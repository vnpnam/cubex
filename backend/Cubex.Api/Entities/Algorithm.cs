using System.ComponentModel.DataAnnotations;

namespace Cubex.Api.Entities;

public enum AlgorithmCategory
{
    Beginner,
    Cross,
    F2L,
    OLL,
    PLL
}

public enum AlgorithmDifficulty
{
    Beginner,
    Intermediate,
    Advanced
}

public class Algorithm
{
    public int Id { get; set; }

    [Required]
    public AlgorithmCategory Category { get; set; }

    [Required]
    [MaxLength(100)]
    public string SubCategory { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty; // e.g., "F2L 01", "OLL 33", "PLL T", "Beg-01"

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string Notation { get; set; } = string.Empty; // Primary algorithm

    [MaxLength(500)]
    public string? AlternativeNotation { get; set; } // Secondary/alternative triggers

    [MaxLength(500)]
    public string? SetupMoves { get; set; } // Moves to setup case on a solved cube

    public string DescriptionVi { get; set; } = string.Empty;
    public string DescriptionEn { get; set; } = string.Empty;

    public string ExecutionTipVi { get; set; } = string.Empty;
    public string ExecutionTipEn { get; set; } = string.Empty;

    public AlgorithmDifficulty Difficulty { get; set; } = AlgorithmDifficulty.Intermediate;

    public int OrderIndex { get; set; }

    public string? DiagramPattern { get; set; } // Facelet/sticker representation or visual state

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<UserAlgorithmProgress> UserProgresses { get; set; } = new List<UserAlgorithmProgress>();
}
