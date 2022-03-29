using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using MouseAndScreen.Database;
using MouseAndScreen.Hubs;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options => {
        options.Events.OnRedirectToAccessDenied = context => {
            context.Response.StatusCode = 403;
            return Task.CompletedTask;
        };
    });
builder.Services.AddSwaggerGen();
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddDbContextFactory<MouseAndScreenDbContext>();
builder.Services.AddLogging(build =>
{
    build.ClearProviders();
    build.AddSimpleConsole();
});
var app = builder.Build();

// Quality of life
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "My API V1");
});

// Controllers and hubs
app.UseRouting();
app.UseAuthentication();
app.UseEndpoints(endpoints =>
{
    endpoints.MapControllers();
    endpoints.MapHub<SessionHub>("/hubs/session");
});
app.UseStaticFiles(new StaticFileOptions()
{
    ServeUnknownFileTypes = true,
});

var dbContextFactory = app.Services.GetRequiredService<IDbContextFactory<MouseAndScreenDbContext>>();
using (var dbContext = dbContextFactory.CreateDbContext())
{
    dbContext.Database.Migrate();
}

// Go!
app.Run();
