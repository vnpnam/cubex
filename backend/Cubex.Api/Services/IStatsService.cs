using Cubex.Api.Entities;

namespace Cubex.Api.Services;

public interface IStatsService
{
    int? CalculateAo5(IList<Solve> solves);
    int? CalculateAo12(IList<Solve> solves);
    int? CalculateAverage(IList<Solve> solves, int n);
    (double? mean, double? stdDev) CalculateMeanAndStdDev(IList<Solve> solves);
}
