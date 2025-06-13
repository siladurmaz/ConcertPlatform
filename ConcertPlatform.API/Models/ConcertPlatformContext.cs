using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace ConcertPlatform.API.Models;

public partial class ConcertPlatformContext : DbContext
{
    public ConcertPlatformContext()
    {
    }

    public ConcertPlatformContext(DbContextOptions<ConcertPlatformContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<Concert> Concerts { get; set; }

    public virtual DbSet<EfmigrationsLock> EfmigrationsLocks { get; set; }

    public virtual DbSet<Ticket> Tickets { get; set; }

    public virtual DbSet<User> Users { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)

        => optionsBuilder.UseSqlite("Data Source=concert_platform.db");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasIndex(e => e.Name, "IX_Categories_Name").IsUnique();
        });

        modelBuilder.Entity<Concert>(entity =>
        {
            entity.HasIndex(e => e.CategoryId, "IX_Concerts_CategoryId");

            entity.Property(e => e.Price).HasColumnType("decimal(18,2)");

            entity.HasOne(d => d.Category).WithMany(p => p.Concerts)
                .HasForeignKey(d => d.CategoryId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<EfmigrationsLock>(entity =>
        {
            entity.ToTable("__EFMigrationsLock");

            entity.Property(e => e.Id).ValueGeneratedNever();
        });

        modelBuilder.Entity<Ticket>(entity =>
        {
            entity.HasIndex(e => e.ConcertId, "IX_Tickets_ConcertId");

            entity.HasIndex(e => e.UserId, "IX_Tickets_UserId");

            entity.HasOne(d => d.Concert).WithMany(p => p.Tickets).HasForeignKey(d => d.ConcertId);

            entity.HasOne(d => d.User).WithMany(p => p.Tickets).HasForeignKey(d => d.UserId);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Username, "IX_Users_Username").IsUnique();
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
