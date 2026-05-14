using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PcBuilder.Application.Interfaces;
using PcBuilder.Domain.Entities;

namespace PcBuilder.Presentation.Controllers
{
    [ApiController]
    [Route("api/admin/benchmarks")]
    [Authorize(Roles = "Admin")]
    public class AdminBenchmarksController : ControllerBase
    {
        private readonly IBenchmarkService _benchmarkService;

        public AdminBenchmarksController(IBenchmarkService benchmarkService)
        {
            _benchmarkService = benchmarkService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<BenchmarkResult>>> GetBenchmarks(
            [FromQuery] int? componentId)
        {
            return Ok(await _benchmarkService.GetBenchmarksByComponentAsync(componentId));
        }

        [HttpPost]
        public async Task<ActionResult<BenchmarkResult>> Create([FromBody] BenchmarkResult benchmark)
        {
            var created = await _benchmarkService.CreateBenchmarkAsync(benchmark);
            return CreatedAtAction(nameof(GetBenchmarks), new { componentId = created.PcComponentId }, created);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] BenchmarkResult benchmark)
        {
            if (id != benchmark.Id) return BadRequest();
            await _benchmarkService.UpdateBenchmarkAsync(benchmark);
            return NoContent();
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _benchmarkService.DeleteBenchmarkAsync(id);
            return NoContent();
        }
    }
}
