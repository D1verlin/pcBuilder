using PcBuilder.Domain.Entities;

namespace PcBuilder.Domain.Interfaces
{
    public interface IPcComponentRepository : IRepository<PcComponent>
    {
        Task<PcComponent?> GetByIdWithCategoryAsync(int id);
        Task<PcComponent?> GetByIdWithBenchmarksAsync(int id);
        Task<(IReadOnlyList<PcComponent> Items, int TotalCount)> GetPagedAsync(
            int? categoryId,
            string? slug,
            string? search,
            string? brand,
            string? socket,
            string? formFactor,
            string? memoryType,
            string? sortBy,
            int page,
            int pageSize);
        Task<IReadOnlyList<string>> GetDistinctBrandsAsync(int categoryId);
        Task<IReadOnlyList<string>> GetDistinctSocketsAsync(int categoryId);
        Task<IReadOnlyList<string>> GetDistinctFormFactorsAsync(int categoryId);
        Task<IReadOnlyList<string>> GetDistinctMemoryTypesAsync(int categoryId);
        Task<IReadOnlyList<PcComponent>> GetByIdsAsync(IEnumerable<int> ids);
    }
}
