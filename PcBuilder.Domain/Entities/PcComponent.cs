using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PcBuilder.Domain.Entities
{
    public class PcComponent : BaseEntity
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        public int? CategoryId { get; set; }
        public Category? Category { get; set; }

        [MaxLength(100)]
        public string CategoryName { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        public int Tdp { get; set; }

        [MaxLength(500)]
        public string ShortDescription { get; set; } = string.Empty;

        public string SpecsJson { get; set; } = "{}";

        [MaxLength(100)]
        public string Socket { get; set; } = string.Empty;

        [MaxLength(100)]
        public string FormFactor { get; set; } = string.Empty;

        [MaxLength(100)]
        public string MemoryType { get; set; } = string.Empty;

        [MaxLength(100)]
        public string Brand { get; set; } = string.Empty;

        public List<BenchmarkResult> BenchmarkResults { get; set; } = new();
    }
}
