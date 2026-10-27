namespace EscapeRoom.Api.Models;

/// <summary>Text-field changes for a whitelisted game-content database row.</summary>
public sealed record AdminDatabaseTextUpdateRequest(
    Dictionary<string, string> Key,
    Dictionary<string, string?> Values);
