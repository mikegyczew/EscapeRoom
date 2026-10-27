using Microsoft.AspNetCore.Identity;

namespace EscapeRoom.Api.Services;

public static class AdminBootstrapper
{
    public const string AdminRole = "Admin";
    private const string DefaultAdminUsername = "MikeGMsc2";
    private const string DefaultAdminEmail = "mikegyczew@gmail.com";

    public static async Task EnsureConfiguredAdminAsync(
        IConfiguration configuration,
        UserManager<IdentityUser> users,
        RoleManager<IdentityRole> roles)
    {
        var username = configuration["AdminBootstrap:Username"]?.Trim();
        var password = configuration["AdminBootstrap:Password"];
        var email = configuration["AdminBootstrap:Email"]?.Trim();

        if (string.IsNullOrEmpty(username) && string.IsNullOrEmpty(password))
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrEmpty(password))
        {
            throw new InvalidOperationException(
                "AdminBootstrap:Username i AdminBootstrap:Password muszą być ustawione razem.");
        }

        email = string.IsNullOrWhiteSpace(email)
            ? string.Equals(username, DefaultAdminUsername, StringComparison.OrdinalIgnoreCase)
                ? DefaultAdminEmail
                : $"{username.ToLowerInvariant()}@admin.invalid"
            : email;

        var role = await roles.FindByNameAsync(AdminRole);
        if (role is null)
        {
            role = new IdentityRole(AdminRole);
            EnsureSucceeded(await roles.CreateAsync(role), "Nie udało się utworzyć roli administratora.");
        }

        var user = await users.FindByNameAsync(username);
        if (user is null)
        {
            user = new IdentityUser
            {
                UserName = username,
                Email = email,
                EmailConfirmed = true,
                LockoutEnabled = true,
            };
            EnsureSucceeded(await users.CreateAsync(user, password), "Nie udało się utworzyć konta administratora.");
        }
        else if (!string.Equals(user.Email, email, StringComparison.OrdinalIgnoreCase))
        {
            EnsureSucceeded(
                await users.SetEmailAsync(user, email),
                "Nie udało się zaktualizować adresu e-mail administratora.");
        }

        if (!user.EmailConfirmed)
        {
            user.EmailConfirmed = true;
            EnsureSucceeded(
                await users.UpdateAsync(user),
                "Nie udało się potwierdzić adresu e-mail administratora.");
        }

        if (!await users.IsInRoleAsync(user, AdminRole))
        {
            EnsureSucceeded(
                await users.AddToRoleAsync(user, AdminRole),
                "Nie udało się przypisać roli administratora do konta.");
        }
    }

    private static void EnsureSucceeded(IdentityResult result, string message)
    {
        if (!result.Succeeded)
        {
            throw new InvalidOperationException(
                $"{message} {string.Join(" ", result.Errors.Select(error => error.Description))}");
        }
    }
}
