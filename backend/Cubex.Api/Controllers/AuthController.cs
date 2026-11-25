using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Cubex.Api.Data;
using Cubex.Api.DTOs;
using Cubex.Api.Entities;
using Cubex.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Cubex.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IJwtService _jwtService;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly IEmailService _emailService;
    private readonly CubexDbContext _db;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IJwtService jwtService,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        IEmailService emailService,
        CubexDbContext db)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _jwtService = jwtService;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _emailService = emailService;
        _db = db;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto dto)
    {
        var existing = await _userManager.FindByEmailAsync(dto.Email);
        if (existing != null)
        {
            return BadRequest(new { message = "Email này đã được đăng ký." });
        }

        var nowUtc = DateTime.UtcNow;
        var user = new ApplicationUser
        {
            UserName = dto.Email,
            Email = dto.Email,
            DisplayName = dto.DisplayName,
            PreferredLanguage = dto.PreferredLanguage ?? "vi",
            CreatedAt = nowUtc,
            LastLoginAt = nowUtc
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
        {
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }

        await _userManager.AddToRoleAsync(user, "Cubist");
        var roles = await _userManager.GetRolesAsync(user);
        var (token, expiresAt) = _jwtService.GenerateToken(user, roles);
        SetSecureAuthCookie(token, expiresAt);

        await RecordAndSendLoginEmailSafeAsync(user, "Email/Password");

        return Ok(new AuthResponseDto(
            token,
            expiresAt,
            new UserDto(user.Id, user.Email!, user.DisplayName, user.AvatarUrl, user.WcaId, user.Bio, roles, user.PreferredLanguage, user.ThemePreference, user.CreatedAt, user.LastLoginAt, "Email/Password")
        ));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email)
                   ?? await _userManager.FindByNameAsync(dto.Email);
        if (user == null)
        {
            return Unauthorized(new { message = "Tài khoản hoặc mật khẩu không chính xác." });
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, false);
        if (!result.Succeeded)
        {
            // Do NOT send login email when login fails
            return Unauthorized(new { message = "Tài khoản hoặc mật khẩu không chính xác." });
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        var roles = await _userManager.GetRolesAsync(user);
        var (token, expiresAt) = _jwtService.GenerateToken(user, roles);
        SetSecureAuthCookie(token, expiresAt);

        // Send Login Notification Email via Resend & store LoginAuditLog (only on actual login event)
        await RecordAndSendLoginEmailSafeAsync(user, "Email/Password");

        return Ok(new AuthResponseDto(
            token,
            expiresAt,
            new UserDto(user.Id, user.Email!, user.DisplayName, user.AvatarUrl, user.WcaId, user.Bio, roles, user.PreferredLanguage, user.ThemePreference, user.CreatedAt, user.LastLoginAt, "Email/Password")
        ));
    }

    /// <summary>
    /// Verifies Firebase ID Token or Google OAuth 2.0 Token directly on the Backend,
    /// creates/links the user account, sends the Login Notification Email via Resend,
    /// and logs the login audit record.
    /// </summary>
    [HttpPost("google")]
    public async Task<ActionResult<AuthResponseDto>> GoogleLogin([FromBody] GoogleLoginDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.IdToken) && string.IsNullOrWhiteSpace(dto.AccessToken))
        {
            return BadRequest(new { message = "Thiếu Google / Firebase Token để xác thực." });
        }

        var verifiedProfile = await VerifyGoogleOrFirebaseTokenAsync(dto.IdToken, dto.AccessToken);
        if (verifiedProfile == null)
        {
            return Unauthorized(new { message = "Token Google / Firebase không hợp lệ hoặc đã hết hạn." });
        }

        if (!verifiedProfile.EmailVerified || string.IsNullOrWhiteSpace(verifiedProfile.Email))
        {
            return Unauthorized(new { message = "Tài khoản Google chưa xác minh địa chỉ Email." });
        }

        const string loginProvider = "Google";
        var googleUid = verifiedProfile.Sub;

        // 1. Check if this Google UID is already linked to an account
        var user = await _userManager.FindByLoginAsync(loginProvider, googleUid);

        if (user == null)
        {
            // 2. Check if an account with the same email already exists
            user = await _userManager.FindByEmailAsync(verifiedProfile.Email);

            if (user != null)
            {
                var existingLogins = await _userManager.GetLoginsAsync(user);
                if (!existingLogins.Any(l => l.LoginProvider == loginProvider))
                {
                    var addLoginRes = await _userManager.AddLoginAsync(
                        user,
                        new UserLoginInfo(loginProvider, googleUid, "Google OAuth 2.0")
                    );
                    if (!addLoginRes.Succeeded)
                    {
                        return BadRequest(new { message = "Không thể liên kết tài khoản Google với email hiện có." });
                    }
                }

                if (string.IsNullOrWhiteSpace(user.AvatarUrl) && !string.IsNullOrWhiteSpace(verifiedProfile.Picture))
                {
                    user.AvatarUrl = verifiedProfile.Picture;
                }
                user.EmailConfirmed = true;
            }
            else
            {
                // 3. First-time Google Login -> Create new passwordless account
                user = new ApplicationUser
                {
                    UserName = verifiedProfile.Email,
                    Email = verifiedProfile.Email,
                    EmailConfirmed = true,
                    DisplayName = !string.IsNullOrWhiteSpace(verifiedProfile.Name)
                        ? verifiedProfile.Name
                        : verifiedProfile.Email.Split('@')[0],
                    AvatarUrl = verifiedProfile.Picture,
                    Bio = "Speedcuber tại cộng đồng Cube Resolver (Google Verified).",
                    PreferredLanguage = "vi",
                    ThemePreference = "dark",
                    CreatedAt = DateTime.UtcNow,
                    LastLoginAt = DateTime.UtcNow
                };

                var createRes = await _userManager.CreateAsync(user);
                if (!createRes.Succeeded)
                {
                    return BadRequest(new
                    {
                        message = "Không thể tạo tài khoản từ Google.",
                        errors = createRes.Errors.Select(e => e.Description)
                    });
                }

                await _userManager.AddToRoleAsync(user, "Cubist");
                await _userManager.AddLoginAsync(
                    user,
                    new UserLoginInfo(loginProvider, googleUid, "Google OAuth 2.0")
                );
            }
        }
        else
        {
            if (!string.IsNullOrWhiteSpace(verifiedProfile.Picture))
            {
                user.AvatarUrl = verifiedProfile.Picture;
            }
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        var roles = await _userManager.GetRolesAsync(user);
        var (token, expiresAt) = _jwtService.GenerateToken(user, roles);
        SetSecureAuthCookie(token, expiresAt);

        // Send Login Notification Email via Resend & store LoginAuditLog (only on actual login event)
        await RecordAndSendLoginEmailSafeAsync(user, "Google Login");

        return Ok(new AuthResponseDto(
            token,
            expiresAt,
            new UserDto(
                user.Id,
                user.Email!,
                user.DisplayName,
                user.AvatarUrl,
                user.WcaId,
                user.Bio,
                roles,
                user.PreferredLanguage,
                user.ThemePreference,
                user.CreatedAt,
                user.LastLoginAt,
                loginProvider
            )
        ));
    }

    [Authorize]
    [HttpGet("login-history")]
    public async Task<ActionResult<IEnumerable<LoginAuditLogDto>>> GetLoginHistory()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var isAdmin = User.IsInRole("Admin");
        var query = _db.LoginAuditLogs.AsNoTracking();

        if (!isAdmin)
        {
            query = query.Where(l => l.UserId == userId);
        }

        var logs = await query
            .OrderByDescending(l => l.LoginAt)
            .Take(50)
            .Select(l => new LoginAuditLogDto(
                l.Id,
                l.UserId,
                l.Email,
                l.DisplayName,
                l.LoginMethod,
                l.LoginAt,
                l.Browser,
                l.Device,
                l.EmailStatus,
                l.ResendMessageId
            ))
            .ToListAsync();

        return Ok(logs);
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("cubex_auth_session", new CookieOptions
        {
            HttpOnly = true,
            Secure = Request.IsHttps,
            SameSite = SameSiteMode.Lax,
            Path = "/"
        });
        return Ok(new { message = "Đã đăng xuất thành công." });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        // Note: /api/auth/me only reads session state on page refresh — it NEVER triggers a login email.
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        var roles = await _userManager.GetRolesAsync(user);
        var logins = await _userManager.GetLoginsAsync(user);
        var provider = logins.FirstOrDefault()?.LoginProvider ?? "Password";

        return Ok(new UserDto(user.Id, user.Email!, user.DisplayName, user.AvatarUrl, user.WcaId, user.Bio, roles, user.PreferredLanguage, user.ThemePreference, user.CreatedAt, user.LastLoginAt, provider));
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<ActionResult<UserDto>> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        if (dto.DisplayName != null) user.DisplayName = dto.DisplayName;
        if (dto.AvatarUrl != null) user.AvatarUrl = dto.AvatarUrl;
        if (dto.WcaId != null) user.WcaId = dto.WcaId;
        if (dto.Bio != null) user.Bio = dto.Bio;
        if (dto.PreferredLanguage != null) user.PreferredLanguage = dto.PreferredLanguage;
        if (dto.ThemePreference != null) user.ThemePreference = dto.ThemePreference;

        await _userManager.UpdateAsync(user);
        var roles = await _userManager.GetRolesAsync(user);

        return Ok(new UserDto(user.Id, user.Email!, user.DisplayName, user.AvatarUrl, user.WcaId, user.Bio, roles, user.PreferredLanguage, user.ThemePreference, user.CreatedAt, user.LastLoginAt));
    }

    // ── Private Helpers ──────────────────────────────────────────────────────

    private async Task RecordAndSendLoginEmailSafeAsync(ApplicationUser user, string loginMethod)
    {
        try
        {
            var userAgent = Request.Headers.UserAgent.ToString();
            var (browser, device) = _emailService.ParseUserAgent(userAgent);
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();

            var ctx = new LoginEmailContext(
                user.Id,
                user.Email ?? "",
                user.DisplayName,
                loginMethod,
                DateTime.UtcNow,
                browser,
                device,
                ipAddress
            );

            await _emailService.RecordLoginAndSendNotificationAsync(ctx);
        }
        catch
        {
            // Never allow email sending failures to affect user login
        }
    }

    private void SetSecureAuthCookie(string token, DateTime expiresAt)
    {
        Response.Cookies.Append("cubex_auth_session", token, new CookieOptions
        {
            HttpOnly = true,
            Secure = Request.IsHttps,
            SameSite = SameSiteMode.Lax,
            Expires = expiresAt,
            Path = "/"
        });
    }

    private sealed record VerifiedGoogleProfile(
        string Sub,
        string Email,
        bool EmailVerified,
        string? Name,
        string? Picture,
        string? Aud
    );

    private async Task<VerifiedGoogleProfile?> VerifyGoogleOrFirebaseTokenAsync(string? idToken, string? accessToken)
    {
        var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(8);

        try
        {
            // 1. Verify Firebase ID Token via Google Identity Toolkit (accounts:lookup) if Firebase API Key is available
            if (!string.IsNullOrWhiteSpace(idToken))
            {
                var firebaseWebApiKey = Environment.GetEnvironmentVariable("NEXT_PUBLIC_FIREBASE_API_KEY")
                                        ?? _configuration["GoogleAuth:FirebaseApiKey"]
                                        ?? "AIzaSyDWYm88iSkX6HhJJObURUDs6VI7Qy19aoo";

                var lookupUrl = $"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={Uri.EscapeDataString(firebaseWebApiKey)}";
                var payloadJson = JsonSerializer.Serialize(new { idToken });
                using var lookupRes = await client.PostAsync(
                    lookupUrl,
                    new StringContent(payloadJson, Encoding.UTF8, "application/json")
                );

                if (lookupRes.IsSuccessStatusCode)
                {
                    using var stream = await lookupRes.Content.ReadAsStreamAsync();
                    using var doc = await JsonDocument.ParseAsync(stream);
                    if (doc.RootElement.TryGetProperty("users", out var usersArr) &&
                        usersArr.ValueKind == JsonValueKind.Array &&
                        usersArr.GetArrayLength() > 0)
                    {
                        var u = usersArr[0];
                        var localId = u.TryGetProperty("localId", out var lid) ? lid.GetString() : null;
                        var email = u.TryGetProperty("email", out var em) ? em.GetString() : null;
                        var emailVerified = !u.TryGetProperty("emailVerified", out var ev) || ev.GetBoolean();
                        var displayName = u.TryGetProperty("displayName", out var dn) ? dn.GetString() : null;
                        var photoUrl = u.TryGetProperty("photoUrl", out var pu) ? pu.GetString() : null;

                        if (!string.IsNullOrWhiteSpace(localId) && !string.IsNullOrWhiteSpace(email))
                        {
                            return new VerifiedGoogleProfile(localId, email, emailVerified, displayName, photoUrl, null);
                        }
                    }
                }

                // 2. Fallback: Verify standard Google OAuth ID Token via oauth2.googleapis.com/tokeninfo
                var tokenInfoUrl = $"https://oauth2.googleapis.com/tokeninfo?id_token={Uri.EscapeDataString(idToken)}";
                using var response = await client.GetAsync(tokenInfoUrl);
                if (response.IsSuccessStatusCode)
                {
                    using var stream = await response.Content.ReadAsStreamAsync();
                    using var doc = await JsonDocument.ParseAsync(stream);
                    var root = doc.RootElement;

                    var sub = root.TryGetProperty("sub", out var subProp) ? subProp.GetString() : null;
                    var email = root.TryGetProperty("email", out var emailProp) ? emailProp.GetString() : null;
                    var emailVerifiedStr = root.TryGetProperty("email_verified", out var evProp) ? evProp.ToString() : "false";
                    var name = root.TryGetProperty("name", out var nameProp) ? nameProp.GetString() : null;
                    var picture = root.TryGetProperty("picture", out var picProp) ? picProp.GetString() : null;
                    var aud = root.TryGetProperty("aud", out var audProp) ? audProp.GetString() : null;

                    if (!string.IsNullOrWhiteSpace(sub) && !string.IsNullOrWhiteSpace(email))
                    {
                        bool emailVerified = string.Equals(emailVerifiedStr, "true", StringComparison.OrdinalIgnoreCase);
                        return new VerifiedGoogleProfile(sub, email, emailVerified, name, picture, aud);
                    }
                }
            }

            // 3. Verify Google OAuth 2.0 Access Token via OpenID UserInfo endpoint
            if (!string.IsNullOrWhiteSpace(accessToken))
            {
                using var request = new HttpRequestMessage(HttpMethod.Get, "https://www.googleapis.com/oauth2/v3/userinfo");
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);

                using var response = await client.SendAsync(request);
                if (!response.IsSuccessStatusCode) return null;

                using var stream = await response.Content.ReadAsStreamAsync();
                using var doc = await JsonDocument.ParseAsync(stream);
                var root = doc.RootElement;

                var sub = root.TryGetProperty("sub", out var subProp) ? subProp.GetString() : null;
                var email = root.TryGetProperty("email", out var emailProp) ? emailProp.GetString() : null;
                var emailVerified = root.TryGetProperty("email_verified", out var evProp) &&
                                    (evProp.ValueKind == JsonValueKind.True ||
                                     string.Equals(evProp.ToString(), "true", StringComparison.OrdinalIgnoreCase));
                var name = root.TryGetProperty("name", out var nameProp) ? nameProp.GetString() : null;
                var picture = root.TryGetProperty("picture", out var picProp) ? picProp.GetString() : null;

                if (string.IsNullOrWhiteSpace(sub) || string.IsNullOrWhiteSpace(email))
                    return null;

                return new VerifiedGoogleProfile(sub, email, emailVerified, name, picture, null);
            }
        }
        catch
        {
            return null;
        }

        return null;
    }
}
