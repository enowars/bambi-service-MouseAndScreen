using MouseAndScreen.Database.Models;

namespace MouseAndScreen.Messages;

public record AvailableSpritesMessage(AvailableSprite[] OwnSprites);

public record AvailableSprite(long Id, string Name, string Url)
{
    public AvailableSprite(Sprite s): this(s.Id, s.Name, $"/usersprites/{s.Id}")
    {
    }
}
