import { NextRequest, NextResponse } from 'next/server';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

// Default fallback is Cloudflare's official Always-Pass test secret key when TURNSTILE_SECRET_KEY is not set
const SECRET_KEY =
  process.env.TURNSTILE_SECRET_KEY?.trim() || '1x0000000000000000000000000000000AA';

export async function verifyTurnstileTokenOnServer(
  token: string,
  remoteIp?: string | null
): Promise<{ success: boolean; errorCodes?: string[] }> {
  if (!token) {
    return { success: false, errorCodes: ['missing-input-response'] };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', SECRET_KEY);
    formData.append('response', token);
    if (remoteIp) {
      formData.append('remoteip', remoteIp);
    }

    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!res.ok) {
      return { success: false, errorCodes: [`http-${res.status}`] };
    }

    const data = (await res.json()) as {
      success: boolean;
      'error-codes'?: string[];
    };

    return {
      success: Boolean(data.success),
      errorCodes: data['error-codes'],
    };
  } catch {
    return { success: false, errorCodes: ['network-error'] };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = String(body?.token || '').trim();

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Vui lòng hoàn thành xác thực bảo mật Cloudflare Turnstile.',
        },
        { status: 400 }
      );
    }

    const remoteIp =
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      null;

    const result = await verifyTurnstileTokenOnServer(token, remoteIp);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Xác thực Cloudflare Turnstile không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.',
          errorCodes: result.errorCodes,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Lỗi xác thực Turnstile.',
      },
      { status: 500 }
    );
  }
}
