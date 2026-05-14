using Microsoft.AspNetCore.Mvc;
using PcBuilder.Application.DTOs;
using PcBuilder.Application.Interfaces;
using PcBuilder.Domain.Entities;

namespace PcBuilder.Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ComponentsController : ControllerBase
    {
        private readonly IComponentService _componentService;
        private readonly ICategoryService _categoryService;
        private readonly IBenchmarkScenarioService _scenarioService;

        public ComponentsController(
            IComponentService componentService,
            ICategoryService categoryService,
            IBenchmarkScenarioService scenarioService)
        {
            _componentService = componentService;
            _categoryService = categoryService;
            _scenarioService = scenarioService;
        }

        [HttpGet("categories")]
        public async Task<ActionResult<IEnumerable<Category>>> GetCategories()
        {
            return Ok(await _categoryService.GetAllCategoriesAsync());
        }

        [HttpGet("scenarios")]
        public async Task<ActionResult<IEnumerable<BenchmarkScenario>>> GetScenarios()
        {
            return Ok(await _scenarioService.GetAllScenariosAsync());
        }

        [HttpGet("filters")]
        public async Task<ActionResult<ComponentFiltersDto>> GetFilters([FromQuery] int categoryId)
        {
            var filters = await _componentService.GetFiltersForCategoryAsync(categoryId);
            return Ok(filters);
        }

        [HttpGet]
        public async Task<ActionResult<object>> GetComponents(
            [FromQuery] int? categoryId,
            [FromQuery] string? slug,
            [FromQuery] string? search,
            [FromQuery] string? brand,
            [FromQuery] string? socket,
            [FromQuery] string? formFactor,
            [FromQuery] string? memoryType,
            [FromQuery] string? sortBy,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var filter = new ComponentFilterDto
            {
                CategoryId = categoryId,
                Slug = slug,
                Search = search,
                Brand = brand,
                Socket = socket,
                FormFactor = formFactor,
                MemoryType = memoryType,
                SortBy = sortBy,
                Page = page,
                PageSize = pageSize
            };

            var result = await _componentService.GetPagedComponentsAsync(filter);
            return Ok(new { result.TotalCount, result.Items });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetComponent(int id)
        {
            var component = await _componentService.GetComponentByIdAsync(id);
            if (component == null) return NotFound();
            return Ok(component);
        }
    }
}
