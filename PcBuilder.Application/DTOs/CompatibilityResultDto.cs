namespace PcBuilder.Application.DTOs
{
    public class CompatibilityResultDto
    {
        public bool IsCompatible { get; set; } = true;
        public List<string> Errors { get; set; } = new();
        public List<string> Warnings { get; set; } = new();
        public int EstimatedWattage { get; set; }
    }
}
