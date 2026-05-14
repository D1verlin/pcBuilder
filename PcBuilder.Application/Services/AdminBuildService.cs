using PcBuilder.Application.Interfaces;
using PcBuilder.Domain.Entities;
using PcBuilder.Domain.Interfaces;

namespace PcBuilder.Application.Services
{
    public class AdminBuildService : IAdminBuildService
    {
        private readonly IBuildRepository _buildRepository;

        public AdminBuildService(IBuildRepository buildRepository)
        {
            _buildRepository = buildRepository;
        }

        public async Task<(IReadOnlyList<Build> Items, int TotalCount)> GetPagedBuildsAsync(
            int page, int pageSize)
        {
            return await _buildRepository.GetPagedAsync(page, pageSize);
        }

        public async Task DeleteBuildAsync(Guid id)
        {
            var build = await _buildRepository.GetByIdAsync(id);
            if (build != null)
                await _buildRepository.DeleteAsync(build);
        }
    }
}
