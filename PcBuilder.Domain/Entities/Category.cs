using System.ComponentModel.DataAnnotations;

namespace PcBuilder.Domain.Entities
{
    public class Category : BaseEntity
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Slug { get; set; } = string.Empty;

        public List<PcComponent> Components { get; set; } = new();
    }
}
