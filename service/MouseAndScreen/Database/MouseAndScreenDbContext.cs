namespace MouseAndScreen.Database;

using Microsoft.EntityFrameworkCore;
using MouseAndScreen.Database.Models;

public class MouseAndScreenDbContext : DbContext
{
#pragma warning disable CS8618
    public DbSet<Background> Backgrounds { get; set; }
    public DbSet<Sprite> Sprites { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<PlacedSprite> SpritePositions { get; set; }
    public DbSet<Session> Sessions { get; set; }
#pragma warning restore CS8618

    protected override void OnConfiguring(DbContextOptionsBuilder options)
        => options.UseSqlite(@$"Data Source=data/MouseAndScreen.db");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasIndex(e => e.Username)
            .IsUnique();

        modelBuilder.Entity<Session>()
            .HasIndex(e => e.Name);
    }
}
