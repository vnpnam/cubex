using Cubex.Api.Entities;

namespace Cubex.Api.DTOs;

public record RecordSolveDto(
    int SessionId,
    int RawTimeMs,
    SolvePenalty Penalty,
    string Scramble,
    string? Notes,
    string? Tags,
    int? InspectionTimeMs
);

public record UpdateSolveDto(
    SolvePenalty? Penalty,
    string? Notes,
    string? Tags
);

public record SolveDto(
    int Id,
    int SessionId,
    int TimeMs,
    int RawTimeMs,
    SolvePenalty Penalty,
    string Scramble,
    DateTime Timestamp,
    string? Notes,
    string? Tags,
    int? InspectionTimeMs
);

public record CreateSessionDto(
    string Name,
    string? PuzzleType = "3x3x3"
);

public record SessionDto(
    int Id,
    string Name,
    string PuzzleType,
    DateTime CreatedAt,
    bool IsActive,
    int SolveCount,
    int? BestSingleMs,
    int? BestAo5Ms,
    int? BestAo12Ms
);

public record SessionStatsDto(
    int SessionId,
    string SessionName,
    int TotalSolves,
    int? BestSingle,
    int? WorstSingle,
    int? CurrentAo5,
    int? BestAo5,
    int? CurrentAo12,
    int? BestAo12,
    double? Mean,
    double? StdDev,
    List<SolveDto> RecentSolves
);

public record TimePointDto(
    DateTime Timestamp,
    int TimeMs,
    int? RollingAo5,
    int? RollingAo12
);

public record DailySolveCountDto(
    string Date,
    int Count
);

public record TimeBucketDto(
    string Range,
    int Count
);

public record CategoryMasteryDto(
    string Category,
    int TotalCount,
    int MasteredCount,
    int PracticingCount,
    int LearningCount,
    double MasteryPercentage
);

public record AnalyticsDashboardDto(
    int TotalSolves,
    int? OverallPbSingle,
    int? OverallPbAo5,
    int? OverallPbAo12,
    double AverageTimeMs,
    List<TimePointDto> ProgressionTimeline,
    List<TimeBucketDto> Distribution,
    List<DailySolveCountDto> ActivityHeatmap,
    List<CategoryMasteryDto> MasteryOverview
);
