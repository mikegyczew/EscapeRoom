using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace EscapeRoom.Api.Data;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : IdentityDbContext<IdentityUser>(options)
{
    public DbSet<LocalizedText> LocalizedTexts => Set<LocalizedText>();

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
    }
}
