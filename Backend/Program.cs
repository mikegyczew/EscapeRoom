using System.Security.Claims;
using System.Text.Json;
using EscapeRoom.Api.Data;
using EscapeRoom.Api.Models;
using EscapeRoom.Api.Services;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddSingleton<PuzzleService>();

var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Data Source=escape-room.db";
var sqliteConnection = new SqliteConnectionStringBuilder(connectionString);
if (!string.IsNullOrEmpty(sqliteConnection.DataSource) && sqliteConnection.DataSource != ":memory:")
{
    var databaseDirectory = Path.GetDirectoryName(Path.GetFullPath(sqliteConnection.DataSource));
    if (!string.IsNullOrEmpty(databaseDirectory))
    {
        Directory.CreateDirectory(databaseDirectory);
    }
}

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(connectionString));
var dataProtectionKeysDirectory = builder.Configuration["DataProtection:KeysDirectory"];
if (!string.IsNullOrWhiteSpace(dataProtectionKeysDirectory))
{
    Directory.CreateDirectory(dataProtectionKeysDirectory);
    builder.Services
        .AddDataProtection()
        .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionKeysDirectory));
}

builder.Services
    .AddIdentityApiEndpoints<IdentityUser>(options =>
    {
        options.User.RequireUniqueEmail = true;
        options.Password.RequiredLength = 8;
        options.Password.RequireDigit = true;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequireUppercase = false;
        options.SignIn.RequireConfirmedAccount = false;
    })
    .AddEntityFrameworkStores<ApplicationDbContext>();
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = "EscapeRoom.Auth";
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.SameSite = SameSiteMode.Lax;
});
builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173", "http://localhost:3001")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();

using (var scope = app.Services.CreateScope())
{
    var database = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await database.Database.EnsureCreatedAsync();
    await database.Database.ExecuteSqlRawAsync("""
        CREATE TABLE IF NOT EXISTS "LocalizedTexts" (
            "Language" TEXT NOT NULL,
            "Key" TEXT NOT NULL,
            "Value" TEXT NOT NULL,
            PRIMARY KEY ("Language", "Key")
        );
        """);

    var existingKeys = (await database.LocalizedTexts
        .AsNoTracking()
        .Select(text => new { text.Language, text.Key })
        .ToListAsync())
        .Select(text => (text.Language, text.Key))
        .ToHashSet();
    var missingTexts = new List<LocalizedText>();

    foreach (var (language, catalog) in TranslationCatalog.Locales)
    {
        var texts = new Dictionary<string, string>(catalog);
        var catalogPath = Path.Combine(
            AppContext.BaseDirectory,
            "Data",
            "Translations",
            $"{language}.json");
        if (File.Exists(catalogPath))
        {
            var generatedTexts = JsonSerializer.Deserialize<Dictionary<string, string>>(
                await File.ReadAllTextAsync(catalogPath));
            if (generatedTexts is null)
            {
                throw new InvalidOperationException($"Katalog tłumaczeń {language} jest nieprawidłowy.");
            }

            foreach (var (key, value) in generatedTexts)
            {
                texts[key] = value;
            }
        }

        foreach (var (key, value) in texts)
        {
            if (existingKeys.Add((language, key)))
            {
                missingTexts.Add(new LocalizedText
                {
                    Language = language,
                    Key = key,
                    Value = value,
                });
            }
        }
    }

    database.LocalizedTexts.AddRange(missingTexts);
    await database.SaveChangesAsync();
}

var auth = app.MapGroup("/api/auth");
auth.MapIdentityApi<IdentityUser>();
auth.MapGet("/me", async (ClaimsPrincipal principal, UserManager<IdentityUser> users) =>
    {
        var user = await users.GetUserAsync(principal);
        return user is null
            ? Results.Unauthorized()
            : Results.Ok(new { email = user.Email });
    })
    .RequireAuthorization();
auth.MapPost("/logout", async (SignInManager<IdentityUser> signInManager) =>
    {
        await signInManager.SignOutAsync();
        return Results.NoContent();
    })
    .RequireAuthorization();

app.MapGet("/api/translations/{language}", async (
    string language,
    ApplicationDbContext database) =>
{
    var normalizedLanguage = language.Trim().ToLowerInvariant();
    if (normalizedLanguage.Length is < 2 or > 10 ||
        normalizedLanguage.Any(character => !char.IsAsciiLetter(character) && character != '-'))
    {
        return Results.BadRequest(new { message = "Nieprawidłowy kod języka." });
    }

    var texts = await database.LocalizedTexts
        .AsNoTracking()
        .Where(text => text.Language == "pl" || text.Language == normalizedLanguage)
        .ToListAsync();
    var result = texts
        .GroupBy(text => text.Key)
        .ToDictionary(
            group => group.Key,
            group => group.FirstOrDefault(text => text.Language == normalizedLanguage)?.Value
                ?? group.First(text => text.Language == "pl").Value);

    return Results.Ok(new { language = normalizedLanguage, texts = result });
});

app.MapGet("/", () => Results.Ok(new
{
    name = "EscapeRoom API",
    status = "running"
}));

app.MapGet("/api/puzzles/first", (PuzzleService puzzles) =>
{
    return Results.Ok(new
    {
        name = "Matrix",
        length = PuzzleService.Password.Length,
        encoding = "ASCII",
        bitsPerCharacter = 8,
        binaryCodes = puzzles.GetBinaryCodes(),
        progress = 0
    });
});

app.MapPost("/api/puzzles/first/guess",
    (GuessLetterRequest request, PuzzleService puzzles) =>
{
    if (request.Letter is null || request.Letter.Length != 1)
    {
        return Results.BadRequest(new
        {
            message = "Wprowadź dokładnie jeden znak."
        });
    }

    var expected = puzzles.GetLetterAt(request.Position);

    if (expected is null)
    {
        return Results.BadRequest(new
        {
            message = "Zagadka została już ukończona."
        });
    }

    var correct =
        char.ToLowerInvariant(request.Letter[0]) == expected.Value;

    if (!correct)
    {
        return Results.Ok(new
        {
            correct = false,
            complete = false,
            nextPosition = request.Position,
            binary = (string?)null,
            message = "Błędny znak. Spróbuj ponownie."
        });
    }

    var nextPosition = request.Position + 1;
    var complete = nextPosition == PuzzleService.Password.Length;

    return Results.Ok(new
    {
        correct = true,
        complete,
        nextPosition,
        binary = puzzles.GetBinaryCode(expected.Value),
        message = complete
            ? "MISJA ZAKOŃCZONA. ZAMEK OTWARTY!"
            : "Znak zaakceptowany."
    });
});

app.Run();
