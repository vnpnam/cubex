using Cubex.Api.Entities;

namespace Cubex.Api.Services;

public class StatsService : IStatsService
{
    public int? CalculateAo5(IList<Solve> solves)
    {
        return CalculateTrimmedAverage(solves, 5);
    }

    public int? CalculateAo12(IList<Solve> solves)
    {
        return CalculateTrimmedAverage(solves, 12);
    }

    public int? CalculateAverage(IList<Solve> solves, int n)
    {
        return CalculateTrimmedAverage(solves, n);
    }

    private static int? CalculateTrimmedAverage(IList<Solve> solves, int n)
    {
        if (solves.Count < n) return null;

        // Take last n solves
        var subset = solves.TakeLast(n).ToList();

        // Count DNFs
        int dnfCount = subset.Count(s => s.Penalty == SolvePenalty.DNF);
        // In WCA rules:
        // For ao5 (n=5): max 1 DNF allowed (it counts as worst and is dropped). 2+ DNFs = DNF.
        // For ao12 (n=12): max 1 DNF allowed (it counts as worst and is dropped). 2+ DNFs = DNF.
        // Let's drop 5% from top and 5% from bottom (for n=5: 1 each; for n=12: 1 each)
        int dropCount = (int)Math.Ceiling(n * 0.05);
        if (dropCount < 1) dropCount = 1;

        if (dnfCount > dropCount)
        {
            return -1; // Represents DNF average
        }

        // Sort by effective time, placing DNFs at the end
        var sorted = subset
            .OrderBy(s => s.Penalty == SolvePenalty.DNF ? int.MaxValue : s.TimeMs)
            .ToList();

        // Drop best and worst
        var trimmed = sorted.Skip(dropCount).Take(n - (dropCount * 2)).ToList();

        if (trimmed.Count == 0) return null;

        return (int)Math.Round(trimmed.Average(s => s.TimeMs));
    }

    public (double? mean, double? stdDev) CalculateMeanAndStdDev(IList<Solve> solves)
    {
        var validSolves = solves.Where(s => s.Penalty != SolvePenalty.DNF && s.TimeMs > 0).ToList();
        if (validSolves.Count == 0) return (null, null);

        double mean = validSolves.Average(s => s.TimeMs);
        if (validSolves.Count == 1) return (mean, 0);

        double variance = validSolves.Sum(s => Math.Pow(s.TimeMs - mean, 2)) / (validSolves.Count - 1);
        double stdDev = Math.Sqrt(variance);

        return (mean, stdDev);
    }
}
