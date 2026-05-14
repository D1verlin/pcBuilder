using PcBuilder.Application.DTOs;

namespace PcBuilder.Application.Interfaces
{
    public interface IBuildService
    {
        Task<CompatibilityResultDto> ValidateCompatibilityAsync(BuildRequestDto request);
        Task<IReadOnlyList<BenchmarkResultDto>> GetBuildBenchmarksAsync(BuildRequestDto request);
    }
}
