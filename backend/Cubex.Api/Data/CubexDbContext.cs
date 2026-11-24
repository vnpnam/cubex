using Cubex.Api.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Cubex.Api.Data;

public class CubexDbContext : IdentityDbContext<ApplicationUser>
{
    public CubexDbContext(DbContextOptions<CubexDbContext> options) : base(options)
    {
    }

    public DbSet<Algorithm> Algorithms => Set<Algorithm>();
    public DbSet<UserAlgorithmProgress> UserAlgorithmProgresses => Set<UserAlgorithmProgress>();
    public DbSet<SolveSession> SolveSessions => Set<SolveSession>();
    public DbSet<Solve> Solves => Set<Solve>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Ensure unique user progress per algorithm
        builder.Entity<UserAlgorithmProgress>()
            .HasIndex(p => new { p.UserId, p.AlgorithmId })
            .IsUnique();

        // Indexes for performance analytics
        builder.Entity<Solve>()
            .HasIndex(s => new { s.UserId, s.SessionId, s.Timestamp });

        builder.Entity<Algorithm>()
            .HasIndex(a => new { a.Category, a.Code });
    }
}
