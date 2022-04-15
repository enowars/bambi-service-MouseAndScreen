using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MouseAndScreen.Database;
using MouseAndScreen.Database.Models;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace MouseAndScreen.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly MouseAndScreenDbContext dbContext;
        private readonly ILogger<AccountController> logger;

        public AccountController(MouseAndScreenDbContext dbContext, ILogger<AccountController> logger)
        {
            this.dbContext = dbContext;
            this.logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> Login(string username, string password)
        {
            this.logger.LogDebug($"Login({username}, {password})");
            var user = await this.dbContext.Users
                .Where(e => e.Username == username)
                .SingleOrDefaultAsync(this.HttpContext.RequestAborted);

            if (user == null)
            {
                return this.Unauthorized();
            }
            else if (Hash(password).SequenceEqual(user.PasswordHash))
            {
                await this.SignIn(user.Id, username);
                return this.NoContent();
            }
            else
            {
                return this.Unauthorized();
            }
        }

        [HttpPost]
        public async Task<IActionResult> Register(string username, string password)
        {
            this.logger.LogDebug($"Register({username}, {password})");
            var user = new User(0, username, Hash(password));
            this.dbContext.Users.Add(user);

            await this.dbContext.SaveChangesAsync(this.HttpContext.RequestAborted);
            await this.SignIn(user.Id, username);
            
            return NoContent();
        }

        private async Task SignIn(long userId, string username)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Name, username),
            };
            var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            await HttpContext.SignInAsync(new ClaimsPrincipal(claimsIdentity));
        }

        private static byte[] Hash(string input)
        {
            using SHA256 sha256Hash = SHA256.Create();
            return sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(input));
        }
    }
}
