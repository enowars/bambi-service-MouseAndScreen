using MouseAndScreen.Database.Models;

namespace MouseAndScreen.Messages;

public record SpriteMovedMessage(long PlacedSpriteId, string Url, long X, long Y)
{
    public SpriteMovedMessage(PlacedSprite placedSprite) : this(
        placedSprite.Id,
        $"/usersprites/{placedSprite.SpriteId}",
        placedSprite.X,
        placedSprite.Y)
    {
    }
}
