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
public class SolvesController : ControllerBase
{
    private readonly CubexDbContext _context;

    public SolvesController(CubexDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<ActionResult<SolveDto>> RecordSolve([FromBody] RecordSolveDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var session = await _context.SolveSessions.FirstOrDefaultAsync(s => s.Id == dto.SessionId && s.UserId == userId);
        if (session == null)
        {
            return BadRequest(new { message = "Invalid solve session." });
        }

        int effectiveTime = dto.Penalty switch
        {
            SolvePenalty.PlusTwo => dto.RawTimeMs + 2000,
            SolvePenalty.DNF => -1,
            _ => dto.RawTimeMs
        };

        var solve = new Solve
        {
            UserId = userId,
            SessionId = dto.SessionId,
            RawTimeMs = dto.RawTimeMs,
            TimeMs = effectiveTime,
            Penalty = dto.Penalty,
            Scramble = dto.Scramble,
            Notes = dto.Notes,
            Tags = dto.Tags,
            InspectionTimeMs = dto.InspectionTimeMs,
            Timestamp = DateTime.UtcNow
        };

        await _context.Solves.AddAsync(solve);
        await _context.SaveChangesAsync();

        return Ok(new SolveDto(
            solve.Id,
            solve.SessionId,
            solve.TimeMs,
            solve.RawTimeMs,
            solve.Penalty,
            solve.Scramble,
            solve.Timestamp,
            solve.Notes,
            solve.Tags,
            solve.InspectionTimeMs
        ));
    }

    [HttpGet]
    public async Task<ActionResult<List<SolveDto>>> GetSolves([FromQuery] int? sessionId, [FromQuery] int limit = 100)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var query = _context.Solves.Where(s => s.UserId == userId);
        if (sessionId.HasValue)
        {
            query = query.Where(s => s.SessionId == sessionId.Value);
        }

        var solves = await query
            .OrderByDescending(s => s.Timestamp)
            .Take(limit)
            .Select(s => new SolveDto(
                s.Id,
                s.SessionId,
                s.TimeMs,
                s.RawTimeMs,
                s.Penalty,
                s.Scramble,
                s.Timestamp,
                s.Notes,
                s.Tags,
                s.InspectionTimeMs
            ))
            .ToListAsync();

        return Ok(solves);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<SolveDto>> UpdateSolve(int id, [FromBody] UpdateSolveDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var solve = await _context.Solves.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
        if (solve == null) return NotFound();

        if (dto.Penalty.HasValue)
        {
            solve.Penalty = dto.Penalty.Value;
            solve.TimeMs = solve.Penalty switch
            {
                SolvePenalty.PlusTwo => solve.RawTimeMs + 2000,
                SolvePenalty.DNF => -1,
                _ => solve.RawTimeMs
            };
        }

        if (dto.Notes != null) solve.Notes = dto.Notes;
        if (dto.Tags != null) solve.Tags = dto.Tags;

        await _context.SaveChangesAsync();

        return Ok(new SolveDto(
            solve.Id,
            solve.SessionId,
            solve.TimeMs,
            solve.RawTimeMs,
            solve.Penalty,
            solve.Scramble,
            solve.Timestamp,
            solve.Notes,
            solve.Tags,
            solve.InspectionTimeMs
        ));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSolve(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var solve = await _context.Solves.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
        if (solve == null) return NotFound();

        _context.Solves.Remove(solve);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
