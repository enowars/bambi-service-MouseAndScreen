using MouseAndScreen.Database.Models;

namespace MouseAndScreen.Messages;

public record AvailableBackgroundsMessage(AvailableBackground[] OwnBackgrounds);

public record AvailableBackground(long Id, string Url, string Name)
{
    public AvailableBackground(Background b): this(b.Id, $"/backgrounds/{b.Id}", b.Name)
    {
    }
}
