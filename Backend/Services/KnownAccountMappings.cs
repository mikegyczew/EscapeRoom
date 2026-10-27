using Microsoft.AspNetCore.Identity;

namespace EscapeRoom.Api.Services;

public static class KnownAccountMappings
{
    private const string PlayerEmail = "mgyczew@gmail.com";
    private const string PlayerUsername = "mgyczew";

    public static async Task EnsurePlayerUsernameAsync(UserManager<IdentityUser> users)
    {
        var user = await users.FindByEmailAsync(PlayerEmail);
        if (user is null || string.Equals(user.UserName, PlayerUsername, StringComparison.Ordinal))
        {
            return;
        }

        var usernameOwner = await users.FindByNameAsync(PlayerUsername);
        if (usernameOwner is not null && usernameOwner.Id != user.Id)
        {
            throw new InvalidOperationException(
                $"The username {PlayerUsername} is already assigned to a different account.");
        }

        var result = await users.SetUserNameAsync(user, PlayerUsername);
        if (!result.Succeeded)
        {
            throw new InvalidOperationException(
                $"Could not set the username for {PlayerEmail}. " +
                string.Join(" ", result.Errors.Select(error => error.Description)));
        }
    }
}
