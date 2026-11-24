'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useI18nStore } from '@/lib/store/useI18nStore';
import { X, Lock, Mail, User, Shield, Zap } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { t } = useI18nStore();
  const { loginAsDemo, loginAsAdmin, setUser } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({
      id: 'user-' + Date.now(),
      email,
      displayName: displayName || email.split('@')[0],
      roles: ['Cubist'],
      preferredLanguage: 'vi',
      themePreference: 'dark'
    }, 'jwt-token-custom');
    onClose();
  };

  const handleDemo = () => {
    loginAsDemo();
    onClose();
  };

  const handleAdmin = () => {
    loginAsAdmin();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-md bg-[#0B0F19] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <span className="text-[11px] font-mono text-[#00F0FF] uppercase tracking-widest block mb-1">
            CUBEX SPEEDCUBING
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {isRegister ? t('authRegisterTitle') : t('authLoginTitle')}
          </h2>
        </div>

        {/* 1-Click Fast Access Buttons (Best for evaluation & demo testing) */}
        <div className="flex flex-col gap-2 mb-6">
          <button
            type="button"
            onClick={handleDemo}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-[#00F0FF]/20 to-[#0088FF]/20 border border-[#00F0FF]/30 text-[#00F0FF] rounded-2xl text-xs font-semibold hover:border-[#00F0FF]/60 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Zap className="w-4 h-4" />
            <span>{t('authQuickDemo')}</span>
          </button>

          <button
            type="button"
            onClick={handleAdmin}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-[#FF9500]/20 to-[#FF6B00]/20 border border-[#FF9500]/30 text-[#FF9500] rounded-2xl text-xs font-semibold hover:border-[#FF9500]/60 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Shield className="w-4 h-4" />
            <span>{t('authAdminDemo')}</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center mb-6">
          <div className="w-full border-t border-white/10" />
          <span className="bg-[#0B0F19] px-3 text-[10px] uppercase font-mono text-white/40 absolute">
            hoặc đăng nhập thủ công
          </span>
        </div>

        {/* Manual Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="text-xs text-white/60 block mb-1">{t('authDisplayName')}</label>
              <div className="relative">
                <User className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Minh Speedcuber"
                  className="w-full pl-9 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-2xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#00F0FF]/50"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-white/60 block mb-1">{t('authEmail')}</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cubist@cubex.com"
                className="w-full pl-9 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-2xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#00F0FF]/50"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-white/60 block mb-1">{t('authPassword')}</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-2xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#00F0FF]/50"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#00F0FF] text-black font-semibold text-xs rounded-2xl hover:bg-[#00F0FF]/90 transition-all shadow-lg shadow-[#00F0FF]/25 mt-2"
          >
            {isRegister ? t('authSubmitRegister') : t('authSubmitLogin')}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-white/50 hover:text-white transition-colors"
          >
            {isRegister ? t('authHaveAccount') : t('authNoAccount')}
          </button>
        </div>
      </div>
    </div>
  );
};
