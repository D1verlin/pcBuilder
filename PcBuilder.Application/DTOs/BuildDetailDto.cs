namespace PcBuilder.Application.DTOs
{
    public class BuildDetailDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string ShareCode { get; set; } = string.Empty;
        public decimal TotalPrice { get; set; }
        public int EstimatedWattage { get; set; }
        public BuildComponentDto? Cpu { get; set; }
        public BuildComponentDto? Motherboard { get; set; }
        public BuildComponentDto? Ram { get; set; }
        public BuildComponentDto? Gpu { get; set; }
        public BuildComponentDto? Storage { get; set; }
        public BuildComponentDto? Psu { get; set; }
    }

    public class BuildComponentDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Tdp { get; set; }
        public string Socket { get; set; } = string.Empty;
        public string FormFactor { get; set; } = string.Empty;
        public string MemoryType { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string SpecsJson { get; set; } = string.Empty;
    }
}
