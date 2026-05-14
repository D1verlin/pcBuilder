using Microsoft.AspNetCore.Mvc;
using PcBuilder.Application.DTOs;
using PcBuilder.Application.Interfaces;

namespace PcBuilder.Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BuildController : ControllerBase
    {
        private readonly IBuildService _buildService;

        public BuildController(IBuildService buildService)
        {
            _buildService = buildService;
        }

        [HttpPost("validate")]
        public async Task<ActionResult<CompatibilityResultDto>> ValidateBuild([FromBody] BuildRequestDto request)
        {
            var result = await _buildService.ValidateCompatibilityAsync(request);
            return Ok(result);
        }

        [HttpPost("benchmarks")]
        public async Task<ActionResult<IEnumerable<BenchmarkResultDto>>> GetBenchmarks([FromBody] BuildRequestDto request)
        {
            var benchmarks = await _buildService.GetBuildBenchmarksAsync(request);
            return Ok(benchmarks);
        }
    }
}
