using MouseAndScreen.Database.Models;

namespace MouseAndScreen.Messages;

public record AvailableSpritesMessage(AvailableSprite[] OwnSprites);

public record AvailableSprite(long Id, string Url)
{
    public AvailableSprite(Sprite s): this(s.Id, $"/usersprites/{s.Id}")
    {
    }
}
