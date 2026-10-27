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
builder.Services.AddScoped<IPuzzleHandler, WordAnswerPuzzleHandler>();
builder.Services.AddScoped<IPuzzleHandler, NumericCodePuzzleHandler>();
builder.Services.AddScoped<IPuzzleHandler, SolutionProofPuzzleHandler>();
builder.Services.AddScoped<IPuzzleHandler, MazeRoutePuzzleHandler>();
builder.Services.AddScoped<PuzzleHandlerRegistry>();
builder.Services.AddScoped<PuzzleService>();
builder.Services.AddScoped<AdminContentService>();
builder.Services.AddScoped<AdminDatabaseService>();
builder.Services.AddHttpClient<MailjetEmailSender>(client =>
{
    client.BaseAddress = new Uri("https://api.mailjet.com/v3.1/");
    client.Timeout = TimeSpan.FromSeconds(15);
});

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
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>();
builder.Services.AddScoped<IEmailSender<IdentityUser>>(services =>
    services.GetRequiredService<MailjetEmailSender>());
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
    await database.Database.ExecuteSqlRawAsync("""
        CREATE TABLE IF NOT EXISTS "AspNetRoles" (
            "Id" TEXT NOT NULL CONSTRAINT "PK_AspNetRoles" PRIMARY KEY,
            "Name" TEXT NULL,
            "NormalizedName" TEXT NULL,
            "ConcurrencyStamp" TEXT NULL
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "RoleNameIndex"
            ON "AspNetRoles" ("NormalizedName");
        CREATE TABLE IF NOT EXISTS "AspNetRoleClaims" (
            "Id" INTEGER NOT NULL CONSTRAINT "PK_AspNetRoleClaims" PRIMARY KEY AUTOINCREMENT,
            "RoleId" TEXT NOT NULL,
            "ClaimType" TEXT NULL,
            "ClaimValue" TEXT NULL,
            CONSTRAINT "FK_AspNetRoleClaims_AspNetRoles_RoleId"
                FOREIGN KEY ("RoleId") REFERENCES "AspNetRoles" ("Id") ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS "IX_AspNetRoleClaims_RoleId"
            ON "AspNetRoleClaims" ("RoleId");
        CREATE TABLE IF NOT EXISTS "AspNetUserRoles" (
            "UserId" TEXT NOT NULL,
            "RoleId" TEXT NOT NULL,
            CONSTRAINT "PK_AspNetUserRoles" PRIMARY KEY ("UserId", "RoleId"),
            CONSTRAINT "FK_AspNetUserRoles_AspNetUsers_UserId"
                FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
            CONSTRAINT "FK_AspNetUserRoles_AspNetRoles_RoleId"
                FOREIGN KEY ("RoleId") REFERENCES "AspNetRoles" ("Id") ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS "IX_AspNetUserRoles_RoleId"
            ON "AspNetUserRoles" ("RoleId");
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
    await GameContentDatabase.InitializeAsync(database);
    await AdminBootstrapper.EnsureConfiguredAdminAsync(
        app.Configuration,
        scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>(),
        scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>());
    await KnownAccountMappings.EnsurePlayerUsernameAsync(
        scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>());
}

var auth = app.MapGroup("/api/auth");
auth.MapIdentityApi<IdentityUser>();
auth.MapGet("/password-recovery/status", (MailjetEmailSender emailSender) =>
    Results.Ok(new { available = emailSender.IsConfigured }));
auth.MapGet("/me", async (ClaimsPrincipal principal, UserManager<IdentityUser> users) =>
    {
        var user = await users.GetUserAsync(principal);
        return user is null
            ? Results.Unauthorized()
            : Results.Ok(new
            {
                email = user.Email,
                userName = user.UserName,
                isAdmin = principal.IsInRole(AdminBootstrapper.AdminRole),
            });
    })
    .RequireAuthorization();
auth.MapPost("/login-identifier", async (
    LoginIdentifierRequest request,
    UserManager<IdentityUser> users,
    SignInManager<IdentityUser> signInManager) =>
{
    if (string.IsNullOrWhiteSpace(request.Identifier) || string.IsNullOrEmpty(request.Password))
    {
        return Results.BadRequest(new { message = "Podaj login lub e-mail oraz hasło." });
    }

    var user = await users.FindByNameAsync(request.Identifier.Trim())
        ?? await users.FindByEmailAsync(request.Identifier.Trim());
    if (user is null)
    {
        return Results.Unauthorized();
    }

    var signIn = await signInManager.PasswordSignInAsync(
        user,
        request.Password,
        isPersistent: false,
        lockoutOnFailure: true);
    return signIn.Succeeded
        ? Results.Ok()
        : Results.Unauthorized();
});
auth.MapPost("/logout", async (SignInManager<IdentityUser> signInManager) =>
    {
        await signInManager.SignOutAsync();
        return Results.NoContent();
    })
    .RequireAuthorization();

var admin = app.MapGroup("/api/admin")
    .RequireAuthorization(policy => policy.RequireRole(AdminBootstrapper.AdminRole));
admin.MapGet("/content", async (
    AdminContentService content,
    CancellationToken cancellationToken) =>
    Results.Ok(await content.GetStoriesAsync(cancellationToken)));
admin.MapGet("/database/tables", (AdminDatabaseService database) =>
    Results.Ok(database.GetTables()));
admin.MapGet("/database/{tableName}", async (
    string tableName,
    int? offset,
    int? limit,
    AdminDatabaseService database,
    CancellationToken cancellationToken) =>
{
    try
    {
        return Results.Ok(await database.GetPageAsync(
            tableName,
            offset ?? 0,
            limit ?? 50,
            cancellationToken));
    }
    catch (KeyNotFoundException exception)
    {
        return Results.NotFound(new { message = exception.Message });
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { message = exception.Message });
    }
});
admin.MapPut("/database/{tableName}/text", async (
    string tableName,
    AdminDatabaseTextUpdateRequest request,
    AdminDatabaseService database,
    CancellationToken cancellationToken) =>
{
    try
    {
        await database.UpdateTextAsync(tableName, request, cancellationToken);
        return Results.NoContent();
    }
    catch (KeyNotFoundException exception)
    {
        return Results.NotFound(new { message = exception.Message });
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { message = exception.Message });
    }
})
    .WithName("UpdateAdminDatabaseText")
    .WithSummary("Update allowed game text or translation fields")
    .WithDescription(
        "Only text fields in story, room-content, puzzle-instruction, and interface translations are editable.")
    .Produces(StatusCodes.Status204NoContent)
    .Produces(StatusCodes.Status400BadRequest)
    .Produces(StatusCodes.Status404NotFound);
admin.MapGet("/translations/{language}", async (
    string language,
    AdminContentService content,
    CancellationToken cancellationToken) =>
{
    try
    {
        return Results.Ok(await content.GetTranslationsAsync(language, cancellationToken));
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { message = exception.Message });
    }
});
admin.MapPut("/translations/{language}/{key}", async (
    string language,
    string key,
    SaveLocalizedTextRequest request,
    AdminContentService content,
    CancellationToken cancellationToken) =>
{
    try
    {
        await content.SaveTranslationAsync(language, key, request.Value, cancellationToken);
        return Results.NoContent();
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { message = exception.Message });
    }
});
admin.MapPut("/stories/{storyId}", async (
    string storyId,
    SaveStoryRequest request,
    AdminContentService content,
    CancellationToken cancellationToken) =>
{
    try
    {
        await content.SaveStoryAsync(storyId, request, cancellationToken);
        return Results.NoContent();
    }
    catch (KeyNotFoundException exception)
    {
        return Results.NotFound(new { message = exception.Message });
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { message = exception.Message });
    }
});
admin.MapPut("/rooms/{roomId}", async (
    string roomId,
    SaveRoomRequest request,
    AdminContentService content,
    CancellationToken cancellationToken) =>
{
    try
    {
        await content.SaveRoomAsync(roomId, request, cancellationToken);
        return Results.NoContent();
    }
    catch (KeyNotFoundException exception)
    {
        return Results.NotFound(new { message = exception.Message });
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { message = exception.Message });
    }
    catch (DbUpdateException)
    {
        return Results.Conflict(new { message = "Numer pokoju lub kolejność są już używane w tym scenariuszu." });
    }
});
admin.MapPut("/rooms/{roomId}/contents", async (
    string roomId,
    SaveRoomContentRequest request,
    AdminContentService content,
    CancellationToken cancellationToken) =>
{
    try
    {
        await content.SaveRoomContentAsync(roomId, request, cancellationToken);
        return Results.NoContent();
    }
    catch (KeyNotFoundException exception)
    {
        return Results.NotFound(new { message = exception.Message });
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { message = exception.Message });
    }
});
admin.MapPut("/puzzles/{puzzleId}", async (
    string puzzleId,
    SavePuzzleRequest request,
    AdminContentService content,
    CancellationToken cancellationToken) =>
{
    try
    {
        await content.SavePuzzleAsync(puzzleId, request, cancellationToken);
        return Results.NoContent();
    }
    catch (KeyNotFoundException exception)
    {
        return Results.NotFound(new { message = exception.Message });
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { message = exception.Message });
    }
    catch (DbUpdateException)
    {
        return Results.Conflict(new { message = "Kolejność zagadki jest już używana w tym pokoju." });
    }
});

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
                ?? group.FirstOrDefault(text => text.Language == "pl")?.Value
                ?? $"[Brak tłumaczenia: {group.Key}]");

    return Results.Ok(new { language = normalizedLanguage, texts = result });
});

app.MapGet("/api/stories/{language}", async (
    string language,
    ApplicationDbContext database) =>
{
    var normalizedLanguage = language.Trim().ToLowerInvariant();
    if (!IsValidLanguageCode(normalizedLanguage))
    {
        return Results.BadRequest(new { message = "Nieprawidłowy kod języka." });
    }

    var stories = await database.Stories
        .AsNoTracking()
        .Where(story => story.IsPublished)
        .OrderBy(story => story.Key)
        .ToListAsync();
    var storyIds = stories.Select(story => story.Id).ToArray();
    var storyTranslations = await database.StoryTranslations
        .AsNoTracking()
        .Where(translation => storyIds.Contains(translation.StoryId))
        .ToListAsync();
    var rooms = await database.StoryRooms
        .AsNoTracking()
        .AsSplitQuery()
        .Where(room => room.IsEnabled && storyIds.Contains(room.StoryId))
        .Include(room => room.RoomDefinition)
        .Include(room => room.Contents)
        .ThenInclude(content => content.Translations)
        .Include(room => room.Puzzles)
        .ThenInclude(puzzle => puzzle.PuzzleDefinition)
        .Include(room => room.Puzzles)
        .ThenInclude(puzzle => puzzle.Translations)
        .OrderBy(room => room.StoryId)
        .ThenBy(room => room.Order)
        .ToListAsync();

    var storiesResponse = stories.Select(story =>
    {
        var storyTranslation = SelectStoryTranslation(
            storyTranslations.Where(translation => translation.StoryId == story.Id),
            normalizedLanguage);
        var storyRooms = rooms
            .Where(room => room.StoryId == story.Id)
            .Select(room => new
            {
                room.Id,
                room.RoomNumber,
                room.Order,
                room.RoomDefinition.Key,
                contents = room.Contents
                    .OrderBy(content => content.Order)
                    .Select(content => new
                    {
                        content.ContentKey,
                        content.ContentType,
                        text = SelectLocalized(
                            content.Translations,
                            normalizedLanguage,
                            translation => translation.LanguageCode
                        )?.Text
                            ?? $"[Brak treści: {content.ContentKey}]",
                    }),
                puzzles = room.Puzzles
                    .OrderBy(puzzle => puzzle.Order)
                    .Select(puzzle => new
                    {
                        puzzle.Id,
                        puzzle.Order,
                        type = puzzle.PuzzleDefinition.PuzzleType,
                        instruction = SelectLocalized(
                            puzzle.Translations,
                            normalizedLanguage,
                            translation => translation.LanguageCode)?.Instruction
                            ?? "[Brak instrukcji zagadki]",
                        hints = SelectLocalized(
                            puzzle.Translations,
                            normalizedLanguage,
                            translation => translation.LanguageCode) is { } puzzleTranslation
                            ? new[] { puzzleTranslation.Hint1, puzzleTranslation.Hint2 }
                                .OfType<string>()
                            : Array.Empty<string>(),
                    }),
            });

        return new
        {
            story.Id,
            story.Key,
            name = storyTranslation?.Name ?? $"[Brak nazwy: {story.Key}]",
            description = storyTranslation?.Description ?? $"[Brak opisu: {story.Key}]",
            rooms = storyRooms,
        };
    });

    return Results.Ok(new { language = normalizedLanguage, stories = storiesResponse });
});

app.MapGet("/api/stories/{storyId}/progress", async (
    string storyId,
    ClaimsPrincipal principal,
    PuzzleService puzzles,
    CancellationToken cancellationToken) =>
{
    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    try
    {
        return Results.Ok(await puzzles.GetStoryProgressAsync(
            storyId,
            userId,
            cancellationToken));
    }
    catch (KeyNotFoundException)
    {
        return Results.NotFound(new { message = "Nie znaleziono opublikowanego scenariusza." });
    }
})
.RequireAuthorization();

app.MapGet("/", () => Results.Ok(new
{
    name = "EscapeRoom API",
    status = "running"
}));

app.MapGet("/healthz", () => Results.Ok(new { status = "healthy" }));

app.MapGet("/api/puzzles/first", async (
    PuzzleService puzzles,
    CancellationToken cancellationToken) =>
{
    var puzzle = await puzzles.GetFirstPuzzleAsync(cancellationToken);
    return Results.Ok(new
    {
        name = puzzle.Name,
        length = puzzle.Length,
        encoding = puzzle.Encoding,
        bitsPerCharacter = puzzle.BitsPerCharacter,
        binaryCodes = puzzle.BinaryCodes,
        progress = puzzle.Progress
    });
});

app.MapPost("/api/puzzles/first/guess", async (
    GuessLetterRequest request,
    PuzzleService puzzles,
    ClaimsPrincipal principal,
    CancellationToken cancellationToken) =>
{
    if (request.Letter is null || request.Letter.Length != 1)
    {
        return Results.BadRequest(new
        {
            message = "Wprowadź dokładnie jeden znak."
        });
    }

    var puzzleInfo = await puzzles.GetFirstPuzzleAsync(cancellationToken);
    if (request.Position < 0 || request.Position >= puzzleInfo.Length)
    {
        return Results.BadRequest(new
        {
            message = "Zagadka została już ukończona."
        });
    }

    var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId is null)
    {
        return Results.Unauthorized();
    }
    var result = await puzzles.GuessFirstCharacterAsync(request, userId, cancellationToken);

    if (!result.Correct)
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

    return Results.Ok(new
    {
        correct = true,
        complete = result.Complete,
        nextPosition = result.NextPosition,
        binary = result.Binary,
        message = result.Complete
            ? "MISJA ZAKOŃCZONA. ZAMEK OTWARTY!"
            : "Znak zaakceptowany."
    });
})
.RequireAuthorization();

app.MapPost("/api/puzzles/{puzzleInstanceId}/check", async (
    string puzzleInstanceId,
    CheckPuzzleRequest request,
    PuzzleService puzzles,
    ClaimsPrincipal principal,
    ILoggerFactory loggerFactory,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.Code))
    {
        return Results.BadRequest(new { message = "Odpowiedź nie może być pusta." });
    }

    try
    {
        var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
        {
            return Results.Unauthorized();
        }
        var result = await puzzles.ValidateAsync(
            puzzleInstanceId,
            request.Code,
            userId,
            cancellationToken);
        return Results.Ok(new { result.Correct, result.Complete });
    }
    catch (PuzzleLockedException exception)
    {
        return Results.Conflict(new { message = exception.Message });
    }
    catch (KeyNotFoundException)
    {
        return Results.NotFound(new { message = "Nie znaleziono aktywnej zagadki." });
    }
    catch (UnknownPuzzleTypeException exception)
    {
        return Results.UnprocessableEntity(new { message = exception.Message });
    }
    catch (PuzzleConfigurationException exception)
    {
        loggerFactory.CreateLogger("PuzzleValidation").LogError(
            exception,
            "Invalid configuration for puzzle instance {PuzzleInstanceId}",
            puzzleInstanceId);
        return Results.Problem(
            statusCode: StatusCodes.Status500InternalServerError,
            detail: "Konfiguracja zagadki jest nieprawidłowa.");
    }
})
.RequireAuthorization();

app.Run();

static bool IsValidLanguageCode(string language) =>
    language.Length is >= 2 and <= 10 &&
    language.All(character => char.IsAsciiLetter(character) || character == '-');

static TTranslation? SelectLanguage<TTranslation>(
    IEnumerable<TTranslation> translations,
    string language,
    Func<TTranslation, string> languageSelector) =>
    translations.FirstOrDefault(translation => languageSelector(translation) == language) ??
    translations.FirstOrDefault(translation => languageSelector(translation) == "pl");

static TTranslation? SelectLocalized<TTranslation>(
    IEnumerable<TTranslation> translations,
    string language,
    Func<TTranslation, string> languageSelector) =>
    SelectLanguage(translations, language, languageSelector);

static StoryTranslation? SelectStoryTranslation(
    IEnumerable<StoryTranslation> translations,
    string language) =>
    SelectLanguage(translations, language, translation => translation.LanguageCode);
