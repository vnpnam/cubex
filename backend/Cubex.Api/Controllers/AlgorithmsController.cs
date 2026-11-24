using System.Security.Claims;
using Cubex.Api.Data;
using Cubex.Api.DTOs;
using Cubex.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Cubex.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AlgorithmsController : ControllerBase
{
    private readonly CubexDbContext _context;

    public AlgorithmsController(CubexDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<AlgorithmDto>>> GetAll(
        [FromQuery] AlgorithmCategory? category,
        [FromQuery] AlgorithmDifficulty? difficulty,
        [FromQuery] string? search)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var query = _context.Algorithms.AsQueryable();

        if (category.HasValue)
        {
            query = query.Where(a => a.Category == category.Value);
        }

        if (difficulty.HasValue)
        {
            query = query.Where(a => a.Difficulty == difficulty.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(a => a.Name.ToLower().Contains(s) || a.Code.ToLower().Contains(s) || a.Notation.ToLower().Contains(s));
        }

        var algorithms = await query.OrderBy(a => a.Category).ThenBy(a => a.OrderIndex).ToListAsync();

        Dictionary<int, UserAlgorithmProgress> userProgress = new();
        if (!string.IsNullOrEmpty(userId))
        {
            userProgress = await _context.UserAlgorithmProgresses
                .Where(p => p.UserId == userId)
                .ToDictionaryAsync(p => p.AlgorithmId);
        }

        var result = algorithms.Select(a =>
        {
            userProgress.TryGetValue(a.Id, out var p);
            return new AlgorithmDto(
                a.Id,
                a.Category,
                a.SubCategory,
                a.Code,
                a.Name,
                a.Notation,
                a.AlternativeNotation,
                a.SetupMoves,
                a.DescriptionVi,
                a.DescriptionEn,
                a.ExecutionTipVi,
                a.ExecutionTipEn,
                a.Difficulty,
                a.OrderIndex,
                a.DiagramPattern,
                p?.Status,
                p?.IsFavorite ?? false,
                p?.PersonalBestTimeMs,
                p?.PracticeCount ?? 0
            );
        }).ToList();

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AlgorithmDto>> GetById(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var a = await _context.Algorithms.FindAsync(id);
        if (a == null) return NotFound();

        UserAlgorithmProgress? p = null;
        if (!string.IsNullOrEmpty(userId))
        {
            p = await _context.UserAlgorithmProgresses.FirstOrDefaultAsync(x => x.UserId == userId && x.AlgorithmId == id);
        }

        return Ok(new AlgorithmDto(
            a.Id,
            a.Category,
            a.SubCategory,
            a.Code,
            a.Name,
            a.Notation,
            a.AlternativeNotation,
            a.SetupMoves,
            a.DescriptionVi,
            a.DescriptionEn,
            a.ExecutionTipVi,
            a.ExecutionTipEn,
            a.Difficulty,
            a.OrderIndex,
            a.DiagramPattern,
            p?.Status,
            p?.IsFavorite ?? false,
            p?.PersonalBestTimeMs,
            p?.PracticeCount ?? 0
        ));
    }

    [Authorize]
    [HttpPost("{id}/progress")]
    public async Task<IActionResult> UpdateProgress(int id, [FromBody] UpdateProgressDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var algExists = await _context.Algorithms.AnyAsync(a => a.Id == id);
        if (!algExists) return NotFound();

        var progress = await _context.UserAlgorithmProgresses
            .FirstOrDefaultAsync(p => p.UserId == userId && p.AlgorithmId == id);

        if (progress == null)
        {
            progress = new UserAlgorithmProgress
            {
                UserId = userId,
                AlgorithmId = id,
                Status = dto.Status,
                CustomNotes = dto.CustomNotes,
                IsFavorite = dto.IsFavorite ?? false,
                PracticeCount = dto.PracticeTimeMs.HasValue ? 1 : 0,
                PersonalBestTimeMs = dto.PracticeTimeMs,
                LastPracticedAt = DateTime.UtcNow
            };
            await _context.UserAlgorithmProgresses.AddAsync(progress);
        }
        else
        {
            progress.Status = dto.Status;
            if (dto.CustomNotes != null) progress.CustomNotes = dto.CustomNotes;
            if (dto.IsFavorite.HasValue) progress.IsFavorite = dto.IsFavorite.Value;
            if (dto.PracticeTimeMs.HasValue)
            {
                progress.PracticeCount++;
                progress.LastPracticedAt = DateTime.UtcNow;
                if (!progress.PersonalBestTimeMs.HasValue || dto.PracticeTimeMs < progress.PersonalBestTimeMs)
                {
                    progress.PersonalBestTimeMs = dto.PracticeTimeMs;
                }
            }
        }

        await _context.SaveChangesAsync();
        return Ok(progress);
    }
}
