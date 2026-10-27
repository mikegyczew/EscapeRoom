namespace EscapeRoom.Api.Data;

public sealed class Story
{
    public required string Id { get; set; }
    public required string Key { get; set; }
    public bool IsPublished { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public ICollection<StoryTranslation> Translations { get; } = [];
    public ICollection<StoryRoom> Rooms { get; } = [];
}

public sealed class StoryTranslation
{
    public required string Id { get; set; }
    public required string StoryId { get; set; }
    public required string LanguageCode { get; set; }
    public required string Name { get; set; }
    public required string Description { get; set; }
    public Story Story { get; set; } = null!;
}

public sealed class RoomDefinition
{
    public required string Id { get; set; }
    public required string Key { get; set; }
    public bool IsEnabled { get; set; }
    public ICollection<StoryRoom> StoryRooms { get; } = [];
}

public sealed class StoryRoom
{
    public required string Id { get; set; }
    public required string StoryId { get; set; }
    public required string RoomDefinitionId { get; set; }
    public int RoomNumber { get; set; }
    public int Order { get; set; }
    public bool IsEnabled { get; set; }
    public Story Story { get; set; } = null!;
    public RoomDefinition RoomDefinition { get; set; } = null!;
    public ICollection<RoomContent> Contents { get; } = [];
    public ICollection<PuzzleInstance> Puzzles { get; } = [];
}

public sealed class RoomContent
{
    public required string Id { get; set; }
    public required string StoryRoomId { get; set; }
    public required string ContentKey { get; set; }
    public required string ContentType { get; set; }
    public int Order { get; set; }
    public StoryRoom StoryRoom { get; set; } = null!;
    public ICollection<RoomContentTranslation> Translations { get; } = [];
}

public sealed class RoomContentTranslation
{
    public required string Id { get; set; }
    public required string RoomContentId { get; set; }
    public required string LanguageCode { get; set; }
    public required string Text { get; set; }
    public RoomContent RoomContent { get; set; } = null!;
}

public sealed class PuzzleDefinition
{
    public required string Id { get; set; }
    public required string Key { get; set; }
    public required string PuzzleType { get; set; }
    public int ConfigurationVersion { get; set; }
    public bool IsEnabled { get; set; }
    public ICollection<PuzzleInstance> Instances { get; } = [];
}

public sealed class PuzzleInstance
{
    public required string Id { get; set; }
    public required string StoryRoomId { get; set; }
    public required string PuzzleDefinitionId { get; set; }
    public int Order { get; set; }
    public required string Configuration { get; set; }
    public StoryRoom StoryRoom { get; set; } = null!;
    public PuzzleDefinition PuzzleDefinition { get; set; } = null!;
    public ICollection<PuzzleInstanceTranslation> Translations { get; } = [];
}

public sealed class PuzzleInstanceTranslation
{
    public required string Id { get; set; }
    public required string PuzzleInstanceId { get; set; }
    public required string LanguageCode { get; set; }
    public required string Instruction { get; set; }
    public string? Hint1 { get; set; }
    public string? Hint2 { get; set; }
    public PuzzleInstance PuzzleInstance { get; set; } = null!;
}

public sealed class PlayerStoryProgress
{
    public required string Id { get; set; }
    public required string UserId { get; set; }
    public required string StoryId { get; set; }
    public string? CurrentStoryRoomId { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public Story Story { get; set; } = null!;
}

public sealed class PlayerPuzzleProgress
{
    public required string Id { get; set; }
    public required string UserId { get; set; }
    public required string PuzzleInstanceId { get; set; }
    public int Attempts { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public PuzzleInstance PuzzleInstance { get; set; } = null!;
}
