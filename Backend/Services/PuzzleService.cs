using System.Text.Json;
using EscapeRoom.Api.Data;
using EscapeRoom.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EscapeRoom.Api.Services;

public sealed class PuzzleService(
    ApplicationDbContext database,
    PuzzleHandlerRegistry handlers)
{
    private const string ExistingStoryId = "labyrinth-99";
    private const string FirstPuzzleId = $"{ExistingStoryId}:room01:puzzle01";

    public async Task<FirstPuzzleView> GetFirstPuzzleAsync(CancellationToken cancellationToken)
    {
        var puzzle = await LoadFirstPuzzleAsync(cancellationToken);
        var configuration = ParseWordAnswerConfiguration(puzzle.Configuration);
        return new FirstPuzzleView(
            "Matrix",
            configuration.BinaryCodes.Length,
            "ASCII",
            8,
            configuration.BinaryCodes,
            0);
    }

    public async Task<PuzzleResult> GuessFirstCharacterAsync(
        GuessLetterRequest request,
        string userId,
        CancellationToken cancellationToken)
    {
        var puzzle = await LoadFirstPuzzleAsync(cancellationToken);
        var result = await handlers.Get(puzzle.PuzzleDefinition.PuzzleType).ValidateAsync(
            new PuzzleContext(
                puzzle.PuzzleDefinition.PuzzleType,
                puzzle.PuzzleDefinition.ConfigurationVersion,
                puzzle.Configuration,
                request.Position),
            request.Letter,
            cancellationToken);
        await RecordProgressAsync(puzzle, userId, result, cancellationToken);
        return result;
    }

    public async Task<PuzzleResult> ValidateAsync(
        string puzzleInstanceId,
        string answer,
        string userId,
        CancellationToken cancellationToken)
    {
        var puzzle = await database.PuzzleInstances
            .AsNoTracking()
            .Include(instance => instance.PuzzleDefinition)
            .Include(instance => instance.StoryRoom)
            .ThenInclude(room => room.Story)
            .SingleOrDefaultAsync(
                instance => instance.Id == puzzleInstanceId &&
                    instance.StoryRoom.IsEnabled &&
                    instance.StoryRoom.Story.IsPublished &&
                    instance.PuzzleDefinition.IsEnabled,
                cancellationToken);
        if (puzzle is null)
        {
            throw new KeyNotFoundException("Nie znaleziono aktywnej zagadki.");
        }

        var hasIncompletePrerequisite = await database.PuzzleInstances
            .AsNoTracking()
            .Where(instance =>
                instance.StoryRoom.StoryId == puzzle.StoryRoom.StoryId &&
                instance.StoryRoom.IsEnabled &&
                instance.PuzzleDefinition.IsEnabled &&
                (instance.StoryRoom.Order < puzzle.StoryRoom.Order ||
                    (instance.StoryRoomId == puzzle.StoryRoomId &&
                        instance.Order < puzzle.Order)))
            .AnyAsync(instance => !database.PlayerPuzzleProgress
                    .Any(progress =>
                        progress.UserId == userId &&
                        progress.PuzzleInstanceId == instance.Id &&
                        progress.CompletedAt != null),
                cancellationToken);
        if (hasIncompletePrerequisite)
        {
            throw new PuzzleLockedException();
        }

        var result = await handlers.Get(puzzle.PuzzleDefinition.PuzzleType).ValidateAsync(
            new PuzzleContext(
                puzzle.PuzzleDefinition.PuzzleType,
                puzzle.PuzzleDefinition.ConfigurationVersion,
                puzzle.Configuration,
                null),
            answer,
            cancellationToken);
        await RecordProgressAsync(puzzle, userId, result, cancellationToken);
        return result;
    }

    public async Task<StoryProgressView> GetStoryProgressAsync(
        string storyId,
        string userId,
        CancellationToken cancellationToken)
    {
        var story = await database.Stories
            .AsNoTracking()
            .Where(item => item.Id == storyId && item.IsPublished)
            .Select(item => new { item.Id })
            .SingleOrDefaultAsync(cancellationToken);
        if (story is null)
        {
            throw new KeyNotFoundException("Nie znaleziono opublikowanego scenariusza.");
        }

        var progress = await database.PlayerStoryProgress
            .AsNoTracking()
            .SingleOrDefaultAsync(
                item => item.UserId == userId && item.StoryId == storyId,
                cancellationToken);
        var completedPuzzleIds = await database.PlayerPuzzleProgress
            .AsNoTracking()
            .Where(item =>
                item.UserId == userId &&
                item.CompletedAt != null &&
                item.PuzzleInstance.StoryRoom.StoryId == storyId)
            .Select(item => item.PuzzleInstanceId)
            .ToArrayAsync(cancellationToken);

        return new StoryProgressView(
            storyId,
            progress?.CurrentStoryRoomId,
            progress?.CompletedAt,
            completedPuzzleIds);
    }

    private async Task RecordProgressAsync(
        PuzzleInstance puzzle,
        string userId,
        PuzzleResult result,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var puzzleProgress = await database.PlayerPuzzleProgress
            .SingleOrDefaultAsync(
                item => item.UserId == userId && item.PuzzleInstanceId == puzzle.Id,
                cancellationToken);
        if (puzzleProgress is null)
        {
            puzzleProgress = new PlayerPuzzleProgress
            {
                Id = $"{userId}:{puzzle.Id}",
                UserId = userId,
                PuzzleInstanceId = puzzle.Id,
                Attempts = 0,
            };
            database.PlayerPuzzleProgress.Add(puzzleProgress);
        }

        puzzleProgress.Attempts++;
        if (result.Complete)
        {
            puzzleProgress.CompletedAt ??= now;
            var storyRoom = await database.StoryRooms
                .Include(room => room.Story)
                .Where(room => room.Id == puzzle.StoryRoomId)
                .SingleAsync(cancellationToken);
            var storyProgress = await database.PlayerStoryProgress
                .SingleOrDefaultAsync(
                    item => item.UserId == userId && item.StoryId == storyRoom.StoryId,
                    cancellationToken);
            if (storyProgress is null)
            {
                storyProgress = new PlayerStoryProgress
                {
                    Id = $"{userId}:{storyRoom.StoryId}",
                    UserId = userId,
                    StoryId = storyRoom.StoryId,
                    CurrentStoryRoomId = storyRoom.Id,
                    UpdatedAt = now,
                };
                database.PlayerStoryProgress.Add(storyProgress);
            }
            else
            {
                var previousOrder = storyProgress.CurrentStoryRoomId is null
                    ? 0
                    : await database.StoryRooms
                        .Where(room => room.Id == storyProgress.CurrentStoryRoomId)
                        .Select(room => room.Order)
                        .SingleOrDefaultAsync(cancellationToken);
                if (storyRoom.Order >= previousOrder)
                {
                    storyProgress.CurrentStoryRoomId = storyRoom.Id;
                }

                storyProgress.UpdatedAt = now;
            }

            var isLastRoom = !await database.StoryRooms
                .AnyAsync(
                    room => room.StoryId == storyRoom.StoryId &&
                        room.IsEnabled &&
                        room.Order > storyRoom.Order,
                    cancellationToken);
            if (isLastRoom)
            {
                storyProgress.CompletedAt ??= now;
            }
        }

        await database.SaveChangesAsync(cancellationToken);
    }

    private async Task<PuzzleInstance> LoadFirstPuzzleAsync(CancellationToken cancellationToken)
    {
        var puzzle = await database.PuzzleInstances
            .AsNoTracking()
            .Include(instance => instance.PuzzleDefinition)
            .SingleOrDefaultAsync(instance => instance.Id == FirstPuzzleId, cancellationToken);
        return puzzle ?? throw new InvalidOperationException("Brak konfiguracji pierwszej zagadki.");
    }

    private static WordAnswerConfiguration ParseWordAnswerConfiguration(string configuration)
    {
        try
        {
            return JsonSerializer.Deserialize<WordAnswerConfiguration>(configuration)
                ?? throw new PuzzleConfigurationException("Brak konfiguracji pierwszej zagadki.");
        }
        catch (JsonException exception)
        {
            throw new PuzzleConfigurationException(
                "Nieprawidłowy JSON konfiguracji pierwszej zagadki.",
                exception);
        }
    }

    private sealed record WordAnswerConfiguration(string[] CharacterHashes, string[] BinaryCodes);
}

public sealed record FirstPuzzleView(
    string Name,
    int Length,
    string Encoding,
    int BitsPerCharacter,
    string[] BinaryCodes,
    int Progress);

public sealed record StoryProgressView(
    string StoryId,
    string? CurrentStoryRoomId,
    DateTimeOffset? CompletedAt,
    string[] CompletedPuzzleInstanceIds);
