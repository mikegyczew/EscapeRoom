using System.Net;
using System.Text.Json;
using EscapeRoom.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace EscapeRoom.Api.Tests;

public sealed class ResendEmailSenderTests
{
    [Fact]
    public async Task PasswordResetCodeSendsAnEncodedLinkThroughResend()
    {
        using var handler = new CapturingHandler();
        using var client = new HttpClient(handler)
        {
            BaseAddress = new Uri("https://api.resend.com/"),
        };
        var sender = CreateSender(client);

        await sender.SendPasswordResetCodeAsync(
            new IdentityUser(),
            "player@example.test",
            "token + with spaces");

        Assert.Equal(HttpMethod.Post, handler.Method);
        Assert.Equal("https://api.resend.com/emails", handler.RequestUri?.ToString());
        Assert.Equal("Bearer test-api-key", handler.Authorization);
        using var payload = JsonDocument.Parse(handler.Body!);
        var root = payload.RootElement;
        Assert.Equal("Escape Room <noreply@example.test>", root.GetProperty("from").GetString());
        Assert.Equal("player@example.test", root.GetProperty("to")[0].GetString());
        Assert.Contains(
            "resetEmail=player%40example.test&amp;resetCode=token%20%2B%20with%20spaces",
            root.GetProperty("html").GetString());
        Assert.Contains(
            "resetCode=token%20%2B%20with%20spaces",
            root.GetProperty("text").GetString());
    }

    [Fact]
    public async Task SenderReportsMissingConfigurationAndResendFailures()
    {
        using var handler = new CapturingHandler(HttpStatusCode.Forbidden);
        using var client = new HttpClient(handler)
        {
            BaseAddress = new Uri("https://api.resend.com/"),
        };
        var sender = CreateSender(client);
        var unconfigured = CreateSender(client, includeApiKey: false);

        Assert.True(sender.IsConfigured);
        Assert.False(unconfigured.IsConfigured);
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            unconfigured.SendPasswordResetCodeAsync(
                new IdentityUser(),
                "player@example.test",
                "token"));
        await Assert.ThrowsAsync<HttpRequestException>(() =>
            sender.SendPasswordResetCodeAsync(
                new IdentityUser(),
                "player@example.test",
                "token"));
    }

    private static ResendEmailSender CreateSender(HttpClient client, bool includeApiKey = true)
    {
        var settings = new Dictionary<string, string?>
        {
            ["Resend:ApiKey"] = includeApiKey ? "test-api-key" : null,
            ["Resend:FromAddress"] = "Escape Room <noreply@example.test>",
            ["Resend:FrontendBaseUrl"] = "https://escape.example.test",
        };
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(settings)
            .Build();
        return new ResendEmailSender(
            client,
            configuration,
            NullLogger<ResendEmailSender>.Instance);
    }

    private sealed class CapturingHandler(HttpStatusCode responseStatus = HttpStatusCode.OK)
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
            return new HttpResponseMessage(responseStatus);
        }
    }
}
