namespace PcBuilder.Application.DTOs
{
    public class BuildRequestDto
    {
        public int? CpuId { get; init; }
        public int? MotherboardId { get; init; }
        public int? RamId { get; init; }
        public int? GpuId { get; init; }
        public int? StorageId { get; init; }
        public int? PsuId { get; init; }

        public IEnumerable<int> GetComponentIds()
        {
            var ids = new[] { CpuId, MotherboardId, RamId, GpuId, StorageId, PsuId };
            return ids.Where(id => id.HasValue).Select(id => id!.Value);
        }
    }
}
