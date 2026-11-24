using System.Security.Claims;
using Cubex.Api.Data;
using Cubex.Api.DTOs;
using Cubex.Api.Entities;
using Cubex.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Cubex.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AnalyticsController : ControllerBase
{
    private readonly CubexDbContext _context;
    private readonly IStatsService _statsService;

    public AnalyticsController(CubexDbContext context, IStatsService statsService)
    {
        _context = context;
        _statsService = statsService;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<AnalyticsDashboardDto>> GetDashboard()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var solves = await _context.Solves
            .Where(s => s.UserId == userId)
            .OrderBy(s => s.Timestamp)
            .ToListAsync();

        var validSolves = solves.Where(s => s.Penalty != SolvePenalty.DNF && s.TimeMs > 0).ToList();

        int? pbSingle = validSolves.Count > 0 ? validSolves.Min(s => s.TimeMs) : null;
        double avgTime = validSolves.Count > 0 ? validSolves.Average(s => s.TimeMs) : 0;

        // Best Ao5 and Ao12
        int? pbAo5 = null;
        if (solves.Count >= 5)
        {
            for (int i = 0; i <= solves.Count - 5; i++)
            {
                var slice = solves.Skip(i).Take(5).ToList();
                var avg = _statsService.CalculateAo5(slice);
                if (avg.HasValue && avg.Value > 0 && (!pbAo5.HasValue || avg.Value < pbAo5.Value))
                {
                    pbAo5 = avg.Value;
                }
            }
        }

        int? pbAo12 = null;
        if (solves.Count >= 12)
        {
            for (int i = 0; i <= solves.Count - 12; i++)
            {
                var slice = solves.Skip(i).Take(12).ToList();
                var avg = _statsService.CalculateAo12(slice);
                if (avg.HasValue && avg.Value > 0 && (!pbAo12.HasValue || avg.Value < pbAo12.Value))
                {
                    pbAo12 = avg.Value;
                }
            }
        }

        // Timeline progression (rolling ao5 and ao12)
        var timeline = new List<TimePointDto>();
        for (int i = 0; i < solves.Count; i++)
        {
            var s = solves[i];
            int? rAo5 = i >= 4 ? _statsService.CalculateAo5(solves.Skip(i - 4).Take(5).ToList()) : null;
            int? rAo12 = i >= 11 ? _statsService.CalculateAo12(solves.Skip(i - 11).Take(12).ToList()) : null;

            timeline.Add(new TimePointDto(
                s.Timestamp,
                s.TimeMs,
                rAo5,
                rAo12
            ));
        }

        // Time distribution buckets
        var buckets = new Dictionary<string, int>
        {
            { "< 10s", 0 },
            { "10-12s", 0 },
            { "12-15s", 0 },
            { "15-20s", 0 },
            { "20-30s", 0 },
            { "30s+", 0 }
        };

        foreach (var s in validSolves)
        {
            double sec = s.TimeMs / 1000.0;
            if (sec < 10) buckets["< 10s"]++;
            else if (sec < 12) buckets["10-12s"]++;
            else if (sec < 15) buckets["12-15s"]++;
            else if (sec < 20) buckets["15-20s"]++;
            else if (sec < 30) buckets["20-30s"]++;
            else buckets["30s+"]++;
        }

        var distributionList = buckets.Select(b => new TimeBucketDto(b.Key, b.Value)).ToList();

        // Daily activity (heatmap)
        var dailySolves = solves
            .GroupBy(s => s.Timestamp.ToString("yyyy-MM-dd"))
            .Select(g => new DailySolveCountDto(g.Key, g.Count()))
            .OrderBy(d => d.Date)
            .ToList();

        // Mastery overview across CFOP & Beginner
        var allAlgorithms = await _context.Algorithms.ToListAsync();
        var userProgress = await _context.UserAlgorithmProgresses
            .Where(p => p.UserId == userId)
            .ToListAsync();

        var masteryList = new List<CategoryMasteryDto>();
        foreach (AlgorithmCategory cat in Enum.GetValues<AlgorithmCategory>())
        {
            var categoryAlgs = allAlgorithms.Where(a => a.Category == cat).ToList();
            int total = categoryAlgs.Count;
            if (total == 0) continue;

            var algIds = categoryAlgs.Select(a => a.Id).ToHashSet();
            var progSubset = userProgress.Where(p => algIds.Contains(p.AlgorithmId)).ToList();

            int mastered = progSubset.Count(p => p.Status == MasteryStatus.Mastered);
            int practicing = progSubset.Count(p => p.Status == MasteryStatus.Practicing);
            int learning = progSubset.Count(p => p.Status == MasteryStatus.Learning);

            double pct = total > 0 ? Math.Round((double)mastered / total * 100.0, 1) : 0;

            masteryList.Add(new CategoryMasteryDto(
                cat.ToString(),
                total,
                mastered,
                practicing,
                learning,
                pct
            ));
        }

        return Ok(new AnalyticsDashboardDto(
            solves.Count,
            pbSingle,
            pbAo5,
            pbAo12,
            Math.Round(avgTime, 0),
            timeline.TakeLast(100).ToList(),
            distributionList,
            dailySolves,
            masteryList
        ));
    }
}
