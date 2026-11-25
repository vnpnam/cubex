namespace Cubex.Api.Entities;

public class MatchRoundResult
{
    public int Id { get; set; }
    public int RoundId { get; set; }
    public MatchRound? Round { get; set; }
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }
    // Time in milliseconds, null = DNF
    public int? TimeMs { get; set; }
    public bool IsDnf { get; set; } = false;
    public bool IsWinner { get; set; } = false;
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
}
