using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Cubex.Api.Entities;
using Microsoft.IdentityModel.Tokens;

namespace Cubex.Api.Services;

public class JwtService : IJwtService
{
    private readonly IConfiguration _config;

    public JwtService(IConfiguration config)
    {
        _config = config;
    }

    public (string token, DateTime expiresAt) GenerateToken(ApplicationUser user, IList<string> roles)
    {
        var secret = _config["Jwt:Secret"] ?? "CubexSpeedcubingSecretKey2026SuperSecureTokenKeyLongEnough!";
        var issuer = _config["Jwt:Issuer"] ?? "CubexApi";
        var audience = _config["Jwt:Audience"] ?? "CubexClient";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email ?? ""),
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Name, user.DisplayName ?? user.UserName ?? "Cubist"),
            new("preferredLanguage", user.PreferredLanguage)
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var expiresAt = DateTime.UtcNow.AddDays(7);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expiresAt,
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = creds
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return (tokenHandler.WriteToken(token), expiresAt);
    }
}
