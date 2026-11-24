'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Award,
  Zap,
  TrendingDown,
  Sparkles,
  RotateCcw,
  Check,
  Share2,
  X,
  Flame,
  ArrowRight
} from 'lucide-react';

interface SolveCelebrationProps {
  isOpen: boolean;
  timeMs: number;
  rawTimeMs: number;
  penalty: 'None' | 'PlusTwo' | 'DNF';
  isPb: boolean;
  ao5: number | null;
  ao12: number | null;
  scramble: string;
  onClose: () => void;
  onNextScramble: () => void;
  onUpdatePenalty: (penalty: 'None' | 'PlusTwo' | 'DNF') => void;
}

export const SolveCelebration: React.FC<SolveCelebrationProps> = ({
  isOpen,
  timeMs,
  rawTimeMs,
  penalty,
  isPb,
  ao5,
  ao12,
  scramble,
  onClose,
  onNextScramble,
  onUpdatePenalty
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Trigger multi-stage cinematic confetti cannon blast
    if (isPb) {
      // Massive Golden Victory Fountain
      const end = Date.now() + 1200;
      const colors = ['#FFD700', '#FFA500', '#00F0FF', '#FFFFFF', '#00F5A0'];

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    } else {
      // Sleek Cyber Starburst
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#00F0FF', '#00F5A0', '#8A2BE2', '#FFFFFF']
      });
    }
  }, [isOpen, isPb]);

  if (!isOpen) return null;

  const formatSeconds = (ms: number) => (ms / 1000).toFixed(2);
  const diffAo5 = ao5 ? (timeMs - ao5) / 1000 : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
        {/* Backdrop with animated blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/85 backdrop-blur-2xl"
        />

        {/* Shockwave Blast Ring Animation */}
        <motion.div
          initial={{ scale: 0.3, opacity: 1 }}
          animate={{ scale: 2.8, opacity: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className={`absolute w-72 h-72 rounded-full border-2 pointer-events-none ${
            isPb
              ? 'border-[#FFD700] shadow-[0_0_80px_#FFD700]'
              : 'border-[#00F0FF] shadow-[0_0_80px_#00F0FF]'
          }`}
        />

        {/* Ambient Center Glow */}
        <div
          className={`absolute w-96 h-96 rounded-full blur-[120px] pointer-events-none ${
            isPb ? 'bg-[#FFD700]/25' : 'bg-[#00F0FF]/20'
          }`}
        />

        {/* Main Floating Glass HUD Card */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative z-10 w-full max-w-lg bg-[#0E131F]/90 backdrop-blur-3xl border border-white/15 rounded-[32px] p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.8)] overflow-hidden text-center flex flex-col items-center"
        >
          {/* Top Decorative Cyber Lightbar */}
          <div
            className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
              isPb
                ? 'from-transparent via-[#FFD700] to-transparent shadow-[0_0_20px_#FFD700]'
                : 'from-transparent via-[#00F0FF] to-transparent shadow-[0_0_20px_#00F0FF]'
            }`}
          />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badge: New PB or Fast Solve */}
          {isPb ? (
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring' }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFD700]/20 border border-[#FFD700]/50 text-[#FFD700] text-xs font-mono font-bold tracking-wider mb-3 shadow-[0_0_20px_rgba(255,215,0,0.3)]"
            >
              <Award className="w-4 h-4 fill-current" />
              <span>🏆 KỶ LỤC CÁ NHÂN MỚI (NEW PB!)</span>
            </motion.div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/10 text-[#00F0FF] text-xs font-mono font-medium tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>HOÀN THÀNH LƯỢT GIẢI</span>
            </div>
          )}

          {/* Massive Time Digits with Atmospheric Glow */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
            className={`font-mono font-black tracking-tight text-6xl sm:text-7xl md:text-8xl my-2 tabular-nums ${
              isPb
                ? 'text-[#FFD700] drop-shadow-[0_0_40px_rgba(255,215,0,0.6)]'
                : 'text-white drop-shadow-[0_0_35px_rgba(0,240,255,0.5)]'
            }`}
          >
            {penalty === 'DNF' ? 'DNF' : formatSeconds(timeMs)}
            <span className="text-2xl sm:text-3xl font-bold ml-1 text-white/40">s</span>
          </motion.div>

          {/* Micro Comparisons & Stats Pill */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 my-4">
            {diffAo5 !== null && (
              <span
                className={`text-xs font-mono font-semibold px-3 py-1 rounded-full border ${
                  diffAo5 <= 0
                    ? 'bg-[#00F5A0]/10 border-[#00F5A0]/30 text-[#00F5A0]'
                    : 'bg-[#FF9500]/10 border-[#FF9500]/30 text-[#FF9500]'
                }`}
              >
                {diffAo5 <= 0 ? `${diffAo5.toFixed(2)}s so với Ao5` : `+${diffAo5.toFixed(2)}s so với Ao5`}
              </span>
            )}

            {ao5 && (
              <span className="text-xs font-mono text-white/50 px-3 py-1 rounded-full bg-black/40 border border-white/5">
                Ao5: <strong className="text-white">{formatSeconds(ao5)}s</strong>
              </span>
            )}

            {ao12 && (
              <span className="text-xs font-mono text-white/50 px-3 py-1 rounded-full bg-black/40 border border-white/5">
                Ao12: <strong className="text-white">{formatSeconds(ao12)}s</strong>
              </span>
            )}
          </div>

          {/* Penalty Adjusters (+2 / DNF) */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs font-mono text-white/40 mr-1">Hình Phạt:</span>
            <button
              onClick={() => onUpdatePenalty(penalty === 'None' ? 'None' : 'None')}
              className={`px-3 py-1 rounded-xl text-xs font-mono border transition-all ${
                penalty === 'None'
                  ? 'bg-white/20 border-white/40 text-white font-bold'
                  : 'bg-black/30 border-white/5 text-white/40 hover:text-white'
              }`}
            >
              Hợp Lệ (OK)
            </button>
            <button
              onClick={() => onUpdatePenalty(penalty === 'PlusTwo' ? 'None' : 'PlusTwo')}
              className={`px-3 py-1 rounded-xl text-xs font-mono border transition-all ${
                penalty === 'PlusTwo'
                  ? 'bg-[#FF9500] border-[#FF9500] text-black font-bold'
                  : 'bg-black/30 border-white/5 text-white/40 hover:text-white'
              }`}
            >
              +2 Giây
            </button>
            <button
              onClick={() => onUpdatePenalty(penalty === 'DNF' ? 'None' : 'DNF')}
              className={`px-3 py-1 rounded-xl text-xs font-mono border transition-all ${
                penalty === 'DNF'
                  ? 'bg-[#FF3B30] border-[#FF3B30] text-white font-bold'
                  : 'bg-black/30 border-white/5 text-white/40 hover:text-white'
              }`}
            >
              DNF
            </button>
          </div>

          {/* Scramble Snapshot */}
          <div className="w-full p-3.5 bg-black/50 border border-white/5 rounded-2xl text-left mb-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono uppercase text-white/40">Scramble Lần Này</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(scramble);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="text-[10px] font-mono text-[#00F0FF] hover:underline flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-[#00F5A0]" /> : 'Sao chép'}
              </button>
            </div>
            <p className="text-xs font-mono text-white/70 tracking-wide line-clamp-2 select-all">
              {scramble}
            </p>
          </div>

          {/* Big CTA Action Button */}
          <button
            onClick={() => {
              onNextScramble();
              onClose();
            }}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#00F0FF] to-[#0088FF] text-black font-extrabold text-sm hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(0,240,255,0.4)]"
          >
            <span>LƯỢT GIẢI TIẾP THEO</span>
            <kbd className="px-2 py-0.5 bg-black/20 rounded text-[11px] font-mono font-normal">
              SPACE
            </kbd>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
