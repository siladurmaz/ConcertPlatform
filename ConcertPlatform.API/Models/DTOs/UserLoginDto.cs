using System.ComponentModel.DataAnnotations;

namespace ConcertPlatform.API.Models.DTOs
{
    public class UserLoginDto
    {
        [Required]
        [MaxLength(50)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [MinLength(6)] // Örnek kural
        public string Password { get; set; } = string.Empty;
    }
}