using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PcBuilder.Application.Interfaces;
using PcBuilder.Domain.Entities;

namespace PcBuilder.Presentation.Controllers
{
    [ApiController]
    [Route("api/admin/builds")]
    [Authorize(Roles = "Admin")]
    public class AdminBuildsController : ControllerBase
    {
        private readonly IAdminBuildService _adminBuildService;

        public AdminBuildsController(IAdminBuildService adminBuildService)
        {
            _adminBuildService = adminBuildService;
        }

        [HttpGet]
        public async Task<ActionResult<object>> GetBuilds(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var (items, totalCount) = await _adminBuildService.GetPagedBuildsAsync(page, pageSize);
            return Ok(new { TotalCount = totalCount, Items = items });
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _adminBuildService.DeleteBuildAsync(id);
            return NoContent();
        }
    }
}
