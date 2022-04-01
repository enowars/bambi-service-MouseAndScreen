namespace MouseAndScreen.Database.Models;

public record PlacedSprite
{
    public PlacedSprite(long id, string name, long spriteId, long sessionId, long x, long y)
    {
        this.Id = id;
        this.Name = name;
        this.SpriteId = spriteId;
        this.SessionId = sessionId;
        this.X = x;
        this.Y = y;
    }

    public long Id { get; set; }

    public string Name { get; set; }

    public long SpriteId { get; set; }

    public virtual Sprite? Sprite { get; set; }

    public long SessionId { get; set; }

    public virtual Session? Session { get; set; }

    public long X { get; set; }

    public long Y { get; set; }
}
