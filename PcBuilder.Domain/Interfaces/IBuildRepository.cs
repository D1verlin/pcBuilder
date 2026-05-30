using PcBuilder.Domain.Entities;

namespace PcBuilder.Domain.Interfaces
{
    public interface IBuildRepository
    {
        Task<Build?> GetByIdAsync(Guid id);
        Task<Build?> GetByShareCodeAsync(string shareCode);
        Task<(IReadOnlyList<Build> Items, int TotalCount)> GetPagedAsync(int page, int pageSize);
        Task<Build> AddAsync(Build build);
        Task DeleteAsync(Build build);
    }
}
