using System.ComponentModel.DataAnnotations;

namespace Cubex.Api.Entities;

public class LoginAuditLog
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(128)]
    public string UserId { get; set; } = string.Empty;

    [Required, MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(128)]
    public string DisplayName { get; set; } = string.Empty;

    [Required, MaxLength(64)]
    public string LoginMethod { get; set; } = string.Empty; // "Google OAuth 2.0" | "Email/Password"

    public DateTime LoginAt { get; set; } = DateTime.UtcNow;

    [MaxLength(128)]
    public string Browser { get; set; } = "Unknown Browser";

    [MaxLength(128)]
    public string Device { get; set; } = "Unknown Device";

    [MaxLength(64)]
    public string? IpAddress { get; set; }

    [Required, MaxLength(32)]
    public string EmailStatus { get; set; } = "Pending"; // "Sent" | "Failed" | "Skipped_RateLimit" | "Skipped_NoApiKey"

    [MaxLength(128)]
    public string? ResendMessageId { get; set; }

    [MaxLength(512)]
    public string? ErrorMessage { get; set; }
}
