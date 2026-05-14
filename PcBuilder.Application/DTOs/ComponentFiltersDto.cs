namespace PcBuilder.Application.DTOs
{
    public class ComponentFiltersDto
    {
        public IReadOnlyList<string> Brands { get; init; } = new List<string>();
        public IReadOnlyList<string> Sockets { get; init; } = new List<string>();
        public IReadOnlyList<string> FormFactors { get; init; } = new List<string>();
        public IReadOnlyList<string> MemoryTypes { get; init; } = new List<string>();
    }
}
