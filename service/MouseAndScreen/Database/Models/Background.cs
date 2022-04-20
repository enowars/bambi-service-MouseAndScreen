namespace MouseAndScreen.Database.Models;

public record Background
{
    public Background(long id, long ownerId, string name)
    {
        this.Id = id;
        this.OwnerId = ownerId;
        this.Name = name;
    }

    public long Id { get; set; }

    public long OwnerId { get; set; }

    public virtual User? Owner { get; set; }

    public string Name { get; set; }
}
