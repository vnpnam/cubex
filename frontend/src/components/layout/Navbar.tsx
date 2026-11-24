'use client';

import React, { useState } from 'react';
import { useI18nStore } from '@/lib/store/useI18nStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { AuthModal } from './AuthModal';
import {
  Timer,
  BookOpen,
  Box,
  BarChart3,
  Shield,
  Globe,
  User,
  LogOut,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'timer' | 'learn' | '3d' | 'analytics' | 'admin';
  setActiveTab: (tab: 'timer' | 'learn' | '3d' | 'analytics' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { lang, toggleLang, t } = useI18nStore();
  const { user, isAuthenticated, isAdmin, logout } = useAuthStore();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navItems = [
    { id: 'timer' as const, label: t('navTimer'), icon: Timer },
    { id: 'learn' as const, label: t('navLearn'), icon: BookOpen },
    { id: '3d' as const, label: t('nav3D'), icon: Box },
    { id: 'analytics' as const, label: t('navAnalytics'), icon: BarChart3 },
    { id: 'admin' as const, label: t('navAdmin'), icon: Shield }
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full px-4 sm:px-8 py-3 bg-[#070A12]/80 backdrop-blur-2xl border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo / Brand */}
          <div
            onClick={() => setActiveTab('timer')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            {/* Geometric Rubik Icon */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00F0FF] via-[#0088FF] to-[#8A2BE2] p-0.5 shadow-lg shadow-[#00F0FF]/25 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#070A12] rounded-[10px] flex items-center justify-center">
                <div className="grid grid-cols-2 gap-0.5">
                  <span className="w-2 h-2 rounded-[2px] bg-[#00F0FF]" />
                  <span className="w-2 h-2 rounded-[2px] bg-[#FF6B00]" />
                  <span className="w-2 h-2 rounded-[2px] bg-[#00F5A0]" />
                  <span className="w-2 h-2 rounded-[2px] bg-[#FFD700]" />
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-lg font-black tracking-wider text-white flex items-center gap-1 font-mono">
                CUBEX
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
              </span>
              <span className="text-[9px] uppercase tracking-widest text-white/40 font-mono hidden sm:block">
                The Art of Speedcubing
              </span>
            </div>
          </div>

          {/* Navigation Pill Menu (Apple style centered segmented control) */}
          <nav className="hidden md:flex items-center gap-1 p-1 bg-black/40 border border-white/10 rounded-2xl shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-white/15 to-white/10 text-white shadow-md border border-white/15'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#00F0FF]' : 'text-white/50'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: Language switch & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono font-bold text-white/80 hover:text-white hover:border-[#00F0FF]/40 transition-all"
              title="Chuyển đổi Ngôn ngữ / Switch Language"
            >
              <Globe className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span className="uppercase">{lang}</span>
            </button>

            {/* User Profile or Sign In */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-2xl bg-black/40 border border-white/10 hover:border-white/20 transition-all text-xs"
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#00F0FF] to-[#8A2BE2] flex items-center justify-center text-[10px] font-bold text-black">
                    {user.displayName[0].toUpperCase()}
                  </div>
                  <span className="text-white font-medium max-w-[100px] truncate hidden sm:inline">
                    {user.displayName}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-white/50" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#0E131F] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 text-xs animate-fade-in">
                    <div className="px-3 py-2 border-b border-white/5 mb-1">
                      <span className="font-bold text-white block truncate">{user.displayName}</span>
                      <span className="text-[10px] text-white/40 block truncate">{user.email}</span>
                      {isAdmin && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#FF9500]/20 text-[#FF9500] rounded mt-1 inline-block">
                          ADMINISTRATOR
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setActiveTab('admin');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-white/70 hover:text-white hover:bg-white/5 rounded-xl flex items-center gap-2"
                    >
                      <Shield className="w-3.5 h-3.5 text-[#FF9500]" />
                      <span>{t('navAdmin')}</span>
                    </button>

                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-xl flex items-center gap-2 mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t('navLogout')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="px-4 py-1.5 bg-[#00F0FF] text-black font-semibold text-xs rounded-xl hover:bg-[#00F0FF]/90 transition-all shadow-md shadow-[#00F0FF]/20"
              >
                {t('navLogin')}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-around gap-1 pt-2 mt-2 border-t border-white/5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`p-2 rounded-xl flex flex-col items-center gap-1 ${
                  isActive ? 'text-[#00F0FF]' : 'text-white/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[9px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
};
