namespace Cubex.Api.Entities;

public class MatchRoom
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty; // CX-XXXX
    public string HostUserId { get; set; } = string.Empty;
    public ApplicationUser? HostUser { get; set; }
    // "waiting", "playing", "finished"
    public string Status { get; set; } = "waiting";
    // 1, 3, or 5 (best-of)
    public int BestOf { get; set; } = 3;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? FinishedAt { get; set; }
    public ICollection<MatchRoomPlayer> Players { get; set; } = new List<MatchRoomPlayer>();
    public ICollection<MatchRound> Rounds { get; set; } = new List<MatchRound>();
}
