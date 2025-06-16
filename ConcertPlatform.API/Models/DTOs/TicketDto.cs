// Models/DTOs/TicketDto.cs
namespace ConcertPlatform.API.Models.DTOs
{
    public class TicketDto
    {
        public int Id { get; set; }
        public int ConcertId { get; set; }
        public string? ConcertTitle { get; set; } 
        public string? ConcertArtist { get; set; } 
        public DateTime ConcertDate { get; set; } 
        public string? ConcertVenue { get; set; } 
        public int UserId { get; set; }
        public string? Username {get; set;} 
        public DateTime PurchaseDate { get; set; }
    }
}