using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PcBuilder.Domain.Entities
{
    public class Build : BaseEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public string? UserId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(50)]
        public string ShareCode { get; set; } = string.Empty;

        public int? CpuId { get; set; }
        public PcComponent? Cpu { get; set; }

        public int? MotherboardId { get; set; }
        public PcComponent? Motherboard { get; set; }

        public int? RamId { get; set; }
        public PcComponent? Ram { get; set; }

        public int? GpuId { get; set; }
        public PcComponent? Gpu { get; set; }

        public int? StorageId { get; set; }
        public PcComponent? Storage { get; set; }

        public int? PsuId { get; set; }
        public PcComponent? Psu { get; set; }

        public int? CaseId { get; set; }
        public PcComponent? Case { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalPrice { get; set; }

        public int EstimatedWattage { get; set; }
    }
}
