using EscapeRoom.Api.Services;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace EscapeRoom.Api.Data;

public static class GameContentDatabase
{
    private const string ExistingStoryId = "labyrinth-99";
    private const string DefaultLanguage = "pl";

    private static readonly RoomSeed[] ExistingRooms =
    [
        new("room01", 1, "Pokój Pierwszego Światła", "Odszyfruj sygnał START i uruchom pierwszą synapsę."),
        new("room05", 5, "Kino Rodzinne", "Odczytaj cyfry ukryte na taśmie filmowej z 1945 roku."),
        new("room11", 11, "Ślepa Plamka", "Znajdź brakujące przejście w optycznym śladzie archiwum."),
        new("room12", 12, "Cisza Absolutna", "Odtwórz sekwencje wibracji prowadzące przez wyciszoną komorę."),
        new("room17", 17, "Chór Głosów", "Odszukaj oryginalne nagranie ukryte wśród archiwalnych ech."),
        new("room22", 22, "Szum Szumów", "Dostrój radio do częstotliwości zachowanej w archiwalnym śladzie."),
        new("room23", 23, "Pokój Napięcia", "W Pokoju 23 odczytaj rytm zapisany w mechanizmie zegara."),
        new("room27", 27, "Gabinet Straty", "W Pokoju 27 ułóż listy Henry'ego i Rose według chronologii."),
        new("room33", 33, "Labirynt Amigdali", "W Pokoju 33 przejdź przez labirynt, odnajdując bezpieczne przejście."),
        new("room34", 34, "Zatrzymana Wskazówka", "W Pokoju 34 odtwórz zapis czasu i uruchom skrót synaptyczny."),
        new("room40", 40, "Pętla Czasowa", "W Pokoju 40 odnajdź wspomnienie, które nie zmienia położenia."),
        new("room44", 44, "Próg Zapomnienia", "W Pokoju 44 odzyskaj hasło z pierwszego impulsu archiwum."),
        new("room45", 45, "Test Rysowania Zegara", "W Pokoju 45 odtwórz główne punkty tarczy zegara."),
        new("room50", 50, "Drżąca Ręka", "W Pokoju 50 ustabilizuj sygnał, korygując trzy punkty projekcji."),
        new("room55", 55, "Paraliż Senny", "W Pokoju 55 wycisz nagranie, porządkując źródła zakłóceń."),
        new("room56", 56, "Złamany Algorytm", "W Pokoju 56 odtwórz reguły logiczne uszkodzonego modelu decyzji."),
        new("room61", 61, "Szachy z Cieniem", "W Pokoju 61 odtwórz trzy ruchy z niepełnego zapisu partii."),
        new("room66", 66, "Granice Eksperymentu", "W Pokoju 66 wybierz sposób ochrony badań i prywatności."),
        new("room76", 76, "Słownik Pamięci", "W Pokoju 76 odzyskaj znaczenie brakujących słów z kontekstu."),
        new("room72", 72, "Afazja", "W Pokoju 72 odczytaj instrukcję zapisaną za pomocą symboli."),
        new("room77", 77, "Ostatnie Zdanie", "W Pokoju 77 ułóż końcowe słowa Henry'ego w zapamiętaną myśl."),
        new("room67", 67, "Wieża Babel", "W Pokoju 67 uzgodnij wspólne nazwy przedmiotów z ich opisami."),
        new("room78", 78, "Labirynt bez Wyjścia", "W Pokoju 78 obróć plan, aby połączyć wejście z widocznym wyjściem."),
        new("room83", 83, "Zgubiłem Nazwisko", "W Pokoju 83 wskaż nazwisko podpisane pod notatkami Profesora."),
        new("room88", 88, "Krawędź Zsypu", "W Pokoju 88 odnajdź stabilną drogę przez iluzję opadającej przestrzeni."),
        new("room89", 89, "Białe Pokoje", "W pokojach 89–98 przywróć światła synaps w kolejności wspomnień."),
        new("room99", 99, "Punkt Omega", "W Pokoju 99 podejmij ostateczną decyzję o badaniach Henry'ego."),
    ];

    private static readonly IReadOnlyDictionary<string, (string Title, string Description)> EnglishRoomTexts =
        new Dictionary<string, (string Title, string Description)>(StringComparer.Ordinal)
        {
            ["room01"] = ("Room of First Light", "Decode the START signal and activate the first synapse."),
            ["room05"] = ("Family Cinema", "Read the digits hidden in a film reel from 1945."),
            ["room11"] = ("Blind Spot", "Find the missing passage in the archive's optical trace."),
            ["room12"] = ("Absolute Silence", "Replay the vibration sequences leading through the silent chamber."),
            ["room17"] = ("Choir of Voices", "Find the original recording among the archival echoes."),
            ["room22"] = ("Noise of Noise", "Tune the radio to the frequency preserved in the archival trace."),
            ["room23"] = ("Tension Room", "Read the rhythm recorded in the clock mechanism."),
            ["room27"] = ("Study of Loss", "Arrange Henry and Rose's letters in chronological order."),
            ["room33"] = ("Amygdala Maze", "Navigate the maze and find a safe path through it."),
            ["room34"] = ("Stopped Hand", "Reconstruct the recorded time and activate a synaptic shortcut."),
            ["room40"] = ("Time Loop", "Find the memory that never changes its position."),
            ["room44"] = ("Threshold of Forgetting", "Recover the password from the archive's first impulse."),
            ["room45"] = ("Clock Drawing Test", "Recreate the clock face's main points."),
            ["room50"] = ("Shaking Hand", "Stabilize the signal by correcting three projection points."),
            ["room55"] = ("Sleep Paralysis", "Silence the recording by sorting its sources of interference."),
            ["room56"] = ("Broken Algorithm", "Reconstruct the logical rules of a damaged decision model."),
            ["room61"] = ("Chess with a Shadow", "Reconstruct three moves from an incomplete game record."),
            ["room66"] = ("Limits of Experimentation", "Choose how to protect the research and its participants' privacy."),
            ["room76"] = ("Memory Dictionary", "Recover the meaning of missing words from their context."),
            ["room72"] = ("Aphasia", "Read the instruction encoded in symbols."),
            ["room77"] = ("The Last Sentence", "Arrange Henry's final words into the thought he remembered."),
            ["room67"] = ("Tower of Babel", "Agree on shared names for objects from their descriptions."),
            ["room78"] = ("Maze Without an Exit", "Rotate the plan to connect the entrance to the visible exit."),
            ["room83"] = ("I Lost My Surname", "Identify the surname signed beneath the Professor's notes."),
            ["room88"] = ("Edge of the Chute", "Find a stable path through the illusion of a falling space."),
            ["room89"] = ("White Rooms", "Restore the synapse lights in the order of the memories."),
            ["room99"] = ("Omega Point", "Make the final decision about Henry's research."),
        };

    private const string AdditiveSchema = """
        CREATE TABLE IF NOT EXISTS "Stories" (
            "Id" TEXT NOT NULL CONSTRAINT "PK_Stories" PRIMARY KEY,
            "Key" TEXT NOT NULL,
            "IsPublished" INTEGER NOT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedAt" TEXT NOT NULL
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_Stories_Key" ON "Stories" ("Key");
        CREATE TABLE IF NOT EXISTS "StoryTranslations" (
            "Id" TEXT NOT NULL CONSTRAINT "PK_StoryTranslations" PRIMARY KEY,
            "StoryId" TEXT NOT NULL,
            "LanguageCode" TEXT NOT NULL,
            "Name" TEXT NOT NULL,
            "Description" TEXT NOT NULL,
            CONSTRAINT "FK_StoryTranslations_Stories_StoryId"
                FOREIGN KEY ("StoryId") REFERENCES "Stories" ("Id") ON DELETE CASCADE
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_StoryTranslations_StoryId_LanguageCode"
            ON "StoryTranslations" ("StoryId", "LanguageCode");
        CREATE TABLE IF NOT EXISTS "RoomDefinitions" (
            "Id" TEXT NOT NULL CONSTRAINT "PK_RoomDefinitions" PRIMARY KEY,
            "Key" TEXT NOT NULL,
            "IsEnabled" INTEGER NOT NULL
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_RoomDefinitions_Key" ON "RoomDefinitions" ("Key");
        CREATE TABLE IF NOT EXISTS "StoryRooms" (
            "Id" TEXT NOT NULL CONSTRAINT "PK_StoryRooms" PRIMARY KEY,
            "StoryId" TEXT NOT NULL,
            "RoomDefinitionId" TEXT NOT NULL,
            "RoomNumber" INTEGER NOT NULL,
            "Order" INTEGER NOT NULL,
            "IsEnabled" INTEGER NOT NULL,
            CONSTRAINT "FK_StoryRooms_Stories_StoryId"
                FOREIGN KEY ("StoryId") REFERENCES "Stories" ("Id") ON DELETE CASCADE,
            CONSTRAINT "FK_StoryRooms_RoomDefinitions_RoomDefinitionId"
                FOREIGN KEY ("RoomDefinitionId") REFERENCES "RoomDefinitions" ("Id") ON DELETE RESTRICT
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_StoryRooms_StoryId_RoomNumber"
            ON "StoryRooms" ("StoryId", "RoomNumber");
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_StoryRooms_StoryId_Order"
            ON "StoryRooms" ("StoryId", "Order");
        CREATE TABLE IF NOT EXISTS "RoomContents" (
            "Id" TEXT NOT NULL CONSTRAINT "PK_RoomContents" PRIMARY KEY,
            "StoryRoomId" TEXT NOT NULL,
            "ContentKey" TEXT NOT NULL,
            "ContentType" TEXT NOT NULL,
            "Order" INTEGER NOT NULL,
            CONSTRAINT "FK_RoomContents_StoryRooms_StoryRoomId"
                FOREIGN KEY ("StoryRoomId") REFERENCES "StoryRooms" ("Id") ON DELETE CASCADE
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_RoomContents_StoryRoomId_ContentKey"
            ON "RoomContents" ("StoryRoomId", "ContentKey");
        CREATE TABLE IF NOT EXISTS "RoomContentTranslations" (
            "Id" TEXT NOT NULL CONSTRAINT "PK_RoomContentTranslations" PRIMARY KEY,
            "RoomContentId" TEXT NOT NULL,
            "LanguageCode" TEXT NOT NULL,
            "Text" TEXT NOT NULL,
            CONSTRAINT "FK_RoomContentTranslations_RoomContents_RoomContentId"
                FOREIGN KEY ("RoomContentId") REFERENCES "RoomContents" ("Id") ON DELETE CASCADE
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_RoomContentTranslations_RoomContentId_LanguageCode"
            ON "RoomContentTranslations" ("RoomContentId", "LanguageCode");
        CREATE TABLE IF NOT EXISTS "PuzzleDefinitions" (
            "Id" TEXT NOT NULL CONSTRAINT "PK_PuzzleDefinitions" PRIMARY KEY,
            "Key" TEXT NOT NULL,
            "PuzzleType" TEXT NOT NULL,
            "ConfigurationVersion" INTEGER NOT NULL,
            "IsEnabled" INTEGER NOT NULL
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_PuzzleDefinitions_Key"
            ON "PuzzleDefinitions" ("Key");
        CREATE TABLE IF NOT EXISTS "PuzzleInstances" (
            "Id" TEXT NOT NULL CONSTRAINT "PK_PuzzleInstances" PRIMARY KEY,
            "StoryRoomId" TEXT NOT NULL,
            "PuzzleDefinitionId" TEXT NOT NULL,
            "Order" INTEGER NOT NULL,
            "Configuration" TEXT NOT NULL,
            CONSTRAINT "FK_PuzzleInstances_StoryRooms_StoryRoomId"
                FOREIGN KEY ("StoryRoomId") REFERENCES "StoryRooms" ("Id") ON DELETE CASCADE,
            CONSTRAINT "FK_PuzzleInstances_PuzzleDefinitions_PuzzleDefinitionId"
                FOREIGN KEY ("PuzzleDefinitionId") REFERENCES "PuzzleDefinitions" ("Id") ON DELETE RESTRICT
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_PuzzleInstances_StoryRoomId_Order"
            ON "PuzzleInstances" ("StoryRoomId", "Order");
        CREATE TABLE IF NOT EXISTS "PuzzleInstanceTranslations" (
            "Id" TEXT NOT NULL CONSTRAINT "PK_PuzzleInstanceTranslations" PRIMARY KEY,
            "PuzzleInstanceId" TEXT NOT NULL,
            "LanguageCode" TEXT NOT NULL,
            "Instruction" TEXT NOT NULL,
            "Hint1" TEXT NULL,
            "Hint2" TEXT NULL,
            CONSTRAINT "FK_PuzzleInstanceTranslations_PuzzleInstances_PuzzleInstanceId"
                FOREIGN KEY ("PuzzleInstanceId") REFERENCES "PuzzleInstances" ("Id") ON DELETE CASCADE
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_PuzzleInstanceTranslations_PuzzleInstanceId_LanguageCode"
            ON "PuzzleInstanceTranslations" ("PuzzleInstanceId", "LanguageCode");
        CREATE TABLE IF NOT EXISTS "PlayerStoryProgress" (
            "Id" TEXT NOT NULL CONSTRAINT "PK_PlayerStoryProgress" PRIMARY KEY,
            "UserId" TEXT NOT NULL,
            "StoryId" TEXT NOT NULL,
            "CurrentStoryRoomId" TEXT NULL,
            "UpdatedAt" TEXT NOT NULL,
            "CompletedAt" TEXT NULL,
            CONSTRAINT "FK_PlayerStoryProgress_AspNetUsers_UserId"
                FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
            CONSTRAINT "FK_PlayerStoryProgress_Stories_StoryId"
                FOREIGN KEY ("StoryId") REFERENCES "Stories" ("Id") ON DELETE CASCADE,
            CONSTRAINT "FK_PlayerStoryProgress_StoryRooms_CurrentStoryRoomId"
                FOREIGN KEY ("CurrentStoryRoomId") REFERENCES "StoryRooms" ("Id") ON DELETE SET NULL
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_PlayerStoryProgress_UserId_StoryId"
            ON "PlayerStoryProgress" ("UserId", "StoryId");
        CREATE TABLE IF NOT EXISTS "PlayerPuzzleProgress" (
            "Id" TEXT NOT NULL CONSTRAINT "PK_PlayerPuzzleProgress" PRIMARY KEY,
            "UserId" TEXT NOT NULL,
            "PuzzleInstanceId" TEXT NOT NULL,
            "Attempts" INTEGER NOT NULL,
            "CompletedAt" TEXT NULL,
            CONSTRAINT "FK_PlayerPuzzleProgress_AspNetUsers_UserId"
                FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
            CONSTRAINT "FK_PlayerPuzzleProgress_PuzzleInstances_PuzzleInstanceId"
                FOREIGN KEY ("PuzzleInstanceId") REFERENCES "PuzzleInstances" ("Id") ON DELETE CASCADE
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_PlayerPuzzleProgress_UserId_PuzzleInstanceId"
            ON "PlayerPuzzleProgress" ("UserId", "PuzzleInstanceId");
        """;

    public static async Task InitializeAsync(ApplicationDbContext database)
    {
        await database.Database.ExecuteSqlRawAsync(AdditiveSchema);

        var now = DateTimeOffset.UtcNow;
        if (!await database.Stories.AnyAsync(story => story.Id == ExistingStoryId))
        {
            database.Stories.Add(new Story
            {
                Id = ExistingStoryId,
                Key = "labyrinth-99",
                IsPublished = true,
                CreatedAt = now,
                UpdatedAt = now,
            });
        }

        var definitions = await database.RoomDefinitions
            .Select(room => room.Id)
            .ToHashSetAsync();
        var storyRooms = await database.StoryRooms
            .Select(room => room.Id)
            .ToHashSetAsync();
        var contents = await database.RoomContents
            .Select(content => content.Id)
            .ToHashSetAsync();
        var contentTranslationIds = await database.RoomContentTranslations
            .Select(translation => translation.Id)
            .ToHashSetAsync();

        for (var index = 0; index < ExistingRooms.Length; index++)
        {
            var seed = ExistingRooms[index];
            if (definitions.Add(seed.Key))
            {
                database.RoomDefinitions.Add(new RoomDefinition
                {
                    Id = seed.Key,
                    Key = seed.Key,
                    IsEnabled = true,
                });
            }

            var storyRoomId = $"{ExistingStoryId}:{seed.Key}";
            if (storyRooms.Add(storyRoomId))
            {
                database.StoryRooms.Add(new StoryRoom
                {
                    Id = storyRoomId,
                    StoryId = ExistingStoryId,
                    RoomDefinitionId = seed.Key,
                    RoomNumber = seed.RoomNumber,
                    Order = index + 1,
                    IsEnabled = true,
                });
            }

            AddContentIfMissing(
                database,
                contents,
                storyRoomId,
                "title",
                seed.Title,
                0);
            AddContentIfMissing(
                database,
                contents,
                storyRoomId,
                "description",
                seed.Description,
                1);
            var englishText = EnglishRoomTexts[seed.Key];
            AddTranslationIfMissing(
                database,
                contentTranslationIds,
                storyRoomId,
                "title",
                "en",
                englishText.Title);
            AddTranslationIfMissing(
                database,
                contentTranslationIds,
                storyRoomId,
                "description",
                "en",
                englishText.Description);
        }

        if (!await database.StoryTranslations.AnyAsync(
                translation => translation.StoryId == ExistingStoryId &&
                    translation.LanguageCode == DefaultLanguage))
        {
            database.StoryTranslations.Add(new StoryTranslation
            {
                Id = $"{ExistingStoryId}:{DefaultLanguage}",
                StoryId = ExistingStoryId,
                LanguageCode = DefaultLanguage,
                Name = "Labirynt 99 Pokoi",
                Description = "Odzyskuj wspomnienia w archiwum profesora Henry'ego Armitage'a.",
            });
        }
        if (!await database.StoryTranslations.AnyAsync(
                translation => translation.StoryId == ExistingStoryId &&
                    translation.LanguageCode == "en"))
        {
            database.StoryTranslations.Add(new StoryTranslation
            {
                Id = $"{ExistingStoryId}:en",
                StoryId = ExistingStoryId,
                LanguageCode = "en",
                Name = "Labyrinth of 99 Rooms",
                Description = "Recover memories in Professor Henry Armitage's archive.",
            });
        }

        foreach (var puzzleType in new[]
        {
            "numeric-code",
            "word-answer",
            "solution-proof",
            "maze-route",
        })
        {
            var definitionId = $"puzzle:{puzzleType}";
            if (!await database.PuzzleDefinitions.AnyAsync(definition => definition.Id == definitionId))
            {
                database.PuzzleDefinitions.Add(new PuzzleDefinition
                {
                    Id = definitionId,
                    Key = puzzleType,
                    PuzzleType = puzzleType,
                    ConfigurationVersion = 1,
                    IsEnabled = true,
                });
            }
        }

        const string firstPuzzleId = $"{ExistingStoryId}:room01:puzzle01";
        if (!await database.PuzzleInstances.AnyAsync(instance => instance.Id == firstPuzzleId))
        {
            database.PuzzleInstances.Add(new PuzzleInstance
            {
                Id = firstPuzzleId,
                StoryRoomId = $"{ExistingStoryId}:room01",
                PuzzleDefinitionId = "puzzle:word-answer",
                Order = 1,
                Configuration = WordAnswerPuzzleHandler.CreateConfiguration("start"),
                Translations =
                {
                    new PuzzleInstanceTranslation
                    {
                        Id = $"{firstPuzzleId}:pl",
                        PuzzleInstanceId = firstPuzzleId,
                        LanguageCode = DefaultLanguage,
                        Instruction = "Odczytaj kod binarny i wpisz odszyfrowane słowo.",
                    },
                },
            });
        }

        foreach (var seed in ExistingPuzzleSeeds)
        {
            var puzzleId = $"{ExistingStoryId}:{seed.RoomKey}:puzzle01";
            var existingPuzzle = await database.PuzzleInstances
                .SingleOrDefaultAsync(instance => instance.Id == puzzleId);
            if (existingPuzzle is not null)
            {
                if (seed.RoomKey == "room33")
                {
                    existingPuzzle.PuzzleDefinitionId = "puzzle:maze-route";
                    existingPuzzle.Configuration = MazeRoutePuzzleHandler.CreateConfiguration(
                        ["..#####", "#.##..#", "#.##..#", "#.....#", "###.#.#", "#.....#", "#####.."],
                        "0-0",
                        "6-6");
                }

                continue;
            }

            database.PuzzleInstances.Add(new PuzzleInstance
            {
                Id = puzzleId,
                StoryRoomId = $"{ExistingStoryId}:{seed.RoomKey}",
                PuzzleDefinitionId = seed.RoomKey == "room33"
                    ? "puzzle:maze-route"
                    : "puzzle:solution-proof",
                Order = 1,
                Configuration = seed.RoomKey == "room33"
                    ? MazeRoutePuzzleHandler.CreateConfiguration(
                        ["..#####", "#.##..#", "#.##..#", "#.....#", "###.#.#", "#.....#", "#####.."],
                        "0-0",
                        "6-6")
                    : SolutionProofPuzzleHandler.CreateConfiguration(seed.Solutions),
                Translations =
                {
                    new PuzzleInstanceTranslation
                    {
                        Id = $"{puzzleId}:pl",
                        PuzzleInstanceId = puzzleId,
                        LanguageCode = DefaultLanguage,
                        Instruction = "Ukończ interaktywną zagadkę, aby zapisać jej wynik.",
                    },
                },
            });
        }

        await database.SaveChangesAsync();
        await ImportExistingRoomTranslationsAsync(database);
    }

    private static readonly PuzzleSeed[] ExistingPuzzleSeeds =
    [
        new("room05", ["2741"]),
        new("room11", [JsonSerializer.Serialize(new[] { "right", "top", "left" })]),
        new("room12", [JsonSerializer.Serialize(new[]
        {
            "north", "west", "north",
            "east", "south", "west", "east",
            "south", "north", "east", "west", "south",
        })]),
        new("room17", ["0830"]),
        new("room22", ["98.4"]),
        new("room23", ["[4,2,6]"]),
        new("room27", [JsonSerializer.Serialize(new[]
        {
            "first-walk", "wedding", "new-home", "garden",
        })]),
        new("room33", []),
        new("room34", ["clock-reconstruction-complete"]),
        new("room40", ["letter"]),
        new("room44", ["start"]),
        new("room45", ["[\"12\",\"3\",\"6\",\"9\"]"]),
        new("room50", ["[25,55,80]"]),
        new("room55", [JsonSerializer.Serialize(new[] { "radio", "clock", "tape" })]),
        new("room56", ValidRoom56Proofs()),
        new("room61", [JsonSerializer.Serialize(new[]
        {
            "E2 → E4", "E7 → E5", "G1 → F3",
        })]),
        new("room66", ["privacy", "research"]),
        new("room67", [JsonSerializer.Serialize(new[] { "klucz", "książka", "drzwi" })]),
        new("room72", [JsonSerializer.Serialize(new[] { "door", "open", "memory" })]),
        new("room76", [JsonSerializer.Serialize(new[] { "klucz", "światło", "notatnik" })]),
        new("room77", [JsonSerializer.Serialize(new[] { "if", "words", "remind", "love" })]),
        new("room78", ["90°"]),
        new("room83", ["Henry Armitage"]),
        new("room88", [JsonSerializer.Serialize(new[] { "left", "center", "right" })]),
        new("room89", [JsonSerializer.Serialize(new[]
        {
            "first-light", "film", "blindspot", "vibration", "choir",
            "radio", "tension", "letter", "labyrinth", "clock",
        })]),
        new("room99", ["privacy", "research"]),
    ];

    private static string[] ValidRoom56Proofs()
    {
        var validProofs = new List<string>();
        for (var a = 0; a <= 1; a++)
        for (var b = 0; b <= 1; b++)
        for (var c = 0; c <= 1; c++)
        for (var d = 0; d <= 1; d++)
        {
            var notA = a == 0;
            var andPath = notA && b == 1;
            var xorPath = c != d;
            if (andPath || xorPath)
            {
                validProofs.Add(JsonSerializer.Serialize(new
                {
                    A = a == 1,
                    B = b == 1,
                    C = c == 1,
                    D = d == 1,
                }));
            }
        }

        return validProofs.ToArray();
    }

    private static void AddContentIfMissing(
        ApplicationDbContext database,
        HashSet<string> existingContentIds,
        string storyRoomId,
        string contentKey,
        string text,
        int order)
    {
        var contentId = $"{storyRoomId}:{contentKey}";
        if (!existingContentIds.Add(contentId))
        {
            return;
        }

        database.RoomContents.Add(new RoomContent
        {
            Id = contentId,
            StoryRoomId = storyRoomId,
            ContentKey = contentKey,
            ContentType = "text",
            Order = order,
            Translations =
            {
                new RoomContentTranslation
                {
                    Id = $"{contentId}:{DefaultLanguage}",
                    RoomContentId = contentId,
                    LanguageCode = DefaultLanguage,
                    Text = text,
                },
            },
        });
    }

    private static void AddTranslationIfMissing(
        ApplicationDbContext database,
        HashSet<string> existingTranslationIds,
        string storyRoomId,
        string contentKey,
        string language,
        string text)
    {
        var contentId = $"{storyRoomId}:{contentKey}";
        var translationId = $"{contentId}:{language}";
        if (existingTranslationIds.Add(translationId))
        {
            database.RoomContentTranslations.Add(new RoomContentTranslation
            {
                Id = translationId,
                RoomContentId = contentId,
                LanguageCode = language,
                Text = text,
            });
        }
    }

    private static async Task ImportExistingRoomTranslationsAsync(ApplicationDbContext database)
    {
        var roomIds = ExistingRooms.Select(room => room.Key).ToHashSet(StringComparer.Ordinal);
        var roomTexts = await database.LocalizedTexts
            .AsNoTracking()
            .Where(text => text.Key.StartsWith("room"))
            .ToListAsync();
        var contentIds = await database.RoomContents
            .Select(content => content.Id)
            .ToHashSetAsync();
        var translationIds = await database.RoomContentTranslations
            .Select(translation => translation.Id)
            .ToHashSetAsync();

        foreach (var text in roomTexts)
        {
            var separator = text.Key.IndexOf('.');
            if (separator <= 0)
            {
                continue;
            }

            var roomKey = text.Key[..separator];
            if (!roomIds.Contains(roomKey))
            {
                continue;
            }

            var storyRoomId = $"{ExistingStoryId}:{roomKey}";
            var contentKey = text.Key[(separator + 1)..];
            var contentId = $"{storyRoomId}:{contentKey}";
            if (contentIds.Add(contentId))
            {
                database.RoomContents.Add(new RoomContent
                {
                    Id = contentId,
                    StoryRoomId = storyRoomId,
                    ContentKey = contentKey,
                    ContentType = "text",
                    Order = 100,
                });
            }

            var translationId = $"{contentId}:{text.Language}";
            if (translationIds.Add(translationId))
            {
                database.RoomContentTranslations.Add(new RoomContentTranslation
                {
                    Id = translationId,
                    RoomContentId = contentId,
                    LanguageCode = text.Language,
                    Text = text.Value,
                });
            }
        }

        await database.SaveChangesAsync();
    }

    private sealed record RoomSeed(string Key, int RoomNumber, string Title, string Description);
    private sealed record PuzzleSeed(string RoomKey, string[] Solutions);
}
