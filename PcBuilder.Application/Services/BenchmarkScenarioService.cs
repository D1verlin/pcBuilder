using PcBuilder.Application.Interfaces;
using PcBuilder.Domain.Entities;
using PcBuilder.Domain.Interfaces;

namespace PcBuilder.Application.Services
{
    public class BenchmarkScenarioService : IBenchmarkScenarioService
    {
        private readonly IBenchmarkScenarioRepository _scenarioRepository;

        public BenchmarkScenarioService(IBenchmarkScenarioRepository scenarioRepository)
        {
            _scenarioRepository = scenarioRepository;
        }

        public async Task<IReadOnlyList<BenchmarkScenario>> GetAllScenariosAsync()
        {
            return await _scenarioRepository.GetAllOrderedAsync();
        }

        public async Task<BenchmarkScenario> CreateScenarioAsync(BenchmarkScenario scenario)
        {
            scenario.Id = 0;
            return await _scenarioRepository.AddAsync(scenario);
        }

        public async Task UpdateScenarioAsync(BenchmarkScenario scenario)
        {
            await _scenarioRepository.UpdateAsync(scenario);
        }

        public async Task DeleteScenarioAsync(int id)
        {
            var scenario = await _scenarioRepository.GetByIdAsync(id);
            if (scenario != null)
                await _scenarioRepository.DeleteAsync(scenario);
        }
    }
}
