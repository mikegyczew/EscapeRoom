namespace EscapeRoom.Api.Data;

public sealed class LocalizedText
{
    public required string Language { get; init; }
    public required string Key { get; init; }
    public required string Value { get; set; }
}
