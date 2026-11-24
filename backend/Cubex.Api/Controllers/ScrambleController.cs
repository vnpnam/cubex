using Cubex.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Cubex.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ScrambleController : ControllerBase
{
    private readonly IScrambleService _scrambleService;

    public ScrambleController(IScrambleService scrambleService)
    {
        _scrambleService = scrambleService;
    }

    [HttpGet("3x3")]
    public ActionResult<object> Get3x3Scramble([FromQuery] int length = 20)
    {
        var scramble = _scrambleService.Generate3x3Scramble(Math.Clamp(length, 15, 30));
        return Ok(new { scramble, type = "3x3x3", length });
    }

    [HttpGet("cross")]
    public ActionResult<object> GetCrossScramble()
    {
        var scramble = _scrambleService.GenerateCrossScramble();
        return Ok(new { scramble, type = "Cross Practice" });
    }

    [HttpGet("f2l")]
    public ActionResult<object> GetF2LScramble()
    {
        var scramble = _scrambleService.GenerateF2LScramble();
        return Ok(new { scramble, type = "F2L Practice" });
    }

    [HttpGet("oll")]
    public ActionResult<object> GetOLLScramble()
    {
        var scramble = _scrambleService.GenerateOLLScramble();
        return Ok(new { scramble, type = "OLL Practice" });
    }

    [HttpGet("pll")]
    public ActionResult<object> GetPLLScramble()
    {
        var scramble = _scrambleService.GeneratePLLScramble();
        return Ok(new { scramble, type = "PLL Practice" });
    }
}
