// Models/DTOs/TicketCreateDto.cs
using System.ComponentModel.DataAnnotations;

namespace ConcertPlatform.API.Models.DTOs
{
    public class TicketCreateDto
    {
        [Required(ErrorMessage = "Concert ID is required to purchase a ticket.")]
        public int ConcertId { get; set; }
    }
}