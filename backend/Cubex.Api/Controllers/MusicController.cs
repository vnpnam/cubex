using Cubex.Api.Data;
using Cubex.Api.DTOs;
using Cubex.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Cubex.Api.Controllers;

[ApiController]
[Route("api/music")]
public class MusicController : ControllerBase
{
    private readonly CubexDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<MusicController> _logger;

    private static readonly string[] AllowedAudioTypes = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp3"];
    private static readonly string[] AllowedAudioExtensions = [".mp3", ".wav", ".ogg"];
    private static readonly string[] AllowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
    private static readonly string[] AllowedImageExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    private const long MaxAudioSize = 20 * 1024 * 1024; // 20 MB
    private const long MaxImageSize = 5 * 1024 * 1024;  // 5 MB

    public MusicController(CubexDbContext db, IWebHostEnvironment env, ILogger<MusicController> logger)
    {
        _db = db;
        _env = env;
        _logger = logger;
    }

    private string? GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    // ── Helpers ─────────────────────────────────────────────────────────────

    private async Task<string?> SaveFileAsync(IFormFile file, string subfolder, string[] allowedTypes, long maxSize)
    {
        if (file.Length == 0 || file.Length > maxSize) return null;
        if (!allowedTypes.Contains(file.ContentType.ToLower())) return null;

        var ext = Path.GetExtension(file.FileName)?.ToLowerInvariant() ?? string.Empty;
        var allowedExts = subfolder == "music" ? AllowedAudioExtensions : AllowedImageExtensions;
        if (string.IsNullOrEmpty(ext) || !allowedExts.Contains(ext)) return null;

        var uploads = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads", subfolder);
        Directory.CreateDirectory(uploads);

        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploads, fileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        return $"/uploads/{subfolder}/{fileName}";
    }

    private void DeleteFile(string? relativeUrl)
    {
        if (string.IsNullOrEmpty(relativeUrl)) return;
        var full = Path.Combine(_env.WebRootPath ?? "wwwroot", relativeUrl.TrimStart('/'));
        if (System.IO.File.Exists(full)) System.IO.File.Delete(full);
    }

    // ── System Tracks (public GET, Admin mutate) ─────────────────────────────

    [HttpGet("system")]
    public async Task<ActionResult<List<SystemTrackDto>>> GetSystemTracks([FromQuery] bool all = false)
    {
        var query = _db.SystemTracks.AsQueryable();
        if (!all) query = query.Where(t => t.IsActive);
        var tracks = await query.OrderBy(t => t.SortOrder).ThenBy(t => t.Id).ToListAsync();
        return tracks.Select(ToDto).ToList();
    }

    [HttpPost("system")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<SystemTrackDto>> CreateSystemTrack([FromForm] CreateSystemTrackDto dto,
        IFormFile? audioFile, IFormFile? coverFile)
    {
        if (audioFile == null) return BadRequest("Audio file is required.");
        var audioUrl = await SaveFileAsync(audioFile, "music", AllowedAudioTypes, MaxAudioSize);
        if (audioUrl == null) return BadRequest("Invalid audio file. Max 20 MB, MP3/WAV/OGG only.");

        string? coverUrl = null;
        if (coverFile != null)
        {
            coverUrl = await SaveFileAsync(coverFile, "covers", AllowedImageTypes, MaxImageSize);
        }

        var maxOrder = await _db.SystemTracks.AnyAsync() ? await _db.SystemTracks.MaxAsync(t => t.SortOrder) : 0;
        var track = new SystemTrack
        {
            Title = dto.Title,
            Artist = dto.Artist,
            AudioUrl = audioUrl,
            CoverUrl = coverUrl,
            SortOrder = maxOrder + 1
        };

        _db.SystemTracks.Add(track);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetSystemTracks), ToDto(track));
    }

    [HttpPut("system/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<SystemTrackDto>> UpdateSystemTrack(int id,
        [FromForm] UpdateSystemTrackDto dto, IFormFile? coverFile)
    {
        var track = await _db.SystemTracks.FindAsync(id);
        if (track == null) return NotFound();

        if (dto.Title != null) track.Title = dto.Title;
        if (dto.Artist != null) track.Artist = dto.Artist;
        if (dto.IsActive.HasValue) track.IsActive = dto.IsActive.Value;
        if (dto.SortOrder.HasValue) track.SortOrder = dto.SortOrder.Value;

        if (dto.IsDefault == true)
        {
            // Unset all others
            await _db.SystemTracks.ForEachAsync(t => t.IsDefault = false);
            track.IsDefault = true;
        }

        if (coverFile != null)
        {
            DeleteFile(track.CoverUrl);
            track.CoverUrl = await SaveFileAsync(coverFile, "covers", AllowedImageTypes, MaxImageSize);
        }

        await _db.SaveChangesAsync();
        return ToDto(track);
    }

    [HttpDelete("system/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteSystemTrack(int id)
    {
        var track = await _db.SystemTracks.FindAsync(id);
        if (track == null) return NotFound();

        DeleteFile(track.AudioUrl);
        DeleteFile(track.CoverUrl);
        _db.SystemTracks.Remove(track);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("system/{id:int}/audio")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<SystemTrackDto>> ReplaceSystemAudio(int id, IFormFile audioFile)
    {
        var track = await _db.SystemTracks.FindAsync(id);
        if (track == null) return NotFound();

        var url = await SaveFileAsync(audioFile, "music", AllowedAudioTypes, MaxAudioSize);
        if (url == null) return BadRequest("Invalid audio file.");

        DeleteFile(track.AudioUrl);
        track.AudioUrl = url;
        await _db.SaveChangesAsync();
        return ToDto(track);
    }

    // ── User Tracks ──────────────────────────────────────────────────────────

    [HttpGet("user")]
    [Authorize]
    public async Task<ActionResult<List<UserTrackDto>>> GetUserTracks()
    {
        var uid = GetUserId()!;
        var tracks = await _db.UserTracks
            .Where(t => t.UserId == uid)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
        return tracks.Select(ToUserDto).ToList();
    }

    [HttpPost("user")]
    [Authorize]
    public async Task<ActionResult<UserTrackDto>> UploadUserTrack([FromForm] CreateUserTrackDto dto,
        IFormFile audioFile, IFormFile? coverFile)
    {
        var uid = GetUserId()!;

        var audioUrl = await SaveFileAsync(audioFile, "music", AllowedAudioTypes, MaxAudioSize);
        if (audioUrl == null) return BadRequest("Invalid audio file. Max 20 MB, MP3/WAV/OGG only.");

        string? coverUrl = null;
        if (coverFile != null)
            coverUrl = await SaveFileAsync(coverFile, "covers", AllowedImageTypes, MaxImageSize);

        var track = new UserTrack
        {
            UserId = uid,
            Title = dto.Title,
            Artist = dto.Artist,
            AudioUrl = audioUrl,
            CoverUrl = coverUrl
        };

        _db.UserTracks.Add(track);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetUserTracks), ToUserDto(track));
    }

    [HttpDelete("user/{id:int}")]
    [Authorize]
    public async Task<IActionResult> DeleteUserTrack(int id)
    {
        var uid = GetUserId()!;
        var track = await _db.UserTracks.FindAsync(id);
        if (track == null || track.UserId != uid) return NotFound();

        DeleteFile(track.AudioUrl);
        DeleteFile(track.CoverUrl);
        _db.UserTracks.Remove(track);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── User Music Settings ──────────────────────────────────────────────────

    [HttpGet("settings")]
    [Authorize]
    public async Task<ActionResult<UserMusicSettingsDto>> GetSettings()
    {
        var uid = GetUserId()!;
        var settings = await _db.UserMusicSettings.FirstOrDefaultAsync(s => s.UserId == uid);
        if (settings == null) return Ok(new UserMusicSettingsDto("system", null, 0.8f, "none", false));
        return ToSettingsDto(settings);
    }

    [HttpPut("settings")]
    [Authorize]
    public async Task<ActionResult<UserMusicSettingsDto>> UpdateSettings(UpdateUserMusicSettingsDto dto)
    {
        var uid = GetUserId()!;
        var settings = await _db.UserMusicSettings.FirstOrDefaultAsync(s => s.UserId == uid);
        if (settings == null)
        {
            settings = new UserMusicSettings { UserId = uid };
            _db.UserMusicSettings.Add(settings);
        }

        if (dto.SelectedSource != null) settings.SelectedSource = dto.SelectedSource;
        if (dto.SelectedTrackId.HasValue) settings.SelectedTrackId = dto.SelectedTrackId;
        if (dto.Volume.HasValue) settings.Volume = dto.Volume.Value;
        if (dto.RepeatMode != null) settings.RepeatMode = dto.RepeatMode;
        if (dto.ShuffleEnabled.HasValue) settings.ShuffleEnabled = dto.ShuffleEnabled.Value;
        settings.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return ToSettingsDto(settings);
    }

    // ── Mappers ──────────────────────────────────────────────────────────────

    private static SystemTrackDto ToDto(SystemTrack t) => new(
        t.Id, t.Title, t.Artist, t.CoverUrl, t.AudioUrl,
        t.IsActive, t.IsDefault, t.SortOrder, t.CreatedAt);

    private static UserTrackDto ToUserDto(UserTrack t) => new(
        t.Id, t.Title, t.Artist, t.CoverUrl, t.AudioUrl, t.CreatedAt);

    private static UserMusicSettingsDto ToSettingsDto(UserMusicSettings s) => new(
        s.SelectedSource, s.SelectedTrackId, s.Volume, s.RepeatMode, s.ShuffleEnabled);
}
