using ConcertPlatform.API.Data;
using ConcertPlatform.API.Models;
using ConcertPlatform.API.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ConcertPlatform.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Bu controller'daki tüm action'lar için varsayılan olarak kimlik doğrulaması gereksin
    public class TicketsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TicketsController(AppDbContext context)
        {
            _context = context;
        }

        // POST: api/tickets
        // Kullanıcının bir konser için bilet "satın alması" (oluşturması)
        [HttpPost]
        public async Task<ActionResult<TicketDto>> PurchaseTicket([FromBody] TicketCreateDto ticketCreateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Token'dan kullanıcı ID'sini al
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized("User ID could not be found in token.");
            }

            // Konserin var olup olmadığını kontrol et
            var concert = await _context.Concerts.FindAsync(ticketCreateDto.ConcertId);
            if (concert == null)
            {
                return NotFound(new { Message = $"Concert with ID {ticketCreateDto.ConcertId} not found." });
            }

            // Aynı kullanıcı aynı konsere daha önce bilet almış mı kontrolü (opsiyonel, isteğe bağlı)
            // bool alreadyHasTicket = await _context.Tickets
            //     .AnyAsync(t => t.UserId == userId && t.ConcertId == ticketCreateDto.ConcertId);
            // if (alreadyHasTicket)
            // {
            //     return Conflict(new { Message = "You have already purchased a ticket for this concert." });
            // }


            var ticket = new Ticket
            {
                UserId = userId,
                ConcertId = ticketCreateDto.ConcertId,
                PurchaseDate = DateTime.UtcNow
            };

            _context.Tickets.Add(ticket);
            await _context.SaveChangesAsync();

            // Oluşturulan bileti, ilişkili konser ve kullanıcı bilgileriyle birlikte DTO olarak dön
            var createdTicket = await _context.Tickets
                .Include(t => t.Concert)
                .ThenInclude(c => c.Category) // Konserin kategorisini de alalım (DTO'da yok ama lazım olursa diye)
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.Id == ticket.Id);

            if (createdTicket == null)
            {
                 return StatusCode(StatusCodes.Status500InternalServerError, "Failed to retrieve created ticket for DTO mapping.");
            }

            var ticketDto = new TicketDto
            {
                Id = createdTicket.Id,
                ConcertId = createdTicket.ConcertId,
                ConcertTitle = createdTicket.Concert?.Title,
                ConcertArtist = createdTicket.Concert?.Artist,
                ConcertDate = createdTicket.Concert != null ? createdTicket.Concert.Date : default,
                ConcertVenue = createdTicket.Concert?.Venue,
                UserId = createdTicket.UserId,
                Username = createdTicket.User?.Username,
                PurchaseDate = createdTicket.PurchaseDate
            };

            // Normalde CreatedAtAction için bir GetTicketById metodu olmalı, şimdilik sadece 201 Created ve DTO dönelim.
            // Veya GetMyTickets'a yönlendirebiliriz ama o liste döner.
            return Created("", ticketDto); // İkinci parametre olarak routeValues eklenebilir, GetMyTickets'ta bu bileti nasıl bulacağımıza dair
        }


        // GET: api/tickets/my
        // Giriş yapmış kullanıcının kendi biletlerini listelemesi
        [HttpGet("my")]
        public async Task<ActionResult<IEnumerable<TicketDto>>> GetMyTickets()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized("User ID could not be found in token.");
            }

            var tickets = await _context.Tickets
                .Where(t => t.UserId == userId)
                .Include(t => t.Concert) // Konser bilgilerini de al
                .Include(t => t.User) // Kullanıcı bilgilerini de al (Username için)
                .OrderByDescending(t => t.PurchaseDate)
                .ToListAsync();

            if (!tickets.Any())
            {
                return Ok(new List<TicketDto>()); // Boş liste dönebiliriz veya NotFound("No tickets found for this user.");
            }

            var ticketDtos = tickets.Select(ticket => new TicketDto
            {
                Id = ticket.Id,
                ConcertId = ticket.ConcertId,
                ConcertTitle = ticket.Concert?.Title,
                ConcertArtist = ticket.Concert?.Artist,
                ConcertDate = ticket.Concert != null ? ticket.Concert.Date : default,
                ConcertVenue = ticket.Concert?.Venue,
                UserId = ticket.UserId,
                Username = ticket.User?.Username,
                PurchaseDate = ticket.PurchaseDate
            }).ToList();

            return Ok(ticketDtos);
        }

        // İsteğe Bağlı: GET: api/tickets/{id} - Sadece admin veya biletin sahibi görebilir gibi bir yetkilendirme eklenebilir
        // [HttpGet("{id}")]
        // public async Task<ActionResult<TicketDto>> GetTicketById(int id)
        // {
        //     var ticket = await _context.Tickets
        //         .Include(t => t.Concert)
        //         .Include(t => t.User)
        //         .FirstOrDefaultAsync(t => t.Id == id);

        //     if (ticket == null)
        //     {
        //         return NotFound();
        //     }

        //     // Yetkilendirme: Sadece Admin veya biletin sahibi bu bileti görebilir
        //     var currentUserIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        //     var currentUserRole = User.FindFirstValue(ClaimTypes.Role);

        //     if (!int.TryParse(currentUserIdString, out int currentUserId))
        //     {
        //         return Unauthorized();
        //     }

        //     if (ticket.UserId != currentUserId && currentUserRole != "Admin")
        //     {
        //         return Forbid(); // Kullanıcının bu kaynağa erişim yetkisi yok
        //     }


        //     var ticketDto = new TicketDto { /* ... mapping ... */ };
        //     return Ok(ticketDto);
        // }
    }
}