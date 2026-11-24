'use client';

import React from 'react';
import { useI18nStore } from '@/lib/store/useI18nStore';
import { Box, Heart, Sparkles, Keyboard, Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useI18nStore();

  return (
    <footer className="w-full mt-16 border-t border-white/5 bg-[#05070C] text-white/50 text-xs py-10 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <Box className="w-4 h-4 text-[#00F0FF]" />
          </div>
          <div>
            <span className="font-mono font-bold text-white text-sm">CUBEX</span>
            <p className="text-[11px] text-white/40">The Art of Speedcubing • WCA Standard Ready</p>
          </div>
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono text-white/40">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/80">SPACE</kbd> Bấm giờ
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/80">U, D, L, R, F, B</kbd> Xoay khối 3D
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/80">SHIFT + Phím</kbd> Nghịch đảo (')
          </span>
        </div>

        <div className="text-right text-[11px] text-white/40">
          Thiết kế & phát triển với Next.js, Three.js & .NET 10 Web API
        </div>
      </div>
    </footer>
  );
};
