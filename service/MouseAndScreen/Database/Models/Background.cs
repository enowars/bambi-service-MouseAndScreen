namespace MouseAndScreen.Database.Models;

public record Background
{
    public Background(long id, string name, string url)
    {
        this.Id = id;
        this.Name = name;
        this.Url = url;
    }

    public long Id { get; set; }

    public string Name { get; set; }

    public string Url { get; set; }
}
