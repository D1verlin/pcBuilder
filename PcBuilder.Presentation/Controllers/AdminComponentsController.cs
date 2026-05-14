using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PcBuilder.Application.DTOs;
using PcBuilder.Application.Interfaces;
using PcBuilder.Domain.Entities;

namespace PcBuilder.Presentation.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminComponentsController : ControllerBase
    {
        private readonly IComponentService _componentService;
        private readonly ICategoryService _categoryService;

        public AdminComponentsController(
            IComponentService componentService,
            ICategoryService categoryService)
        {
            _componentService = componentService;
            _categoryService = categoryService;
        }


        [HttpGet("components")]
        public async Task<ActionResult<object>> GetComponents(
            [FromQuery] string? search,
            [FromQuery] int? categoryId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var filter = new ComponentFilterDto
            {
                Search = search,
                CategoryId = categoryId,
                Page = page,
                PageSize = pageSize
            };

            var result = await _componentService.GetPagedComponentsAsync(filter);
            return Ok(new { result.TotalCount, result.Items });
        }

        [HttpGet("components/{id:int}")]
        public async Task<ActionResult<PcComponent>> GetComponent(int id)
        {
            var component = await _componentService.GetComponentByIdAsync(id);
            return component == null ? NotFound() : Ok(component);
        }

        [HttpPost("components")]
        public async Task<ActionResult<PcComponent>> CreateComponent([FromBody] PcComponent component)
        {
            var created = await _componentService.CreateComponentAsync(component);
            return CreatedAtAction(nameof(GetComponent), new { id = created.Id }, created);
        }

        [HttpPut("components/{id:int}")]
        public async Task<IActionResult> UpdateComponent(int id, [FromBody] PcComponent component)
        {
            if (id != component.Id) return BadRequest();
            await _componentService.UpdateComponentAsync(component);
            return NoContent();
        }

        [HttpDelete("components/{id:int}")]
        public async Task<IActionResult> DeleteComponent(int id)
        {
            await _componentService.DeleteComponentAsync(id);
            return NoContent();
        }


        [HttpGet("categories")]
        public async Task<ActionResult<IEnumerable<Category>>> GetCategories()
        {
            return Ok(await _categoryService.GetAllCategoriesAsync());
        }

        [HttpPost("categories")]
        public async Task<ActionResult<Category>> CreateCategory([FromBody] Category category)
        {
            var created = await _categoryService.CreateCategoryAsync(category);
            return CreatedAtAction(nameof(GetCategories), new { }, created);
        }

        [HttpPut("categories/{id:int}")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] Category category)
        {
            if (id != category.Id) return BadRequest();
            await _categoryService.UpdateCategoryAsync(category);
            return NoContent();
        }

        [HttpDelete("categories/{id:int}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            await _categoryService.DeleteCategoryAsync(id);
            return NoContent();
        }
    }
}
