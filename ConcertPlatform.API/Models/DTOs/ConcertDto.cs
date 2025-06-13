    namespace ConcertPlatform.API.Models.DTOs
{
    public class ConcertDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Artist { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string Venue { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string? CategoryName { get; set; } // Kategori adını da ekleyelim
        public int? CategoryId { get; set; }
        public string? ImageUrl { get; set; } // YENİ EKLENEN ALAN
  
    }
}