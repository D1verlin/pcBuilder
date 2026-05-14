using System.ComponentModel.DataAnnotations;

namespace PcBuilder.Domain.Entities
{
    public class BenchmarkScenario : BaseEntity
    {
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string Category { get; set; } = string.Empty;

        public string Unit { get; set; } = string.Empty;

        public string Icon { get; set; } = string.Empty;
    }
}
