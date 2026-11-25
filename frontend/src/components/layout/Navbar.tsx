'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useI18nStore } from '@/lib/store/useI18nStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import {
  Timer,
  Box,
  BarChart3,
  Shield,
  Globe,
  LogOut,
  ChevronDown,
  Swords,
  GraduationCap
} from 'lucide-react';

interface NavbarProps {
  activeTab?: 'timer' | 'learn' | '3d' | 'analytics' | 'admin' | 'match';
  setActiveTab?: (tab: 'timer' | 'learn' | '3d' | 'analytics' | 'admin' | 'match') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab = 'timer', setActiveTab }) => {
  const { lang, toggleLang, t } = useI18nStore();
  const { user, isAuthenticated, isAdmin, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [learnDropdownOpen, setLearnDropdownOpen] = useState(false);
  const learnRef = useRef<HTMLDivElement>(null);

  const isLearnActive = pathname?.startsWith('/learn') || activeTab === 'learn';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (learnRef.current && !learnRef.current.contains(e.target as Node)) {
        setLearnDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-[#06090f]/85 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Left: CUBEX Brand Logo */}
          <Link href="/" className="flex items-center gap-3.5 shrink-0 group select-none">
            <div className="p-[2px] rounded-xl bg-gradient-to-br from-neonCyan via-sky-500 to-electricPurple shadow-cyan-glow group-hover:scale-105 transition-transform">
              <div className="w-10 h-10 bg-[#070b13] rounded-[10px] p-2 grid grid-cols-2 grid-rows-2 gap-1">
                <span className="rounded-[3px] bg-[#00e5ff]" />
                <span className="rounded-[3px] bg-[#ff6b00]" />
                <span className="rounded-[3px] bg-[#10b981]" />
                <span className="rounded-[3px] bg-[#facc15]" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-xl font-extrabold tracking-tight text-white">CUBEX</span>
                <span className="w-2 h-2 rounded-full bg-neonCyan shadow-[0_0_10px_#00e5ff]" />
              </div>
              <span className="font-mono text-[9.5px] font-medium tracking-[0.22em] text-slate-400 mt-1 uppercase hidden sm:block">
                THE ART OF SPEEDCUBING
              </span>
            </div>
          </Link>

          {/* Center: Dark Pill Menu (Desktop & Medium Screens) */}
          <nav className="hidden md:flex items-center bg-[#0b0f18]/90 border border-white/[0.09] rounded-full p-1 xl:p-1.5 shadow-lg gap-0.5 shrink-0">
            <Link
              href="/timer"
              onClick={() => setActiveTab?.('timer')}
              className={`whitespace-nowrap shrink-0 flex items-center gap-1.5 xl:gap-2 px-2.5 lg:px-3.5 py-1.5 lg:py-2 rounded-full text-xs xl:text-sm transition-all ${
                pathname === '/timer' && activeTab === 'timer'
                  ? 'font-semibold bg-[#1a2232] text-white border border-white/10 shadow-sm'
                  : 'font-medium text-slate-300 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <Timer className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-neonCyan shrink-0" />
              <span>{t('navTimer')}</span>
            </Link>

            <Link
              href="/#hero-3d"
              className="whitespace-nowrap shrink-0 flex items-center gap-1.5 xl:gap-2 px-2.5 lg:px-3.5 py-1.5 lg:py-2 rounded-full text-xs xl:text-sm font-medium text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all"
            >
              <Box className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-neonCyan shrink-0" />
              <span>{t('nav3D')}</span>
            </Link>

            <Link
              href="/#performance-section"
              className="whitespace-nowrap shrink-0 flex items-center gap-1.5 xl:gap-2 px-2.5 lg:px-3.5 py-1.5 lg:py-2 rounded-full text-xs xl:text-sm font-medium text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all"
            >
              <BarChart3 className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
              <span>{t('navAnalytics')}</span>
            </Link>

            <Link
              href="/match"
              className={`whitespace-nowrap shrink-0 flex items-center gap-1.5 xl:gap-2 px-2.5 lg:px-3.5 py-1.5 lg:py-2 rounded-full text-xs xl:text-sm transition-all ${
                pathname?.startsWith('/match')
                  ? 'font-semibold bg-[#1a2232] text-white border border-white/10 shadow-sm'
                  : 'font-medium text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <Swords className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-neonCyan shrink-0" />
              <span>Thi Đấu</span>
            </Link>

            {isAdmin && (
              <Link
                href="/?view=admin"
                className="whitespace-nowrap shrink-0 flex items-center gap-1.5 xl:gap-2 px-2.5 lg:px-3.5 py-1.5 lg:py-2 rounded-full text-xs xl:text-sm font-medium text-amber-400 hover:text-white hover:bg-amber-500/10 transition-all"
              >
                <Shield className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-amber-400 shrink-0" />
                <span>{t('navAdmin')}</span>
              </Link>
            )}

            {/* Dropdown: Học */}
            <div className="relative shrink-0" ref={learnRef}>
              <button
                type="button"
                onClick={() => setLearnDropdownOpen((v) => !v)}
                className={`whitespace-nowrap shrink-0 flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 lg:py-2 rounded-full text-xs xl:text-sm transition-all ${
                  isLearnActive || learnDropdownOpen
                    ? 'font-semibold bg-[#1a2232] text-white border border-white/10 shadow-sm'
                    : 'font-medium text-slate-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-neonCyan shrink-0" />
                <span>Học</span>
                <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${learnDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {learnDropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-[#0d121d]/95 backdrop-blur-xl border border-white/10 shadow-2xl p-2 z-50">
                  <Link
                    href="/learn/basic"
                    onClick={() => setLearnDropdownOpen(false)}
                    className="w-full text-left flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-rubikGreen/15 text-rubikGreen flex items-center justify-center font-mono font-bold text-xs">
                      CB
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-neonCyan transition-colors">Cơ bản</div>
                      <div className="text-xs text-slate-400">Layer-by-Layer • Sub-60s</div>
                    </div>
                  </Link>
                  <Link
                    href="/learn/cross"
                    onClick={() => setLearnDropdownOpen(false)}
                    className="w-full text-left flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center font-mono font-bold text-xs">
                      +
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-neonCyan transition-colors">Cross</div>
                      <div className="text-xs text-slate-400">Tối ưu chữ thập ≤ 8 bước</div>
                    </div>
                  </Link>
                  <Link
                    href="/learn/f2l"
                    onClick={() => setLearnDropdownOpen(false)}
                    className="w-full text-left flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-neonCyan/15 text-neonCyan flex items-center justify-center font-mono font-bold text-xs">
                      F2L
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-neonCyan transition-colors">F2L</div>
                      <div className="text-xs text-slate-400">41 thế giải 2 tầng đầu</div>
                    </div>
                  </Link>
                  <Link
                    href="/learn/oll"
                    onClick={() => setLearnDropdownOpen(false)}
                    className="w-full text-left flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-rubikYellow/15 text-rubikYellow flex items-center justify-center font-mono font-bold text-xs">
                      OLL
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-neonCyan transition-colors">OLL</div>
                      <div className="text-xs text-slate-400">Lật mặt vàng (2-Look & Full)</div>
                    </div>
                  </Link>
                  <Link
                    href="/learn/pll"
                    onClick={() => setLearnDropdownOpen(false)}
                    className="w-full text-left flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-electricPurple/20 text-purple-400 flex items-center justify-center font-mono font-bold text-xs">
                      PLL
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-neonCyan transition-colors">PLL</div>
                      <div className="text-xs text-slate-400">Hoán vị tầng cuối (21 thế)</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* Right: Language switch & User Profile */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={toggleLang}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#0b0f18] border border-white/[0.09] hover:border-neonCyan/50 transition-all text-sm font-bold text-white"
              title="Chuyển đổi Ngôn ngữ / Switch Language"
            >
              <Globe className="w-4 h-4 text-neonCyan" />
              <span className="uppercase">{lang}</span>
            </button>

            {isAuthenticated && user ? (
              <div className="relative shrink-0">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="whitespace-nowrap flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-full bg-[#0b0f18] border border-white/[0.09] hover:border-electricPurple/50 transition-all"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName}
                      className="w-7 h-7 rounded-full object-cover border border-neonCyan/40 bg-slate-800 shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neonCyan to-electricPurple flex items-center justify-center text-[#06090f] font-extrabold text-xs shrink-0">
                      {user.displayName[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-white max-w-[130px] truncate hidden sm:inline">
                    {user.displayName}
                  </span>
                  <span
                    className={`hidden lg:inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isAdmin
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-neonCyan/15 text-neonCyan border border-neonCyan/25'
                    }`}
                  >
                    {isAdmin ? 'ADMIN' : 'MEMBER'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-[#0d121d]/95 backdrop-blur-xl border border-white/10 shadow-2xl p-2 z-50 text-xs">
                    <div className="px-3 py-2.5 border-b border-white/[0.07] mb-1 flex items-center gap-3">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.displayName}
                          className="w-10 h-10 rounded-full object-cover border border-neonCyan/40 bg-slate-800 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neonCyan to-electricPurple flex items-center justify-center text-[#06090f] font-extrabold text-sm shrink-0">
                          {user.displayName[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-white block truncate text-sm">{user.displayName}</span>
                        <span className="text-[11px] text-slate-400 block truncate">{user.email}</span>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded inline-block ${
                              isAdmin
                                ? 'bg-[#FF9500]/20 text-[#FF9500] border border-[#FF9500]/30'
                                : 'bg-neonCyan/15 text-neonCyan border border-neonCyan/25'
                            }`}
                          >
                            {isAdmin ? 'ADMIN' : 'MEMBER'}
                          </span>
                          {(user.authProvider === 'Google' || user.googleUid) && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-white inline-block">
                              Google Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isAdmin && (
                      <Link
                        href="/?view=admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full px-3 py-2 text-left text-amber-400 hover:text-white hover:bg-amber-500/10 rounded-xl flex items-center gap-2 text-sm font-semibold"
                      >
                        <Shield className="w-4 h-4 text-[#FF9500]" />
                        <span>{t('navAdmin')}</span>
                      </Link>
                    )}

                    <Link
                      href="/login"
                      onClick={() => setUserDropdownOpen(false)}
                      className="w-full px-3 py-2 text-left text-slate-200 hover:text-white hover:bg-white/[0.06] rounded-xl flex items-center gap-2 text-sm"
                    >
                      <GraduationCap className="w-4 h-4 text-neonCyan" />
                      <span>Đổi tài khoản / Đăng nhập</span>
                    </Link>

                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                        router.push('/login');
                      }}
                      className="w-full px-3 py-2 text-left text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-xl flex items-center gap-2 mt-1 text-sm"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('navLogout')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-neonCyan text-[#06090f] font-bold text-xs rounded-full hover:bg-[#33ecff] transition-all shadow-cyan-glow"
              >
                {t('navLogin')}
              </Link>
            )}
          </div>
        </div>

        {/* Compact Taskbar Row for Small Viewports (< 768px or when DevTools takes half the screen) */}
        <div className="flex md:hidden items-center gap-1.5 px-4 pb-2.5 overflow-x-auto no-scrollbar border-t border-white/[0.05] pt-2">
          <Link
            href="/timer"
            className={`whitespace-nowrap shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all ${
              pathname === '/timer'
                ? 'font-semibold bg-[#1a2232] text-white border border-white/10'
                : 'font-medium text-slate-300 bg-[#0b0f18] border border-white/[0.06]'
            }`}
          >
            <Timer className="w-3.5 h-3.5 text-neonCyan shrink-0" />
            <span>{t('navTimer')}</span>
          </Link>
          <Link
            href="/#hero-3d"
            className="whitespace-nowrap shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 bg-[#0b0f18] border border-white/[0.06]"
          >
            <Box className="w-3.5 h-3.5 text-neonCyan shrink-0" />
            <span>{t('nav3D')}</span>
          </Link>
          <Link
            href="/#performance-section"
            className="whitespace-nowrap shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 bg-[#0b0f18] border border-white/[0.06]"
          >
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span>{t('navAnalytics')}</span>
          </Link>
          <Link
            href="/match"
            className={`whitespace-nowrap shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all ${
              pathname?.startsWith('/match')
                ? 'font-semibold bg-[#1a2232] text-white border border-white/10'
                : 'font-medium text-slate-300 bg-[#0b0f18] border border-white/[0.06]'
            }`}
          >
            <Swords className="w-3.5 h-3.5 text-neonCyan shrink-0" />
            <span>Thi Đấu</span>
          </Link>
          {isAdmin && (
            <Link
              href="/?view=admin"
              className="whitespace-nowrap shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-amber-400 bg-[#0b0f18] border border-amber-500/25"
            >
              <Shield className="w-3.5 h-3.5 shrink-0" />
              <span>{t('navAdmin')}</span>
            </Link>
          )}
          <Link
            href="/learn/basic"
            className={`whitespace-nowrap shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all ${
              isLearnActive
                ? 'font-semibold bg-[#1a2232] text-white border border-white/10'
                : 'font-medium text-slate-300 bg-[#0b0f18] border border-white/[0.06]'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-neonCyan shrink-0" />
            <span>Học CFOP</span>
          </Link>
        </div>
      </header>
    </>
  );
};
