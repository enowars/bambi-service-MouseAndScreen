namespace MouseAndScreen.Database.Models;

public record Session
{
    public Session(long id, string name)
    {
        this.Id = id;
        this.Name = name;
    }

    public long Id { get; set; }

    public string Name { get; set; }

    public List<PlacedSprite>? PlacedSprites { get; set; }
}
