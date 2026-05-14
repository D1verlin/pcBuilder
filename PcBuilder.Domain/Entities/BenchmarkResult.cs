using System.ComponentModel.DataAnnotations;

namespace PcBuilder.Domain.Entities
{
    public class BenchmarkResult : BaseEntity
    {
        public int Id { get; set; }

        public int PcComponentId { get; set; }
        public PcComponent? PcComponent { get; set; }

        [Required]
        [MaxLength(100)]
        public string Type { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Score { get; set; } = string.Empty;

        [MaxLength(50)]
        public string Unit { get; set; } = string.Empty;
    }
}
