using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ConcertPlatform.API.Data;
using ConcertPlatform.API.Models;
using ConcertPlatform.API.Models.DTOs; // DTO'lar için using 
using Microsoft.AspNetCore.Authorization;

namespace ConcertPlatform.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ConcertsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ConcertsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Concerts
[HttpGet]
public async Task<ActionResult<IEnumerable<ConcertDto>>> GetConcerts(
    [FromQuery] int? categoryId,
    [FromQuery] string? searchTerm,
    [FromQuery] string? sortBy,
    [FromQuery] string? sortOrder,
    [FromQuery] int pageNumber = 1,
    [FromQuery] int pageSize =100)
{
    var query = _context.Concerts.Include(c => c.Category).AsQueryable();

    // 1. Kategoriye Göre Filtreleme (Veritabanında)
    if (categoryId.HasValue && categoryId.Value > 0)
    {
        query = query.Where(c => c.CategoryId == categoryId.Value);
    }

    // 2. Arama Terimine Göre Filtreleme (Veritabanında)
    if (!string.IsNullOrWhiteSpace(searchTerm))
    {
        var term = searchTerm.ToLower().Trim();
        query = query.Where(c =>
            (c.Artist != null && c.Artist.ToLower().Contains(term)) ||
            (c.Venue != null && c.Venue.ToLower().Contains(term)) ||
            (c.Title != null && c.Title.ToLower().Contains(term))
        );
    }

    // 3. Sıralama (Fiyata göre sıralama)
    bool isPriceSort = !string.IsNullOrWhiteSpace(sortBy) && sortBy.Trim().ToLower() == "price";
    bool isDescending = !string.IsNullOrWhiteSpace(sortOrder) && sortOrder.Trim().ToLower() == "desc";

    if (!isPriceSort) // Fiyata göre sıralama DEĞİLSE, sıralamayı veritabanında yap
    {
        if (!string.IsNullOrWhiteSpace(sortBy))
        {
            switch (sortBy.Trim().ToLower())
            {
                case "date":
                    query = isDescending ? query.OrderByDescending(c => c.Date) : query.OrderBy(c => c.Date);
                    break;
                case "artist":
                    query = isDescending ? query.OrderByDescending(c => c.Artist) : query.OrderBy(c => c.Artist);
                    break;
                case "title":
                    query = isDescending ? query.OrderByDescending(c => c.Title) : query.OrderBy(c => c.Title);
                    break;
                default: 
                    query = query.OrderByDescending(c => c.Date); // Varsayılan
                    break;
            }
        }
        else
        {
            query = query.OrderByDescending(c => c.Date);
        }
    }
    else
    {
        // Fiyata göre sıralama İSTENİYORSA, ama henüz veritabanında yapmıyoruz.
        // Varsayılan sıralamayı (tarihe göre) uygula, böylece ToListAsync sonrası tutarlı bir başlangıç noktamız olur.
        // Bu, eğer sortBy sadece "price" ise ve başka bir sıralama yoksa önemlidir.
        // Ama ToListAsync öncesi bir OrderBy olması genellikle iyidir.
        if (string.IsNullOrWhiteSpace(sortBy) || sortBy.Trim().ToLower() != "price") // Eğer sortBy price değilse ve başka bir sıralama yapılmadıysa
        {
             query = query.OrderByDescending(c => c.Date); // Genel bir varsayılan
        }
    }
    // // Veriyi veritabanından çek
// SAYFALAMA UYGULA
    var concerts = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();
    // Fiyata göre sıralama İSTENİYORSA, şimdi bellekte (LINQ to Objects) 
    if (isPriceSort)
    {
        concerts = isDescending ?
                   concerts.OrderByDescending(c => c.Price).ToList() :
                   concerts.OrderBy(c => c.Price).ToList();
    }
   

    var concertDtos = concerts.Select(concert => new ConcertDto
    {
        Id = concert.Id,
        Title = concert.Title,
        Artist = concert.Artist,
        Date = concert.Date,
        Venue = concert.Venue,
        Price = concert.Price,
        CategoryId = concert.CategoryId,
        CategoryName = concert.Category?.Name,
        ImageUrl = concert.ImageUrl
    }).ToList();

    return Ok(concertDtos);
}

        // GET: api/Concerts/categories
        [HttpGet("categories")]
        public async Task<ActionResult<IEnumerable<Category>>> GetCategories()
        {
            var categories = await _context.Categories.OrderBy(c => c.Name).ToListAsync();
            if (categories == null || !categories.Any())
            {
                return NotFound(new { Message = "No categories found." });
            }
            return Ok(categories);
        }

        // GET: api/Concerts/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ConcertDto>> GetConcert(int id)
        {
            var concert = await _context.Concerts
                                        .Include(c => c.Category)
                                        .FirstOrDefaultAsync(c => c.Id == id);

            if (concert == null)
            {
                return NotFound(new { Message = $"Concert with ID {id} not found." });
            }

            var concertDto = new ConcertDto
            {
                Id = concert.Id,
                Title = concert.Title,
                Artist = concert.Artist,
                Date = concert.Date,
                Venue = concert.Venue,
                Price = concert.Price,
                CategoryId = concert.CategoryId,
                CategoryName = concert.Category?.Name,
                ImageUrl = concert.ImageUrl 
            };

            return Ok(concertDto);
        }

        // POST: api/Concerts
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ConcertDto>> PostConcert([FromBody] ConcertCreateDto concertCreateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (concertCreateDto.CategoryId.HasValue)
            {
                var categoryExists = await _context.Categories.AnyAsync(c => c.Id == concertCreateDto.CategoryId.Value);
                if (!categoryExists)
                {
                    ModelState.AddModelError(nameof(concertCreateDto.CategoryId), $"Category with Id {concertCreateDto.CategoryId} not found.");
                    return BadRequest(ModelState);
                }
            }

            var concert = new Concert
            {
                Title = concertCreateDto.Title,
                Artist = concertCreateDto.Artist,
                Date = concertCreateDto.Date,
                Venue = concertCreateDto.Venue,
                Price = concertCreateDto.Price,
                CategoryId = concertCreateDto.CategoryId,
                ImageUrl = concertCreateDto.ImageUrl
            };

            _context.Concerts.Add(concert);
            await _context.SaveChangesAsync();

            var createdConcertEntity = await _context.Concerts
                                                 .Include(c => c.Category)
                                                 .FirstOrDefaultAsync(c => c.Id == concert.Id);

            if (createdConcertEntity == null)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Failed to retrieve created concert for DTO mapping.");
            }

            var concertDto = new ConcertDto
            {
                Id = createdConcertEntity.Id,
                Title = createdConcertEntity.Title,
                Artist = createdConcertEntity.Artist,
                Date = createdConcertEntity.Date,
                Venue = createdConcertEntity.Venue,
                Price = createdConcertEntity.Price,
                CategoryId = createdConcertEntity.CategoryId,
                CategoryName = createdConcertEntity.Category?.Name,
                ImageUrl = createdConcertEntity.ImageUrl 
            };

            return CreatedAtAction(nameof(GetConcert), new { id = concertDto.Id }, concertDto);
        }

        // PUT: api/Concerts/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> PutConcert(int id, [FromBody] ConcertUpdateDto concertUpdateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var concertToUpdate = await _context.Concerts.FindAsync(id);

            if (concertToUpdate == null)
            {
                return NotFound(new { Message = $"Concert with ID {id} not found for update." });
            }

            if (concertUpdateDto.CategoryId.HasValue)
            {
                var categoryExists = await _context.Categories.AnyAsync(cat => cat.Id == concertUpdateDto.CategoryId.Value);
                if (!categoryExists)
                {
                    ModelState.AddModelError(nameof(concertUpdateDto.CategoryId), $"Category with Id {concertUpdateDto.CategoryId} not found.");
                    return BadRequest(ModelState);
                }
            }

            concertToUpdate.Title = concertUpdateDto.Title;
            concertToUpdate.Artist = concertUpdateDto.Artist;
            concertToUpdate.Date = concertUpdateDto.Date;
            concertToUpdate.Venue = concertUpdateDto.Venue;
            concertToUpdate.Price = concertUpdateDto.Price;
            concertToUpdate.CategoryId = concertUpdateDto.CategoryId;
            concertToUpdate.ImageUrl = concertUpdateDto.ImageUrl;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ConcertExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            var updatedConcertEntity = await _context.Concerts
                                                    .Include(c => c.Category)
                                                    .FirstOrDefaultAsync(c => c.Id == id);

            if (updatedConcertEntity == null)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Failed to retrieve updated concert for DTO mapping.");
            }

            var concertDto = new ConcertDto
            {
                Id = updatedConcertEntity.Id,
                Title = updatedConcertEntity.Title,
                Artist = updatedConcertEntity.Artist,
                Date = updatedConcertEntity.Date,
                Venue = updatedConcertEntity.Venue,
                Price = updatedConcertEntity.Price,
                CategoryId = updatedConcertEntity.CategoryId,
                CategoryName = updatedConcertEntity.Category?.Name,
                ImageUrl = updatedConcertEntity.ImageUrl
            };
            return Ok(concertDto);
        }

        // DELETE: api/Concerts/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteConcert(int id)
        {
            var concert = await _context.Concerts.FindAsync(id);
            if (concert == null)
            {
                return NotFound(new { Message = $"Concert with ID {id} not found for deletion." });
            }

            _context.Concerts.Remove(concert);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ConcertExists(int id)
        {
            return _context.Concerts.Any(e => e.Id == id);
        }
    }
}