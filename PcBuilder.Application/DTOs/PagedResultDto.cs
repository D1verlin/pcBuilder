namespace PcBuilder.Application.DTOs
{
    public class PagedResultDto<T>
    {
        public int TotalCount { get; init; }
        public IReadOnlyList<T> Items { get; init; } = new List<T>();

        public PagedResultDto(IReadOnlyList<T> items, int totalCount)
        {
            Items = items;
            TotalCount = totalCount;
        }
    }
}
