using Microsoft.EntityFrameworkCore;
using PcBuilder.Domain.Entities;
using PcBuilder.Domain.Interfaces;
using PcBuilder.Infrastructure.Data;

namespace PcBuilder.Infrastructure.Repositories
{
    public class BenchmarkRepository : BaseRepository<BenchmarkResult>, IBenchmarkRepository
    {
        public BenchmarkRepository(ApplicationDbContext context) : base(context) { }

        public async Task<IReadOnlyList<BenchmarkResult>> GetByComponentIdAsync(int componentId)
        {
            return await Context.BenchmarkResults
                .Include(b => b.PcComponent)
                .Where(b => b.PcComponentId == componentId)
                .OrderBy(b => b.Type)
                .ToListAsync();
        }

        public async Task<IReadOnlyList<BenchmarkResult>> GetByComponentIdsAsync(IEnumerable<int> componentIds)
        {
            return await Context.BenchmarkResults
                .Include(b => b.PcComponent)
                .Where(b => componentIds.Contains(b.PcComponentId))
                .ToListAsync();
        }

        public override async Task<IReadOnlyList<BenchmarkResult>> GetAllAsync()
        {
            return await Context.BenchmarkResults
                .Include(b => b.PcComponent)
                .OrderBy(b => b.PcComponentId)
                .ThenBy(b => b.Type)
                .ToListAsync();
        }
    }
}
