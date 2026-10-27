using System.Text.Json;
using EscapeRoom.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace EscapeRoom.Api.Services;

public sealed class AdminContentService(
    ApplicationDbContext database,
    PuzzleHandlerRegistry handlers)
{
    public async Task<IReadOnlyList<AdminStoryDto>> GetStoriesAsync(
        CancellationToken cancellationToken)
    {
        var stories = await database.Stories
            .AsNoTracking()
            .AsSplitQuery()
            .Include(story => story.Translations)
            .Include(story => story.Rooms)
                .ThenInclude(room => room.RoomDefinition)
            .Include(story => story.Rooms)
                .ThenInclude(room => room.Contents)
                    .ThenInclude(content => content.Translations)
            .Include(story => story.Rooms)
                .ThenInclude(room => room.Puzzles)
                    .ThenInclude(puzzle => puzzle.PuzzleDefinition)
            .Include(story => story.Rooms)
                .ThenInclude(room => room.Puzzles)
                    .ThenInclude(puzzle => puzzle.Translations)
            .OrderBy(story => story.Key)
            .ToListAsync(cancellationToken);

        return stories.Select(story => new AdminStoryDto(
            story.Id,
            story.Key,
            story.IsPublished,
            story.Translations
                .Select(translation => new AdminStoryTranslationDto(
                    translation.LanguageCode,
                    translation.Name,
                    translation.Description))
                .ToArray(),
            story.Rooms
                .OrderBy(room => room.Order)
                .Select(room => new AdminRoomDto(
                    room.Id,
                    room.RoomDefinition.Key,
                    room.RoomNumber,
                    room.Order,
                    room.IsEnabled,
                    room.Contents
                        .OrderBy(content => content.Order)
                        .Select(content => new AdminRoomContentDto(
                            content.Id,
                            content.ContentKey,
                            content.ContentType,
                            content.Order,
                            content.Translations
                                .Select(translation => new AdminTextTranslationDto(
                                    translation.LanguageCode,
                                    translation.Text))
                                .ToArray()))
                        .ToArray(),
                    room.Puzzles
                        .OrderBy(puzzle => puzzle.Order)
                        .Select(puzzle => new AdminPuzzleDto(
                            puzzle.Id,
                            puzzle.PuzzleDefinition.PuzzleType,
                            puzzle.PuzzleDefinition.ConfigurationVersion,
                            puzzle.Order,
                            puzzle.Configuration,
                            puzzle.Translations
                                .Select(translation => new AdminPuzzleTranslationDto(
                                    translation.LanguageCode,
                                    translation.Instruction,
                                    translation.Hint1,
                                    translation.Hint2))
                                .ToArray()))
                        .ToArray()))
                .ToArray()))
            .ToArray();
    }

    public async Task<IReadOnlyList<LocalizedTextDto>> GetTranslationsAsync(
        string language,
        CancellationToken cancellationToken)
    {
        var normalizedLanguage = ValidateLanguage(language);
        return await database.LocalizedTexts
            .AsNoTracking()
            .Where(text => text.Language == normalizedLanguage)
            .OrderBy(text => text.Key)
            .Select(text => new LocalizedTextDto(text.Language, text.Key, text.Value))
            .ToArrayAsync(cancellationToken);
    }

    public async Task SaveTranslationAsync(
        string language,
        string key,
        string value,
        CancellationToken cancellationToken)
    {
        var normalizedLanguage = ValidateLanguage(language);
        if (string.IsNullOrWhiteSpace(key) || key.Length > 200)
        {
            throw new ArgumentException("Klucz tłumaczenia jest wymagany i może mieć maksymalnie 200 znaków.");
        }

        if (value is null || value.Length > 20_000)
        {
            throw new ArgumentException("Tekst tłumaczenia może mieć maksymalnie 20 000 znaków.");
        }

        var translation = await database.LocalizedTexts
            .SingleOrDefaultAsync(
                text => text.Language == normalizedLanguage && text.Key == key,
                cancellationToken);
        if (translation is null)
        {
            database.LocalizedTexts.Add(new LocalizedText
            {
                Language = normalizedLanguage,
                Key = key,
                Value = value,
            });
        }
        else
        {
            translation.Value = value;
        }

        await database.SaveChangesAsync(cancellationToken);
    }

    public async Task SaveStoryAsync(
        string storyId,
        SaveStoryRequest request,
        CancellationToken cancellationToken)
    {
        var story = await database.Stories
            .Include(item => item.Translations)
            .SingleOrDefaultAsync(item => item.Id == storyId, cancellationToken)
            ?? throw new KeyNotFoundException("Nie znaleziono scenariusza.");
        var language = ValidateLanguage(request.LanguageCode);
        ValidateText(request.Name, 200, "Nazwa scenariusza");
        ValidateText(request.Description, 4_000, "Opis scenariusza");

        var translation = story.Translations.SingleOrDefault(item =>
            item.LanguageCode == language);
        if (translation is null)
        {
            story.Translations.Add(new StoryTranslation
            {
                Id = $"{story.Id}:{language}",
                StoryId = story.Id,
                LanguageCode = language,
                Name = request.Name,
                Description = request.Description,
            });
        }
        else
        {
            translation.Name = request.Name;
            translation.Description = request.Description;
        }

        story.IsPublished = request.IsPublished;
        story.UpdatedAt = DateTimeOffset.UtcNow;
        await database.SaveChangesAsync(cancellationToken);
    }

    public async Task SaveRoomAsync(
        string roomId,
        SaveRoomRequest request,
        CancellationToken cancellationToken)
    {
        var room = await database.StoryRooms
            .SingleOrDefaultAsync(item => item.Id == roomId, cancellationToken)
            ?? throw new KeyNotFoundException("Nie znaleziono pokoju scenariusza.");
        if (request.RoomNumber < 1 || request.Order < 1)
        {
            throw new ArgumentException("Numer pokoju i kolejność muszą być większe od zera.");
        }

        room.RoomNumber = request.RoomNumber;
        room.Order = request.Order;
        room.IsEnabled = request.IsEnabled;
        await database.SaveChangesAsync(cancellationToken);
    }

    public async Task SaveRoomContentAsync(
        string roomId,
        SaveRoomContentRequest request,
        CancellationToken cancellationToken)
    {
        var language = ValidateLanguage(request.LanguageCode);
        ValidateText(request.ContentKey, 100, "Klucz treści");
        ValidateText(request.ContentType, 40, "Typ treści");
        ValidateText(request.Text, 20_000, "Treść");
        if (request.Order < 0)
        {
            throw new ArgumentException("Kolejność treści nie może być ujemna.");
        }
        if (request.ContentKey.Contains(':') || request.ContentKey.Any(char.IsWhiteSpace))
        {
            throw new ArgumentException("Klucz treści nie może zawierać dwukropka ani białych znaków.");
        }

        var roomExists = await database.StoryRooms
            .AnyAsync(room => room.Id == roomId, cancellationToken);
        if (!roomExists)
        {
            throw new KeyNotFoundException("Nie znaleziono pokoju scenariusza.");
        }

        var contentId = $"{roomId}:{request.ContentKey}";
        var content = await database.RoomContents
            .Include(item => item.Translations)
            .SingleOrDefaultAsync(item => item.Id == contentId, cancellationToken);
        if (content is null)
        {
            content = new RoomContent
            {
                Id = contentId,
                StoryRoomId = roomId,
                ContentKey = request.ContentKey,
                ContentType = request.ContentType,
                Order = request.Order,
            };
            database.RoomContents.Add(content);
        }
        else
        {
            content.ContentType = request.ContentType;
            content.Order = request.Order;
        }

        var translation = content.Translations.SingleOrDefault(item =>
            item.LanguageCode == language);
        if (translation is null)
        {
            content.Translations.Add(new RoomContentTranslation
            {
                Id = $"{contentId}:{language}",
                RoomContentId = contentId,
                LanguageCode = language,
                Text = request.Text,
            });
        }
        else
        {
            translation.Text = request.Text;
        }

        await database.SaveChangesAsync(cancellationToken);
    }

    public async Task SavePuzzleAsync(
        string puzzleId,
        SavePuzzleRequest request,
        CancellationToken cancellationToken)
    {
        var language = ValidateLanguage(request.LanguageCode);
        ValidateText(request.Instruction, 2_000, "Instrukcja zagadki");
        ValidateOptionalText(request.Hint1, 2_000, "Pierwsza podpowiedź");
        ValidateOptionalText(request.Hint2, 2_000, "Druga podpowiedź");
        if (request.Order < 1)
        {
            throw new ArgumentException("Kolejność zagadki musi być większa od zera.");
        }

        if (string.IsNullOrWhiteSpace(request.Configuration) || request.Configuration.Length > 100_000)
        {
            throw new ArgumentException("Konfiguracja zagadki jest wymagana i może mieć maksymalnie 100 000 znaków.");
        }
        try
        {
            using var configuration = JsonDocument.Parse(request.Configuration);
        }
        catch (JsonException exception)
        {
            throw new ArgumentException("Konfiguracja zagadki musi być poprawnym JSON-em.", exception);
        }

        var puzzle = await database.PuzzleInstances
            .Include(item => item.PuzzleDefinition)
            .Include(item => item.Translations)
            .SingleOrDefaultAsync(item => item.Id == puzzleId, cancellationToken)
            ?? throw new KeyNotFoundException("Nie znaleziono zagadki.");
        if (request.ConfigurationVersion != puzzle.PuzzleDefinition.ConfigurationVersion)
        {
            throw new ArgumentException("Wersja konfiguracji nie może różnić się od wersji definicji zagadki.");
        }
        if (request.PuzzleType != puzzle.PuzzleDefinition.PuzzleType)
        {
            throw new ArgumentException("Typ zagadki jest stały dla istniejącej instancji.");
        }
        try
        {
            await handlers.Get(request.PuzzleType).ValidateAsync(
                new PuzzleContext(
                    request.PuzzleType,
                    request.ConfigurationVersion,
                    request.Configuration,
                    null),
                string.Empty,
                cancellationToken);
        }
        catch (PuzzleConfigurationException exception)
        {
            throw new ArgumentException("Konfiguracja nie pasuje do typu zagadki.", exception);
        }

        puzzle.Order = request.Order;
        puzzle.Configuration = request.Configuration;
        var translation = puzzle.Translations.SingleOrDefault(item =>
            item.LanguageCode == language);
        if (translation is null)
        {
            puzzle.Translations.Add(new PuzzleInstanceTranslation
            {
                Id = $"{puzzle.Id}:{language}",
                PuzzleInstanceId = puzzle.Id,
                LanguageCode = language,
                Instruction = request.Instruction,
                Hint1 = request.Hint1,
                Hint2 = request.Hint2,
            });
        }
        else
        {
            translation.Instruction = request.Instruction;
            translation.Hint1 = request.Hint1;
            translation.Hint2 = request.Hint2;
        }

        await database.SaveChangesAsync(cancellationToken);
    }

    private static string ValidateLanguage(string? language)
    {
        if (string.IsNullOrWhiteSpace(language))
        {
            throw new ArgumentException("Kod języka jest wymagany.");
        }

        var normalizedLanguage = language.Trim().ToLowerInvariant();
        if (normalizedLanguage.Length is < 2 or > 10 ||
            normalizedLanguage.Any(character =>
                !char.IsAsciiLetter(character) && character != '-'))
        {
            throw new ArgumentException("Nieprawidłowy kod języka.");
        }

        return normalizedLanguage;
    }

    private static void ValidateText(string? value, int maximumLength, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length > maximumLength)
        {
            throw new ArgumentException(
                $"{fieldName} jest wymagany i może mieć maksymalnie {maximumLength} znaków.");
        }
    }

    private static void ValidateOptionalText(string? value, int maximumLength, string fieldName)
    {
        if (value?.Length > maximumLength)
        {
            throw new ArgumentException($"{fieldName} może mieć maksymalnie {maximumLength} znaków.");
        }
    }
}

public sealed record AdminStoryDto(
    string Id,
    string Key,
    bool IsPublished,
    AdminStoryTranslationDto[] Translations,
    AdminRoomDto[] Rooms);

public sealed record AdminStoryTranslationDto(string LanguageCode, string Name, string Description);

public sealed record AdminRoomDto(
    string Id,
    string Key,
    int RoomNumber,
    int Order,
    bool IsEnabled,
    AdminRoomContentDto[] Contents,
    AdminPuzzleDto[] Puzzles);

public sealed record AdminRoomContentDto(
    string Id,
    string ContentKey,
    string ContentType,
    int Order,
    AdminTextTranslationDto[] Translations);

public sealed record AdminTextTranslationDto(string LanguageCode, string Text);

public sealed record AdminPuzzleDto(
    string Id,
    string Type,
    int ConfigurationVersion,
    int Order,
    string Configuration,
    AdminPuzzleTranslationDto[] Translations);

public sealed record AdminPuzzleTranslationDto(
    string LanguageCode,
    string Instruction,
    string? Hint1,
    string? Hint2);

public sealed record LocalizedTextDto(string Language, string Key, string Value);

public sealed record SaveLocalizedTextRequest(string Value);

public sealed record SaveStoryRequest(
    string LanguageCode,
    string Name,
    string Description,
    bool IsPublished);

public sealed record SaveRoomRequest(int RoomNumber, int Order, bool IsEnabled);

public sealed record SaveRoomContentRequest(
    string LanguageCode,
    string ContentKey,
    string ContentType,
    int Order,
    string Text);

public sealed record SavePuzzleRequest(
    string LanguageCode,
    string PuzzleType,
    int ConfigurationVersion,
    int Order,
    string Configuration,
    string Instruction,
    string? Hint1,
    string? Hint2);
