using System.ComponentModel.DataAnnotations;

namespace ConcertPlatform.API.Models.DTOs
{
    public class UserRegisterDto
    {
        [Required]
        [MaxLength(50)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [MinLength(6, ErrorMessage = "Password must be at least 8 characters long.")]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$",
         ErrorMessage = "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character.")] 
        public string Password { get; set; } = string.Empty;
    }
}