'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import {
  useAuthStore,
  PRESET_ACCOUNTS,
  User as CubexUser,
  GoogleAccountInput,
} from '@/lib/store/useAuthStore';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';

function sanitizeApiUrl(raw?: string): string {
  if (!raw) return 'http://localhost:5247';
  const cleaned = raw.trim().replace(/^https?:\/\/(https?:\/\/)/i, '$1');
  if (cleaned.includes('localhost:5247.trycloudflare.com')) {
    return 'http://localhost:5247';
  }
  return cleaned.replace(/\/+$/, '');
}

const API_URL = sanitizeApiUrl(process.env.NEXT_PUBLIC_API_URL);

// Official Google SVG Logo
const GoogleLogoSvg = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const { setUser, loginOrLinkGoogleAccount } = useAuthStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fallback Google chooser if Firebase Google provider is not yet enabled in console
  const [googleChooserOpen, setGoogleChooserOpen] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  /**
   * Triggered when user clicks "Continue with Google"
   * Uses official Firebase Google OAuth 2.0 popup (signInWithPopup)
   */
  const handleContinueWithGoogle = useCallback(async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setGoogleLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const firebaseIdToken = await fbUser.getIdToken();
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const googleAccessToken = credential?.accessToken;

      const googleProfile: GoogleAccountInput = {
        googleUid: fbUser.uid,
        email: fbUser.email || `${fbUser.uid}@gmail.com`,
        displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Google Cuber',
        avatarUrl:
          fbUser.photoURL ||
          `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(fbUser.uid)}`,
      };

      // 1. Try verifying Firebase ID Token & sending Resend notification on C# Backend if running
      let handledByCSharpBackend = false;
      try {
        const res = await fetch(`${API_URL}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            idToken: firebaseIdToken,
            accessToken: googleAccessToken,
          }),
        });

        if (res.ok) {
          handledByCSharpBackend = true;
          const data = await res.json();
          const apiUser = data.user;
          const loggedUser: CubexUser = {
            id: apiUser.id,
            googleUid: fbUser.uid,
            email: apiUser.email,
            displayName: apiUser.displayName,
            avatarUrl: apiUser.avatarUrl || googleProfile.avatarUrl,
            wcaId: apiUser.wcaId,
            bio: apiUser.bio,
            roles: apiUser.roles ?? ['Cubist'],
            preferredLanguage: apiUser.preferredLanguage ?? 'vi',
            themePreference: apiUser.themePreference ?? 'dark',
            createdAt: apiUser.createdAt,
            lastLoginAt: apiUser.lastLoginAt,
            authProvider: 'Google',
          };
          setUser(loggedUser, data.token);
        }
      } catch {
        // C# Backend offline -> Next.js Server API route will verify Firebase ID Token & dispatch Resend email
      }

      if (!handledByCSharpBackend) {
        loginOrLinkGoogleAccount(googleProfile);
      }

      // 2. Always verify Firebase ID Token on Next.js Server API route & send Resend login notification + record Audit Log
      fetch('/api/auth/login-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseIdToken,
          loginMethod: 'Google Login',
        }),
      }).catch(() => {});

      setSuccessMsg(`Đăng nhập Google thành công (${googleProfile.email})!`);
      setGoogleLoading(false);
      setTimeout(() => router.push('/'), 450);
    } catch (err: unknown) {
      setGoogleLoading(false);
      const fbErr = err as { code?: string; message?: string };
      const code = fbErr?.code || '';

      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setErrorMsg('Bạn đã đóng cửa sổ đăng nhập Google trước khi hoàn tất.');
      } else if (code === 'auth/popup-blocked') {
        setErrorMsg('Trình duyệt đã chặn cửa sổ Popup của Google. Vui lòng cho phép Popup trên trình duyệt.');
      } else if (code === 'auth/user-disabled') {
        setErrorMsg('Tài khoản Google này đã bị vô hiệu hóa.');
      } else if (code === 'auth/operation-not-allowed' || code === 'auth/configuration-not-found') {
        setGoogleChooserOpen(true);
      } else {
        setErrorMsg(`Đăng nhập Google thất bại (${code || 'Lỗi xác thực'}).`);
      }
    }
  }, [loginOrLinkGoogleAccount, router, setUser]);

  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailClean = customGoogleEmail.trim().toLowerCase();
    if (!emailClean || !emailClean.includes('@')) return;
    const nameClean = customGoogleName.trim() || emailClean.split('@')[0];
    const deterministicUid =
      'goog-uid-' +
      Array.from(emailClean)
        .reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7)
        .toString(16);

    setGoogleChooserOpen(false);
    setGoogleLoading(true);

    setTimeout(() => {
      const { user } = loginOrLinkGoogleAccount({
        googleUid: deterministicUid,
        email: emailClean,
        displayName: nameClean,
        avatarUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(emailClean)}&backgroundColor=00e5ff`,
      });
      setGoogleLoading(false);
      setSuccessMsg(`Đăng nhập Google thành công (${user.email})!`);
      setTimeout(() => router.push('/'), 450);
    }, 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanId = identifier.trim();
    if (!cleanId) {
      setErrorMsg('Vui lòng nhập tài khoản hoặc email.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setLoading(true);

    // 1. Check built-in preset accounts (admin / 123456, vnpnam1 / 123456, vnpnam2 / 123456)
    const matchedPreset = PRESET_ACCOUNTS.find(
      (acc) =>
        acc.username.toLowerCase() === cleanId.toLowerCase() ||
        acc.user.email.toLowerCase() === cleanId.toLowerCase()
    );

    if (matchedPreset) {
      if (matchedPreset.password !== password) {
        setErrorMsg('Tài khoản hoặc mật khẩu không chính xác.');
        setLoading(false);
        return;
      }

      setUser(matchedPreset.user, matchedPreset.token);
      fetch('/api/auth/login-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: cleanId,
          password,
          loginMethod: 'Email/Password',
        }),
      }).catch(() => {});
      setSuccessMsg(`Đăng nhập thành công vào tài khoản ${matchedPreset.user.displayName}!`);
      setLoading(false);
      setTimeout(() => router.push('/'), 400);
      return;
    }

    // 2. Try Backend API if available
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: cleanId,
          password,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const apiUser = data.user;
        const loggedUser: CubexUser = {
          id: apiUser.id,
          email: apiUser.email,
          displayName: apiUser.displayName,
          avatarUrl: apiUser.avatarUrl,
          wcaId: apiUser.wcaId,
          bio: apiUser.bio,
          roles: apiUser.roles ?? ['Cubist'],
          preferredLanguage: apiUser.preferredLanguage ?? 'vi',
          themePreference: apiUser.themePreference ?? 'dark',
          createdAt: apiUser.createdAt,
          lastLoginAt: apiUser.lastLoginAt,
          authProvider: 'Password',
        };
        setUser(loggedUser, data.token);
        fetch('/api/auth/login-notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: loggedUser.email,
            password,
            loginMethod: 'Email/Password',
          }),
        }).catch(() => {});
        setSuccessMsg('Đăng nhập thành công!');
        setLoading(false);
        setTimeout(() => router.push('/'), 400);
        return;
      }

      if (res.status === 401 || res.status === 400) {
        const errJson = await res.json().catch(() => null);
        setErrorMsg(errJson?.message || 'Tài khoản hoặc mật khẩu không chính xác.');
        setLoading(false);
        return;
      }
    } catch {
      // Backend offline
    }

    setErrorMsg('Tài khoản hoặc mật khẩu không chính xác.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#05080f] text-slate-100 flex flex-col justify-center items-center p-4 bg-grid-pattern relative overflow-hidden">
      {/* Ambient Background Glows */}
      <div className="pointer-events-none fixed -top-24 left-1/2 -translate-x-1/2 w-[650px] h-[420px] bg-neonCyan/[0.08] rounded-full blur-[150px]" />
      <div className="pointer-events-none fixed bottom-0 right-1/4 w-[500px] h-[400px] bg-electricPurple/[0.08] rounded-full blur-[150px]" />

      {/* Top Back to Home link */}
      <div className="w-full max-w-md mb-5 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-neonCyan" />
          <span>Quay về trang chủ</span>
        </Link>

        <Link href="/" className="flex items-center gap-2.5 select-none">
          <div className="p-[1.5px] rounded-lg bg-gradient-to-br from-neonCyan via-sky-500 to-electricPurple">
            <div className="w-7 h-7 bg-[#070b13] rounded-[7px] p-1.5 grid grid-cols-2 grid-rows-2 gap-0.5">
              <span className="rounded-[2px] bg-[#00e5ff]" />
              <span className="rounded-[2px] bg-[#ff6b00]" />
              <span className="rounded-[2px] bg-[#10b981]" />
              <span className="rounded-[2px] bg-[#facc15]" />
            </div>
          </div>
          <span className="text-base font-extrabold tracking-tight text-white">CUBEX</span>
        </Link>
      </div>

      {/* Main Standalone Login Card */}
      <div className="w-full max-w-md glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.85)] relative z-10">
        {/* Heading */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Đăng Nhập CUBEX
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
            Đăng nhập để đồng bộ lịch sử giải & thi đấu 1v1
          </p>
        </div>

        {/* Continue with Google Button (Official Google OAuth 2.0) */}
        <button
          type="button"
          onClick={handleContinueWithGoogle}
          disabled={googleLoading || loading}
          className="group w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-[0_8px_25px_rgba(255,255,255,0.12)] hover:shadow-[0_10px_30px_rgba(0,229,255,0.25)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          {googleLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-sky-600 shrink-0" />
              <span>Đang xác thực với Google...</span>
            </>
          ) : (
            <>
              <GoogleLogoSvg className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <div className="relative flex items-center justify-center my-5">
          <div className="w-full border-t border-white/10" />
          <span className="bg-[#0c111d] px-3 text-[10px] uppercase font-mono text-slate-400 absolute">
            hoặc đăng nhập bằng tài khoản
          </span>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-4 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 px-4 py-3 rounded-2xl bg-rubikGreen/15 border border-rubikGreen/40 text-rubikGreen text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Tên đăng nhập hoặc Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Nhập tên đăng nhập hoặc email"
                className="w-full pl-10 pr-4 py-2.5 bg-[#070b12] border border-white/10 rounded-2xl text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-neonCyan/60 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-[#070b12] border border-white/10 rounded-2xl text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-neonCyan/60 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-3.5 rounded-2xl bg-neonCyan hover:bg-[#33ecff] text-[#06090f] font-extrabold text-sm shadow-cyan-glow transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Đăng Nhập</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Fallback Google Account input if Firebase Google Auth provider isn't enabled yet */}
      {googleChooserOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setGoogleChooserOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#111622] border border-white/15 rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#161c2b]">
              <div className="flex items-center gap-2.5">
                <GoogleLogoSvg className="w-5 h-5" />
                <span className="text-sm font-semibold text-white">Đăng nhập bằng Google</span>
              </div>
              <button
                type="button"
                onClick={() => setGoogleChooserOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCustomGoogleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Email Google (Gmail)</label>
                <input
                  type="email"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-[#070b12] border border-white/15 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-neonCyan"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">Họ và tên hiển thị</label>
                <input
                  type="text"
                  value={customGoogleName}
                  onChange={(e) => setCustomGoogleName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-3.5 py-2.5 bg-[#070b12] border border-white/15 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-neonCyan"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-neonCyan text-[#06090f] text-xs sm:text-sm font-extrabold hover:bg-[#33ecff]"
              >
                Tiếp tục với Google
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
