namespace MouseAndScreen.Database.Models;

public record Sprite
{
    public Sprite(long id, string name, long ownerId)
    {
        this.Id = id;
        this.Name = name;
        this.OwnerId = ownerId;
    }

    public long Id { get; set; }

    public string Name { get; set; }

    public long OwnerId { get; set; }

    public virtual User? Owner { get; set; }
}
