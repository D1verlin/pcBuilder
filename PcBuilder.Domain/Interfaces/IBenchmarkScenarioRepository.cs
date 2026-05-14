using PcBuilder.Domain.Entities;

namespace PcBuilder.Domain.Interfaces
{
    public interface IBenchmarkScenarioRepository : IRepository<BenchmarkScenario>
    {
        Task<IReadOnlyList<BenchmarkScenario>> GetAllOrderedAsync();
    }
}
