using System.ComponentModel.DataAnnotations;

namespace Cubex.Api.Entities;

public enum SolvePenalty
{
    None = 0,
    PlusTwo = 1,
    DNF = 2
}

public class Solve
{
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;

    public int SessionId { get; set; }
    public SolveSession Session { get; set; } = null!;

    public int TimeMs { get; set; } // Effective time (Raw + 2000 if +2, or -1 if DNF)
    public int RawTimeMs { get; set; } // Raw timer recorded time
    public SolvePenalty Penalty { get; set; } = SolvePenalty.None;

    [Required]
    [MaxLength(500)]
    public string Scramble { get; set; } = string.Empty;

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    [MaxLength(200)]
    public string? Notes { get; set; }

    [MaxLength(100)]
    public string? Tags { get; set; }

    public int? InspectionTimeMs { get; set; }
}
