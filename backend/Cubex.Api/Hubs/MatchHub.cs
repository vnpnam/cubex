using System.Security.Claims;
using Cubex.Api.Data;
using Cubex.Api.Entities;
using Cubex.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Cubex.Api.Hubs;

[Authorize]
public class MatchHub : Hub
{
    private readonly CubexDbContext _db;
    private readonly IScrambleService _scramble;
    private static readonly Random Rng = new();

    public MatchHub(CubexDbContext db, IScrambleService scramble)
    {
        _db = db;
        _scramble = scramble;
    }

    private string UserId => Context.User!.FindFirstValue(ClaimTypes.NameIdentifier)!;
    private string DisplayName => Context.User!.FindFirstValue("displayName")
        ?? Context.User!.FindFirstValue(ClaimTypes.Email)
        ?? "Player";

    // ── Connection lifecycle ─────────────────────────────────────────────────

    public override async Task OnConnectedAsync()
    {
        // Try to rejoin active room
        var player = await _db.MatchRoomPlayers
            .Include(p => p.Room)
            .FirstOrDefaultAsync(p => p.UserId == UserId && p.Room!.Status != "finished");

        if (player != null)
        {
            player.ConnectionId = Context.ConnectionId;
            player.DisconnectedAt = null;
            await _db.SaveChangesAsync();
            await Groups.AddToGroupAsync(Context.ConnectionId, player.Room!.Code);
            await Clients.Caller.SendAsync("Reconnected", player.Room.Code);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var player = await _db.MatchRoomPlayers
            .Include(p => p.Room)
            .FirstOrDefaultAsync(p => p.ConnectionId == Context.ConnectionId);

        if (player != null)
        {
            player.DisconnectedAt = DateTime.UtcNow;
            player.ConnectionId = null;
            await _db.SaveChangesAsync();

            await Clients.Group(player.Room!.Code).SendAsync("PlayerDisconnected", new
            {
                userId = UserId,
                displayName = DisplayName
            });

            // After 60s grace period – handled via background check on reconnect / submit
        }

        await base.OnDisconnectedAsync(exception);
    }

    // ── Room management ──────────────────────────────────────────────────────

    public async Task CreateRoom(int bestOf)
    {
        if (bestOf != 1 && bestOf != 3 && bestOf != 5)
            throw new HubException("bestOf must be 1, 3 or 5.");

        // Leave any existing active rooms first
        await LeaveCurrentRoom();

        var code = await GenerateUniqueCodeAsync();
        var room = new MatchRoom
        {
            Code = code,
            HostUserId = UserId,
            BestOf = bestOf,
            Status = "waiting"
        };
        _db.MatchRooms.Add(room);
        await _db.SaveChangesAsync();

        var roomPlayer = new MatchRoomPlayer
        {
            RoomId = room.Id,
            UserId = UserId,
            ConnectionId = Context.ConnectionId,
            IsReady = false
        };
        _db.MatchRoomPlayers.Add(roomPlayer);
        await _db.SaveChangesAsync();

        await Groups.AddToGroupAsync(Context.ConnectionId, code);
        await Clients.Caller.SendAsync("RoomCreated", BuildRoomState(room, new[] { roomPlayer }));
    }

    public async Task JoinRoom(string code)
    {
        var room = await _db.MatchRooms
            .Include(r => r.Players)
            .FirstOrDefaultAsync(r => r.Code == code);

        if (room == null) throw new HubException("Room not found.");
        if (room.Status == "finished") throw new HubException("Room has already finished.");
        if (room.Players.Count >= 2 && !room.Players.Any(p => p.UserId == UserId))
            throw new HubException("Room is full.");

        // Rejoin or new join
        var existing = room.Players.FirstOrDefault(p => p.UserId == UserId);
        if (existing != null)
        {
            existing.ConnectionId = Context.ConnectionId;
            existing.DisconnectedAt = null;
        }
        else
        {
            await LeaveCurrentRoom();
            var newPlayer = new MatchRoomPlayer
            {
                RoomId = room.Id,
                UserId = UserId,
                ConnectionId = Context.ConnectionId
            };
            _db.MatchRoomPlayers.Add(newPlayer);
        }

        await _db.SaveChangesAsync();
        await Groups.AddToGroupAsync(Context.ConnectionId, code);

        var players = await _db.MatchRoomPlayers
            .Include(p => p.User)
            .Where(p => p.RoomId == room.Id)
            .ToListAsync();

        var state = BuildRoomState(room, players);
        await Clients.Group(code).SendAsync("RoomUpdated", state);
    }

    public async Task SetReady(bool ready)
    {
        var player = await GetCurrentPlayerAsync();
        if (player == null) throw new HubException("Not in a room.");

        player.IsReady = ready;
        await _db.SaveChangesAsync();

        var room = await _db.MatchRooms
            .Include(r => r.Players)
            .ThenInclude(p => p.User)
            .FirstAsync(r => r.Id == player.RoomId);

        await Clients.Group(room.Code).SendAsync("PlayerReady", new
        {
            userId = UserId,
            ready
        });

        // Auto-start if both ready and 2 players
        if (room.Players.Count == 2 && room.Players.All(p => p.IsReady) && room.Status == "waiting")
        {
            await StartNextRound(room);
        }
    }

    public async Task SubmitResult(int roundId, int? timeMs)
    {
        var round = await _db.MatchRounds
            .Include(r => r.Room)
            .ThenInclude(r => r.Players)
            .FirstOrDefaultAsync(r => r.Id == roundId);

        if (round == null || round.Status == "finished" || round.Room == null) throw new HubException("Invalid round.");

        var player = round.Room.Players.FirstOrDefault(p => p.UserId == UserId);
        if (player == null) throw new HubException("Not a participant.");

        // Check 60s disconnect DNF rule
        bool isDnf = timeMs == null;
        if (player.DisconnectedAt.HasValue &&
            (DateTime.UtcNow - player.DisconnectedAt.Value).TotalSeconds > 60)
        {
            isDnf = true;
            timeMs = null;
        }

        var existing = await _db.MatchRoundResults
            .FirstOrDefaultAsync(r => r.RoundId == roundId && r.UserId == UserId);

        if (existing != null)
        {
            existing.TimeMs = timeMs;
            existing.IsDnf = isDnf;
            existing.SubmittedAt = DateTime.UtcNow;
        }
        else
        {
            _db.MatchRoundResults.Add(new MatchRoundResult
            {
                RoundId = roundId,
                UserId = UserId,
                TimeMs = timeMs,
                IsDnf = isDnf
            });
        }

        await _db.SaveChangesAsync();

        var results = await _db.MatchRoundResults
            .Where(r => r.RoundId == roundId)
            .ToListAsync();

        var playerCount = round.Room.Players.Count;

        await Clients.Group(round.Room.Code).SendAsync("ResultSubmitted", new
        {
            userId = UserId,
            timeMs,
            isDnf
        });

        // All submitted – resolve round
        if (results.Count >= playerCount)
        {
            await ResolveRound(round, results);
        }
    }

    public async Task LeaveRoom()
    {
        await LeaveCurrentRoom();
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private async Task LeaveCurrentRoom()
    {
        var player = await _db.MatchRoomPlayers
            .Include(p => p.Room)
            .FirstOrDefaultAsync(p => p.UserId == UserId && p.Room!.Status != "finished");

        if (player == null) return;

        var code = player.Room!.Code;
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, code);
        _db.MatchRoomPlayers.Remove(player);

        // If host leaves and room is waiting, cancel it
        if (player.Room.HostUserId == UserId && player.Room.Status == "waiting")
        {
            player.Room.Status = "finished";
            player.Room.FinishedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        await Clients.Group(code).SendAsync("PlayerLeft", new { userId = UserId });
    }

    private async Task<MatchRoomPlayer?> GetCurrentPlayerAsync()
    {
        return await _db.MatchRoomPlayers
            .Include(p => p.Room)
            .FirstOrDefaultAsync(p => p.UserId == UserId && p.Room!.Status != "finished");
    }

    private async Task StartNextRound(MatchRoom room)
    {
        room.Status = "playing";

        var roundNumber = await _db.MatchRounds.CountAsync(r => r.RoomId == room.Id) + 1;
        var scramble = _scramble.Generate3x3Scramble();

        var round = new MatchRound
        {
            RoomId = room.Id,
            RoundNumber = roundNumber,
            Scramble = scramble,
            Status = "solving",
            StartedAt = DateTime.UtcNow
        };
        _db.MatchRounds.Add(round);
        await _db.SaveChangesAsync();

        await Clients.Group(room.Code).SendAsync("RoundStarted", new
        {
            roundId = round.Id,
            roundNumber,
            scramble,
            startedAt = round.StartedAt
        });
    }

    private async Task ResolveRound(MatchRound round, List<MatchRoundResult> results)
    {
        round.Status = "finished";
        round.FinishedAt = DateTime.UtcNow;

        // Determine winner: lowest non-DNF time wins; both DNF = no winner this round
        MatchRoundResult? winner = results
            .Where(r => !r.IsDnf && r.TimeMs.HasValue)
            .OrderBy(r => r.TimeMs)
            .FirstOrDefault();

        if (winner != null)
        {
            winner.IsWinner = true;
            var winPlayer = await _db.MatchRoomPlayers
                .FirstOrDefaultAsync(p => p.RoomId == round.RoomId && p.UserId == winner.UserId);
            if (winPlayer != null) winPlayer.Wins++;
        }

        await _db.SaveChangesAsync();

        var room = await _db.MatchRooms
            .Include(r => r.Players)
            .ThenInclude(p => p.User)
            .FirstAsync(r => r.Id == round.RoomId);

        // Check match winner (best-of-N)
        int neededWins = (room.BestOf / 2) + 1;
        var matchWinner = room.Players.FirstOrDefault(p => p.Wins >= neededWins);

        await Clients.Group(room.Code).SendAsync("RoundFinished", new
        {
            roundId = round.Id,
            results = results.Select(r => new
            {
                userId = r.UserId,
                timeMs = r.TimeMs,
                isDnf = r.IsDnf,
                isWinner = r.IsWinner
            }),
            scores = room.Players.Select(p => new { userId = p.UserId, wins = p.Wins })
        });

        if (matchWinner != null)
        {
            room.Status = "finished";
            room.FinishedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            await Clients.Group(room.Code).SendAsync("MatchFinished", new
            {
                winnerId = matchWinner.UserId,
                displayName = matchWinner.User?.UserName
            });
        }
        else
        {
            // Reset ready states for next round
            foreach (var p in room.Players) p.IsReady = false;
            await _db.SaveChangesAsync();
            await Clients.Group(room.Code).SendAsync("WaitingForNextRound");
        }
    }

    private async Task<string> GenerateUniqueCodeAsync()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        string code;
        do
        {
            var random = new string(Enumerable.Range(0, 4).Select(_ => chars[Rng.Next(chars.Length)]).ToArray());
            code = $"CX-{random}";
        } while (await _db.MatchRooms.AnyAsync(r => r.Code == code && r.Status != "finished"));
        return code;
    }

    private static object BuildRoomState(MatchRoom room, IEnumerable<MatchRoomPlayer> players) => new
    {
        code = room.Code,
        status = room.Status,
        bestOf = room.BestOf,
        hostUserId = room.HostUserId,
        players = players.Select(p => new
        {
            userId = p.UserId,
            displayName = p.User?.UserName ?? p.UserId,
            isReady = p.IsReady,
            wins = p.Wins
        })
    };
}
