using ConcertPlatform.API.Models;
using Microsoft.EntityFrameworkCore;
// BCrypt.Net using ifadesi, ileride şifre doğrulaması (Verify) için
// bir serviste veya controller'da kullanılacağı için kalabilir.
// Şu an OnModelCreating içinde doğrudan kullanılmıyor.
using BCrypt.Net;

namespace ConcertPlatform.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Concert> Concerts { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Ticket> Tickets { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Unique kısıtlamaları
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();

            modelBuilder.Entity<Category>()
                .HasIndex(c => c.Name)
                .IsUnique();

            // İlişkilerin daha detaylı konfigürasyonu
            // One-to-Many: Category -> Concerts
            modelBuilder.Entity<Category>()
                .HasMany(c => c.Concerts)
                .WithOne(co => co.Category)
                .HasForeignKey(co => co.CategoryId)
                .OnDelete(DeleteBehavior.SetNull); // Kategori silinirse konserlerdeki CategoryId null olsun

            // Many-to-Many (Ticket üzerinden User ve Concert arasında)
            // User -> Tickets
            modelBuilder.Entity<User>()
                .HasMany(u => u.Tickets)
                .WithOne(t => t.User)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade); // Kullanıcı silinirse biletleri de silinsin

            // Concert -> Tickets
            modelBuilder.Entity<Concert>()
                .HasMany(c => c.Tickets)
                .WithOne(t => t.Concert)
                .HasForeignKey(t => t.ConcertId)
                .OnDelete(DeleteBehavior.Cascade); // Konser silinirse biletleri de silinsin

            // Seed Data: Kategoriler
            modelBuilder.Entity<Category>().HasData(
                new Category { Id = 1, Name = "Rock" },
                new Category { Id = 2, Name = "Pop" },
                new Category { Id = 3, Name = "Jazz" },
                new Category { Id = 4, Name = "Classical" }
            );

            // Seed Data: Admin Kullanıcısı
            // "Admin123!" şifresinin ÖNCEDEN HESAPLANMIŞ ve SAKLANMIŞ hash değeri.
            // Bu değer '$2a$11$mL/a0sJCrereOceIeejQyeq5IWDEyJRByXFGK1YNprv8m3qOcKsb2'
            // senin daha önce belirttiğin hash. Eğer bu Admin123!'in hash'i değilse,
            // doğru hash'i bulup buraya yazmalısın.
            // Örneğin: string adminPasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!");
            //          Console.WriteLine(adminPasswordHash);
            // ile bir kere çalıştırıp elde ettiğin hash'i buraya sabit olarak yaz.
            string sabitAdminSifreHashi = "$2a$11$1ra7gQkM.cbjPLj4c9eo/Oo9rAODi0t1rfJtFBFPgAPTEgln4HKny"; // Kendi hash değerinle değiştir

            modelBuilder.Entity<User>().HasData(
                new User
                {
                    Id = 1, // ID'yi manuel veriyoruz seed data için
                    FirstName = "Admin",
                    LastName = "User",
                    Username = "admin",
                    PasswordHash = sabitAdminSifreHashi, // Doğrudan önceden hesaplanmış hash'i ata
                    Role = "Admin"
                }
            );
        }
    }
}