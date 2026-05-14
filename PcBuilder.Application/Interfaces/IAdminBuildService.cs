using PcBuilder.Domain.Entities;

namespace PcBuilder.Application.Interfaces
{
    public interface IAdminBuildService
    {
        Task<(IReadOnlyList<Build> Items, int TotalCount)> GetPagedBuildsAsync(int page, int pageSize);
        Task DeleteBuildAsync(Guid id);
    }
}
