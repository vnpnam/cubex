using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Cubex.Api.Data;
using Cubex.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace Cubex.Api.Services;

public record LoginEmailContext(
    string UserId,
    string Email,
    string DisplayName,
    string LoginMethod,
    DateTime LoginAtUtc,
    string Browser,
    string Device,
    string? IpAddress
);

public record ResendSendResult(
    bool Sent,
    string Status,
    string? ResendMessageId,
    string? ErrorMessage
);

public interface IEmailService
{
    Task<LoginAuditLog> RecordLoginAndSendNotificationAsync(LoginEmailContext ctx);
    string BuildLoginNotificationHtml(LoginEmailContext ctx);
    (string Browser, string Device) ParseUserAgent(string? userAgent);
}

public class EmailService : IEmailService
{
    private readonly CubexDbContext _db;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    // Rate-limiting / Anti-spam guard per userId (minimum 15 seconds between login notification emails)
    private static readonly ConcurrentDictionary<string, DateTime> LastEmailSentByUser = new();

    public EmailService(
        CubexDbContext db,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<EmailService> logger)
    {
        _db = db;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<LoginAuditLog> RecordLoginAndSendNotificationAsync(LoginEmailContext ctx)
    {
        var auditLog = new LoginAuditLog
        {
            UserId = ctx.UserId,
            Email = ctx.Email,
            DisplayName = ctx.DisplayName,
            LoginMethod = ctx.LoginMethod,
            LoginAt = ctx.LoginAtUtc,
            Browser = ctx.Browser,
            Device = ctx.Device,
            IpAddress = ctx.IpAddress,
            EmailStatus = "Pending"
        };

        try
        {
            // 1. Check if this email/user has ALREADY received their first-time login email
            var alreadySentBefore = await _db.LoginAuditLogs
                .AnyAsync(l =>
                    (l.Email.ToLower() == ctx.Email.ToLower() || l.UserId == ctx.UserId) &&
                    l.EmailStatus == "Sent");

            if (alreadySentBefore || LastEmailSentByUser.ContainsKey(ctx.UserId))
            {
                auditLog.EmailStatus = "Skipped_AlreadyNotified";
                auditLog.ErrorMessage = "First-time login email was already sent to this account previously.";
            }
            else
            {
                var sendResult = await SendViaResendWithRetryAsync(ctx);
                auditLog.EmailStatus = sendResult.Status;
                auditLog.ResendMessageId = sendResult.ResendMessageId;
                auditLog.ErrorMessage = sendResult.ErrorMessage;

                if (sendResult.Sent)
                {
                    LastEmailSentByUser[ctx.UserId] = DateTime.UtcNow;
                }
            }
        }
        catch (Exception ex)
        {
            // Never let email errors break or block user login
            _logger.LogWarning(ex, "[Cube Resolver Security] Error while sending login notification email for {Email}", ctx.Email);
            auditLog.EmailStatus = "Failed";
            auditLog.ErrorMessage = ex.Message;
        }

        try
        {
            _db.LoginAuditLogs.Add(auditLog);
            await _db.SaveChangesAsync();
        }
        catch (Exception dbEx)
        {
            _logger.LogWarning(dbEx, "[Cube Resolver Security] Could not persist LoginAuditLog to database.");
        }

        return auditLog;
    }

    private async Task<ResendSendResult> SendViaResendWithRetryAsync(LoginEmailContext ctx)
    {
        if (string.IsNullOrWhiteSpace(ctx.Email) || !ctx.Email.Contains('@'))
        {
            return new ResendSendResult(false, "Failed", null, "Invalid recipient email address.");
        }

        var apiKey = Environment.GetEnvironmentVariable("RESEND_API_KEY")
                     ?? _configuration["Resend:ApiKey"]
                     ?? "";

        var fromEmail = Environment.GetEnvironmentVariable("RESEND_FROM_EMAIL")
                        ?? _configuration["Resend:FromEmail"]
                        ?? "Cube Resolver Security <onboarding@resend.dev>";

        var htmlBody = BuildLoginNotificationHtml(ctx);

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogInformation(
                "[Cube Resolver Security] RESEND_API_KEY is not configured. Recorded login audit log for {Email} ({Method}) without dispatching external HTTP request.",
                ctx.Email,
                ctx.LoginMethod
            );
            return new ResendSendResult(false, "Skipped_NoApiKey", null, "RESEND_API_KEY is not configured.");
        }

        var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(10);

        var payload = new
        {
            from = fromEmail,
            to = new[] { ctx.Email },
            subject = $"[Cube Resolver] Đăng nhập thành công vào tài khoản của bạn ({ctx.LoginMethod})",
            html = htmlBody
        };

        var jsonPayload = JsonSerializer.Serialize(payload);
        const int maxAttempts = 3;
        string? lastError = null;

        for (int attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey.Trim());
                request.Content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

                using var response = await client.SendAsync(request);
                var responseText = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    string? messageId = null;
                    try
                    {
                        using var doc = JsonDocument.Parse(responseText);
                        if (doc.RootElement.TryGetProperty("id", out var idProp))
                        {
                            messageId = idProp.GetString();
                        }
                    }
                    catch
                    {
                        // ignore parse error
                    }

                    _logger.LogInformation(
                        "[Cube Resolver Security] Resend login notification email sent to {Email}. MessageId={MessageId}",
                        ctx.Email,
                        messageId
                    );
                    return new ResendSendResult(true, "Sent", messageId, null);
                }

                lastError = $"HTTP {(int)response.StatusCode}: {responseText}";
                _logger.LogWarning(
                    "[Cube Resolver Security] Resend API attempt {Attempt}/{Max} failed for {Email}: {Error}",
                    attempt,
                    maxAttempts,
                    ctx.Email,
                    lastError
                );

                // Do not retry on 4xx client errors (except 429 Too Many Requests)
                if ((int)response.StatusCode >= 400 && (int)response.StatusCode < 500 && (int)response.StatusCode != 429)
                {
                    break;
                }
            }
            catch (Exception ex)
            {
                lastError = ex.Message;
                _logger.LogWarning(
                    ex,
                    "[Cube Resolver Security] Resend network exception on attempt {Attempt}/{Max} for {Email}",
                    attempt,
                    maxAttempts,
                    ctx.Email
                );
            }

            if (attempt < maxAttempts)
            {
                await Task.Delay(TimeSpan.FromMilliseconds(400 * attempt));
            }
        }

        return new ResendSendResult(false, "Failed", null, lastError);
    }

    public (string Browser, string Device) ParseUserAgent(string? userAgent)
    {
        if (string.IsNullOrWhiteSpace(userAgent))
            return ("Web Browser", "Desktop / Web");

        var ua = userAgent;

        // Detect Browser
        string browser = "Web Browser";
        if (ua.Contains("Edg/", StringComparison.OrdinalIgnoreCase))
            browser = "Microsoft Edge";
        else if (ua.Contains("OPR/", StringComparison.OrdinalIgnoreCase) || ua.Contains("Opera", StringComparison.OrdinalIgnoreCase))
            browser = "Opera";
        else if (ua.Contains("Chrome/", StringComparison.OrdinalIgnoreCase) && !ua.Contains("Edg/", StringComparison.OrdinalIgnoreCase))
            browser = "Google Chrome";
        else if (ua.Contains("Firefox/", StringComparison.OrdinalIgnoreCase))
            browser = "Mozilla Firefox";
        else if (ua.Contains("Safari/", StringComparison.OrdinalIgnoreCase) && !ua.Contains("Chrome/", StringComparison.OrdinalIgnoreCase))
            browser = "Apple Safari";

        // Detect OS / Device
        string device = "Desktop";
        if (ua.Contains("Windows NT 10.0", StringComparison.OrdinalIgnoreCase))
            device = "Windows 10 / 11 PC";
        else if (ua.Contains("Windows", StringComparison.OrdinalIgnoreCase))
            device = "Windows PC";
        else if (ua.Contains("Macintosh", StringComparison.OrdinalIgnoreCase) || ua.Contains("Mac OS X", StringComparison.OrdinalIgnoreCase))
            device = "Mac (macOS)";
        else if (ua.Contains("iPhone", StringComparison.OrdinalIgnoreCase))
            device = "iPhone (iOS)";
        else if (ua.Contains("iPad", StringComparison.OrdinalIgnoreCase))
            device = "iPad (iPadOS)";
        else if (ua.Contains("Android", StringComparison.OrdinalIgnoreCase))
            device = "Android Device";
        else if (ua.Contains("Linux", StringComparison.OrdinalIgnoreCase))
            device = "Linux PC";

        return (browser, device);
    }

    public string BuildLoginNotificationHtml(LoginEmailContext ctx)
    {
        var safeName = WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(ctx.DisplayName) ? ctx.Email.Split('@')[0] : ctx.DisplayName);
        var safeEmail = WebUtility.HtmlEncode(ctx.Email);
        var safeMethod = WebUtility.HtmlEncode(ctx.LoginMethod);
        var safeBrowser = WebUtility.HtmlEncode(ctx.Browser);
        var safeDevice = WebUtility.HtmlEncode(ctx.Device);
        var vnTime = ctx.LoginAtUtc.AddHours(7).ToString("HH:mm:ss — dd/MM/yyyy") + " (GMT+7)";

        return $@"<!DOCTYPE html>
<html lang=""vi"">
<head>
  <meta charset=""UTF-8"" />
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
  <title>Đăng nhập thành công! - Cube Resolver</title>
</head>
<body style=""margin:0;padding:0;background-color:#060911;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f1f5f9;-webkit-font-smoothing:antialiased;"">
  <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background-color:#060911;padding:32px 12px;"">
    <tr>
      <td align=""center"">
        <!-- Main Card (Gmail & Mobile Responsive) -->
        <table role=""presentation"" width=""580"" cellpadding=""0"" cellspacing=""0"" style=""max-width:580px;width:100%;background-color:#0c1220;border:1px solid #1e293b;border-radius:20px;overflow:hidden;"">
          
          <!-- Top Accent Bar -->
          <tr>
            <td style=""height:5px;background:linear-gradient(90deg,#00e5ff 0%,#38bdf8 50%,#8a2be2 100%);""></td>
          </tr>

          <!-- Logo & Header -->
          <tr>
            <td style=""padding:28px 32px 16px 32px;text-align:center;"">
              <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" align=""center"">
                <tr>
                  <td style=""background-color:#070b13;border:2px solid #00e5ff;border-radius:10px;padding:7px;"">
                    <table role=""presentation"" cellpadding=""0"" cellspacing=""2"">
                      <tr>
                        <td style=""width:9px;height:9px;background-color:#00e5ff;border-radius:2px;""></td>
                        <td style=""width:9px;height:9px;background-color:#ff6b00;border-radius:2px;""></td>
                      </tr>
                      <tr>
                        <td style=""width:9px;height:9px;background-color:#10b981;border-radius:2px;""></td>
                        <td style=""width:9px;height:9px;background-color:#facc15;border-radius:2px;""></td>
                      </tr>
                    </table>
                  </td>
                  <td style=""padding-left:10px;text-align:left;"">
                    <div style=""font-size:20px;font-weight:900;letter-spacing:-0.4px;color:#ffffff;"">CUBE RESOLVER</div>
                    <div style=""font-size:9px;font-family:monospace;letter-spacing:2px;color:#94a3b8;text-transform:uppercase;"">CUBEX SECURITY NOTIFICATION</div>
                  </td>
                </tr>
              </table>

              <div style=""margin-top:20px;display:inline-block;padding:5px 14px;border-radius:999px;background-color:rgba(16,185,129,0.14);border:1px solid rgba(16,185,129,0.35);color:#34d399;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;"">
                ✓ Xác Thực Bảo Mật
              </div>

              <h1 style=""margin:14px 0 6px 0;font-size:24px;font-weight:800;color:#ffffff;"">
                Đăng nhập thành công!
              </h1>
              <p style=""margin:0;font-size:14px;color:#94a3b8;line-height:1.55;"">
                Xin chào <strong style=""color:#ffffff;"">{safeName}</strong>, hệ thống vừa ghi nhận một phiên đăng nhập mới vào tài khoản Cube Resolver của bạn.
              </p>
            </td>
          </tr>

          <!-- Login Details Table -->
          <tr>
            <td style=""padding:12px 32px 20px 32px;"">
              <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background-color:#111827;border:1px solid #1f2937;border-radius:14px;overflow:hidden;"">
                <tr>
                  <td style=""padding:13px 18px;border-bottom:1px solid #1f2937;font-size:12px;color:#94a3b8;width:40%;"">Tên người dùng</td>
                  <td style=""padding:13px 18px;border-bottom:1px solid #1f2937;font-size:13px;font-weight:700;color:#ffffff;"">{safeName}</td>
                </tr>
                <tr>
                  <td style=""padding:13px 18px;border-bottom:1px solid #1f2937;font-size:12px;color:#94a3b8;"">Email tài khoản</td>
                  <td style=""padding:13px 18px;border-bottom:1px solid #1f2937;font-size:13px;font-weight:600;color:#00e5ff;"">{safeEmail}</td>
                </tr>
                <tr>
                  <td style=""padding:13px 18px;border-bottom:1px solid #1f2937;font-size:12px;color:#94a3b8;"">Thời gian đăng nhập</td>
                  <td style=""padding:13px 18px;border-bottom:1px solid #1f2937;font-size:13px;font-family:monospace;color:#e2e8f0;"">{vnTime}</td>
                </tr>
                <tr>
                  <td style=""padding:13px 18px;border-bottom:1px solid #1f2937;font-size:12px;color:#94a3b8;"">Phương thức đăng nhập</td>
                  <td style=""padding:13px 18px;border-bottom:1px solid #1f2937;font-size:13px;font-weight:700;color:#38bdf8;"">{safeMethod}</td>
                </tr>
                <tr>
                  <td style=""padding:13px 18px;border-bottom:1px solid #1f2937;font-size:12px;color:#94a3b8;"">Trình duyệt</td>
                  <td style=""padding:13px 18px;border-bottom:1px solid #1f2937;font-size:13px;color:#cbd5e1;"">{safeBrowser}</td>
                </tr>
                <tr>
                  <td style=""padding:13px 18px;font-size:12px;color:#94a3b8;"">Thiết bị / Hệ điều hành</td>
                  <td style=""padding:13px 18px;font-size:13px;color:#cbd5e1;"">{safeDevice}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Security Warning Box -->
          <tr>
            <td style=""padding:0 32px 26px 32px;"">
              <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background-color:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);border-radius:14px;"">
                <tr>
                  <td style=""padding:16px 18px;"">
                    <div style=""font-size:13px;font-weight:800;color:#f87171;margin-bottom:4px;"">
                      ⚠️ Không phải bạn thực hiện đăng nhập này?
                    </div>
                    <div style=""font-size:12px;color:#cbd5e1;line-height:1.55;"">
                      Nếu bạn không nhận ra hoạt động đăng nhập trên, vui lòng đổi mật khẩu tài khoản hoặc thu hồi quyền truy cập Google OAuth ngay lập tức và liên hệ với bộ phận bảo mật của Cube Resolver.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style=""padding:18px 32px;background-color:#080c16;border-top:1px solid #1e293b;text-align:center;"">
              <div style=""font-size:12px;font-weight:700;color:#94a3b8;"">Cube Resolver Security Team</div>
              <div style=""font-size:11px;color:#64748b;margin-top:4px;"">
                Email thông báo bảo mật tự động • Vui lòng không trả lời trực tiếp email này.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>";
    }
}
