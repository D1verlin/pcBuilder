using PcBuilder.Domain.Entities;

namespace PcBuilder.Application.Interfaces
{
    public interface IBenchmarkScenarioService
    {
        Task<IReadOnlyList<BenchmarkScenario>> GetAllScenariosAsync();
        Task<BenchmarkScenario> CreateScenarioAsync(BenchmarkScenario scenario);
        Task UpdateScenarioAsync(BenchmarkScenario scenario);
        Task DeleteScenarioAsync(int id);
    }
}
