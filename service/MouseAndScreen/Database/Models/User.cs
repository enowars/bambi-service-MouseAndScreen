namespace MouseAndScreen.Database.Models;

public record User
{
    public User(long id, string username, byte[] passwordHash)
    {
        this.Id = id;
        this.Username = username;
        this.PasswordHash = passwordHash;
    }
    public long Id { get; set; }

    public string Username { get; set; }

    public byte[] PasswordHash { get; set; }
}
