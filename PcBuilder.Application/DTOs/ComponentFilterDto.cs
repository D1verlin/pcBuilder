namespace PcBuilder.Application.DTOs
{
    public class ComponentFilterDto
    {
        public int? CategoryId { get; init; }
        public string? Slug { get; init; }
        public string? Search { get; init; }
        public string? Brand { get; init; }
        public string? Socket { get; init; }
        public string? FormFactor { get; init; }
        public string? MemoryType { get; init; }
        public string? SortBy { get; init; }
        public int Page { get; init; } = 1;
        public int PageSize { get; init; } = 50;
    }
}
