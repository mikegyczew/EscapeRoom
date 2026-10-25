namespace EscapeRoom.Api.Services;

public sealed class PuzzleService
{
    public const string Password = "start";

    public char? GetLetterAt(int position)
    {
        if (position < 0 || position >= Password.Length)
        {
            return null;
        }

        return Password[position];
    }

    public string GetBinaryCode(char character)
    {
        return Convert.ToString(character, 2).PadLeft(8, '0');
    }

    public string[] GetBinaryCodes()
    {
        return Password.Select(GetBinaryCode).ToArray();
    }
}
