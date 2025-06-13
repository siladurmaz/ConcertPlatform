using System.ComponentModel.DataAnnotations;

namespace ConcertPlatform.API.Models.DTOs
{
    public class ConcertUpdateDto
    {
        // Id güncellenmeyeceği için burada yok. Route'tan alacağız.
        // Ancak bazen API tasarımında PUT ile gönderilen DTO'nun da ID içermesi istenebilir
        // ve route'daki ID ile eşleşip eşleşmediği kontrol edilebilir. Şimdilik ID'siz bırakalım.

        [Required(ErrorMessage = "Title is required.")]
        [MaxLength(100, ErrorMessage = "Title cannot be longer than 100 characters.")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Artist is required.")]
        [MaxLength(100, ErrorMessage = "Artist name cannot be longer than 100 characters.")]
        public string Artist { get; set; } = string.Empty;

        [Required(ErrorMessage = "Date is required.")]
        public DateTime Date { get; set; }

        [Required(ErrorMessage = "Venue is required.")]
        [MaxLength(200, ErrorMessage = "Venue cannot be longer than 200 characters.")]
        public string Venue { get; set; } = string.Empty;

        [Required(ErrorMessage = "Price is required.")]
        [Range(0.01, 100000, ErrorMessage = "Price must be between 0.01 and 100000.")]
        public decimal Price { get; set; }

        public int? CategoryId { get; set; }
        [MaxLength(500)]
        public string? ImageUrl { get; set; } // YENİ EKLENEN ALAN
    }
}