using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;

namespace EscapeRoom.Api.Services;

public sealed class MailjetEmailSender(
    HttpClient httpClient,
    IConfiguration configuration,
    ILogger<MailjetEmailSender> logger) : IEmailSender<IdentityUser>
{
    private static readonly JsonSerializerOptions MailjetJsonOptions = new()
    {
        PropertyNamingPolicy = null,
    };

    private readonly string apiKey = configuration["Mailjet:ApiKey"] ?? string.Empty;
    private readonly string secretKey = configuration["Mailjet:SecretKey"] ?? string.Empty;
    private readonly string fromAddress = configuration["Mailjet:FromAddress"] ?? string.Empty;
    private readonly string fromName = configuration["Mailjet:FromName"] ?? "Escape Room";
    private readonly string frontendBaseUrl = configuration["Mailjet:FrontendBaseUrl"] ?? string.Empty;

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(apiKey) &&
        !string.IsNullOrWhiteSpace(secretKey) &&
        !string.IsNullOrWhiteSpace(fromAddress) &&
        Uri.TryCreate(frontendBaseUrl, UriKind.Absolute, out var frontendUri) &&
        (frontendUri.Scheme == Uri.UriSchemeHttp || frontendUri.Scheme == Uri.UriSchemeHttps);

    public Task SendConfirmationLinkAsync(
        IdentityUser user,
        string email,
        string confirmationLink)
    {
        if (!IsConfigured)
        {
            logger.LogWarning(
                "Skipping the confirmation email because Mailjet is not configured and account confirmation is not required.");
            return Task.CompletedTask;
        }

        return SendAsync(
            email,
            "Potwierdź swój adres e-mail",
            "Kliknij poniższy link, aby potwierdzić adres e-mail.",
            confirmationLink);
    }

    public Task SendPasswordResetLinkAsync(
        IdentityUser user,
        string email,
        string resetLink) =>
        SendAsync(
            email,
            "Zresetuj hasło do EscapeRoom",
            "Kliknij poniższy link, aby ustawić nowe hasło.",
            resetLink);

    public Task SendPasswordResetCodeAsync(
        IdentityUser user,
        string email,
        string resetCode)
    {
        var resetLink = $"{frontendBaseUrl.TrimEnd('/')}/#resetEmail={Uri.EscapeDataString(email)}&resetCode={Uri.EscapeDataString(resetCode)}";
        return SendAsync(
            email,
            "Zresetuj hasło do EscapeRoom",
            "Kliknij poniższy link, aby ustawić nowe hasło. Jeśli nie proszono o reset, zignoruj tę wiadomość.",
            resetLink);
    }

    private async Task SendAsync(
        string email,
        string subject,
        string introduction,
        string link)
    {
        if (!IsConfigured)
        {
            throw new InvalidOperationException(
                "Mailjet email delivery requires Mailjet:ApiKey, Mailjet:SecretKey, Mailjet:FromAddress, and Mailjet:FrontendBaseUrl.");
        }

        var encodedLink = HtmlEncoder.Default.Encode(link);
        var html = $"<p>{HtmlEncoder.Default.Encode(introduction)}</p><p><a href=\"{encodedLink}\">Otwórz EscapeRoom</a></p>";
        var text = $"{introduction}{Environment.NewLine}{link}";
        using var request = new HttpRequestMessage(HttpMethod.Post, "send")
        {
            Content = JsonContent.Create(
                new MailjetSendRequest(
                    [
                        new MailjetMessage(
                            new MailjetAddress(fromAddress, fromName),
                            [new MailjetAddress(email)],
                            subject,
                            text,
                            html),
                    ]),
                options: MailjetJsonOptions),
        };
        var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{apiKey}:{secretKey}"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);

        using var response = await httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            logger.LogError(
                "Mailjet rejected an email request with HTTP status {StatusCode}.",
                (int)response.StatusCode);
            throw new HttpRequestException(
                $"Mailjet rejected the email request with HTTP status {(int)response.StatusCode}.",
                null,
                response.StatusCode);
        }

        using var responseJson = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync());
        var statuses = responseJson.RootElement
            .GetProperty("Messages")
            .EnumerateArray()
            .Select(message => message.GetProperty("Status").GetString())
            .ToArray();
        if (statuses.Length == 0 || statuses.Any(status => !string.Equals(
                status,
                "success",
                StringComparison.OrdinalIgnoreCase)))
        {
            logger.LogError(
                "Mailjet did not accept the email request. Message statuses: {Statuses}.",
                string.Join(", ", statuses));
            throw new InvalidOperationException(
                "Mailjet did not accept the email request.");
        }
    }

    private sealed record MailjetSendRequest(MailjetMessage[] Messages);

    private sealed record MailjetMessage(
        MailjetAddress From,
        MailjetAddress[] To,
        string Subject,
        string TextPart,
        string HTMLPart);

    private sealed record MailjetAddress(string Email, string? Name = null);
}
