namespace Cubex.Api.Entities;

public class MatchRoomPlayer
{
    public int Id { get; set; }
    public int RoomId { get; set; }
    public MatchRoom? Room { get; set; }
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }
    public bool IsReady { get; set; } = false;
    public string? ConnectionId { get; set; }
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DisconnectedAt { get; set; }
    // Wins count
    public int Wins { get; set; } = 0;
}
