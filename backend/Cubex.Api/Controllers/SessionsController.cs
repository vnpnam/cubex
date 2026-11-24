using System.Security.Claims;
using Cubex.Api.Data;
using Cubex.Api.DTOs;
using Cubex.Api.Entities;
using Cubex.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Cubex.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SessionsController : ControllerBase
{
    private readonly CubexDbContext _context;
    private readonly IStatsService _statsService;

    public SessionsController(CubexDbContext context, IStatsService statsService)
    {
        _context = context;
        _statsService = statsService;
    }

    [HttpGet]
    public async Task<ActionResult<List<SessionDto>>> GetSessions()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var sessions = await _context.SolveSessions
            .Where(s => s.UserId == userId)
            .Include(s => s.Solves)
            .OrderByDescending(s => s.IsActive)
            .ThenByDescending(s => s.CreatedAt)
            .ToListAsync();

        var result = sessions.Select(s =>
        {
            var validSolves = s.Solves.Where(x => x.Penalty != SolvePenalty.DNF && x.TimeMs > 0).ToList();
            int? bestSingle = validSolves.Count > 0 ? validSolves.Min(x => x.TimeMs) : null;
            int? bestAo5 = _statsService.CalculateAo5(s.Solves.ToList());
            int? bestAo12 = _statsService.CalculateAo12(s.Solves.ToList());

            return new SessionDto(
                s.Id,
                s.Name,
                s.PuzzleType,
                s.CreatedAt,
                s.IsActive,
                s.Solves.Count,
                bestSingle,
                bestAo5,
                bestAo12
            );
        }).ToList();

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<SessionDto>> CreateSession([FromBody] CreateSessionDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var session = new SolveSession
        {
            UserId = userId,
            Name = dto.Name,
            PuzzleType = dto.PuzzleType ?? "3x3x3",
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        // Deactivate others
        var existingActive = await _context.SolveSessions.Where(s => s.UserId == userId && s.IsActive).ToListAsync();
        foreach (var s in existingActive) s.IsActive = false;

        await _context.SolveSessions.AddAsync(session);
        await _context.SaveChangesAsync();

        return Ok(new SessionDto(session.Id, session.Name, session.PuzzleType, session.CreatedAt, session.IsActive, 0, null, null, null));
    }

    [HttpGet("{id}/stats")]
    public async Task<ActionResult<SessionStatsDto>> GetSessionStats(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var session = await _context.SolveSessions
            .Include(s => s.Solves)
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

        if (session == null) return NotFound();

        var solves = session.Solves.OrderBy(s => s.Timestamp).ToList();
        var validSolves = solves.Where(s => s.Penalty != SolvePenalty.DNF && s.TimeMs > 0).ToList();

        int? bestSingle = validSolves.Count > 0 ? validSolves.Min(s => s.TimeMs) : null;
        int? worstSingle = validSolves.Count > 0 ? validSolves.Max(s => s.TimeMs) : null;

        int? curAo5 = _statsService.CalculateAo5(solves);
        int? curAo12 = _statsService.CalculateAo12(solves);

        // Calculate best Ao5 and Ao12 across entire session
        int? bestAo5 = null;
        if (solves.Count >= 5)
        {
            for (int i = 0; i <= solves.Count - 5; i++)
            {
                var slice = solves.Skip(i).Take(5).ToList();
                var avg = _statsService.CalculateAo5(slice);
                if (avg.HasValue && avg.Value > 0 && (!bestAo5.HasValue || avg.Value < bestAo5.Value))
                {
                    bestAo5 = avg.Value;
                }
            }
        }

        int? bestAo12 = null;
        if (solves.Count >= 12)
        {
            for (int i = 0; i <= solves.Count - 12; i++)
            {
                var slice = solves.Skip(i).Take(12).ToList();
                var avg = _statsService.CalculateAo12(slice);
                if (avg.HasValue && avg.Value > 0 && (!bestAo12.HasValue || avg.Value < bestAo12.Value))
                {
                    bestAo12 = avg.Value;
                }
            }
        }

        var (mean, stdDev) = _statsService.CalculateMeanAndStdDev(solves);

        var recentSolves = solves.OrderByDescending(s => s.Timestamp).Take(50).Select(s => new SolveDto(
            s.Id,
            s.SessionId,
            s.TimeMs,
            s.RawTimeMs,
            s.Penalty,
            s.Scramble,
            s.Timestamp,
            s.Notes,
            s.Tags,
            s.InspectionTimeMs
        )).ToList();

        return Ok(new SessionStatsDto(
            session.Id,
            session.Name,
            solves.Count,
            bestSingle,
            worstSingle,
            curAo5,
            bestAo5,
            curAo12,
            bestAo12,
            mean,
            stdDev,
            recentSolves
        ));
    }

    [HttpPut("{id}/activate")]
    public async Task<IActionResult> SetActiveSession(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var sessions = await _context.SolveSessions.Where(s => s.UserId == userId).ToListAsync();
        foreach (var s in sessions)
        {
            s.IsActive = (s.Id == id);
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }
}
