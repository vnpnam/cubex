'use client';

import React, { useState } from 'react';
import { AlgorithmItem } from '@/lib/data/algorithmsData';
import { useI18nStore } from '@/lib/store/useI18nStore';
import { InteractiveCube } from '../3d/InteractiveCube';
import confetti from 'canvas-confetti';
import {
  X,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Bookmark,
  Share2,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';

interface AlgorithmModalProps {
  algorithm: AlgorithmItem | null;
  onClose: () => void;
  onUpdateStatus: (id: number, status: 'Learning' | 'Practicing' | 'Mastered', timeMs?: number) => void;
}

export const AlgorithmModal: React.FC<AlgorithmModalProps> = ({
  algorithm,
  onClose,
  onUpdateStatus
}) => {
  const { lang, t } = useI18nStore();
  const [practiceTime, setPracticeTime] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);

  if (!algorithm) return null;

  const desc = lang === 'vi' ? algorithm.descriptionVi : algorithm.descriptionEn;
  const tip = lang === 'vi' ? algorithm.executionTipVi : algorithm.executionTipEn;

  const handleStatusChange = (status: 'Learning' | 'Practicing' | 'Mastered') => {
    if (status === 'Mastered') {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.5 }
      });
    }
    onUpdateStatus(algorithm.id, status);
  };

  const handleSavePracticeTime = (e: React.FormEvent) => {
    e.preventDefault();
    const sec = parseFloat(practiceTime);
    if (!isNaN(sec) && sec > 0) {
      const ms = Math.round(sec * 1000);
      onUpdateStatus(algorithm.id, algorithm.userStatus || 'Practicing', ms);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
      setPracticeTime('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-4xl bg-[#0B0F19] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[92vh]">
        {/* Left: 3D Cube Viewer */}
        <div className="w-full md:w-1/2 bg-black/40 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5 relative min-h-[380px]">
          <div className="absolute top-4 left-4 z-10">
            <span className="text-[11px] font-mono uppercase tracking-widest px-3 py-1 bg-white/10 text-[#00F0FF] rounded-full border border-white/5">
              {algorithm.code}
            </span>
          </div>

          <InteractiveCube
            algorithm={algorithm.notation}
            setupMoves={algorithm.setupMoves}
            autoPlay={false}
            interactive={true}
            className="w-full h-full"
          />
        </div>

        {/* Right: Algorithm Info, Triggers & Practice Controls */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="text-xs font-mono font-semibold text-[#00F0FF] uppercase tracking-wider block mb-1">
                  {algorithm.category} • {algorithm.subCategory}
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  {algorithm.name}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notation Box (Apple style high-contrast) */}
            <div className="p-4 bg-black/50 border border-white/10 rounded-2xl mb-5">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-1.5">
                {t('triggerBreakdown')}
              </span>
              <p className="text-xl md:text-2xl font-mono font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-[#00F0FF]">
                {algorithm.notation}
              </p>
              {algorithm.alternativeNotation && (
                <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-2">
                  <span className="text-[10px] font-mono text-white/40 uppercase">{t('alternativeAlgorithm')}:</span>
                  <span className="text-xs font-mono text-[#FF9500]">{algorithm.alternativeNotation}</span>
                </div>
              )}
            </div>

            {/* Description & Fingertrick execution tip */}
            <div className="space-y-4 mb-6">
              <div>
                <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">
                  Mô tả / Breakdown
                </h4>
                <p className="text-sm text-white/80 leading-relaxed">{desc}</p>
              </div>

              <div className="p-3.5 bg-[#00F0FF]/5 border border-[#00F0FF]/20 rounded-2xl flex items-start gap-3">
                <Zap className="w-5 h-5 text-[#00F0FF] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-[#00F0FF] uppercase tracking-wider mb-0.5">
                    Fingertrick Tip
                  </h4>
                  <p className="text-xs text-white/90 leading-relaxed">{tip}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions: Mastery & Practice drill */}
          <div className="pt-4 border-t border-white/10 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => handleStatusChange('Learning')}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  algorithm.userStatus === 'Learning'
                    ? 'bg-white/15 border-white/40 text-white'
                    : 'bg-white/5 border-white/5 text-white/50 hover:text-white'
                }`}
              >
                {t('statusLearning')}
              </button>

              <button
                onClick={() => handleStatusChange('Practicing')}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  algorithm.userStatus === 'Practicing'
                    ? 'bg-[#FF9500]/20 border-[#FF9500]/50 text-[#FF9500]'
                    : 'bg-white/5 border-white/5 text-white/50 hover:text-white'
                }`}
              >
                {t('statusPracticing')}
              </button>

              <button
                onClick={() => handleStatusChange('Mastered')}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  algorithm.userStatus === 'Mastered'
                    ? 'bg-[#00F5A0]/20 border-[#00F5A0]/50 text-[#00F5A0]'
                    : 'bg-white/5 border-white/5 text-white/50 hover:text-white'
                }`}
              >
                {t('statusMastered')}
              </button>
            </div>

            {/* Fast Execution Drill Input */}
            <form onSubmit={handleSavePracticeTime} className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.01"
                  value={practiceTime}
                  onChange={(e) => setPracticeTime(e.target.value)}
                  placeholder="Ghi nhận tốc độ drill (giây, vd 0.85)..."
                  className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#00F0FF]/50"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-[#00F0FF] text-black font-semibold text-xs rounded-xl hover:bg-[#00F0FF]/90 transition-all shrink-0 shadow-md shadow-[#00F0FF]/20"
              >
                {isSaved ? 'Đã Lưu!' : 'Lưu PB Drill'}
              </button>
            </form>

            {algorithm.personalBestTimeMs && (
              <div className="flex items-center justify-between text-xs text-white/50 pt-1">
                <span className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#FFD700]" />
                  Best Drill: <strong className="text-white">{(algorithm.personalBestTimeMs / 1000).toFixed(2)}s</strong>
                </span>
                <span>Đã luyện: <strong className="text-white">{algorithm.practiceCount || 0} lần</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
