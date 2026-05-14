namespace PcBuilder.Application.DTOs
{
    public class BenchmarkResultDto
    {
        public int Id { get; init; }
        public int PcComponentId { get; init; }
        public string ComponentName { get; init; } = string.Empty;
        public string Type { get; init; } = string.Empty;
        public string Score { get; init; } = string.Empty;
        public string Unit { get; init; } = string.Empty;
    }
}
