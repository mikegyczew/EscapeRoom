using System.Net;
using System.Text;
using System.Text.Json;
using EscapeRoom.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace EscapeRoom.Api.Tests;

public sealed class MailjetEmailSenderTests
{
    [Fact]
    public async Task PasswordResetCodeSendsAnEncodedLinkThroughMailjet()
    {
        using var handler = new CapturingHandler();
        using var client = CreateClient(handler);
        var sender = CreateSender(client);

        await sender.SendPasswordResetCodeAsync(
            new IdentityUser(),
            "player@example.test",
            "token + with spaces");

        Assert.Equal(HttpMethod.Post, handler.Method);
        Assert.Equal("https://api.mailjet.com/v3.1/send", handler.RequestUri?.ToString());
        Assert.Equal(
            $"Basic {Convert.ToBase64String(Encoding.UTF8.GetBytes("test-api-key:test-secret"))}",
            handler.Authorization);
        using var payload = JsonDocument.Parse(handler.Body!);
        var message = payload.RootElement.GetProperty("Messages")[0];
        Assert.Equal("noreply@example.test", message.GetProperty("From").GetProperty("Email").GetString());
        Assert.Equal("Escape Room", message.GetProperty("From").GetProperty("Name").GetString());
        Assert.Equal("player@example.test", message.GetProperty("To")[0].GetProperty("Email").GetString());
        Assert.Contains(
            "resetEmail=player%40example.test&amp;resetCode=token%20%2B%20with%20spaces",
            message.GetProperty("HTMLPart").GetString());
        Assert.Contains(
            "resetCode=token%20%2B%20with%20spaces",
            message.GetProperty("TextPart").GetString());
    }

    [Fact]
    public async Task SenderReportsMissingConfigurationAndMailjetFailures()
    {
        using var handler = new CapturingHandler(HttpStatusCode.Forbidden);
        using var client = CreateClient(handler);
        var sender = CreateSender(client);
        var unconfigured = CreateSender(client, includeCredentials: false);

        Assert.True(sender.IsConfigured);
        Assert.False(unconfigured.IsConfigured);
        await unconfigured.SendConfirmationLinkAsync(
            new IdentityUser(),
            "player@example.test",
            "https://escape.example.test/confirm");
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            unconfigured.SendPasswordResetCodeAsync(
                new IdentityUser(),
                "player@example.test",
                "token"));
        Assert.Null(handler.Method);
        await Assert.ThrowsAsync<HttpRequestException>(() =>
            sender.SendPasswordResetCodeAsync(
                new IdentityUser(),
                "player@example.test",
                "token"));
    }

    [Fact]
    public async Task SenderRejectsMailjetMessageLevelErrors()
    {
        using var handler = new CapturingHandler(
            HttpStatusCode.OK,
            """{"Messages":[{"Status":"error"}]}""");
        using var client = CreateClient(handler);
        var sender = CreateSender(client);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            sender.SendPasswordResetCodeAsync(
                new IdentityUser(),
                "player@example.test",
                "token"));
    }

    private static HttpClient CreateClient(CapturingHandler handler) =>
        new(handler)
        {
            BaseAddress = new Uri("https://api.mailjet.com/v3.1/"),
        };

    private static MailjetEmailSender CreateSender(HttpClient client, bool includeCredentials = true)
    {
        var settings = new Dictionary<string, string?>
        {
            ["Mailjet:ApiKey"] = includeCredentials ? "test-api-key" : null,
            ["Mailjet:SecretKey"] = includeCredentials ? "test-secret" : null,
            ["Mailjet:FromAddress"] = "noreply@example.test",
            ["Mailjet:FromName"] = "Escape Room",
            ["Mailjet:FrontendBaseUrl"] = "https://escape.example.test",
        };
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(settings)
            .Build();
        return new MailjetEmailSender(
            client,
            configuration,
            NullLogger<MailjetEmailSender>.Instance);
    }

    private sealed class CapturingHandler(
        HttpStatusCode responseStatus = HttpStatusCode.OK,
        string responseBody = """{"Messages":[{"Status":"success"}]}""")
        : HttpMessageHandler
    {
        public HttpMethod? Method { get; private set; }
        public Uri? RequestUri { get; private set; }
        public string? Authorization { get; private set; }
        public string? Body { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            Method = request.Method;
            RequestUri = request.RequestUri;
            Authorization = request.Headers.Authorization?.ToString();
            Body = await request.Content!.ReadAsStringAsync(cancellationToken);
            return new HttpResponseMessage(responseStatus)
            {
                Content = new StringContent(responseBody),
            };
        }
    }
}
