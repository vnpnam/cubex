using Cubex.Api.Entities;

namespace Cubex.Api.DTOs;

public record AlgorithmDto(
    int Id,
    AlgorithmCategory Category,
    string SubCategory,
    string Code,
    string Name,
    string Notation,
    string? AlternativeNotation,
    string? SetupMoves,
    string DescriptionVi,
    string DescriptionEn,
    string ExecutionTipVi,
    string ExecutionTipEn,
    AlgorithmDifficulty Difficulty,
    int OrderIndex,
    string? DiagramPattern,
    MasteryStatus? UserStatus,
    bool IsFavorite,
    int? PersonalBestTimeMs,
    int PracticeCount
);

public record CreateAlgorithmDto(
    AlgorithmCategory Category,
    string SubCategory,
    string Code,
    string Name,
    string Notation,
    string? AlternativeNotation,
    string? SetupMoves,
    string DescriptionVi,
    string DescriptionEn,
    string ExecutionTipVi,
    string ExecutionTipEn,
    AlgorithmDifficulty Difficulty,
    int OrderIndex,
    string? DiagramPattern
);

public record UpdateAlgorithmDto(
    AlgorithmCategory? Category,
    string? SubCategory,
    string? Code,
    string? Name,
    string? Notation,
    string? AlternativeNotation,
    string? SetupMoves,
    string? DescriptionVi,
    string? DescriptionEn,
    string? ExecutionTipVi,
    string? ExecutionTipEn,
    AlgorithmDifficulty? Difficulty,
    int? OrderIndex,
    string? DiagramPattern
);

public record UpdateProgressDto(
    MasteryStatus Status,
    string? CustomNotes,
    bool? IsFavorite,
    int? PracticeTimeMs
);
