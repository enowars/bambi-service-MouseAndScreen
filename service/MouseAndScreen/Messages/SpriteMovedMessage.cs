using MouseAndScreen.Database.Models;

namespace MouseAndScreen.Messages;

public record SpriteMovedMessage(long PlacedSpriteId, string Name, string Url, long X, long Y)
{
    public SpriteMovedMessage(PlacedSprite placedSprite) : this(
        placedSprite.Id,
        placedSprite.Name,
        $"/usersprites/{placedSprite.SpriteId}",
        placedSprite.X,
        placedSprite.Y)
    {
    }
}
