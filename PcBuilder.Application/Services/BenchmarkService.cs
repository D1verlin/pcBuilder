using PcBuilder.Application.Interfaces;
using PcBuilder.Domain.Entities;
using PcBuilder.Domain.Interfaces;

namespace PcBuilder.Application.Services
{
    public class BenchmarkService : IBenchmarkService
    {
        private readonly IBenchmarkRepository _benchmarkRepository;

        public BenchmarkService(IBenchmarkRepository benchmarkRepository)
        {
            _benchmarkRepository = benchmarkRepository;
        }

        public async Task<IReadOnlyList<BenchmarkResult>> GetBenchmarksByComponentAsync(int? componentId)
        {
            if (componentId.HasValue)
                return await _benchmarkRepository.GetByComponentIdAsync(componentId.Value);

            return await _benchmarkRepository.GetAllAsync();
        }

        public async Task<BenchmarkResult> CreateBenchmarkAsync(BenchmarkResult benchmark)
        {
            benchmark.Id = 0;
            return await _benchmarkRepository.AddAsync(benchmark);
        }

        public async Task UpdateBenchmarkAsync(BenchmarkResult benchmark)
        {
            await _benchmarkRepository.UpdateAsync(benchmark);
        }

        public async Task DeleteBenchmarkAsync(int id)
        {
            var benchmark = await _benchmarkRepository.GetByIdAsync(id);
            if (benchmark != null)
                await _benchmarkRepository.DeleteAsync(benchmark);
        }
    }
}
