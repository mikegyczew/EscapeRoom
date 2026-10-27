using System.Data.Common;
using EscapeRoom.Api.Data;
using EscapeRoom.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace EscapeRoom.Api.Services;

public sealed class AdminDatabaseService(ApplicationDbContext database)
{
    private static readonly IReadOnlyDictionary<string, string> AvailableTables =
        new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["Stories"] = "Scenariusze",
            ["StoryTranslations"] = "Tłumaczenia scenariuszy",
            ["RoomDefinitions"] = "Definicje pokoi",
            ["StoryRooms"] = "Pokoje scenariuszy",
            ["RoomContents"] = "Treści pokoi",
            ["RoomContentTranslations"] = "Tłumaczenia treści",
            ["PuzzleDefinitions"] = "Definicje zagadek",
            ["PuzzleInstances"] = "Zagadki w scenariuszach",
            ["PuzzleInstanceTranslations"] = "Instrukcje i podpowiedzi",
            ["LocalizedTexts"] = "Teksty interfejsu",
            ["AspNetUsers"] = "Użytkownicy (bez danych uwierzytelniających)",
        };

    private static readonly IReadOnlyDictionary<string, HashSet<string>> EditableTextColumns =
        new Dictionary<string, HashSet<string>>(StringComparer.Ordinal)
        {
            ["StoryTranslations"] = new(["Name", "Description"], StringComparer.Ordinal),
            ["RoomContentTranslations"] = new(["Text"], StringComparer.Ordinal),
            ["PuzzleInstanceTranslations"] = new(
                ["Instruction", "Hint1", "Hint2"],
                StringComparer.Ordinal),
            ["LocalizedTexts"] = new(["Value"], StringComparer.Ordinal),
        };

    public IReadOnlyList<AdminDatabaseTableDto> GetTables() =>
        AvailableTables
            .Select(table => new AdminDatabaseTableDto(table.Key, table.Value))
            .ToArray();

    public async Task<AdminDatabasePageDto> GetPageAsync(
        string tableName,
        int offset,
        int limit,
        CancellationToken cancellationToken)
    {
        if (!AvailableTables.TryGetValue(tableName, out var label))
        {
            throw new KeyNotFoundException("Nie znaleziono tabeli bazy gry.");
        }

        if (offset < 0 || offset > 10_000_000 || limit is < 1 or > 100)
        {
            throw new ArgumentException("Offset musi być w zakresie 0–10 000 000, a limit 1–100.");
        }

        var entityType = database.Model.GetEntityTypes()
            .SingleOrDefault(entity => entity.GetTableName() == tableName)
            ?? throw new InvalidOperationException($"Tabela {tableName} nie ma mapowania EF Core.");
        var storeObject = StoreObjectIdentifier.Table(tableName, entityType.GetSchema());
        var properties = entityType.GetProperties();
        var userColumns = tableName == "AspNetUsers"
            ? new HashSet<string>(
                [
                    nameof(IdentityUser.Id),
                    nameof(IdentityUser.UserName),
                    nameof(IdentityUser.Email),
                    nameof(IdentityUser.EmailConfirmed),
                    nameof(IdentityUser.LockoutEnabled),
                ],
                StringComparer.Ordinal)
            : null;
        var columns = properties
            .Where(property => userColumns is null || userColumns.Contains(property.Name))
            .Select(property => property.GetColumnName(storeObject))
            .Where(column => column is not null)
            .Cast<string>()
            .ToArray();
        if (tableName == "AspNetUsers")
        {
            columns = [.. columns, "Roles"];
        }
        var primaryKeyColumns = entityType.FindPrimaryKey()?.Properties
            .Select(property => property.GetColumnName(storeObject))
            .Where(column => column is not null)
            .Cast<string>()
            .ToArray() ?? [];
        if (columns.Length == 0 || primaryKeyColumns.Length == 0)
        {
            throw new InvalidOperationException($"Tabela {tableName} nie ma kolumn ani klucza głównego.");
        }

        var quotedTableName = QuoteIdentifier(tableName);
        var visibleColumnCount = tableName == "AspNetUsers" ? columns.Length - 1 : columns.Length;
        var quotedColumns = string.Join(
            ", ",
            columns.Take(visibleColumnCount).Select(QuoteIdentifier));
        var selectedColumns = tableName == "AspNetUsers"
            ? $"{quotedColumns}, (SELECT GROUP_CONCAT(role.\"Name\", ', ') " +
                "FROM \"AspNetUserRoles\" userRole " +
                "INNER JOIN \"AspNetRoles\" role ON role.\"Id\" = userRole.\"RoleId\" " +
                "WHERE userRole.\"UserId\" = \"AspNetUsers\".\"Id\") AS \"Roles\""
            : quotedColumns;
        var orderBy = string.Join(", ", primaryKeyColumns.Select(QuoteIdentifier));
        var connection = database.Database.GetDbConnection();
        var wasClosed = connection.State != System.Data.ConnectionState.Open;
        if (wasClosed)
        {
            await database.Database.OpenConnectionAsync(cancellationToken);
        }

        try
        {
            var totalRows = await CountRowsAsync(connection, quotedTableName, cancellationToken);
            var rows = await ReadRowsAsync(
                connection,
                quotedTableName,
                selectedColumns,
                orderBy,
                offset,
                limit,
                cancellationToken);
            return new AdminDatabasePageDto(
                tableName,
                label,
                columns,
                rows,
                totalRows,
                offset,
                limit);
        }
        finally
        {
            if (wasClosed)
            {
                await database.Database.CloseConnectionAsync();
            }
        }
    }

    public async Task UpdateTextAsync(
        string tableName,
        AdminDatabaseTextUpdateRequest request,
        CancellationToken cancellationToken)
    {
        if (!EditableTextColumns.TryGetValue(tableName, out var allowedColumns))
        {
            throw new ArgumentException("Edytowanie tej tabeli nie jest dozwolone.");
        }

        if (request.Key is null || request.Values is null || request.Values.Count == 0)
        {
            throw new ArgumentException("Podaj klucz wiersza i co najmniej jedno pole tekstowe.");
        }

        if (request.Values.Keys.Any(column => !allowedColumns.Contains(column)))
        {
            throw new ArgumentException("Jedno z wybranych pól nie może być edytowane.");
        }

        if (request.Values.Any(value =>
                value.Value is null &&
                !(tableName == "PuzzleInstanceTranslations" &&
                    (value.Key is "Hint1" or "Hint2"))))
        {
            throw new ArgumentException("Edytowane pole tekstowe nie może być puste.");
        }

        if (tableName == "RoomContentTranslations" &&
            !request.Values.ContainsKey("Text"))
        {
            throw new ArgumentException("Podaj tekst tłumaczenia.");
        }

        if (tableName == "LocalizedTexts" &&
            !request.Values.ContainsKey("Value"))
        {
            throw new ArgumentException("Podaj tekst interfejsu.");
        }

        if (request.Values.Values.Any(value => value?.Length > 50_000))
        {
            throw new ArgumentException("Tekst nie może przekraczać 50 000 znaków.");
        }

        switch (tableName)
        {
            case "StoryTranslations":
            {
                var id = GetKeyValue(request.Key, ["Id"]);
                var translation = await database.StoryTranslations
                    .SingleOrDefaultAsync(item => item.Id == id, cancellationToken)
                    ?? throw new KeyNotFoundException("Nie znaleziono tłumaczenia scenariusza.");
                if (request.Values.TryGetValue("Name", out var name))
                {
                    translation.Name = name ?? string.Empty;
                }

                if (request.Values.TryGetValue("Description", out var description))
                {
                    translation.Description = description ?? string.Empty;
                }

                break;
            }
            case "RoomContentTranslations":
            {
                var id = GetKeyValue(request.Key, ["Id"]);
                var translation = await database.RoomContentTranslations
                    .SingleOrDefaultAsync(item => item.Id == id, cancellationToken)
                    ?? throw new KeyNotFoundException("Nie znaleziono tłumaczenia treści pokoju.");
                translation.Text = request.Values["Text"] ?? string.Empty;
                break;
            }
            case "PuzzleInstanceTranslations":
            {
                var id = GetKeyValue(request.Key, ["Id"]);
                var translation = await database.PuzzleInstanceTranslations
                    .SingleOrDefaultAsync(item => item.Id == id, cancellationToken)
                    ?? throw new KeyNotFoundException("Nie znaleziono tłumaczenia zagadki.");
                if (request.Values.TryGetValue("Instruction", out var instruction))
                {
                    translation.Instruction = instruction ?? string.Empty;
                }

                if (request.Values.TryGetValue("Hint1", out var hint1))
                {
                    translation.Hint1 = hint1;
                }

                if (request.Values.TryGetValue("Hint2", out var hint2))
                {
                    translation.Hint2 = hint2;
                }

                break;
            }
            case "LocalizedTexts":
            {
                var language = GetKeyValue(request.Key, ["Language", "Key"], "Language");
                var key = GetKeyValue(request.Key, ["Language", "Key"], "Key");
                var translation = await database.LocalizedTexts
                    .SingleOrDefaultAsync(
                        item => item.Language == language && item.Key == key,
                        cancellationToken)
                    ?? throw new KeyNotFoundException("Nie znaleziono tekstu interfejsu.");
                translation.Value = request.Values["Value"] ?? string.Empty;
                break;
            }
        }

        await database.SaveChangesAsync(cancellationToken);
    }

    private static async Task<long> CountRowsAsync(
        DbConnection connection,
        string quotedTableName,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = $"SELECT COUNT(*) FROM {quotedTableName}";
        var result = await command.ExecuteScalarAsync(cancellationToken);
        return Convert.ToInt64(result, System.Globalization.CultureInfo.InvariantCulture);
    }

    private static async Task<IReadOnlyList<object?[]>> ReadRowsAsync(
        DbConnection connection,
        string quotedTableName,
        string quotedColumns,
        string orderBy,
        int offset,
        int limit,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText =
            $"SELECT {quotedColumns} FROM {quotedTableName} ORDER BY {orderBy} LIMIT @limit OFFSET @offset";
        AddParameter(command, "@limit", limit);
        AddParameter(command, "@offset", offset);

        var rows = new List<object?[]>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var values = new object?[reader.FieldCount];
            reader.GetValues(values!);
            for (var index = 0; index < values.Length; index++)
            {
                if (values[index] is DBNull)
                {
                    values[index] = null;
                }
                else if (values[index] is byte[] bytes)
                {
                    values[index] = Convert.ToBase64String(bytes);
                }
            }

            rows.Add(values);
        }

        return rows;
    }

    private static void AddParameter(DbCommand command, string name, int value)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.Value = value;
        command.Parameters.Add(parameter);
    }

    private static string QuoteIdentifier(string identifier) =>
        $"\"{identifier.Replace("\"", "\"\"", StringComparison.Ordinal)}\"";

    private static string GetKeyValue(
        IReadOnlyDictionary<string, string> key,
        string[] allowedKeys,
        string? selectedKey = null)
    {
        if (key.Keys.Any(item => !allowedKeys.Contains(item, StringComparer.Ordinal)))
        {
            throw new ArgumentException("Klucz zawiera niedozwolone pola.");
        }

        var keyName = selectedKey ?? allowedKeys[0];
        if (!key.TryGetValue(keyName, out var value) || string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException($"Brakuje wartości klucza {keyName}.");
        }

        if (key.Count != allowedKeys.Length)
        {
            throw new ArgumentException("Klucz wiersza jest niekompletny.");
        }

        return value;
    }
}

public sealed record AdminDatabaseTableDto(string Name, string Label);

public sealed record AdminDatabasePageDto(
    string Name,
    string Label,
    string[] Columns,
    IReadOnlyList<object?[]> Rows,
    long TotalRows,
    int Offset,
    int Limit);
