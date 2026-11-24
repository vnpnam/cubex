using System.ComponentModel.DataAnnotations;

namespace Cubex.Api.Entities;

public class SolveSession
{
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = "Main 3x3";

    [MaxLength(50)]
    public string PuzzleType { get; set; } = "3x3x3";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    // Navigation
    public ICollection<Solve> Solves { get; set; } = new List<Solve>();
}
