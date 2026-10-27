using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace EscapeRoom.Api.Data;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : IdentityDbContext<IdentityUser, IdentityRole, string>(options)
{
    public DbSet<LocalizedText> LocalizedTexts => Set<LocalizedText>();
    public DbSet<Story> Stories => Set<Story>();
    public DbSet<StoryTranslation> StoryTranslations => Set<StoryTranslation>();
    public DbSet<RoomDefinition> RoomDefinitions => Set<RoomDefinition>();
    public DbSet<StoryRoom> StoryRooms => Set<StoryRoom>();
    public DbSet<RoomContent> RoomContents => Set<RoomContent>();
    public DbSet<RoomContentTranslation> RoomContentTranslations => Set<RoomContentTranslation>();
    public DbSet<PuzzleDefinition> PuzzleDefinitions => Set<PuzzleDefinition>();
    public DbSet<PuzzleInstance> PuzzleInstances => Set<PuzzleInstance>();
    public DbSet<PuzzleInstanceTranslation> PuzzleInstanceTranslations =>
        Set<PuzzleInstanceTranslation>();
    public DbSet<PlayerStoryProgress> PlayerStoryProgress => Set<PlayerStoryProgress>();
    public DbSet<PlayerPuzzleProgress> PlayerPuzzleProgress => Set<PlayerPuzzleProgress>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.Entity<LocalizedText>(entity =>
        {
            entity.HasKey(text => new { text.Language, text.Key });
            entity.Property(text => text.Language).HasMaxLength(10);
            entity.Property(text => text.Key).HasMaxLength(200);
            entity.Property(text => text.Value).IsRequired().HasColumnName("Value");
        });

        builder.Entity<Story>(entity =>
        {
            entity.HasKey(story => story.Id);
            entity.HasIndex(story => story.Key).IsUnique();
            entity.Property(story => story.Key).HasMaxLength(100);
        });
        builder.Entity<StoryTranslation>(entity =>
        {
            entity.HasKey(translation => translation.Id);
            entity.HasIndex(translation => new { translation.StoryId, translation.LanguageCode })
                .IsUnique();
            entity.Property(translation => translation.LanguageCode).HasMaxLength(10);
            entity.HasOne(translation => translation.Story)
                .WithMany(story => story.Translations)
                .HasForeignKey(translation => translation.StoryId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        builder.Entity<RoomDefinition>(entity =>
        {
            entity.HasKey(room => room.Id);
            entity.HasIndex(room => room.Key).IsUnique();
            entity.Property(room => room.Key).HasMaxLength(100);
        });
        builder.Entity<StoryRoom>(entity =>
        {
            entity.HasKey(room => room.Id);
            entity.HasIndex(room => new { room.StoryId, room.RoomNumber }).IsUnique();
            entity.HasIndex(room => new { room.StoryId, room.Order }).IsUnique();
            entity.HasOne(room => room.Story)
                .WithMany(story => story.Rooms)
                .HasForeignKey(room => room.StoryId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(room => room.RoomDefinition)
                .WithMany(definition => definition.StoryRooms)
                .HasForeignKey(room => room.RoomDefinitionId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        builder.Entity<RoomContent>(entity =>
        {
            entity.HasKey(content => content.Id);
            entity.HasIndex(content => new { content.StoryRoomId, content.ContentKey }).IsUnique();
            entity.HasOne(content => content.StoryRoom)
                .WithMany(room => room.Contents)
                .HasForeignKey(content => content.StoryRoomId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        builder.Entity<RoomContentTranslation>(entity =>
        {
            entity.HasKey(translation => translation.Id);
            entity.HasIndex(translation => new
                {
                    translation.RoomContentId,
                    translation.LanguageCode,
                })
                .IsUnique();
            entity.Property(translation => translation.LanguageCode).HasMaxLength(10);
            entity.HasOne(translation => translation.RoomContent)
                .WithMany(content => content.Translations)
                .HasForeignKey(translation => translation.RoomContentId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        builder.Entity<PuzzleDefinition>(entity =>
        {
            entity.HasKey(definition => definition.Id);
            entity.HasIndex(definition => definition.Key).IsUnique();
            entity.Property(definition => definition.Key).HasMaxLength(100);
            entity.Property(definition => definition.PuzzleType).HasMaxLength(80);
        });
        builder.Entity<PuzzleInstance>(entity =>
        {
            entity.HasKey(instance => instance.Id);
            entity.HasIndex(instance => new { instance.StoryRoomId, instance.Order }).IsUnique();
            entity.HasOne(instance => instance.StoryRoom)
                .WithMany(room => room.Puzzles)
                .HasForeignKey(instance => instance.StoryRoomId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(instance => instance.PuzzleDefinition)
                .WithMany(definition => definition.Instances)
                .HasForeignKey(instance => instance.PuzzleDefinitionId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        builder.Entity<PuzzleInstanceTranslation>(entity =>
        {
            entity.HasKey(translation => translation.Id);
            entity.HasIndex(translation => new
                {
                    translation.PuzzleInstanceId,
                    translation.LanguageCode,
                })
                .IsUnique();
            entity.Property(translation => translation.LanguageCode).HasMaxLength(10);
            entity.HasOne(translation => translation.PuzzleInstance)
                .WithMany(instance => instance.Translations)
                .HasForeignKey(translation => translation.PuzzleInstanceId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        builder.Entity<PlayerStoryProgress>(entity =>
        {
            entity.HasKey(progress => progress.Id);
            entity.HasIndex(progress => new { progress.UserId, progress.StoryId }).IsUnique();
            entity.HasOne<IdentityUser>()
                .WithMany()
                .HasForeignKey(progress => progress.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(progress => progress.Story)
                .WithMany()
                .HasForeignKey(progress => progress.StoryId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<StoryRoom>()
                .WithMany()
                .HasForeignKey(progress => progress.CurrentStoryRoomId)
                .OnDelete(DeleteBehavior.SetNull);
        });
        builder.Entity<PlayerPuzzleProgress>(entity =>
        {
            entity.HasKey(progress => progress.Id);
            entity.HasIndex(progress => new { progress.UserId, progress.PuzzleInstanceId }).IsUnique();
            entity.HasOne<IdentityUser>()
                .WithMany()
                .HasForeignKey(progress => progress.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(progress => progress.PuzzleInstance)
                .WithMany()
                .HasForeignKey(progress => progress.PuzzleInstanceId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
