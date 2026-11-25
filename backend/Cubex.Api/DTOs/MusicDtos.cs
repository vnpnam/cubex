namespace Cubex.Api.DTOs;

// ── System Tracks ──────────────────────────────────────────────────────────
public record SystemTrackDto(
    int Id,
    string Title,
    string Artist,
    string? CoverUrl,
    string AudioUrl,
    bool IsActive,
    bool IsDefault,
    int SortOrder,
    DateTime CreatedAt
);

public record CreateSystemTrackDto(
    string Title,
    string Artist
);

public record UpdateSystemTrackDto(
    string? Title,
    string? Artist,
    bool? IsActive,
    bool? IsDefault,
    int? SortOrder
);

// ── User Tracks ─────────────────────────────────────────────────────────────
public record UserTrackDto(
    int Id,
    string Title,
    string Artist,
    string? CoverUrl,
    string AudioUrl,
    DateTime CreatedAt
);

public record CreateUserTrackDto(
    string Title,
    string Artist
);

// ── User Music Settings ──────────────────────────────────────────────────────
public record UserMusicSettingsDto(
    string SelectedSource,
    int? SelectedTrackId,
    float Volume,
    string RepeatMode,
    bool ShuffleEnabled
);

public record UpdateUserMusicSettingsDto(
    string? SelectedSource,
    int? SelectedTrackId,
    float? Volume,
    string? RepeatMode,
    bool? ShuffleEnabled
);
