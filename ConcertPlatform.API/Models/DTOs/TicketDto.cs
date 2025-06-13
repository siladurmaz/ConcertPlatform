// Models/DTOs/TicketDto.cs
namespace ConcertPlatform.API.Models.DTOs
{
    public class TicketDto
    {
        public int Id { get; set; }
        public int ConcertId { get; set; }
        public string? ConcertTitle { get; set; } // Konser başlığını da gösterelim
        public string? ConcertArtist { get; set; } // Sanatçıyı da gösterelim
        public DateTime ConcertDate { get; set; } // Konser tarihini de gösterelim
        public string? ConcertVenue { get; set; } // Konser mekanını da gösterelim
        public int UserId { get; set; }
        public string? Username {get; set;} // Hangi kullanıcıya ait olduğu
        public DateTime PurchaseDate { get; set; }
    }
}