namespace MouseAndScreen.Database.Models;

public record Background
{
    public Background(long id, long ownerId)
    {
        this.Id = id;
        this.OwnerId = ownerId;
    }

    public long Id { get; set; }

    public long OwnerId { get; set; }

    public virtual User? Owner { get; set; }
}
