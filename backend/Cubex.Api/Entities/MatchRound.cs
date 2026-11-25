namespace Cubex.Api.Entities;

public class MatchRound
{
    public int Id { get; set; }
    public int RoomId { get; set; }
    public MatchRoom? Room { get; set; }
    public int RoundNumber { get; set; }
    public string Scramble { get; set; } = string.Empty;
    // "pending", "inspection", "solving", "finished"
    public string Status { get; set; } = "pending";
    public DateTime? StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
    public ICollection<MatchRoundResult> Results { get; set; } = new List<MatchRoundResult>();
}
