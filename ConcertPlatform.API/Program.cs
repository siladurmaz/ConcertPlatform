using ConcertPlatform.API.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer; // JWT için
using Microsoft.IdentityModel.Tokens;               // JWT için
using System.Text;                                  // JWT için
using ConcertPlatform.API.Helpers;                  // JwtSettings için
using System.Text.Json.Serialization;               // ReferenceHandler için
using ConcertPlatform.API.Middleware;               // ExceptionHandlerMiddleware için

// --- WebApplication Builder ---
var builder = WebApplication.CreateBuilder(args);

// --- JwtSettings'i yapılandırmadan oku ve DI konteynerine ekle ---
var jwtSettingsSection = builder.Configuration.GetSection("Jwt");
builder.Services.Configure<JwtSettings>(jwtSettingsSection);

var jwtSettings = jwtSettingsSection.Get<JwtSettings>();
if (jwtSettings == null || string.IsNullOrEmpty(jwtSettings.Key))
{
    throw new ArgumentNullException(nameof(jwtSettings), "JWT Key cannot be null or empty in appsettings.json");
}
builder.Services.AddSingleton(jwtSettings);


builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// --- Controllers ve Swagger ---
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(); // Geliştirme için kalsın

// +++++++++++++ CORS AYARLARI BAŞLANGIÇ +++++++++++++
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins"; // Policy adı

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
                          policy.WithOrigins( "http://127.0.0.1:5500",
                                              "http://localhost:5500",
                                              "https://black-flower-06749fc1e.2.azurestaticapps.net")  // Bazen localhost olarak da gelebilir
                                .AllowAnyHeader()
                                .AllowAnyMethod();
                      });
});
// +++++++++++++ CORS AYARLARI BİTİŞ +++++++++++++

// --- JWT Authentication'ı ekle ---
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.SaveToken = true;
    options.RequireHttpsMetadata = true; // Geliştirme için false, production'da true olmalı
    options.TokenValidationParameters = new TokenValidationParameters()
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Key))
    };
});
// --- ---

var app = builder.Build();

// --- HTTP request pipeline ---

// Custom Exception Handler'ımızı pipeline'ın başına yakın ekliyoruz.
app.UseMiddleware<ExceptionHandlerMiddleware>();


if (app.Environment.IsDevelopment()|| app.Environment.IsProduction())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    // app.UseExceptionHandler("/Error");
    // app.UseHsts();
}

// app.UseHttpsRedirection(); // Bunu şimdilik yorumda bırakabiliriz, SSL ve CORS etkileşimlerini basitleştirmek için.
                             // Her şey çalıştığında tekrar aktif edilebilir.

// +++++++++++++ CORS MIDDLEWARE'İNİ EKLE +++++++++++++
// Routing'den ÖNCE, Authentication/Authorization'dan ÖNCE eklenmeli.
app.UseCors(MyAllowSpecificOrigins);
// +++++++++++++ CORS MIDDLEWARE'İ BİTİŞ +++++++++++++

app.UseRouting(); // Routing middleware'i

app.UseAuthentication(); // Önce kimlik doğrulama
app.UseAuthorization();  // Sonra yetkilendirme

app.MapControllers();   // Controller endpoint'lerini eşle //get post put delete =crud likke this

app.Run();