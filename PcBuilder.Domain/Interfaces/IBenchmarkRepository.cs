using PcBuilder.Domain.Entities;

namespace PcBuilder.Domain.Interfaces
{
    public interface IBenchmarkRepository : IRepository<BenchmarkResult>
    {
        Task<IReadOnlyList<BenchmarkResult>> GetByComponentIdAsync(int componentId);
        Task<IReadOnlyList<BenchmarkResult>> GetByComponentIdsAsync(IEnumerable<int> componentIds);
    }
}
