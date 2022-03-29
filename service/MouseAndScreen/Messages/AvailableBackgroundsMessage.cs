using MouseAndScreen.Database.Models;

namespace MouseAndScreen.Messages;

public record AvailableBackgroundsMessage(AvailableBackground[] OwnSprites);

public record AvailableBackground(long Id, string Url)
{
    public AvailableBackground(Background b): this(b.Id, $"/usersprites/{b.Id}")
    {
    }
}
