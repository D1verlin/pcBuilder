using Microsoft.EntityFrameworkCore;
using PcBuilder.Domain.Entities;
using PcBuilder.Domain.Interfaces;
using PcBuilder.Infrastructure.Data;

namespace PcBuilder.Infrastructure.Repositories
{
    public class BenchmarkScenarioRepository : BaseRepository<BenchmarkScenario>, IBenchmarkScenarioRepository
    {
        public BenchmarkScenarioRepository(ApplicationDbContext context) : base(context) { }

        public async Task<IReadOnlyList<BenchmarkScenario>> GetAllOrderedAsync()
        {
            return await Context.BenchmarkScenarios
                .OrderBy(s => s.Category)
                .ThenBy(s => s.Name)
                .ToListAsync();
        }
    }
}
