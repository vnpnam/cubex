'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Search, Star, Play, Pause, X, RotateCcw,
  BookOpen, Dumbbell, AlertCircle, CheckCircle2, Timer, RefreshCw
} from 'lucide-react';
import { INITIAL_ALGORITHMS, AlgorithmItem } from '@/lib/data/algorithmsData';
import { Navbar } from '@/components/layout/Navbar';
import { F2LCaseDiagram } from '@/components/learn/F2LCaseDiagram';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useLearnProgressStore } from '@/lib/store/useLearnProgressStore';

/* ─── Data ─── */
const F2L_CASES = INITIAL_ALGORITHMS.filter((a) => a.category === 'F2L');
const NAV_PAGES = ['basic', 'cross', 'f2l', 'oll', 'pll'] as const;

const KHO_KAN: Record<string, string> = {
  Beginner: 'Cơ bản',
  Intermediate: 'Trung cấp',
  Advanced: 'Nâng cao',
};

/* ─── Dịch tên tiếng Anh → tiếng Việt ─── */
const VI_NAME: Record<string, string> = {
  'Easy Right Slot Insert': 'Chèn Khe Phải Cơ Bản',
  'Easy Left Slot Insert': 'Chèn Khe Trái Cơ Bản',
  'Opposite Colors on Top': 'Màu Đối Diện Trên Đỉnh',
  'Corner White Up & Edge Free': 'Góc Trắng Lên & Cạnh Tự Do',
  'T-Shape 1 (Sexy + Sledge)': 'Hình T 1 (Sexy + Búa)',
  'T-Shape 2': 'Hình T 2',
  'Cross H-Shape': 'Hình Thập H',
  'Runway Dot': 'Chấm Giữa',
  'T-Permutation': 'Hoán Vị T',
  'Y-Permutation': 'Hoán Vị Y',
  'Ua-Permutation': 'Hoán Vị Ua',
  'Ub-Permutation': 'Hoán Vị Ub',
  'H-Permutation': 'Hoán Vị H',
  'Z-Permutation': 'Hoán Vị Z',
  'Jb-Permutation': 'Hoán Vị Jb',
  'Ja-Permutation': 'Hoán Vị Ja',
  'White Cross Orientation': 'Định Hướng Dấu Thập Trắng',
  'The Sexy Move': 'Nước Sexy',
  'Right Edge Insertion': 'Chèn Cạnh Phải',
  'Left Edge Insertion': 'Chèn Cạnh Trái',
  "F-Sexy-F' (FRUR'U'F')": 'F-Sexy-F\'',
  'Sune (Yellow Face)': 'Sune (Mặt Vàng)',
  'Direct 4-Move Cross': 'Dấu Thập 4 Nước Trực Tiếp',
  'Opposite Cross (Yellow/White)': 'Dấu Thập Đối Diện (Vàng/Trắng)',
};

const VI_SUB: Record<string, string> = {
  'Basic Inserts': 'Chèn Cơ Bản',
  'Corner in U & Edge in U': 'Góc và Cạnh trên U',
  'White Facing Up': 'Trắng Hướng Lên',
  'Corner in Slot & Edge in U': 'Góc trong Khe & Cạnh trên U',
  'Corner in U & Edge in Slot': 'Góc trên U & Cạnh trong Khe',
  'Both in Slot': 'Cả Hai trong Khe',
  'T-Shapes': 'Hình T',
  'All Corners Oriented': 'Tất Cả Góc Đúng Hướng',
  'Dot Cases': 'Trường Hợp Chấm',
  'Adjacent Swaps': 'Hoán Vị Liền Kề',
  'Diagonal Swaps': 'Hoán Vị Chéo',
  'Edges Only': 'Chỉ Cạnh',
  'Daisy & White Cross': 'Hoa Cúc & Dấu Thập Trắng',
  'First Layer Corners': 'Góc Tầng Một',
  'Second Layer Edges': 'Cạnh Tầng Hai',
  'Yellow Cross': 'Dấu Thập Vàng',
  'Last Layer Corners': 'Góc Tầng Cuối',
  'Inspection & Planning': 'Nhận Xét & Lập Kế Hoạch',
  'Color Neutrality': 'Trung Lập Màu',
};

function viName(name: string) { return VI_NAME[name] ?? name; }
function viSub(sub: string) { return VI_SUB[sub] ?? sub; }

function khoKhan(d: string) {
  return KHO_KAN[d] ?? d;
}

function khoKhanClass(d: string) {
  if (d === 'Beginner') return 'bg-green-500/15 border-green-500/25 text-green-400';
  if (d === 'Intermediate') return 'bg-yellow-500/15 border-yellow-500/25 text-yellow-400';
  return 'bg-red-500/15 border-red-500/25 text-red-400';
}

function generateScramble(): string {
  const faces = ['R', 'L', 'U', 'D', 'F', 'B'];
  const sfx = ['', "'", '2'];
  const result: string[] = [];
  let last = '';
  for (let i = 0; i < 20; i++) {
    let f = faces[Math.floor(Math.random() * 6)];
    while (f === last) f = faces[Math.floor(Math.random() * 6)];
    last = f;
    result.push(f + sfx[Math.floor(Math.random() * 3)]);
  }
  return result.join(' ');
}

/* ─── Move chips ─── */
function MoveChips({ notation, highlight }: { notation: string; highlight?: boolean }) {
  const moves = notation.split(' ').filter(Boolean);
  return (
    <div className="flex flex-wrap gap-1.5">
      {moves.map((m, i) => (
        <span
          key={i}
          className={`px-2 py-0.5 text-[10px] font-mono rounded-md font-bold border ${
            highlight
              ? 'bg-[#64D9FF]/20 border-[#64D9FF]/40 text-[#64D9FF]'
              : 'bg-white/5 border-white/10 text-white/80'
          }`}
        >
          {m}
        </span>
      ))}
    </div>
  );
}

/* ─── Case card ─── */
function CaseCard({ alg, onClick }: { alg: AlgorithmItem; onClick: () => void }) {
  const userId = useAuthStore((s) => s.user?.id) || 'guest';
  const learned = useLearnProgressStore((s) => s.isMastered(userId, alg.code));
  const toggleMastered = useLearnProgressStore((s) => s.toggleMastered);

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer group flex flex-col gap-2.5 p-3.5 bg-[#0B0F19]/90 border rounded-2xl hover:border-[#00e5ff]/50 hover:bg-[#0E1424] hover:shadow-[0_8px_30px_rgba(0,229,255,0.12)] transition-all text-left w-full ${
        learned ? 'border-emerald-500/40' : 'border-white/10'
      }`}
    >
      {/* Isometric 3D F2L Diagram matching the exact algorithm */}
      <div className="w-full aspect-square rounded-xl relative flex items-center justify-center bg-[#121622] border border-white/[0.04] group-hover:scale-[1.03] transition-transform">
        <F2LCaseDiagram alg={alg.notation} size={156} />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleMastered(userId, alg.code);
          }}
          title={learned ? 'Đã thuộc (Nhấn để bỏ đánh dấu)' : 'Đánh dấu đã thuộc'}
          className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all ${
            learned
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'bg-black/50 text-white/40 hover:text-white border border-white/10'
          }`}
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>{learned ? 'Đã thuộc' : 'Học'}</span>
        </button>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 px-0.5">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] font-bold text-[#00e5ff] font-mono">{alg.code}</span>
          <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${khoKhanClass(alg.difficulty)}`}>
            {khoKhan(alg.difficulty)}
          </span>
        </div>
        <p className="text-xs font-bold text-white leading-tight truncate">{viName(alg.name)}</p>
        <p className="text-[11px] text-[#00e5ff]/90 font-mono font-semibold leading-snug break-words">{alg.notation}</p>
      </div>
    </div>
  );
}

/* ─── Case popup ─── */
function CasePopup({ alg, onClose }: { alg: AlgorithmItem; onClose: () => void }) {
  const moves = useMemo(() => alg.notation.replace(/[()]/g, ' ').trim().split(/\s+/).filter(Boolean), [alg.notation]);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setStep((prev) => {
        if (prev >= moves.length) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 550);
    return () => clearInterval(id);
  }, [playing, moves.length]);

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
    } else {
      if (step >= moves.length) setStep(0);
      setPlaying(true);
    }
  };

  const resetAnim = () => {
    setPlaying(false);
    setStep(0);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-[#0A0F1E] border border-white/10 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3 sticky top-0 bg-[#0A0F1E] z-10 border-b border-white/5">
          <div>
            <h2 className="text-base font-bold text-white">{viName(alg.name)}</h2>
            <p className="text-xs text-white/40 font-mono mt-0.5">{alg.code} · {viSub(alg.subCategory)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-xl transition-colors mt-0.5">
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        {/* 3D Step-by-Step Diagram Viewer */}
        <div className="mx-5 my-4 py-4 bg-[#060A14] rounded-2xl flex flex-col items-center justify-center border border-white/5 relative gap-3">
          <F2LCaseDiagram alg={alg.notation} stepCount={step} size={185} />

          {/* Step progress & playback controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={resetAnim}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
              title="Đặt lại trạng thái đầu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setPlaying(false);
                setStep((s) => Math.max(0, s - 1));
              }}
              disabled={step === 0}
              className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-xs font-mono text-white"
            >
              ◀
            </button>
            <button
              onClick={togglePlay}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#00e5ff] text-black text-xs font-bold rounded-xl hover:bg-[#33ecff] transition-all shadow-lg"
            >
              {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
              {playing ? 'Tạm dừng' : step >= moves.length ? 'Chạy lại' : 'Chạy thử'}
            </button>
            <button
              onClick={() => {
                setPlaying(false);
                setStep((s) => Math.min(moves.length, s + 1));
              }}
              disabled={step >= moves.length}
              className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-xs font-mono text-white"
            >
              ▶
            </button>
            <span className="text-[11px] font-mono text-white/50 ml-1">
              {step}/{moves.length}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 pb-5 flex flex-col gap-4">
          {/* Main alg with active step highlight */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] text-white/40 font-mono uppercase tracking-wider">Công thức chính (Nhấn vào bước để xem)</p>
            <div className="font-mono text-sm text-white tracking-wide">{alg.notation}</div>
            <div className="flex flex-wrap gap-1.5">
              {moves.map((m, i) => {
                const isDone = i < step;
                const isCurrent = i === step - 1;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setPlaying(false);
                      setStep(i + 1);
                    }}
                    className={`px-2.5 py-1 text-xs font-mono rounded-lg font-bold border transition-all ${
                      isCurrent
                        ? 'bg-[#00e5ff] border-[#00e5ff] text-black scale-105 shadow-md shadow-[#00e5ff]/30'
                        : isDone
                        ? 'bg-[#00e5ff]/20 border-[#00e5ff]/40 text-[#00e5ff]'
                        : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Alt alg */}
          {alg.alternativeNotation && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] text-white/40 font-mono uppercase tracking-wider">Thay thế</p>
              <div className="font-mono text-xs text-white/70 tracking-wide">{alg.alternativeNotation}</div>
              <MoveChips notation={alg.alternativeNotation} />
            </div>
          )}

          {/* Tip */}
          <div className="bg-white/3 border border-white/5 rounded-xl px-3 py-2.5">
            <p className="text-[11px] text-white/55 italic leading-relaxed">{alg.executionTipVi}</p>
          </div>

          {/* Description */}
          <p className="text-xs text-white/50 leading-relaxed">{alg.descriptionVi}</p>

          {/* Actions row */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                playing
                  ? 'bg-[#64D9FF]/15 border border-[#64D9FF]/30 text-[#64D9FF]'
                  : 'bg-[#1A6B3C] border border-[#1D7D47]/50 text-white hover:bg-[#1D7D47]'
              }`}
            >
              {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {playing ? 'Đang chạy' : 'Chạy thử'}
            </button>
            <span className={`px-2.5 py-1.5 rounded-xl text-[10px] font-mono border ${khoKhanClass(alg.difficulty)}`}>
              {khoKhan(alg.difficulty)}
            </span>
          </div>

          {/* Feedback */}
          {showFeedback ? (
            <div className="flex flex-col gap-2">
              {feedbackSent ? (
                <p className="text-xs text-green-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã gửi báo cáo. Cảm ơn!
                </p>
              ) : (
                <>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Mô tả lỗi công thức..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-red-400/30 resize-none h-16"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowFeedback(false)} className="flex-1 py-1.5 bg-white/5 rounded-xl text-xs text-white/50 hover:bg-white/10">Hủy</button>
                    <button
                      onClick={() => { setFeedbackSent(true); setShowFeedback(false); }}
                      className="flex-1 py-1.5 bg-red-500/20 border border-red-500/30 rounded-xl text-xs text-red-400 font-semibold hover:bg-red-500/30"
                    >
                      Gửi báo cáo
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : !feedbackSent ? (
            <button
              onClick={() => setShowFeedback(true)}
              className="flex items-center gap-1.5 text-xs text-white/30 hover:text-red-400 transition-colors"
            >
              <AlertCircle className="w-3 h-3" /> Báo lỗi công thức
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ─── Practice tab ─── */
function PracticeTab() {
  const [caseIndex, setCaseIndex] = useState(0);
  const currentCase = F2L_CASES[caseIndex] || F2L_CASES[0];
  const [scramble, setScramble] = useState('');
  const [timerMs, setTimerMs] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [pb, setPb] = useState<number | null>(null);
  const [splits, setSplits] = useState<number[]>([]);
  const startRef = useRef(0);

  useEffect(() => {
    setScramble(generateScramble());
  }, []);

  useEffect(() => {
    if (!timerRunning) return;
    startRef.current = Date.now() - timerMs;
    const id = setInterval(() => setTimerMs(Date.now() - startRef.current), 10);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerRunning]);

  const newScramble = () => {
    setScramble(generateScramble());
    setCaseIndex(Math.floor(Math.random() * F2L_CASES.length));
    setTimerMs(0);
    setTimerRunning(false);
  };

  const handleToggle = useCallback(() => {
    if (timerRunning) {
      const t = timerMs;
      setTimerRunning(false);
      setSessionCount((c) => c + 1);
      setSplits((s) => [t, ...s].slice(0, 15));
      if (!pb || t < pb) setPb(t);
    } else {
      setTimerMs(0);
      setTimerRunning(true);
    }
  }, [timerRunning, timerMs, pb]);

  const fmtTime = (ms: number) =>
    `${Math.floor(ms / 1000)}.${String(Math.floor((ms % 1000) / 10)).padStart(2, '0')}`;

  const avg = splits.length > 0
    ? Math.round(splits.reduce((a, b) => a + b, 0) / splits.length)
    : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Scramble bar */}
      <div className="bg-[#0B0F19]/80 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-white/40 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#64D9FF]" /> Scramble
          </span>
          <button
            onClick={newScramble}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#64D9FF]/10 hover:bg-[#64D9FF]/20 border border-[#64D9FF]/20 rounded-xl text-xs text-[#64D9FF] font-semibold transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Tạo mới
          </button>
        </div>
        <div className="font-mono text-white text-sm tracking-wide px-3 py-2.5 bg-black/30 rounded-xl overflow-x-auto whitespace-nowrap select-all border border-white/5">
          {scramble}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* 3D live cube + timer */}
        <div className="flex-1 bg-[#0B0F19]/80 border border-white/10 rounded-2xl flex flex-col items-center gap-4 p-5">
          <div className="w-full flex flex-col items-center justify-center rounded-xl bg-[#0D1117] py-4 gap-2">
            <F2LCaseDiagram alg={currentCase.notation} size={210} />
            <div className="text-center">
              <span className="text-xs font-mono font-bold text-[#00e5ff]">{currentCase.code} — {currentCase.name}</span>
              <p className="text-xs font-mono text-white/60 mt-0.5">Gợi ý: {currentCase.notation}</p>
            </div>
          </div>

          {/* Timer */}
          <div
            className="text-6xl font-black font-mono text-white tabular-nums cursor-pointer select-none"
            onClick={handleToggle}
          >
            {fmtTime(timerMs)}
          </div>
          <p className="text-xs text-white/40">
            {timerRunning ? 'Nhấn để dừng' : 'Nhấn để bắt đầu'}
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={handleToggle}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                timerRunning
                  ? 'bg-red-500 shadow-red-500/25 hover:bg-red-600'
                  : 'bg-[#64D9FF] shadow-[#64D9FF]/25 hover:bg-[#64D9FF]/90'
              }`}
            >
              {timerRunning
                ? <Pause className="w-6 h-6 text-white" />
                : <Play className="w-6 h-6 text-black ml-0.5" />}
            </button>
            <button
              onClick={() => { setTimerMs(0); setTimerRunning(false); }}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-white/50" />
            </button>
          </div>
        </div>

        {/* Stats + splits */}
        <div className="w-full lg:w-72 bg-[#0B0F19]/80 border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Timer className="w-4 h-4 text-[#64D9FF]" /> Thống kê phiên
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/30 rounded-xl p-3">
              <p className="text-[9px] text-white/40 mb-1 uppercase tracking-wider">Số lần</p>
              <p className="text-2xl font-bold text-white">{sessionCount}</p>
            </div>
            <div className="bg-black/30 rounded-xl p-3">
              <p className="text-[9px] text-white/40 mb-1 uppercase tracking-wider">PB</p>
              <p className="text-2xl font-bold text-[#64D9FF]">{pb ? fmtTime(pb) : '—'}</p>
            </div>
          </div>
          <div className="bg-black/30 rounded-xl p-3">
            <p className="text-[9px] text-white/40 mb-1 uppercase tracking-wider">Trung bình</p>
            <p className="text-2xl font-bold text-white">{avg ? fmtTime(avg) : '—'}</p>
          </div>

          {splits.length > 0 && (
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
              <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Lịch sử</p>
              {splits.map((s, i) => (
                <div key={i} className="flex justify-between text-xs font-mono px-1">
                  <span className="text-white/30">#{sessionCount - i}</span>
                  <span className={s === pb ? 'text-[#64D9FF] font-bold' : 'text-white/60'}>
                    {fmtTime(s)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ─── */
export default function F2LPage() {
  const [activeTab, setActiveTab] = useState<'formula' | 'practice'>('formula');
  const [search, setSearch] = useState('');
  const [selectedCase, setSelectedCase] = useState<AlgorithmItem | null>(null);

  const filteredCases = useMemo(() =>
    F2L_CASES.filter((a) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        a.notation.toLowerCase().includes(q)
      );
    }),
    [search]
  );

  return (
    <div className="min-h-screen bg-[#070A12] text-white">
      <div className="fixed -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#64D9FF]/8 to-transparent blur-[120px] pointer-events-none" />

      {/* Main Global Taskbar */}
      <Navbar activeTab="learn" />

      {/* Sub-header for CFOP step & Formula/Practice tabs */}
      <div className="bg-[#080c15]/90 backdrop-blur-xl border-b border-white/[0.08] px-3.5 sm:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar max-w-full">
            <span className="text-xs font-mono text-white/40 uppercase tracking-wider shrink-0">Học CFOP:</span>
            <nav className="flex items-center gap-1 shrink-0">
              {NAV_PAGES.map((page) => (
                <Link
                  key={page}
                  href={`/learn/${page}`}
                  className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${
                    page === 'f2l'
                      ? 'bg-[#00e5ff] text-black shadow-md shadow-[#00e5ff]/25'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {page === 'basic' ? 'Cơ bản' : page === 'cross' ? 'Cross' : page === 'f2l' ? 'F2L' : page === 'oll' ? 'OLL' : 'PLL'}
                </Link>
              ))}
            </nav>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center gap-1 p-1 bg-black/40 border border-white/10 rounded-2xl">
            <button
              onClick={() => setActiveTab('formula')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'formula'
                  ? 'bg-[#00e5ff] text-black'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Công thức
            </button>
            <button
              onClick={() => setActiveTab('practice')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'practice'
                  ? 'bg-[#00e5ff] text-black'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" /> Luyện tập
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
        {activeTab === 'formula' && (
          <div className="flex flex-col gap-5">
            {/* Search */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm trường hợp, nước đi..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-[#64D9FF]/30"
                />
              </div>
              <span className="text-xs text-white/30">{filteredCases.length} kết quả</span>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {filteredCases.map((alg) => (
                <CaseCard key={alg.id} alg={alg} onClick={() => setSelectedCase(alg)} />
              ))}
              {filteredCases.length === 0 && (
                <div className="col-span-full text-center py-12 text-white/30 text-sm">
                  Không tìm thấy case nào.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'practice' && <PracticeTab />}
      </main>

      {selectedCase && (
        <CasePopup alg={selectedCase} onClose={() => setSelectedCase(null)} />
      )}
    </div>
  );
}
