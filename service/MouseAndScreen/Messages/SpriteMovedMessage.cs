using MouseAndScreen.Database.Models;

namespace MouseAndScreen.Messages;

public record SpriteMovedMessage(long PlacedSpriteId, string PlacedSpriteName, string Name, string Url, long X, long Y)
{
    public SpriteMovedMessage(PlacedSprite placedSprite, string placedSpriteName) : this(
        placedSprite.Id,
        placedSpriteName,
        placedSprite.Name,
        $"/usersprites/{placedSprite.SpriteId}",
        placedSprite.X,
        placedSprite.Y)
    {
    }
}
