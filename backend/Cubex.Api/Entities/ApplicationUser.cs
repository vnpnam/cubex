using Microsoft.AspNetCore.Identity;

namespace Cubex.Api.Entities;

public class ApplicationUser : IdentityUser
{
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? WcaId { get; set; }
    public string? Bio { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
    public string PreferredLanguage { get; set; } = "vi"; // "vi" or "en"
    public string ThemePreference { get; set; } = "dark";

    // Navigation properties
    public ICollection<UserAlgorithmProgress> ProgressRecords { get; set; } = new List<UserAlgorithmProgress>();
    public ICollection<SolveSession> SolveSessions { get; set; } = new List<SolveSession>();
    public ICollection<Solve> Solves { get; set; } = new List<Solve>();
}
