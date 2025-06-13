using System;
using System.Collections.Generic;

namespace ConcertPlatform.API.Models;

public partial class Ticket
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int ConcertId { get; set; }

    public DateTime PurchaseDate { get; set; }

    public virtual Concert Concert { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
