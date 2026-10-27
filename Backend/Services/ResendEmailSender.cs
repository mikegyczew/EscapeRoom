using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Identity;

namespace EscapeRoom.Api.Services;

public sealed class ResendEmailSender(
    HttpClient httpClient,
    IConfiguration configuration,
    ILogger<ResendEmailSender> logger) : IEmailSender<IdentityUser>
{
    private readonly string apiKey = configuration["Resend:ApiKey"] ?? string.Empty;
    private readonly string fromAddress = configuration["Resend:FromAddress"] ?? string.Empty;
    private readonly string frontendBaseUrl = configuration["Resend:FrontendBaseUrl"] ?? string.Empty;

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(apiKey) &&
        !string.IsNullOrWhiteSpace(fromAddress) &&
        Uri.TryCreate(frontendBaseUrl, UriKind.Absolute, out var frontendUri) &&
        (frontendUri.Scheme == Uri.UriSchemeHttp || frontendUri.Scheme == Uri.UriSchemeHttps);

    public Task SendConfirmationLinkAsync(
        IdentityUser user,
        string email,
        string confirmationLink) =>
        SendAsync(
            email,
            "Potwierdź swój adres e-mail",
            "Kliknij poniższy link, aby potwierdzić adres e-mail.",
            confirmationLink);

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
                "Resend email delivery requires Resend:ApiKey, Resend:FromAddress, and Resend:FrontendBaseUrl.");
        }

        var encodedLink = HtmlEncoder.Default.Encode(link);
        var html = $"<p>{HtmlEncoder.Default.Encode(introduction)}</p><p><a href=\"{encodedLink}\">Otwórz EscapeRoom</a></p>";
        var text = $"{introduction}{Environment.NewLine}{link}";
        using var request = new HttpRequestMessage(HttpMethod.Post, "emails")
        {
            Content = JsonContent.Create(new ResendEmailRequest(
                fromAddress,
                [email],
                subject,
                html,
                text)),
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        using var response = await httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            logger.LogError(
                "Resend rejected an email request with HTTP status {StatusCode}.",
                (int)response.StatusCode);
            throw new HttpRequestException(
                $"Resend rejected the email request with HTTP status {(int)response.StatusCode}.",
                null,
                response.StatusCode);
        }
    }

    private sealed record ResendEmailRequest(
        string From,
        string[] To,
        string Subject,
        string Html,
        string Text);
}
