using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting; 
using Microsoft.Extensions.Logging; 

namespace ConcertPlatform.API.Middleware
{
    public class ExceptionHandlerMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlerMiddleware> _logger;
        private readonly IHostEnvironment _env; 

        public ExceptionHandlerMiddleware(RequestDelegate next,
                                          ILogger<ExceptionHandlerMiddleware> logger,
                                          IHostEnvironment env)
        {
            _next = next;
            _logger = logger;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context); // Bir sonraki middleware'e veya endpoint'e git
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unhandled exception has occurred: {ErrorMessage}", ex.Message);
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";
            var statusCode = HttpStatusCode.InternalServerError; // Varsayılan 500
            var errorResponse = new
            {
                title = "An error occurred while processing your request.",
                status = (int)statusCode,
                detail = _env.IsDevelopment() ? exception.ToString() : "An internal server error has occurred. Please try again later.",
                
            };

            
            context.Response.StatusCode = (int)statusCode;
            errorResponse = new { // errorResponse'u statusCode güncellendikten sonra tekrar oluşturabiliriz
                title = errorResponse.title, // Önceki title'ı koru ya da exception'a göre değiştir.
                status = (int)statusCode, // Güncellenmiş statusCode
                detail = (_env.IsDevelopment() && statusCode == HttpStatusCode.InternalServerError)
                            ? exception.ToString() // Sadece 500 ve Development ise tüm detayı ver
                            : (statusCode == HttpStatusCode.InternalServerError ? "An internal server error has occurred." : exception.Message),
                // type = exception.GetType().Name // Exception tipini de ekleyebiliriz
            };


            var jsonResponse = JsonSerializer.Serialize(errorResponse);
            await context.Response.WriteAsync(jsonResponse);
        }
    }
}