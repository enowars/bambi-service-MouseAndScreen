using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MouseAndScreen.Database;
using MouseAndScreen.Database.Models;
using MouseAndScreen.Messages;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace MouseAndScreen.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class ResourcesController : ControllerBase
    {
        private readonly MouseAndScreenDbContext dbContext;
        private readonly ILogger<ResourcesController> logger;

        public ResourcesController(MouseAndScreenDbContext dbContext, ILogger<ResourcesController> logger)
        {
            this.dbContext = dbContext;
            this.logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> Sprite([FromForm] IFormFile file)
        {
            this.logger.LogDebug($"Sprite()");
            var userId = GetUserId();
            if (userId == null)
            {
                return this.Unauthorized();
            }

            var sprite = new Sprite(0, userId.Value);
            this.dbContext.Sprites.Add(sprite);
            await this.dbContext.SaveChangesAsync(this.HttpContext.RequestAborted);
            using var fs = new FileStream($"wwwroot/usersprites/{sprite.Id}", FileMode.Create);
            await file.CopyToAsync(fs, this.HttpContext.RequestAborted);
            return this.Ok(sprite.Id);
        }

        [HttpGet]
        public async Task<ActionResult<AvailableSpritesMessage>> Sprites()
        {
            var userId = this.GetUserId();
            if (userId != null)
            {
                var ownSprites = await this.dbContext.Sprites
                    .Where(e => e.OwnerId == userId)
                    .OrderByDescending(e => e.Id)
                    .Take(100)
                    .Select(e => new AvailableSprite(e.Id, $"/usersprites/{e.Id}"))
                    .ToArrayAsync(this.HttpContext.RequestAborted);

                return new AvailableSpritesMessage(ownSprites);
            }

            return this.Unauthorized();
        }

        [HttpPost]
        public async Task<IActionResult> Background([FromForm] IFormFile file)
        {
            this.logger.LogDebug($"Background()");
            var userId = GetUserId();
            if (userId == null)
            {
                return this.Unauthorized();
            }

            var background = new Background(0, userId.Value);
            this.dbContext.Backgrounds.Add(background);
            await this.dbContext.SaveChangesAsync(this.HttpContext.RequestAborted);
            using var fs = new FileStream($"wwwroot/backgrounds/{background.Id}", FileMode.Create);
            await file.CopyToAsync(fs, this.HttpContext.RequestAborted);
            return this.Ok(background.Id);
        }

        [HttpGet]
        public async Task<ActionResult<AvailableBackgroundsMessage>> Backgrounds()
        {
            var userId = this.GetUserId();
            if (userId != null)
            {
                var ownBackgrounds = await this.dbContext.Backgrounds
                    .Where(e => e.OwnerId == userId)
                    .OrderByDescending(e => e.Id)
                    .Take(100)
                    .Select(e => new AvailableBackground(e.Id, $"/backgrounds/{e.Id}"))
                    .ToArrayAsync(this.HttpContext.RequestAborted);

                return new AvailableBackgroundsMessage(ownBackgrounds);
            }

            return this.Unauthorized();
        }

        private long? GetUserId()
        {
            var claimedId = this.HttpContext.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (long.TryParse(claimedId, out var userId))
            {
                return userId;
            }
            else
            {
                return null;
            }
        }
    }
}
