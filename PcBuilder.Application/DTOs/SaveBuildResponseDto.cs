namespace PcBuilder.Application.DTOs
{
    public class SaveBuildResponseDto
    {
        public Guid Id { get; set; }
        public string ShareCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
    }
}
