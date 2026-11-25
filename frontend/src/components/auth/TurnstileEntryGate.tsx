'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TurnstileWidget } from './TurnstileWidget';

const SESSION_VERIFIED_KEY = 'cubex_turnstile_verified_v2';

export const TurnstileEntryGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<'checking-session' | 'challenge' | 'verifying' | 'verified'>('checking-session');
  const [hostname, setHostname] = useState('cubex.click');
  const [rayId, setRayId] = useState('928d7f41e8a104b2');
  const [resetSignal, setResetSignal] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hostname && window.location.hostname !== 'localhost') {
        setHostname(window.location.hostname);
      }
      setRayId(
        Array.from({ length: 16 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join('')
      );
    }

    try {
      if (sessionStorage.getItem(SESSION_VERIFIED_KEY) === '1') {
        setStatus('verified');
        return;
      }
    } catch {}
    setStatus('challenge');
  }, []);

  const handleVerify = useCallback(async (token: string) => {
    setStatus('verifying');

    try {
      const res = await fetch('/api/auth/turnstile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({ success: false }));

      if (res.ok && data?.success) {
        try {
          sessionStorage.setItem(SESSION_VERIFIED_KEY, '1');
        } catch {}
        setTimeout(() => {
          setStatus('verified');
        }, 400);
      } else {
        setStatus('challenge');
        setResetSignal((c) => c + 1);
      }
    } catch {
      try {
        sessionStorage.setItem(SESSION_VERIFIED_KEY, '1');
      } catch {}
      setStatus('verified');
    }
  }, []);

  if (status === 'verified') {
    return <>{children}</>;
  }

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full bg-white text-[#313131] flex flex-col justify-between font-sans select-none"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
      }}
    >
      {/* Top / Main Content matching Cloudflare Security Verification page */}
      <div className="w-full max-w-[960px] mx-auto px-6 sm:px-12 pt-16 sm:pt-28 pb-12 flex-1">
        <h1 className="text-[28px] sm:text-[38px] font-semibold tracking-tight text-[#313131] leading-tight">
          {hostname}
        </h1>

        <h2 className="text-[18px] sm:text-[24px] font-medium text-[#313131] mt-1.5">
          Performing security verification
        </h2>

        <p className="text-[14px] sm:text-[15px] text-[#4b4b4b] mt-3.5 max-w-[700px] leading-relaxed">
          This website uses a security service to protect against malicious bots. This page is
          displayed while the website verifies you are not a bot.
        </p>

        {/* Turnstile Widget & Spinner Area */}
        <div className="mt-7 flex flex-col items-start gap-4">
          {status === 'checking-session' || status === 'verifying' ? (
            <div className="flex items-center gap-3 py-2">
              <div className="w-7 h-7 rounded-full border-[3px] border-[#d9d9d9] border-t-[#313131] animate-spin" />
              {status === 'verifying' && (
                <span className="text-sm text-[#4b4b4b] font-medium">
                  Verification successful. Redirecting...
                </span>
              )}
            </div>
          ) : (
            <div className="w-full max-w-[320px]">
              <TurnstileWidget
                theme="light"
                onVerify={handleVerify}
                onExpire={() => setStatus('challenge')}
                onError={() => {
                  // Automatically retry once or allow widget interaction
                }}
                resetSignal={resetSignal}
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Cloudflare Ray ID Footer */}
      <div className="w-full border-t border-[#e5e5e5] py-5 px-6 text-center text-[12px] text-[#737373]">
        <div className="max-w-[960px] mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6">
          <span>
            Ray ID: <code className="font-mono text-[#4b4b4b]">{rayId}</code>
          </span>
          <span className="hidden sm:inline text-[#d4d4d4]">•</span>
          <span>Performance &amp; security by Cloudflare</span>
        </div>
      </div>
    </div>
  );
};
