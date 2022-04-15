using MouseAndScreen.Database.Models;

namespace MouseAndScreen.Messages;

public record SpriteMovedMessage(long PlacedSpriteId, string Name, string SpriteName, string Url, long X, long Y)
{
    public SpriteMovedMessage(PlacedSprite placedSprite, string spriteName) : this(
        placedSprite.Id,
        spriteName,
        placedSprite.Name,
        $"/usersprites/{placedSprite.SpriteId}",
        placedSprite.X,
        placedSprite.Y)
    {
    }
}
