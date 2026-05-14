using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PcBuilder.Application.Interfaces;
using PcBuilder.Domain.Entities;

namespace PcBuilder.Presentation.Controllers
{
    [ApiController]
    [Route("api/admin/scenarios")]
    [Authorize(Roles = "Admin")]
    public class AdminScenariosController : ControllerBase
    {
        private readonly IBenchmarkScenarioService _scenarioService;

        public AdminScenariosController(IBenchmarkScenarioService scenarioService)
        {
            _scenarioService = scenarioService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<BenchmarkScenario>>> GetScenarios()
        {
            return Ok(await _scenarioService.GetAllScenariosAsync());
        }

        [HttpPost]
        public async Task<ActionResult<BenchmarkScenario>> Create([FromBody] BenchmarkScenario scenario)
        {
            var created = await _scenarioService.CreateScenarioAsync(scenario);
            return Ok(created);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] BenchmarkScenario scenario)
        {
            if (id != scenario.Id) return BadRequest();
            await _scenarioService.UpdateScenarioAsync(scenario);
            return NoContent();
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _scenarioService.DeleteScenarioAsync(id);
            return NoContent();
        }
    }
}
