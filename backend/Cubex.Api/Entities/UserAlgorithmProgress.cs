using System.ComponentModel.DataAnnotations;

namespace Cubex.Api.Entities;

public enum MasteryStatus
{
    Learning,
    Practicing,
    Mastered
}

public class UserAlgorithmProgress
{
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;

    [Required]
    public int AlgorithmId { get; set; }
    public Algorithm Algorithm { get; set; } = null!;

    public MasteryStatus Status { get; set; } = MasteryStatus.Learning;

    public string? CustomNotes { get; set; }
    public bool IsFavorite { get; set; } = false;

    public int? PersonalBestTimeMs { get; set; }
    public int PracticeCount { get; set; } = 0;
    public DateTime LastPracticedAt { get; set; } = DateTime.UtcNow;
}
