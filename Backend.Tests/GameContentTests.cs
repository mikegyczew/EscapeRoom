using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using EscapeRoom.Api.Data;
using EscapeRoom.Api.Models;
using EscapeRoom.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace EscapeRoom.Api.Tests;

public sealed class PuzzleHandlerTests
{
    [Fact]
    public async Task WordAnswerHandlerChecksSingleCharactersAndWholeAnswers()
    {
        var handler = new WordAnswerPuzzleHandler();
        var configuration = WordAnswerPuzzleHandler.CreateConfiguration("start");

        var correctCharacter = await handler.ValidateAsync(
            new PuzzleContext("word-answer", 1, configuration, 0),
            "S",
            CancellationToken.None);
        var incorrectCharacter = await handler.ValidateAsync(
            new PuzzleContext("word-answer", 1, configuration, 0),
            "x",
            CancellationToken.None);
        var completeAnswer = await handler.ValidateAsync(
            new PuzzleContext("word-answer", 1, configuration, null),
            "START",
            CancellationToken.None);
        var incorrectAnswer = await handler.ValidateAsync(
            new PuzzleContext("word-answer", 1, configuration, null),
            "wrong",
            CancellationToken.None);

        Assert.True(correctCharacter.Correct);
        Assert.Equal("01110011", correctCharacter.Binary);
        Assert.False(incorrectCharacter.Correct);
        Assert.True(completeAnswer.Complete);
        Assert.False(incorrectAnswer.Correct);
    }

    [Fact]
    public async Task HandlersRejectInvalidConfigurationAndUnknownTypes()
    {
        var handler = new WordAnswerPuzzleHandler();
        await Assert.ThrowsAsync<PuzzleConfigurationException>(() =>
            handler.ValidateAsync(
                new PuzzleContext("word-answer", 1, "{", null),
                "start",
                CancellationToken.None));

        await Assert.ThrowsAsync<PuzzleConfigurationException>(() =>
            handler.ValidateAsync(
                new PuzzleContext(
                    "word-answer",
                    1,
                    """{"CharacterHashes":["00"],"BinaryCodes":["01110011"]}""",
                    null),
                string.Empty,
                CancellationToken.None));
        await Assert.ThrowsAsync<PuzzleConfigurationException>(() =>
            new NumericCodePuzzleHandler().ValidateAsync(
                new PuzzleContext("numeric-code", 1, """{"AnswerHash":"00"}""", null),
                string.Empty,
                CancellationToken.None));
        await Assert.ThrowsAsync<PuzzleConfigurationException>(() =>
            new SolutionProofPuzzleHandler().ValidateAsync(
                new PuzzleContext("solution-proof", 1, """{"SolutionHashes":["00"]}""", null),
                string.Empty,
                CancellationToken.None));

        var registry = new PuzzleHandlerRegistry([handler]);
        Assert.Throws<UnknownPuzzleTypeException>(() => registry.Get("unknown"));
    }

    [Fact]
    public async Task NumericCodeHandlerValidatesHashedConfiguration()
    {
        const string answer = "4821";
        var answerHash = Convert.ToHexString(
            SHA256.HashData(Encoding.UTF8.GetBytes(answer)));
        var configuration = JsonSerializer.Serialize(new { AnswerHash = answerHash });
        var handler = new NumericCodePuzzleHandler();

        var correct = await handler.ValidateAsync(
            new PuzzleContext("numeric-code", 1, configuration, null),
            answer,
            CancellationToken.None);
        var incorrect = await handler.ValidateAsync(
            new PuzzleContext("numeric-code", 1, configuration, null),
            "1111",
            CancellationToken.None);

        Assert.True(correct.Complete);
        Assert.False(incorrect.Correct);
    }

    [Fact]
    public async Task SolutionProofHandlerNormalizesJsonUnicodeBeforeHashing()
    {
        var solution = JsonSerializer.Serialize(new[] { "klucz", "książka", "drzwi" });
        var configuration = SolutionProofPuzzleHandler.CreateConfiguration([solution]);
        var handler = new SolutionProofPuzzleHandler();

        var result = await handler.ValidateAsync(
            new PuzzleContext("solution-proof", 1, configuration, null),
            """["klucz","książka","drzwi"]""",
            CancellationToken.None);

        Assert.True(result.Complete);
    }

    [Fact]
    public async Task MazeRouteHandlerAcceptsAnyValidPathAndRejectsInvalidMoves()
    {
        var handler = new MazeRoutePuzzleHandler();
        var configuration = MazeRoutePuzzleHandler.CreateConfiguration(
            ["..#####", "#.##..#", "#.##..#", "#.....#", "###.#.#", "#.....#", "#####.."],
            "0-0",
            "6-6");
        var context = new PuzzleContext("maze-route", 1, configuration, null);

        var seededPath = await handler.ValidateAsync(
            context,
            """["0-0","0-1","1-1","2-1","3-1","3-2","3-3","4-3","5-3","5-4","5-5","6-5","6-6"]""",
            CancellationToken.None);
        var alternativePath = await handler.ValidateAsync(
            context,
            """["0-0","0-1","1-1","2-1","3-1","3-2","3-3","3-4","3-5","2-5","1-5","1-4","2-4","3-4","3-3","4-3","5-3","5-4","5-5","6-5","6-6"]""",
            CancellationToken.None);
        var invalidWall = await handler.ValidateAsync(
            context,
            """["0-0","0-1","0-2","6-6"]""",
            CancellationToken.None);
        var nullCell = await handler.ValidateAsync(
            context,
            """["0-0",null,"6-6"]""",
            CancellationToken.None);

        Assert.True(seededPath.Complete);
        Assert.True(alternativePath.Complete);
        Assert.False(invalidWall.Correct);
        Assert.False(nullCell.Correct);
        await Assert.ThrowsAsync<PuzzleConfigurationException>(() =>
            handler.ValidateAsync(
                new PuzzleContext(
                    "maze-route",
                    1,
                    MazeRoutePuzzleHandler.CreateConfiguration(
                        ["..#####", "#.##..#", "#.##..#", "#.....#", "###.#.#", "#.....#", "#####.."],
                        "0-2",
                        "6-6"),
                    null),
                "[]",
                CancellationToken.None));
    }
}

public sealed class GameContentMigrationTests
{
    [Fact]
    public async Task AdminDatabaseBrowserListsGameContentAndSafeUserFields()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using (var command = connection.CreateCommand())
        {
            command.CommandText = """
                CREATE TABLE "AspNetUsers" (
                    "Id" TEXT NOT NULL PRIMARY KEY,
                    "UserName" TEXT NULL,
                    "Email" TEXT NULL,
                    "EmailConfirmed" INTEGER NOT NULL,
                    "LockoutEnabled" INTEGER NOT NULL,
                    "PasswordHash" TEXT NULL,
                    "SecurityStamp" TEXT NULL
                );
                CREATE TABLE "AspNetRoles" (
                    "Id" TEXT NOT NULL PRIMARY KEY,
                    "Name" TEXT NULL
                );
                CREATE TABLE "AspNetUserRoles" (
                    "UserId" TEXT NOT NULL,
                    "RoleId" TEXT NOT NULL,
                    PRIMARY KEY ("UserId", "RoleId")
                );
                INSERT INTO "AspNetRoles" ("Id", "Name") VALUES ('role-admin', 'Admin');
                INSERT INTO "AspNetUsers" (
                    "Id", "UserName", "Email", "EmailConfirmed", "LockoutEnabled",
                    "PasswordHash", "SecurityStamp"
                ) VALUES (
                    'user-1', 'player', 'player@example.test', 0, 1, 'secret-hash', 'secret-stamp'
                );
                INSERT INTO "AspNetUserRoles" ("UserId", "RoleId")
                VALUES ('user-1', 'role-admin');
                CREATE TABLE "LocalizedTexts" (
                    "Language" TEXT NOT NULL,
                    "Key" TEXT NOT NULL,
                    "Value" TEXT NOT NULL,
                    PRIMARY KEY ("Language", "Key")
                );
                """;
            await command.ExecuteNonQueryAsync();
        }

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlite(connection)
            .Options;
        await using var database = new ApplicationDbContext(options);
        await GameContentDatabase.InitializeAsync(database);

        var browser = new AdminDatabaseService(database);
        var availableTables = browser.GetTables().Select(table => table.Name).ToArray();
        var page = await browser.GetPageAsync("StoryRooms", 0, 5, CancellationToken.None);
        var usersPage = await browser.GetPageAsync("AspNetUsers", 0, 10, CancellationToken.None);

        Assert.Contains("LocalizedTexts", availableTables);
        Assert.Contains("AspNetUsers", availableTables);
        Assert.DoesNotContain("PlayerStoryProgress", availableTables);
        Assert.DoesNotContain("PlayerPuzzleProgress", availableTables);
        Assert.Equal(27, page.TotalRows);
        Assert.Equal(5, page.Rows.Count);
        Assert.Contains("RoomNumber", page.Columns);
        Assert.Equal(6, usersPage.Columns.Length);
        Assert.Contains("Id", usersPage.Columns);
        Assert.Contains("UserName", usersPage.Columns);
        Assert.Contains("Email", usersPage.Columns);
        Assert.Contains("EmailConfirmed", usersPage.Columns);
        Assert.Contains("LockoutEnabled", usersPage.Columns);
        Assert.Contains("Roles", usersPage.Columns);
        Assert.DoesNotContain("PasswordHash", usersPage.Columns);
        Assert.DoesNotContain("SecurityStamp", usersPage.Columns);
        Assert.Equal(1, usersPage.TotalRows);
        Assert.Equal(
            "player",
            usersPage.Rows[0][Array.IndexOf(usersPage.Columns, "UserName")]);
        Assert.Equal(
            "player@example.test",
            usersPage.Rows[0][Array.IndexOf(usersPage.Columns, "Email")]);
        Assert.Equal("Admin", usersPage.Rows[0][Array.IndexOf(usersPage.Columns, "Roles")]);
        await Assert.ThrowsAsync<ArgumentException>(() =>
            browser.GetPageAsync("Stories", 0, 101, CancellationToken.None));

        var storyTranslation = await database.StoryTranslations.FirstAsync();
        await browser.UpdateTextAsync(
            "StoryTranslations",
            new AdminDatabaseTextUpdateRequest(
                new Dictionary<string, string> { ["Id"] = storyTranslation.Id },
                new Dictionary<string, string?>
                {
                    ["Name"] = "Updated story",
                    ["Description"] = "Updated description",
                }),
            CancellationToken.None);
        Assert.Equal("Updated story", storyTranslation.Name);
        Assert.Equal("Updated description", storyTranslation.Description);

        var roomTranslation = await database.RoomContentTranslations.FirstAsync();
        await browser.UpdateTextAsync(
            "RoomContentTranslations",
            new AdminDatabaseTextUpdateRequest(
                new Dictionary<string, string> { ["Id"] = roomTranslation.Id },
                new Dictionary<string, string?> { ["Text"] = "Updated room text" }),
            CancellationToken.None);
        Assert.Equal("Updated room text", roomTranslation.Text);

        var puzzleTranslation = await database.PuzzleInstanceTranslations.FirstAsync();
        await browser.UpdateTextAsync(
            "PuzzleInstanceTranslations",
            new AdminDatabaseTextUpdateRequest(
                new Dictionary<string, string> { ["Id"] = puzzleTranslation.Id },
                new Dictionary<string, string?>
                {
                    ["Instruction"] = "Updated instruction",
                    ["Hint1"] = null,
                    ["Hint2"] = "Updated hint",
                }),
            CancellationToken.None);
        Assert.Equal("Updated instruction", puzzleTranslation.Instruction);
        Assert.Null(puzzleTranslation.Hint1);
        Assert.Equal("Updated hint", puzzleTranslation.Hint2);

        database.LocalizedTexts.Add(new LocalizedText
        {
            Language = "en",
            Key = "database.edit-test",
            Value = "Before",
        });
        await database.SaveChangesAsync();
        await browser.UpdateTextAsync(
            "LocalizedTexts",
            new AdminDatabaseTextUpdateRequest(
                new Dictionary<string, string>
                {
                    ["Language"] = "en",
                    ["Key"] = "database.edit-test",
                },
                new Dictionary<string, string?> { ["Value"] = "After" }),
            CancellationToken.None);
        Assert.Equal(
            "After",
            await database.LocalizedTexts
                .Where(text => text.Language == "en" && text.Key == "database.edit-test")
                .Select(text => text.Value)
                .SingleAsync());

        await Assert.ThrowsAsync<ArgumentException>(() =>
            browser.UpdateTextAsync(
                "Stories",
                new AdminDatabaseTextUpdateRequest(
                    new Dictionary<string, string> { ["Id"] = "labyrinth-99" },
                    new Dictionary<string, string?> { ["Key"] = "unsafe" }),
                CancellationToken.None));
    }

    [Fact]
    public async Task ConfiguredAdminIsCreatedOnceWithAdminRole()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddDbContext<ApplicationDbContext>(options => options.UseSqlite(connection));
        services.AddIdentityCore<IdentityUser>()
            .AddRoles<IdentityRole>()
            .AddEntityFrameworkStores<ApplicationDbContext>();
        await using var provider = services.BuildServiceProvider();
        await using var scope = provider.CreateAsyncScope();
        var database = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await database.Database.EnsureCreatedAsync();

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["AdminBootstrap:Username"] = "MikeGMsc2",
                ["AdminBootstrap:Password"] = "SecureTestPassword9!",
            })
            .Build();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();
        var roles = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var existingAdmin = new IdentityUser
        {
            UserName = "MikeGMsc2",
            Email = "mikegmsc2@admin.invalid",
            EmailConfirmed = true,
        };
        Assert.True((await users.CreateAsync(existingAdmin, "OldSecurePassword9!")).Succeeded);
        var existingPlayer = new IdentityUser
        {
            UserName = "mgyczew@gmail.com",
            Email = "mgyczew@gmail.com",
            EmailConfirmed = true,
        };
        Assert.True((await users.CreateAsync(existingPlayer, "PlayerPassword9!")).Succeeded);

        await AdminBootstrapper.EnsureConfiguredAdminAsync(configuration, users, roles);
        await KnownAccountMappings.EnsurePlayerUsernameAsync(users);
        await AdminBootstrapper.EnsureConfiguredAdminAsync(configuration, users, roles);
        await KnownAccountMappings.EnsurePlayerUsernameAsync(users);

        var admin = await users.FindByNameAsync("MikeGMsc2");
        Assert.NotNull(admin);
        Assert.Equal("mikegyczew@gmail.com", admin.Email);
        Assert.True(admin.EmailConfirmed);
        Assert.True(await users.IsInRoleAsync(admin, AdminBootstrapper.AdminRole));
        Assert.True(await users.CheckPasswordAsync(admin, "OldSecurePassword9!"));
        Assert.False(await users.CheckPasswordAsync(admin, "SecureTestPassword9!"));
        var player = await users.FindByNameAsync("mgyczew");
        Assert.NotNull(player);
        Assert.Equal("mgyczew@gmail.com", player.Email);
        Assert.Single(await roles.Roles.ToListAsync());
    }

    [Fact]
    public async Task SeededPuzzleSolutionsAreAcceptedByTheirHandlers()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using (var command = connection.CreateCommand())
        {
            command.CommandText = """
                CREATE TABLE "AspNetUsers" ("Id" TEXT NOT NULL PRIMARY KEY);
                CREATE TABLE "LocalizedTexts" (
                    "Language" TEXT NOT NULL,
                    "Key" TEXT NOT NULL,
                    "Value" TEXT NOT NULL,
                    PRIMARY KEY ("Language", "Key")
                );
                """;
            await command.ExecuteNonQueryAsync();
        }

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlite(connection)
            .Options;
        await using var database = new ApplicationDbContext(options);
        await GameContentDatabase.InitializeAsync(database);
        var legacyMaze = await database.PuzzleInstances
            .SingleAsync(instance => instance.Id == "labyrinth-99:room33:puzzle01");
        legacyMaze.PuzzleDefinitionId = "puzzle:solution-proof";
        legacyMaze.Configuration = SolutionProofPuzzleHandler.CreateConfiguration(["legacy-route"]);
        await database.SaveChangesAsync();
        await GameContentDatabase.InitializeAsync(database);
        database.ChangeTracker.Clear();

        var englishStory = await database.StoryTranslations
            .SingleAsync(translation =>
                translation.StoryId == "labyrinth-99" &&
                translation.LanguageCode == "en");
        Assert.Equal("Labyrinth of 99 Rooms", englishStory.Name);
        Assert.Equal(
            54,
            await database.RoomContentTranslations.CountAsync(translation =>
                translation.LanguageCode == "en" &&
                translation.RoomContent.StoryRoom.StoryId == "labyrinth-99" &&
                (translation.RoomContent.ContentKey == "title" ||
                    translation.RoomContent.ContentKey == "description")));

        var solutions = new Dictionary<string, string>
        {
            ["room01"] = "START",
            ["room05"] = "2741",
            ["room11"] = """["right","top","left"]""",
            ["room12"] = """["north","west","north","east","south","west","east","south","north","east","west","south"]""",
            ["room17"] = "0830",
            ["room22"] = "98.4",
            ["room23"] = "[4,2,6]",
            ["room27"] = """["first-walk","wedding","new-home","garden"]""",
            ["room33"] = """["0-0","0-1","1-1","2-1","3-1","3-2","3-3","4-3","5-3","5-4","5-5","6-5","6-6"]""",
            ["room34"] = "clock-reconstruction-complete",
            ["room40"] = "letter",
            ["room44"] = "start",
            ["room45"] = """["12","3","6","9"]""",
            ["room50"] = "[25,55,80]",
            ["room55"] = """["radio","clock","tape"]""",
            ["room56"] = """{"A":false,"B":true,"C":false,"D":false}""",
            ["room61"] = """["E2 → E4","E7 → E5","G1 → F3"]""",
            ["room66"] = "privacy",
            ["room67"] = """["klucz","książka","drzwi"]""",
            ["room72"] = """["door","open","memory"]""",
            ["room76"] = """["klucz","światło","notatnik"]""",
            ["room77"] = """["if","words","remind","love"]""",
            ["room78"] = "90°",
            ["room83"] = "Henry Armitage",
            ["room88"] = """["left","center","right"]""",
            ["room89"] = """["first-light","film","blindspot","vibration","choir","radio","tension","letter","labyrinth","clock"]""",
            ["room99"] = "privacy",
        };
        var instances = await database.PuzzleInstances
            .Include(instance => instance.StoryRoom)
            .Include(instance => instance.PuzzleDefinition)
            .Where(instance => instance.StoryRoom.StoryId == "labyrinth-99")
            .ToListAsync();
        var handlers = new PuzzleHandlerRegistry([
            new WordAnswerPuzzleHandler(),
            new NumericCodePuzzleHandler(),
            new SolutionProofPuzzleHandler(),
            new MazeRoutePuzzleHandler(),
        ]);

        Assert.Equal(27, instances.Count);
        Assert.All(
            instances.Where(instance => instance.StoryRoom.RoomDefinitionId == "room33"),
            instance => Assert.Equal("maze-route", instance.PuzzleDefinition.PuzzleType));
        foreach (var instance in instances)
        {
            var roomKey = instance.StoryRoom.RoomDefinitionId;
            Assert.True(solutions.TryGetValue(roomKey, out var answer), roomKey);
            var result = await handlers.Get(instance.PuzzleDefinition.PuzzleType).ValidateAsync(
                new PuzzleContext(
                    instance.PuzzleDefinition.PuzzleType,
                    instance.PuzzleDefinition.ConfigurationVersion,
                    instance.Configuration,
                    null),
                answer!,
                CancellationToken.None);
            Assert.True(result.Complete, roomKey);
        }
    }

    [Fact]
    public async Task PuzzleValidationRequiresAndPersistsCompletedPrerequisites()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using (var command = connection.CreateCommand())
        {
            command.CommandText = """
                CREATE TABLE "AspNetUsers" ("Id" TEXT NOT NULL PRIMARY KEY);
                CREATE TABLE "LocalizedTexts" (
                    "Language" TEXT NOT NULL,
                    "Key" TEXT NOT NULL,
                    "Value" TEXT NOT NULL,
                    PRIMARY KEY ("Language", "Key")
                );
                INSERT INTO "AspNetUsers" ("Id") VALUES ('player-1');
                """;
            await command.ExecuteNonQueryAsync();
        }

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlite(connection)
            .Options;
        await using var database = new ApplicationDbContext(options);
        await GameContentDatabase.InitializeAsync(database);
        database.PuzzleDefinitions.Add(new PuzzleDefinition
        {
            Id = "puzzle:disabled-word-answer",
            Key = "disabled-word-answer",
            PuzzleType = "word-answer",
            ConfigurationVersion = 1,
            IsEnabled = false,
        });
        database.PuzzleInstances.AddRange(
            new PuzzleInstance
            {
                Id = "labyrinth-99:room01:puzzle02",
                StoryRoomId = "labyrinth-99:room01",
                PuzzleDefinitionId = "puzzle:word-answer",
                Order = 2,
                Configuration = WordAnswerPuzzleHandler.CreateConfiguration("second"),
            },
            new PuzzleInstance
            {
                Id = "labyrinth-99:room01:puzzle03",
                StoryRoomId = "labyrinth-99:room01",
                PuzzleDefinitionId = "puzzle:disabled-word-answer",
                Order = 3,
                Configuration = WordAnswerPuzzleHandler.CreateConfiguration("disabled"),
            });
        await database.SaveChangesAsync();

        var service = new PuzzleService(
            database,
            new PuzzleHandlerRegistry([
                new WordAnswerPuzzleHandler(),
                new NumericCodePuzzleHandler(),
                new SolutionProofPuzzleHandler(),
            ]));

        await Assert.ThrowsAsync<PuzzleLockedException>(() =>
            service.ValidateAsync(
                "labyrinth-99:room05:puzzle01",
                "2741",
                "player-1",
                CancellationToken.None));

        PuzzleResult? result = null;
        const string answer = "START";
        for (var position = 0; position < answer.Length; position++)
        {
            result = await service.GuessFirstCharacterAsync(
                new GuessLetterRequest(position, answer[position].ToString()),
                "player-1",
                CancellationToken.None);
        }

        Assert.NotNull(result);
        Assert.True(result.Complete);

        await Assert.ThrowsAsync<PuzzleLockedException>(() =>
            service.ValidateAsync(
                "labyrinth-99:room05:puzzle01",
                "2741",
                "player-1",
                CancellationToken.None));

        var secondPuzzleResult = await service.ValidateAsync(
            "labyrinth-99:room01:puzzle02",
            "SECOND",
            "player-1",
            CancellationToken.None);
        Assert.True(secondPuzzleResult.Complete);

        var roomFiveResult = await service.ValidateAsync(
            "labyrinth-99:room05:puzzle01",
            "2741",
            "player-1",
            CancellationToken.None);
        Assert.True(roomFiveResult.Complete);
        Assert.DoesNotContain(
            "labyrinth-99:room01:puzzle03",
            (await service.GetStoryProgressAsync(
                "labyrinth-99",
                "player-1",
                CancellationToken.None)).CompletedPuzzleInstanceIds);

        var progress = await service.GetStoryProgressAsync(
            "labyrinth-99",
            "player-1",
            CancellationToken.None);
        Assert.Contains("labyrinth-99:room05:puzzle01", progress.CompletedPuzzleInstanceIds);
    }

    [Fact]
    public async Task AdditiveMigrationPreservesLegacyTextAndIsRepeatable()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using (var command = connection.CreateCommand())
        {
            command.CommandText = """
                CREATE TABLE "AspNetUsers" ("Id" TEXT NOT NULL PRIMARY KEY);
                CREATE TABLE "LocalizedTexts" (
                    "Language" TEXT NOT NULL,
                    "Key" TEXT NOT NULL,
                    "Value" TEXT NOT NULL,
                    PRIMARY KEY ("Language", "Key")
                );
                INSERT INTO "LocalizedTexts" ("Language", "Key", "Value")
                VALUES ('pl', 'room05.story1', 'Oryginalny tekst pokoju');
                """;
            await command.ExecuteNonQueryAsync();
        }

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlite(connection)
            .Options;
        await using var database = new ApplicationDbContext(options);

        await GameContentDatabase.InitializeAsync(database);
        await GameContentDatabase.InitializeAsync(database);

        Assert.Equal(27, await database.StoryRooms.CountAsync());
        Assert.Equal(27, await database.PuzzleInstances.CountAsync());
        Assert.Equal(1, await database.Stories.CountAsync());
        Assert.Equal(
            5,
            await database.StoryRooms
                .Where(room => room.Order == 2)
                .Select(room => room.RoomNumber)
                .SingleAsync());
        Assert.Equal(
            "Oryginalny tekst pokoju",
            await database.LocalizedTexts
                .Where(text => text.Key == "room05.story1")
                .Select(text => text.Value)
                .SingleAsync());
        Assert.Equal(
            "Oryginalny tekst pokoju",
            await database.RoomContentTranslations
                .Where(translation =>
                    translation.RoomContentId == "labyrinth-99:room05:story1" &&
                    translation.LanguageCode == "pl")
                .Select(translation => translation.Text)
                .SingleAsync());
        Assert.Equal(
            27,
            await database.StoryRooms
                .Select(room => room.RoomNumber)
                .Distinct()
                .CountAsync());

        var duplicateTranslation = new RoomContentTranslation
        {
            Id = "duplicate-room05-story1-pl",
            RoomContentId = "labyrinth-99:room05:story1",
            LanguageCode = "pl",
            Text = "Duplicate",
        };
        database.RoomContentTranslations.Add(duplicateTranslation);
        await Assert.ThrowsAsync<DbUpdateException>(() => database.SaveChangesAsync());
        database.Entry(duplicateTranslation).State = EntityState.Detached;
    }

    [Fact]
    public async Task OneRoomDefinitionCanBeUsedInTwoStoriesWithIndependentContent()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using (var command = connection.CreateCommand())
        {
            command.CommandText = """
                CREATE TABLE "AspNetUsers" ("Id" TEXT NOT NULL PRIMARY KEY);
                CREATE TABLE "LocalizedTexts" (
                    "Language" TEXT NOT NULL,
                    "Key" TEXT NOT NULL,
                    "Value" TEXT NOT NULL,
                    PRIMARY KEY ("Language", "Key")
                );
                """;
            await command.ExecuteNonQueryAsync();
        }

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlite(connection)
            .Options;
        await using var database = new ApplicationDbContext(options);
        await GameContentDatabase.InitializeAsync(database);

        database.Stories.Add(new Story
        {
            Id = "second-story",
            Key = "second-story",
            IsPublished = true,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        });
        database.StoryRooms.Add(new StoryRoom
        {
            Id = "second-story:room01",
            StoryId = "second-story",
            RoomDefinitionId = "room01",
            RoomNumber = 42,
            Order = 8,
            IsEnabled = true,
            Contents =
            {
                new RoomContent
                {
                    Id = "second-story:room01:intro",
                    StoryRoomId = "second-story:room01",
                    ContentKey = "intro",
                    ContentType = "text",
                    Order = 0,
                    Translations =
                    {
                        new RoomContentTranslation
                        {
                            Id = "second-story:room01:intro:en",
                            RoomContentId = "second-story:room01:intro",
                            LanguageCode = "en",
                            Text = "A different story-specific introduction.",
                        },
                    },
                },
            },
        });
        await database.SaveChangesAsync();

        Assert.Equal(
            2,
            await database.StoryRooms
                .CountAsync(room => room.RoomDefinitionId == "room01"));
        Assert.Equal(
            42,
            await database.StoryRooms
                .Where(room => room.StoryId == "second-story")
                .Select(room => room.RoomNumber)
                .SingleAsync());
        Assert.Equal(
            8,
            await database.StoryRooms
                .Where(room => room.StoryId == "second-story")
                .Select(room => room.Order)
                .SingleAsync());
        Assert.Equal(
            "A different story-specific introduction.",
            await database.RoomContentTranslations
                .Where(translation => translation.Id == "second-story:room01:intro:en")
                .Select(translation => translation.Text)
                .SingleAsync());

        var duplicateRoom = new StoryRoom
        {
            Id = "second-story:duplicate-number",
            StoryId = "second-story",
            RoomDefinitionId = "room05",
            RoomNumber = 42,
            Order = 9,
            IsEnabled = true,
        };
        database.StoryRooms.Add(duplicateRoom);
        await Assert.ThrowsAsync<DbUpdateException>(() => database.SaveChangesAsync());
        database.Entry(duplicateRoom).State = EntityState.Detached;

        await using (var command = connection.CreateCommand())
        {
            command.CommandText = "INSERT INTO \"AspNetUsers\" (\"Id\") VALUES ('player-1')";
            await command.ExecuteNonQueryAsync();
        }

        const string secondPuzzleId = "second-story:room01:puzzle01";
        database.PuzzleInstances.Add(new PuzzleInstance
        {
            Id = secondPuzzleId,
            StoryRoomId = "second-story:room01",
            PuzzleDefinitionId = "puzzle:word-answer",
            Order = 1,
            Configuration = WordAnswerPuzzleHandler.CreateConfiguration("second"),
        });
        database.PlayerPuzzleProgress.AddRange(
            new PlayerPuzzleProgress
            {
                Id = "player-1:labyrinth-puzzle",
                UserId = "player-1",
                PuzzleInstanceId = "labyrinth-99:room01:puzzle01",
                Attempts = 2,
                CompletedAt = DateTimeOffset.UtcNow,
            },
            new PlayerPuzzleProgress
            {
                Id = "player-1:second-story-puzzle",
                UserId = "player-1",
                PuzzleInstanceId = secondPuzzleId,
                Attempts = 1,
            });
        await database.SaveChangesAsync();

        Assert.Equal(
            2,
            await database.PlayerPuzzleProgress.CountAsync(progress => progress.UserId == "player-1"));
        Assert.NotEqual(
            await database.PuzzleInstances
                .Where(instance => instance.Id == "labyrinth-99:room01:puzzle01")
                .Select(instance => instance.Configuration)
                .SingleAsync(),
            await database.PuzzleInstances
                .Where(instance => instance.Id == secondPuzzleId)
                .Select(instance => instance.Configuration)
                .SingleAsync());
    }
}
