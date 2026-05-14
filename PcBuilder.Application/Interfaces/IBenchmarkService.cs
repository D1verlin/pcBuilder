using PcBuilder.Domain.Entities;

namespace PcBuilder.Application.Interfaces
{
    public interface IBenchmarkService
    {
        Task<IReadOnlyList<BenchmarkResult>> GetBenchmarksByComponentAsync(int? componentId);
        Task<BenchmarkResult> CreateBenchmarkAsync(BenchmarkResult benchmark);
        Task UpdateBenchmarkAsync(BenchmarkResult benchmark);
        Task DeleteBenchmarkAsync(int id);
    }
}
