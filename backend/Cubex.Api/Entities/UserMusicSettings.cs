namespace Cubex.Api.Entities;

public class UserMusicSettings
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }
    // "system" or "user"
    public string SelectedSource { get; set; } = "system";
    public int? SelectedTrackId { get; set; }
    public float Volume { get; set; } = 0.8f;
    // "none", "one", "all"
    public string RepeatMode { get; set; } = "none";
    public bool ShuffleEnabled { get; set; } = false;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
