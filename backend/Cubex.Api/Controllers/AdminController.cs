using Cubex.Api.Data;
using Cubex.Api.DTOs;
using Cubex.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Cubex.Api.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly CubexDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public AdminController(CubexDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    [HttpGet("overview")]
    public async Task<ActionResult<object>> GetPlatformOverview()
    {
        int totalUsers = await _userManager.Users.CountAsync();
        int totalAlgorithms = await _context.Algorithms.CountAsync();
        int totalSolves = await _context.Solves.CountAsync();
        int totalMasteredRecords = await _context.UserAlgorithmProgresses.CountAsync(p => p.Status == MasteryStatus.Mastered);

        var topActiveUsers = await _context.Solves
            .GroupBy(s => s.UserId)
            .Select(g => new { UserId = g.Key, SolvesCount = g.Count() })
            .OrderByDescending(x => x.SolvesCount)
            .Take(5)
            .ToListAsync();

        return Ok(new
        {
            totalUsers,
            totalAlgorithms,
            totalSolves,
            totalMasteredRecords,
            topActiveUsers
        });
    }

    [HttpGet("users")]
    public async Task<ActionResult<object>> GetUsers()
    {
        var users = await _userManager.Users.OrderByDescending(u => u.CreatedAt).ToListAsync();
        var userDtos = new List<object>();

        foreach (var u in users)
        {
            var roles = await _userManager.GetRolesAsync(u);
            var solvesCount = await _context.Solves.CountAsync(s => s.UserId == u.Id);
            userDtos.Add(new
            {
                u.Id,
                u.Email,
                u.DisplayName,
                u.WcaId,
                u.CreatedAt,
                u.LastLoginAt,
                Roles = roles,
                SolvesCount = solvesCount
            });
        }

        return Ok(userDtos);
    }

    [HttpPost("algorithms")]
    public async Task<ActionResult<Algorithm>> CreateAlgorithm([FromBody] CreateAlgorithmDto dto)
    {
        var alg = new Algorithm
        {
            Category = dto.Category,
            SubCategory = dto.SubCategory,
            Code = dto.Code,
            Name = dto.Name,
            Notation = dto.Notation,
            AlternativeNotation = dto.AlternativeNotation,
            SetupMoves = dto.SetupMoves,
            DescriptionVi = dto.DescriptionVi,
            DescriptionEn = dto.DescriptionEn,
            ExecutionTipVi = dto.ExecutionTipVi,
            ExecutionTipEn = dto.ExecutionTipEn,
            Difficulty = dto.Difficulty,
            OrderIndex = dto.OrderIndex,
            DiagramPattern = dto.DiagramPattern,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Algorithms.AddAsync(alg);
        await _context.SaveChangesAsync();

        return CreatedAtAction("GetById", "Algorithms", new { id = alg.Id }, alg);
    }

    [HttpPut("algorithms/{id}")]
    public async Task<ActionResult<Algorithm>> UpdateAlgorithm(int id, [FromBody] UpdateAlgorithmDto dto)
    {
        var alg = await _context.Algorithms.FindAsync(id);
        if (alg == null) return NotFound();

        if (dto.Category.HasValue) alg.Category = dto.Category.Value;
        if (dto.SubCategory != null) alg.SubCategory = dto.SubCategory;
        if (dto.Code != null) alg.Code = dto.Code;
        if (dto.Name != null) alg.Name = dto.Name;
        if (dto.Notation != null) alg.Notation = dto.Notation;
        if (dto.AlternativeNotation != null) alg.AlternativeNotation = dto.AlternativeNotation;
        if (dto.SetupMoves != null) alg.SetupMoves = dto.SetupMoves;
        if (dto.DescriptionVi != null) alg.DescriptionVi = dto.DescriptionVi;
        if (dto.DescriptionEn != null) alg.DescriptionEn = dto.DescriptionEn;
        if (dto.ExecutionTipVi != null) alg.ExecutionTipVi = dto.ExecutionTipVi;
        if (dto.ExecutionTipEn != null) alg.ExecutionTipEn = dto.ExecutionTipEn;
        if (dto.Difficulty.HasValue) alg.Difficulty = dto.Difficulty.Value;
        if (dto.OrderIndex.HasValue) alg.OrderIndex = dto.OrderIndex.Value;
        if (dto.DiagramPattern != null) alg.DiagramPattern = dto.DiagramPattern;

        await _context.SaveChangesAsync();
        return Ok(alg);
    }

    [HttpDelete("algorithms/{id}")]
    public async Task<IActionResult> DeleteAlgorithm(int id)
    {
        var alg = await _context.Algorithms.FindAsync(id);
        if (alg == null) return NotFound();

        _context.Algorithms.Remove(alg);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
