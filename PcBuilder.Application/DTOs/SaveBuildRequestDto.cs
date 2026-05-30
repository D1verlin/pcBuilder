namespace PcBuilder.Application.DTOs
{
    public class SaveBuildRequestDto
    {
        public string Name { get; set; } = "Моя сборка";
        public int? CpuId { get; set; }
        public int? MotherboardId { get; set; }
        public int? RamId { get; set; }
        public int? GpuId { get; set; }
        public int? StorageId { get; set; }
        public int? PsuId { get; set; }
    }
}
