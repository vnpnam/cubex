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

    // Music
    public DbSet<SystemTrack> SystemTracks => Set<SystemTrack>();
    public DbSet<UserTrack> UserTracks => Set<UserTrack>();
    public DbSet<UserMusicSettings> UserMusicSettings => Set<UserMusicSettings>();

    // Match / Battle
    public DbSet<MatchRoom> MatchRooms => Set<MatchRoom>();
    public DbSet<MatchRoomPlayer> MatchRoomPlayers => Set<MatchRoomPlayer>();
    public DbSet<MatchRound> MatchRounds => Set<MatchRound>();
    public DbSet<MatchRoundResult> MatchRoundResults => Set<MatchRoundResult>();

    // Security & Login Email Audit Logs
    public DbSet<LoginAuditLog> LoginAuditLogs => Set<LoginAuditLog>();

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

        // Music
        builder.Entity<UserMusicSettings>()
            .HasIndex(u => u.UserId)
            .IsUnique();

        builder.Entity<UserTrack>()
            .HasIndex(t => t.UserId);

        // Match
        builder.Entity<MatchRoom>()
            .HasIndex(r => r.Code)
            .IsUnique();

        builder.Entity<MatchRoomPlayer>()
            .HasIndex(p => new { p.RoomId, p.UserId })
            .IsUnique();

        builder.Entity<MatchRoundResult>()
            .HasIndex(r => new { r.RoundId, r.UserId })
            .IsUnique();

        // Login Audit Logs index
        builder.Entity<LoginAuditLog>()
            .HasIndex(l => new { l.UserId, l.LoginAt });
    }
}
