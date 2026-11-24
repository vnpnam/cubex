using System.ComponentModel.DataAnnotations;

namespace Cubex.Api.DTOs;

public record RegisterDto(
    [Required, EmailAddress] string Email,
    [Required, MinLength(6)] string Password,
    [Required, MinLength(2)] string DisplayName,
    string? PreferredLanguage = "vi"
);

public record LoginDto(
    [Required, EmailAddress] string Email,
    [Required] string Password
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
    DateTime CreatedAt
);

public record UpdateProfileDto(
    string? DisplayName,
    string? AvatarUrl,
    string? WcaId,
    string? Bio,
    string? PreferredLanguage,
    string? ThemePreference
);
