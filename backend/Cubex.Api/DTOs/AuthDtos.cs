using System.ComponentModel.DataAnnotations;

namespace Cubex.Api.DTOs;

public record RegisterDto(
    [Required, EmailAddress] string Email,
    [Required, MinLength(6)] string Password,
    [Required, MinLength(2)] string DisplayName,
    string? PreferredLanguage = "vi"
);

public record LoginDto(
    [Required] string Email,
    [Required] string Password
);

public record GoogleLoginDto(
    string? IdToken,
    string? AccessToken
);

public record LoginAuditLogDto(
    int Id,
    string UserId,
    string Email,
    string DisplayName,
    string LoginMethod,
    DateTime LoginAt,
    string Browser,
    string Device,
    string EmailStatus,
    string? ResendMessageId
);

public record AuthResponseDto(
    string Token,
    DateTime ExpiresAt,
    UserDto User
);

public record UserDto(
    string Id,
    string Email,
    string DisplayName,
    string? AvatarUrl,
    string? WcaId,
    string? Bio,
    IList<string> Roles,
    string PreferredLanguage,
    string ThemePreference,
    DateTime CreatedAt,
    DateTime? LastLoginAt = null,
    string? AuthProvider = null
);

public record UpdateProfileDto(
    string? DisplayName,
    string? AvatarUrl,
    string? WcaId,
    string? Bio,
    string? PreferredLanguage,
    string? ThemePreference
);
