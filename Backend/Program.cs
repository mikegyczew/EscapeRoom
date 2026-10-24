using EscapeRoom.Api.Models;
using EscapeRoom.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddSingleton<PuzzleService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("Frontend");

app.MapGet("/", () => Results.Ok(new
{
    name = "EscapeRoom API",
    status = "running"
}));

app.MapGet("/api/puzzles/first", (PuzzleService puzzles) =>
{
    return Results.Ok(new
    {
        name = "Matrix",
        length = PuzzleService.Password.Length,
        encoding = "ASCII",
        bitsPerCharacter = 8,
        progress = 0
    });
});

app.MapPost("/api/puzzles/first/guess",
    (GuessLetterRequest request, PuzzleService puzzles) =>
{
    if (request.Letter is null || request.Letter.Length != 1)
    {
        return Results.BadRequest(new
        {
            message = "Wprowadź dokładnie jeden znak."
        });
    }

    var expected = puzzles.GetLetterAt(request.Position);

    if (expected is null)
    {
        return Results.BadRequest(new
        {
            message = "Zagadka została już ukończona."
        });
    }

    var correct =
        char.ToLowerInvariant(request.Letter[0]) == expected.Value;

    if (!correct)
    {
        return Results.Ok(new
        {
            correct = false,
            complete = false,
            nextPosition = request.Position,
            binary = (string?)null,
            message = "Błędny znak. Spróbuj ponownie."
        });
    }

    var nextPosition = request.Position + 1;
    var complete = nextPosition == PuzzleService.Password.Length;

    return Results.Ok(new
    {
        correct = true,
        complete,
        nextPosition,
        binary = puzzles.GetBinaryCode(expected.Value),
        message = complete
            ? "MISJA ZAKOŃCZONA. ZAMEK OTWARTY!"
            : "Znak zaakceptowany."
    });
});

app.Run();
