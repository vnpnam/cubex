using System.Security.Claims;
using Cubex.Api.DTOs;
using Cubex.Api.Entities;
using Cubex.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Cubex.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IJwtService _jwtService;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IJwtService jwtService)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _jwtService = jwtService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto dto)
    {
        var existing = await _userManager.FindByEmailAsync(dto.Email);
        if (existing != null)
        {
            return BadRequest(new { message = "Email already registered." });
        }

        var user = new ApplicationUser
        {
            UserName = dto.Email,
            Email = dto.Email,
            DisplayName = dto.DisplayName,
            PreferredLanguage = dto.PreferredLanguage ?? "vi",
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
        {
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }

        await _userManager.AddToRoleAsync(user, "Cubist");
        var roles = await _userManager.GetRolesAsync(user);
        var (token, expiresAt) = _jwtService.GenerateToken(user, roles);

        return Ok(new AuthResponseDto(
            token,
            expiresAt,
            new UserDto(user.Id, user.Email!, user.DisplayName, user.AvatarUrl, user.WcaId, user.Bio, roles, user.PreferredLanguage, user.ThemePreference, user.CreatedAt)
        ));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, false);
        if (!result.Succeeded)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        var roles = await _userManager.GetRolesAsync(user);
        var (token, expiresAt) = _jwtService.GenerateToken(user, roles);

        return Ok(new AuthResponseDto(
            token,
            expiresAt,
            new UserDto(user.Id, user.Email!, user.DisplayName, user.AvatarUrl, user.WcaId, user.Bio, roles, user.PreferredLanguage, user.ThemePreference, user.CreatedAt)
        ));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        var roles = await _userManager.GetRolesAsync(user);
        return Ok(new UserDto(user.Id, user.Email!, user.DisplayName, user.AvatarUrl, user.WcaId, user.Bio, roles, user.PreferredLanguage, user.ThemePreference, user.CreatedAt));
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

        return Ok(new UserDto(user.Id, user.Email!, user.DisplayName, user.AvatarUrl, user.WcaId, user.Bio, roles, user.PreferredLanguage, user.ThemePreference, user.CreatedAt));
    }
}
