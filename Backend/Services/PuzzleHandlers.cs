using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;

namespace EscapeRoom.Api.Services;

public sealed record PuzzleContext(string PuzzleType, int ConfigurationVersion, string Configuration, int? Position);

public sealed record PuzzleResult(bool Correct, bool Complete, int? NextPosition = null, string? Binary = null);

public interface IPuzzleHandler
{
    string PuzzleType { get; }
    Task<PuzzleResult> ValidateAsync(
        PuzzleContext context,
        string answer,
        CancellationToken cancellationToken);
}

public sealed class PuzzleHandlerRegistry
{
    private readonly IReadOnlyDictionary<string, IPuzzleHandler> handlers;

    public PuzzleHandlerRegistry(IEnumerable<IPuzzleHandler> registeredHandlers)
    {
        var handlerMap = new Dictionary<string, IPuzzleHandler>(StringComparer.Ordinal);
        foreach (var handler in registeredHandlers)
        {
            if (!handlerMap.TryAdd(handler.PuzzleType, handler))
            {
                throw new InvalidOperationException(
                    $"Zarejestrowano więcej niż jeden handler typu {handler.PuzzleType}.");
            }
        }

        handlers = handlerMap;
    }

    public IPuzzleHandler Get(string puzzleType) =>
        handlers.TryGetValue(puzzleType, out var handler)
            ? handler
            : throw new UnknownPuzzleTypeException(puzzleType);
}

public sealed class UnknownPuzzleTypeException(string puzzleType)
    : Exception($"Nieznany typ zagadki: {puzzleType}.")
{
    public string PuzzleType { get; } = puzzleType;
}

public sealed class PuzzleLockedException()
    : Exception("Ukończ poprzednie zagadki, aby odblokować tę zagadkę.");

public sealed class PuzzleConfigurationException(string message, Exception? innerException = null)
    : Exception(message, innerException)
{
}

public sealed class WordAnswerPuzzleHandler : IPuzzleHandler
{
    public string PuzzleType => "word-answer";

    public Task<PuzzleResult> ValidateAsync(
        PuzzleContext context,
        string answer,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var configuration = ParseConfiguration(context.Configuration);
        if (context.ConfigurationVersion != 1)
        {
            throw new PuzzleConfigurationException(
                $"Nieobsługiwana wersja konfiguracji zagadki: {context.ConfigurationVersion}.");
        }

        if (configuration.CharacterHashes is null ||
            configuration.BinaryCodes is null ||
            configuration.CharacterHashes.Length == 0 ||
            configuration.CharacterHashes.Length != configuration.BinaryCodes.Length)
        {
            throw new PuzzleConfigurationException("Nieprawidłowa długość konfiguracji zagadki.");
        }
        if (configuration.BinaryCodes.Any(code =>
                string.IsNullOrEmpty(code) ||
                code.Length != 8 ||
                code.Any(character => character is not ('0' or '1'))))
        {
            throw new PuzzleConfigurationException("Nieprawidłowy kod podpowiedzi zagadki.");
        }
        foreach (var hash in configuration.CharacterHashes)
        {
            ParseAnswerHash(hash, "Nieprawidłowy hash odpowiedzi zagadki.");
        }

        if (context.Position is int position)
        {
            if (position < 0 || position >= configuration.CharacterHashes.Length)
            {
                return Task.FromResult(new PuzzleResult(false, false, position));
            }

            var candidate = answer.Trim().ToLowerInvariant();
            if (candidate.Length != 1)
            {
                return Task.FromResult(new PuzzleResult(false, false, position));
            }

            var correct = Matches(configuration.CharacterHashes[position], position, candidate[0]);
            return Task.FromResult(new PuzzleResult(
                correct,
                correct && position + 1 == configuration.CharacterHashes.Length,
                correct ? position + 1 : position,
                correct ? configuration.BinaryCodes[position] : null));
        }

        var normalizedAnswer = answer.Trim().ToLowerInvariant();
        if (normalizedAnswer.Length != configuration.CharacterHashes.Length)
        {
            return Task.FromResult(new PuzzleResult(false, false));
        }

        for (var index = 0; index < normalizedAnswer.Length; index++)
        {
            if (!Matches(configuration.CharacterHashes[index], index, normalizedAnswer[index]))
            {
                return Task.FromResult(new PuzzleResult(false, false));
            }
        }

        return Task.FromResult(new PuzzleResult(true, true));
    }

    public static string CreateConfiguration(string answer)
    {
        var normalizedAnswer = answer.Trim().ToLowerInvariant();
        var characterHashes = normalizedAnswer
            .Select((character, position) => HashCharacter(position, character))
            .ToArray();
        var binaryCodes = normalizedAnswer
            .Select(character => Convert.ToString(character, 2).PadLeft(8, '0'))
            .ToArray();

        return JsonSerializer.Serialize(new WordAnswerConfiguration(characterHashes, binaryCodes));
    }

    private static WordAnswerConfiguration ParseConfiguration(string configuration)
    {
        try
        {
            return JsonSerializer.Deserialize<WordAnswerConfiguration>(configuration)
                ?? throw new PuzzleConfigurationException("Brak konfiguracji zagadki.");
        }
        catch (JsonException exception)
        {
            throw new PuzzleConfigurationException("Nieprawidłowy JSON konfiguracji zagadki.", exception);
        }
    }

    private static bool Matches(string configuredHash, int position, char character)
    {
        var expected = ParseAnswerHash(configuredHash, "Nieprawidłowy hash odpowiedzi zagadki.");
        var actual = Convert.FromHexString(HashCharacter(position, character));
        return CryptographicOperations.FixedTimeEquals(expected, actual);
    }

    private static byte[] ParseAnswerHash(string? configuredHash, string errorMessage)
    {
        if (string.IsNullOrWhiteSpace(configuredHash))
        {
            throw new PuzzleConfigurationException(errorMessage);
        }

        byte[] hash;
        try
        {
            hash = Convert.FromHexString(configuredHash);
        }
        catch (FormatException exception)
        {
            throw new PuzzleConfigurationException(errorMessage, exception);
        }

        if (hash.Length != SHA256.HashSizeInBytes)
        {
            throw new PuzzleConfigurationException(errorMessage);
        }

        return hash;
    }

    private static string HashCharacter(int position, char character)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes($"{position}:{character}"));
        return Convert.ToHexString(bytes);
    }

    private sealed record WordAnswerConfiguration(string[] CharacterHashes, string[] BinaryCodes);
}

public sealed class NumericCodePuzzleHandler : IPuzzleHandler
{
    public string PuzzleType => "numeric-code";

    public Task<PuzzleResult> ValidateAsync(
        PuzzleContext context,
        string answer,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (context.ConfigurationVersion != 1)
        {
            throw new PuzzleConfigurationException(
                $"Nieobsługiwana wersja konfiguracji zagadki: {context.ConfigurationVersion}.");
        }

        NumericCodeConfiguration configuration;
        try
        {
            configuration = JsonSerializer.Deserialize<NumericCodeConfiguration>(context.Configuration)
                ?? throw new PuzzleConfigurationException("Brak konfiguracji zagadki.");
        }
        catch (JsonException exception)
        {
            throw new PuzzleConfigurationException("Nieprawidłowy JSON konfiguracji zagadki.", exception);
        }
        if (string.IsNullOrWhiteSpace(configuration.AnswerHash))
        {
            throw new PuzzleConfigurationException("Brak skrótu odpowiedzi zagadki.");
        }

        var submittedHash = Convert.ToHexString(
            SHA256.HashData(Encoding.UTF8.GetBytes(answer.Trim())));
        byte[] expectedHash;
        try
        {
            expectedHash = Convert.FromHexString(configuration.AnswerHash);
        }
        catch (FormatException exception)
        {
            throw new PuzzleConfigurationException("Nieprawidłowy hash odpowiedzi zagadki.", exception);
        }
        if (expectedHash.Length != SHA256.HashSizeInBytes)
        {
            throw new PuzzleConfigurationException("Nieprawidłowa długość hasha odpowiedzi zagadki.");
        }

        var submittedBytes = Convert.FromHexString(submittedHash);
        var correct = CryptographicOperations.FixedTimeEquals(expectedHash, submittedBytes);
        return Task.FromResult(new PuzzleResult(correct, correct));
    }

    private sealed record NumericCodeConfiguration(string AnswerHash);
}

public sealed class SolutionProofPuzzleHandler : IPuzzleHandler
{
    public string PuzzleType => "solution-proof";

    public Task<PuzzleResult> ValidateAsync(
        PuzzleContext context,
        string answer,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (context.ConfigurationVersion != 1)
        {
            throw new PuzzleConfigurationException(
                $"Nieobsługiwana wersja konfiguracji zagadki: {context.ConfigurationVersion}.");
        }

        SolutionProofConfiguration configuration;
        try
        {
            configuration = JsonSerializer.Deserialize<SolutionProofConfiguration>(
                context.Configuration)
                ?? throw new PuzzleConfigurationException("Brak konfiguracji rozwiązania.");
        }
        catch (JsonException exception)
        {
            throw new PuzzleConfigurationException("Nieprawidłowy JSON konfiguracji rozwiązania.", exception);
        }

        if (configuration.SolutionHashes is null || configuration.SolutionHashes.Length == 0)
        {
            throw new PuzzleConfigurationException("Brak dozwolonych rozwiązań zagadki.");
        }

        var expectedHashes = configuration.SolutionHashes
            .Select(hash => ParseSolutionHash(hash))
            .ToArray();
        var submittedHash = SHA256.HashData(Encoding.UTF8.GetBytes(NormalizeAnswer(answer)));
        foreach (var expectedHash in expectedHashes)
        {
            if (CryptographicOperations.FixedTimeEquals(expectedHash, submittedHash))
            {
                return Task.FromResult(new PuzzleResult(true, true));
            }
        }

        return Task.FromResult(new PuzzleResult(false, false));
    }

    public static string CreateConfiguration(IEnumerable<string> solutions)
    {
        var solutionHashes = solutions
            .Select(solution => Convert.ToHexString(
                SHA256.HashData(Encoding.UTF8.GetBytes(NormalizeAnswer(solution)))))
            .ToArray();
        return JsonSerializer.Serialize(new SolutionProofConfiguration(solutionHashes));
    }

    private static string NormalizeAnswer(string answer)
    {
        try
        {
            using var document = JsonDocument.Parse(answer);
            return JsonSerializer.Serialize(
                document.RootElement,
                new JsonSerializerOptions { Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping });
        }
        catch (JsonException)
        {
            return answer;
        }
    }

    private static byte[] ParseSolutionHash(string? configuredHash)
    {
        if (string.IsNullOrWhiteSpace(configuredHash))
        {
            throw new PuzzleConfigurationException("Nieprawidłowy hash rozwiązania.");
        }

        byte[] hash;
        try
        {
            hash = Convert.FromHexString(configuredHash);
        }
        catch (FormatException exception)
        {
            throw new PuzzleConfigurationException("Nieprawidłowy hash rozwiązania.", exception);
        }

        if (hash.Length != SHA256.HashSizeInBytes)
        {
            throw new PuzzleConfigurationException("Nieprawidłowa długość hasha rozwiązania.");
        }

        return hash;
    }

    private sealed record SolutionProofConfiguration(string[] SolutionHashes);
}

public sealed class MazeRoutePuzzleHandler : IPuzzleHandler
{
    public string PuzzleType => "maze-route";

    public Task<PuzzleResult> ValidateAsync(
        PuzzleContext context,
        string answer,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (context.ConfigurationVersion != 1)
        {
            throw new PuzzleConfigurationException(
                $"Nieobsługiwana wersja konfiguracji zagadki: {context.ConfigurationVersion}.");
        }

        MazeRouteConfiguration configuration;
        try
        {
            configuration = JsonSerializer.Deserialize<MazeRouteConfiguration>(context.Configuration)
                ?? throw new PuzzleConfigurationException("Brak konfiguracji labiryntu.");
        }
        catch (JsonException exception)
        {
            throw new PuzzleConfigurationException("Nieprawidłowy JSON konfiguracji labiryntu.", exception);
        }

        if (configuration.Rows is null ||
            configuration.Rows.Length == 0 ||
            string.IsNullOrWhiteSpace(configuration.Start) ||
            string.IsNullOrWhiteSpace(configuration.Exit) ||
            configuration.Rows.Any(row => string.IsNullOrEmpty(row) ||
                row.Length != configuration.Rows[0].Length ||
                row.Any(cell => cell is not ('.' or '#'))))
        {
            throw new PuzzleConfigurationException("Nieprawidłowa mapa labiryntu.");
        }
        try
        {
            ParseOpenCell(configuration, configuration.Start);
            ParseOpenCell(configuration, configuration.Exit);
        }
        catch (InvalidRouteException exception)
        {
            throw new PuzzleConfigurationException("Początek lub wyjście nie leżą na otwartym polu.", exception);
        }

        string[]? submittedRoute;
        try
        {
            submittedRoute = JsonSerializer.Deserialize<string[]>(answer);
        }
        catch (JsonException)
        {
            return Task.FromResult(new PuzzleResult(false, false));
        }

        if (submittedRoute is null ||
            submittedRoute.Length == 0 ||
            submittedRoute.Any(string.IsNullOrWhiteSpace) ||
            submittedRoute[0] != configuration.Start ||
            submittedRoute[^1] != configuration.Exit)
        {
            return Task.FromResult(new PuzzleResult(false, false));
        }

        try
        {
            var previous = ParseOpenCell(configuration, submittedRoute[0]);
            for (var index = 1; index < submittedRoute.Length; index++)
            {
                var current = ParseOpenCell(configuration, submittedRoute[index]);
                if (Math.Abs(current.Row - previous.Row) + Math.Abs(current.Column - previous.Column) != 1)
                {
                    return Task.FromResult(new PuzzleResult(false, false));
                }

                previous = current;
            }
        }
        catch (InvalidRouteException)
        {
            return Task.FromResult(new PuzzleResult(false, false));
        }

        return Task.FromResult(new PuzzleResult(true, true));
    }

    public static string CreateConfiguration(string[] rows, string start, string exit) =>
        JsonSerializer.Serialize(new MazeRouteConfiguration(rows, start, exit));

    private static Cell ParseOpenCell(MazeRouteConfiguration configuration, string key)
    {
        var coordinates = key.Split('-', StringSplitOptions.None);
        if (coordinates.Length != 2 ||
            !int.TryParse(coordinates[0], NumberStyles.None, CultureInfo.InvariantCulture, out var row) ||
            !int.TryParse(coordinates[1], NumberStyles.None, CultureInfo.InvariantCulture, out var column) ||
            row < 0 ||
            row >= configuration.Rows.Length ||
            column < 0 ||
            column >= configuration.Rows[row].Length ||
            configuration.Rows[row][column] != '.')
        {
            throw new InvalidRouteException();
        }

        return new Cell(row, column);
    }

    private sealed record MazeRouteConfiguration(string[] Rows, string Start, string Exit);
    private sealed record Cell(int Row, int Column);

    private sealed class InvalidRouteException : Exception
    {
    }
}
