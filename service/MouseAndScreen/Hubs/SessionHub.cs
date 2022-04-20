namespace MouseAndScreen.Hubs;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MouseAndScreen.Database;
using MouseAndScreen.Database.Models;
using MouseAndScreen.Messages;
using System.Security.Claims;

public class SessionHub: Hub
{
    private readonly IDbContextFactory<MouseAndScreenDbContext> dbContextFactory;
    private readonly ILogger<SessionHub> logger;

    public SessionHub(IDbContextFactory<MouseAndScreenDbContext> dbContextFactory, ILogger<SessionHub> logger)
    {
        this.dbContextFactory = dbContextFactory;
        this.logger = logger;
    }

    public override Task OnConnectedAsync()
    {
        this.logger.LogDebug($"OnConnectedAsync (userId={this.GetUserId()})");
        return Task.CompletedTask;
    }

    public async Task Join(string session)
    {
        this.logger.LogDebug($"Join({session})");
        using var dbContext = await this.dbContextFactory.CreateDbContextAsync(this.Context.ConnectionAborted);
        var dbSession = await dbContext.Sessions
            .Where(e => e.Name == session)
            .SingleOrDefaultAsync(this.Context.ConnectionAborted);

        if (dbSession == null)
        {
            dbSession = new Session(0, session);
            dbContext.Sessions.Add(dbSession);
            await dbContext.SaveChangesAsync(this.Context.ConnectionAborted);
        }

        var dbPlacedSprites = await dbContext.SpritePositions
            .Where(e => e.SessionId == dbSession.Id)
            .Include(e => e.Sprite)
            .ToArrayAsync(this.Context.ConnectionAborted);

        await this.Groups.AddToGroupAsync(this.Context.ConnectionId, session, this.Context.ConnectionAborted);
        foreach (var placedSprite in dbPlacedSprites)
        {
            await this.Clients.Caller.SendAsync(
                nameof(SpriteMovedMessage),
                new SpriteMovedMessage(placedSprite, placedSprite.Sprite.Name),
                this.Context.ConnectionAborted);
        }

        await this.Clients.Group(session).SendAsync(
            nameof(SessionJoinedMessage),
            new SessionJoinedMessage(this.GetUsername()!, session),
            this.Context.ConnectionAborted);
    }

    public async Task SelectBackground(string session, string url, string name)
    {
        this.logger.LogDebug($"SelectBackground({session}, {url}, {name})");
        await this.Clients.All.SendAsync(
            nameof(BackgroundChangedMessage),
            new BackgroundChangedMessage(session, url, name),
            this.Context.ConnectionAborted);
    }

    public async Task PlaceSprite(string session, long spriteId, string name, long x, long y)
    {
        this.logger.LogDebug($"PlaceSprite(session={session}, spriteId={spriteId}, name={name}, x={x}, y={y})");
        using var dbContext = await this.dbContextFactory.CreateDbContextAsync(this.Context.ConnectionAborted);

        var sprite = await dbContext.Sprites
            .Where(e => e.Id == spriteId)
            .SingleOrDefaultAsync(this.Context.ConnectionAborted);

        var dbSession = await dbContext.Sessions
            .Where(e => e.Name == session).
            SingleOrDefaultAsync(this.Context.ConnectionAborted);

        if (sprite == null) throw new ArgumentException("Invalid sprite id");
        if (dbSession == null) throw new ArgumentException("Invalid session");

        var placedSprite = new PlacedSprite(0, name, spriteId, dbSession.Id, x, y);
        dbContext.SpritePositions.Add(placedSprite);
        await dbContext.SaveChangesAsync(this.Context.ConnectionAborted);

        await this.Clients.Group(session).SendAsync(
            nameof(SpriteMovedMessage),
            new SpriteMovedMessage(placedSprite, sprite.Name),
            this.Context.ConnectionAborted);
    }

    public async Task MoveSprite(string session, long placedSpriteId, long x, long y)
    {
        this.logger.LogDebug($"MoveSprite({session}, {placedSpriteId}, {x}, {y})");
        using var dbContext = await this.dbContextFactory.CreateDbContextAsync(this.Context.ConnectionAborted);
        var dbSpritePosition = await dbContext.SpritePositions
            .Where(e => e.Id == placedSpriteId)
            .Include(e => e.Sprite)
            .SingleAsync(this.Context.ConnectionAborted);

        dbSpritePosition.X = x;
        dbSpritePosition.Y = y;

        await dbContext.SaveChangesAsync(this.Context.ConnectionAborted);

        await this.Clients.Group(session).SendAsync(
            nameof(SpriteMovedMessage),
            new SpriteMovedMessage(dbSpritePosition, dbSpritePosition.Sprite!.Name),
            this.Context.ConnectionAborted);
    }

    private long? GetUserId()
    {
        var claimedId = this.Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (long.TryParse(claimedId, out var userId))
        {
            return userId;
        }
        else
        {
            return null;
        }
    }

    private string? GetUsername()
    {
        return this.Context.User?.FindFirst(ClaimTypes.Name)?.Value;
    }
}
