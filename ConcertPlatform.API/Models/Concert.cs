using System;
using System.Collections.Generic;

namespace ConcertPlatform.API.Models;

public partial class Concert
{
    public int Id { get; set; }

    public string Title { get; set; } = null!;

    public string Artist { get; set; } = null!;

    public DateTime Date { get; set; }

    public string Venue { get; set; } = null!;

    public decimal Price { get; set; }

    public int? CategoryId { get; set; }

    public string? ImageUrl { get; set; }

    public virtual Category? Category { get; set; }

    public virtual ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
