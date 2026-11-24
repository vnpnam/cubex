using Cubex.Api.Entities;

namespace Cubex.Api.Services;

public interface IJwtService
{
    (string token, DateTime expiresAt) GenerateToken(ApplicationUser user, IList<string> roles);
}
