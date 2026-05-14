namespace PcBuilder.Application.DTOs.Auth
{
    public class LoginRequestDto
    {
        public string Email { get; init; } = string.Empty;
        public string Password { get; init; } = string.Empty;
    }

    public class LoginResponseDto
    {
        public string Token { get; init; } = string.Empty;
        public string Email { get; init; } = string.Empty;
        public DateTime ExpiresAt { get; init; }
    }
}
