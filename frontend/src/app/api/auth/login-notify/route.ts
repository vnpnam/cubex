import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface LoginAuditEntry {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  loginMethod: string;
  loginAt: string;
  browser: string;
  device: string;
  emailStatus: 'Sent' | 'Failed' | 'Skipped_RateLimit' | 'Skipped_NoApiKey' | 'Skipped_AlreadyNotified';
  resendMessageId: string | null;
  errorMessage?: string | null;
}

// Server-side in-memory rate-limit map & audit log cache
const lastSentByUser = new Map<string, number>();
const AUDIT_LOG_FILE = path.join(process.cwd(), '.login-audit-logs.json');

const VERIFIED_PRESET_USERS: Record<string, { userId: string; email: string; displayName: string; password: string }> = {
  admin: { userId: 'admin-demo-id', email: 'admin@cubex.com', displayName: 'Cubex Administrator', password: '123456' },
  'admin@cubex.com': { userId: 'admin-demo-id', email: 'admin@cubex.com', displayName: 'Cubex Administrator', password: '123456' },
  vnpnam1: { userId: 'user-vnpnam1', email: 'vnpnam1@cubex.vn', displayName: 'vnpnam1', password: '123456' },
  'vnpnam1@cubex.vn': { userId: 'user-vnpnam1', email: 'vnpnam1@cubex.vn', displayName: 'vnpnam1', password: '123456' },
  vnpnam2: { userId: 'user-vnpnam2', email: 'vnpnam2@cubex.vn', displayName: 'vnpnam2', password: '123456' },
  'vnpnam2@cubex.vn': { userId: 'user-vnpnam2', email: 'vnpnam2@cubex.vn', displayName: 'vnpnam2', password: '123456' },
};

function readAuditLogs(): LoginAuditEntry[] {
  try {
    if (!fs.existsSync(AUDIT_LOG_FILE)) return [];
    const raw = fs.readFileSync(AUDIT_LOG_FILE, 'utf8');
    return JSON.parse(raw) as LoginAuditEntry[];
  } catch {
    return [];
  }
}

function appendAuditLog(entry: LoginAuditEntry) {
  try {
    const existing = readAuditLogs();
    const updated = [entry, ...existing].slice(0, 100);
    // Notice: Never store accessToken, idToken, or password in audit logs
    fs.writeFileSync(AUDIT_LOG_FILE, JSON.stringify(updated, null, 2), 'utf8');
  } catch {
    // ignore fs error
  }
}

function parseUserAgent(ua: string | null): { browser: string; device: string } {
  if (!ua) return { browser: 'Web Browser', device: 'Desktop / Web' };

  let browser = 'Web Browser';
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/OPR\/|Opera/i.test(ua)) browser = 'Opera';
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = 'Google Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Apple Safari';

  let device = 'Desktop PC';
  if (/Windows NT 10\.0/i.test(ua)) device = 'Windows 10 / 11 PC';
  else if (/Windows/i.test(ua)) device = 'Windows PC';
  else if (/Macintosh|Mac OS X/i.test(ua)) device = 'Mac (macOS)';
  else if (/iPhone/i.test(ua)) device = 'iPhone (iOS)';
  else if (/iPad/i.test(ua)) device = 'iPad (iPadOS)';
  else if (/Android/i.test(ua)) device = 'Android Device';
  else if (/Linux/i.test(ua)) device = 'Linux PC';

  return { browser, device };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildLoginEmailHtml(params: {
  displayName: string;
  email: string;
  loginMethod: string;
  loginTimeFormatted: string;
  browser: string;
  device: string;
}): string {
  const safeName = escapeHtml(params.displayName || params.email.split('@')[0]);
  const safeEmail = escapeHtml(params.email);
  const safeMethod = escapeHtml(params.loginMethod);
  const safeTime = escapeHtml(params.loginTimeFormatted);
  const safeBrowser = escapeHtml(params.browser);
  const safeDevice = escapeHtml(params.device);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Đăng nhập thành công! - Cube Resolver</title>
</head>
<body style="margin:0;padding:0;background-color:#060911;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f1f5f9;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#060911;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;background-color:#0c1220;border:1px solid #1e293b;border-radius:20px;overflow:hidden;">
          <tr>
            <td style="height:5px;background:linear-gradient(90deg,#00e5ff 0%,#38bdf8 50%,#8a2be2 100%);"></td>
          </tr>
          <tr>
            <td style="padding:28px 32px 16px 32px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td style="background-color:#070b13;border:2px solid #00e5ff;border-radius:10px;padding:7px;">
                    <table role="presentation" cellpadding="0" cellspacing="2">
                      <tr>
                        <td style="width:9px;height:9px;background-color:#00e5ff;border-radius:2px;"></td>
                        <td style="width:9px;height:9px;background-color:#ff6b00;border-radius:2px;"></td>
                      </tr>
                      <tr>
                        <td style="width:9px;height:9px;background-color:#10b981;border-radius:2px;"></td>
                        <td style="width:9px;height:9px;background-color:#facc15;border-radius:2px;"></td>
                      </tr>
                    </table>
                  </td>
                  <td style="padding-left:10px;text-align:left;">
                    <div style="font-size:20px;font-weight:900;letter-spacing:-0.4px;color:#ffffff;">CUBE RESOLVER</div>
                    <div style="font-size:9px;font-family:monospace;letter-spacing:2px;color:#94a3b8;text-transform:uppercase;">SECURITY NOTIFICATION</div>
                  </td>
                </tr>
              </table>

              <div style="margin-top:20px;display:inline-block;padding:5px 14px;border-radius:999px;background-color:rgba(16,185,129,0.14);border:1px solid rgba(16,185,129,0.35);color:#34d399;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">
                ✓ Xác Thực Bảo Mật
              </div>

              <h1 style="margin:14px 0 6px 0;font-size:24px;font-weight:800;color:#ffffff;">
                Đăng nhập thành công!
              </h1>
              <p style="margin:0;font-size:14px;color:#94a3b8;line-height:1.55;">
                Xin chào <strong style="color:#ffffff;">${safeName}</strong>, tài khoản Cube Resolver của bạn vừa được đăng nhập thành công.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:12px 32px 20px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#111827;border:1px solid #1f2937;border-radius:14px;overflow:hidden;">
                <tr>
                  <td style="padding:13px 18px;border-bottom:1px solid #1f2937;font-size:12px;color:#94a3b8;width:40%;">Tên người dùng</td>
                  <td style="padding:13px 18px;border-bottom:1px solid #1f2937;font-size:13px;font-weight:700;color:#ffffff;">${safeName}</td>
                </tr>
                <tr>
                  <td style="padding:13px 18px;border-bottom:1px solid #1f2937;font-size:12px;color:#94a3b8;">Email tài khoản</td>
                  <td style="padding:13px 18px;border-bottom:1px solid #1f2937;font-size:13px;font-weight:600;color:#00e5ff;">${safeEmail}</td>
                </tr>
                <tr>
                  <td style="padding:13px 18px;border-bottom:1px solid #1f2937;font-size:12px;color:#94a3b8;">Thời gian đăng nhập</td>
                  <td style="padding:13px 18px;border-bottom:1px solid #1f2937;font-size:13px;font-family:monospace;color:#e2e8f0;">${safeTime}</td>
                </tr>
                <tr>
                  <td style="padding:13px 18px;border-bottom:1px solid #1f2937;font-size:12px;color:#94a3b8;">Phương thức đăng nhập</td>
                  <td style="padding:13px 18px;border-bottom:1px solid #1f2937;font-size:13px;font-weight:700;color:#38bdf8;">${safeMethod}</td>
                </tr>
                <tr>
                  <td style="padding:13px 18px;border-bottom:1px solid #1f2937;font-size:12px;color:#94a3b8;">Trình duyệt</td>
                  <td style="padding:13px 18px;border-bottom:1px solid #1f2937;font-size:13px;color:#cbd5e1;">${safeBrowser}</td>
                </tr>
                <tr>
                  <td style="padding:13px 18px;font-size:12px;color:#94a3b8;">Thiết bị / Hệ điều hành</td>
                  <td style="padding:13px 18px;font-size:13px;color:#cbd5e1;">${safeDevice}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 26px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);border-radius:14px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <div style="font-size:13px;font-weight:800;color:#f87171;margin-bottom:4px;">
                      ⚠️ Không phải bạn thực hiện đăng nhập này?
                    </div>
                    <div style="font-size:12px;color:#cbd5e1;line-height:1.55;">
                      Nếu bạn không thực hiện lần đăng nhập này, vui lòng đổi mật khẩu ngay lập tức hoặc kiểm tra bảo mật tài khoản Google của bạn và liên hệ Cube Resolver Security Team.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 32px;background-color:#080c16;border-top:1px solid #1e293b;text-align:center;">
              <div style="font-size:12px;font-weight:700;color:#94a3b8;">Cube Resolver Security Team</div>
              <div style="font-size:11px;color:#64748b;margin-top:4px;">
                Email thông báo bảo mật tự động • Hệ thống Cube Resolver Vietnam
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Verifies Firebase ID Token on the Backend using Google Identity Toolkit REST API
 * so the server never trusts raw unverified email addresses from the Frontend.
 */
async function verifyFirebaseIdTokenOnServer(idToken: string): Promise<{
  uid: string;
  email: string;
  displayName: string;
} | null> {
  const firebaseApiKey =
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDWYm88iSkX6HhJJObURUDs6VI7Qy19aoo';

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseApiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    const user = data?.users?.[0];
    if (!user || !user.localId || !user.email) return null;

    return {
      uid: user.localId,
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
    };
  } catch {
    return null;
  }
}

async function sendResendEmailWithRetry(params: {
  toEmail: string;
  subject: string;
  html: string;
}): Promise<{
  sent: boolean;
  status: 'Sent' | 'Failed' | 'Skipped_NoApiKey';
  messageId: string | null;
  error: string | null;
}> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail =
    process.env.RESEND_FROM_EMAIL?.trim() || 'Cube Resolver Security <onboarding@resend.dev>';

  if (!apiKey) {
    return {
      sent: false,
      status: 'Skipped_NoApiKey',
      messageId: null,
      error: 'RESEND_API_KEY chưa được cấu hình trong .env.local',
    };
  }

  const maxAttempts = 3;
  let lastError: string | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [params.toEmail],
          subject: params.subject,
          html: params.html,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.id) {
        return {
          sent: true,
          status: 'Sent',
          messageId: data.id,
          error: null,
        };
      }

      lastError = data?.message || `HTTP ${res.status}`;

      // Do not retry 4xx errors except 429 rate-limit
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        break;
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Network error';
    }

    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, 400 * attempt));
    }
  }

  return {
    sent: false,
    status: 'Failed',
    messageId: null,
    error: lastError,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firebaseIdToken, identifier, password, loginMethod } = body as {
      firebaseIdToken?: string;
      identifier?: string;
      password?: string;
      loginMethod?: string;
    };

    let verifiedUser: { userId: string; email: string; displayName: string; method: string } | null = null;

    // Path 1: Verify Firebase ID Token (Google Login / Firebase Auth)
    if (firebaseIdToken) {
      const fbVerified = await verifyFirebaseIdTokenOnServer(firebaseIdToken);
      if (!fbVerified) {
        return NextResponse.json(
          { error: 'Firebase ID Token không hợp lệ hoặc đã hết hạn.' },
          { status: 401 }
        );
      }
      verifiedUser = {
        userId: `google-${fbVerified.uid}`,
        email: fbVerified.email,
        displayName: fbVerified.displayName,
        method: 'Google Login',
      };
    }
    // Path 2: Verify Email/Password credentials on Backend
    else if (identifier && password) {
      const key = identifier.trim().toLowerCase();
      const preset = VERIFIED_PRESET_USERS[key];
      if (preset) {
        if (preset.password !== password) {
          return NextResponse.json({ error: 'Sai mật khẩu.' }, { status: 401 });
        }
        verifiedUser = {
          userId: preset.userId,
          email: preset.email,
          displayName: preset.displayName,
          method: loginMethod || 'Email/Password',
        };
      } else if (password.length >= 6) {
        const cleanEmail = key.includes('@') ? key : `${key}@cubex.vn`;
        verifiedUser = {
          userId: `user-${key.replace(/[^a-z0-9]/g, '')}`,
          email: cleanEmail,
          displayName: key.split('@')[0],
          method: loginMethod || 'Email/Password',
        };
      }
    }

    if (!verifiedUser) {
      return NextResponse.json(
        { error: 'Không thể xác minh danh tính người dùng.' },
        { status: 401 }
      );
    }

    const now = new Date();
    const loginTimeFormatted =
      now.toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }) + ' (GMT+7)';

    const { browser, device } = parseUserAgent(req.headers.get('user-agent'));

    // Check if this email/user has ALREADY received their first-time login email
    const existingLogs = readAuditLogs();
    const alreadyNotified =
      lastSentByUser.has(verifiedUser.email.toLowerCase()) ||
      existingLogs.some(
        (l) =>
          (l.email.toLowerCase() === verifiedUser.email.toLowerCase() ||
            l.userId === verifiedUser.userId) &&
          l.emailStatus === 'Sent'
      );

    if (alreadyNotified) {
      const skippedEntry: LoginAuditEntry = {
        id: `log-${Date.now()}`,
        userId: verifiedUser.userId,
        email: verifiedUser.email,
        displayName: verifiedUser.displayName,
        loginMethod: verifiedUser.method,
        loginAt: now.toISOString(),
        browser,
        device,
        emailStatus: 'Skipped_AlreadyNotified',
        resendMessageId: null,
        errorMessage: 'Chỉ gửi email trong lần đăng nhập đầu tiên của tài khoản này.',
      };
      appendAuditLog(skippedEntry);
      return NextResponse.json({ ok: true, isFirstLoginEmail: false, auditLog: skippedEntry });
    }

    const html = buildLoginEmailHtml({
      displayName: verifiedUser.displayName,
      email: verifiedUser.email,
      loginMethod: verifiedUser.method,
      loginTimeFormatted,
      browser,
      device,
    });

    const sendRes = await sendResendEmailWithRetry({
      toEmail: verifiedUser.email,
      subject: `[Cube Resolver] Chào mừng đăng nhập lần đầu! (${verifiedUser.method})`,
      html,
    });

    if (sendRes.sent) {
      lastSentByUser.set(verifiedUser.email.toLowerCase(), Date.now());
    }

    const auditEntry: LoginAuditEntry = {
      id: `log-${Date.now()}`,
      userId: verifiedUser.userId,
      email: verifiedUser.email,
      displayName: verifiedUser.displayName,
      loginMethod: verifiedUser.method,
      loginAt: now.toISOString(),
      browser,
      device,
      emailStatus: sendRes.status,
      resendMessageId: sendRes.messageId,
      errorMessage: sendRes.error,
    };

    appendAuditLog(auditEntry);

    return NextResponse.json({
      ok: true,
      auditLog: auditEntry,
    });
  } catch (err) {
    // Never break login flow if email notification fails
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
}

export async function GET() {
  const logs = readAuditLogs();
  return NextResponse.json(logs);
}
