'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Search, Star, X, Play, Pause, RotateCcw,
  BookOpen, Dumbbell, AlertCircle, CheckCircle2, Timer, RefreshCw, Flag
} from 'lucide-react';
import { INITIAL_ALGORITHMS, AlgorithmItem } from '@/lib/data/algorithmsData';
import { Navbar } from '@/components/layout/Navbar';
import { PLLCaseDiagram } from '@/components/learn/PLLCaseDiagram';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useLearnProgressStore } from '@/lib/store/useLearnProgressStore';

const PLL_CASES = INITIAL_ALGORITHMS.filter((a) => a.category === 'PLL').sort((a, b) => a.orderIndex - b.orderIndex);
const NAV_PAGES = ['basic', 'cross', 'f2l', 'oll', 'pll'] as const;

const KHO_KAN: Record<string, string> = {
  Beginner: 'Cơ bản',
  Intermediate: 'Trung cấp',
  Advanced: 'Nâng cao',
};
function khoKhan(d: string) { return KHO_KAN[d] ?? d; }
function khoKhanClass(d: string) {
  if (d === 'Beginner') return 'bg-green-500/15 border-green-500/25 text-green-400';
  if (d === 'Intermediate') return 'bg-yellow-500/15 border-yellow-500/25 text-yellow-400';
  return 'bg-red-500/15 border-red-500/25 text-red-400';
}

/* ─── Dịch tên tiếng Anh → tiếng Việt ─── */
const VI_NAME: Record<string, string> = {
  'T-Permutation': 'Hoán Vị T',
  'Y-Permutation': 'Hoán Vị Y',
  'Ua-Permutation': 'Hoán Vị Ua',
  'Ub-Permutation': 'Hoán Vị Ub',
  'H-Permutation': 'Hoán Vị H',
  'Z-Permutation': 'Hoán Vị Z',
  'Jb-Permutation': 'Hoán Vị Jb',
  'Ja-Permutation': 'Hoán Vị Ja',
  'Easy Right Slot Insert': 'Chèn Khe Phải Cơ Bản',
  'Easy Left Slot Insert': 'Chèn Khe Trái Cơ Bản',
};

const VI_SUB: Record<string, string> = {
  'Adjacent Swaps': 'Hoán Vị Liền Kề',
  'Diagonal Swaps': 'Hoán Vị Chéo',
  'Edges Only': 'Chỉ Cạnh',
  'T-Shapes': 'Hình T',
  'All Corners Oriented': 'Tất Cả Góc Đúng Hướng',
  'Dot Cases': 'Trường Hợp Chấm',
  'Basic Inserts': 'Chèn Cơ Bản',
};

function viName(name: string) { return VI_NAME[name] ?? name; }
function viSub(sub: string) { return VI_SUB[sub] ?? sub; }

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

function MoveChips({ notation, highlight }: { notation: string; highlight?: boolean }) {
  const moves = notation.split(' ').filter(Boolean);
  return (
    <div className="flex flex-wrap gap-1.5">
      {moves.map((m, i) => (
        <span key={i} className={`px-2 py-0.5 text-[10px] font-mono rounded-md font-bold border ${highlight ? 'bg-[#64D9FF]/20 border-[#64D9FF]/40 text-[#64D9FF]' : 'bg-white/5 border-white/10 text-white/80'}`}>{m}</span>
      ))}
    </div>
  );
}

function PLLCard({ alg, onClick }: { alg: AlgorithmItem; onClick: () => void }) {
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
      <div className="w-full aspect-square rounded-xl relative flex items-center justify-center bg-[#121622] border border-white/[0.04] group-hover:scale-[1.03] transition-transform">
        <PLLCaseDiagram alg={alg.notation} size={150} />
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
      <div className="flex flex-col gap-0.5 px-0.5">
        <div className="flex items-center justify-between gap-1">
          <p className="text-xs font-extrabold text-white">{alg.code}</p>
          <span className="text-[10px] font-mono text-[#00e5ff]">{viSub(alg.subCategory)}</span>
        </div>
        <p className="text-[10px] text-[#00e5ff]/85 font-mono truncate mt-0.5">{alg.notation}</p>
      </div>
    </div>
  );
}

function PLLPopup({ alg, onClose }: { alg: AlgorithmItem; onClose: () => void }) {
  const [activeAlg, setActiveAlg] = useState<'main' | 'alt'>('main');
  const currentNotation = activeAlg === 'alt' && alg.alternativeNotation ? alg.alternativeNotation : alg.notation;
  const moves = useMemo(
    () => currentNotation.replace(/[()]/g, ' ').trim().split(/\s+/).filter(Boolean),
    [currentNotation]
  );
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
    }, 520);
    return () => clearInterval(id);
  }, [playing, moves.length]);

  const countMoves = (n: string) => n.replace(/[()]/g, ' ').trim().split(/\s+/).filter(Boolean).length;

  const handleMain = () => {
    if (activeAlg !== 'main') {
      setActiveAlg('main');
      setStep(0);
      setPlaying(true);
    } else if (playing) {
      setPlaying(false);
    } else {
      if (step >= moves.length) setStep(0);
      setPlaying(true);
    }
  };

  const handleAlt = () => {
    if (activeAlg !== 'alt') {
      setActiveAlg('alt');
      setStep(0);
      setPlaying(true);
    } else if (playing) {
      setPlaying(false);
    } else {
      if (step >= moves.length) setStep(0);
      setPlaying(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md bg-[#0A0F1E] border border-white/10 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between px-5 pt-5 pb-3 sticky top-0 bg-[#0A0F1E] z-10 border-b border-white/5">
          <div>
            <h2 className="text-base font-bold text-white">{alg.code} — {viName(alg.name)}</h2>
            <p className="text-xs text-white/40 mt-0.5">{viSub(alg.subCategory)} · {alg.alternativeNotation ? '2 công thức' : '1 công thức'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-xl transition-colors"><X className="w-4 h-4 text-white/50" /></button>
        </div>

        <div className="mx-5 my-4 py-4 bg-[#060A14] rounded-2xl flex flex-col items-center justify-center border border-white/5 gap-3">
          <PLLCaseDiagram alg={currentNotation} stepCount={step} size={176} />

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setPlaying(false); setStep(0); }}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
              title="Đặt lại trạng thái đầu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { setPlaying(false); setStep((s) => Math.max(0, s - 1)); }}
              disabled={step === 0}
              className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-xs font-mono text-white"
            >
              ◀
            </button>
            <button
              onClick={activeAlg === 'alt' ? handleAlt : handleMain}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#00e5ff] text-black text-xs font-bold rounded-xl hover:bg-[#33ecff] transition-all shadow-lg"
            >
              {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
              {playing ? 'Tạm dừng' : step >= moves.length ? 'Chạy lại' : 'Chạy thử'}
            </button>
            <button
              onClick={() => { setPlaying(false); setStep((s) => Math.min(moves.length, s + 1)); }}
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

        <div className="px-5 pb-5 flex flex-col gap-3">
          <div className="bg-black/30 border border-white/5 rounded-2xl p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/40">Công thức chính · {countMoves(alg.notation)} nước</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowFeedback(true)} className="text-[10px] text-white/40 hover:text-[#FF9500] transition-colors flex items-center gap-1"><Flag className="w-3 h-3" /> Báo lỗi</button>
                <button onClick={handleMain} className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-semibold transition-all ${playing && activeAlg === 'main' ? 'bg-[#00e5ff]/20 border border-[#00e5ff]/30 text-[#00e5ff]' : 'bg-[#1A6B3C] text-white hover:bg-[#1D7D47]'}`}>
                  {playing && activeAlg === 'main' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />} Chạy thử
                </button>
              </div>
            </div>
            <div className="font-mono text-xs text-white tracking-wide leading-relaxed">{alg.notation}</div>
            <div className="flex flex-wrap gap-1.5">
              {alg.notation.replace(/[()]/g, ' ').trim().split(/\s+/).filter(Boolean).map((m, i) => {
                const isActive = activeAlg === 'main' && i === step - 1;
                const isDone = activeAlg === 'main' && i < step;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setActiveAlg('main'); setPlaying(false); setStep(i + 1); }}
                    className={`px-2 py-0.5 text-[11px] font-mono rounded-md font-bold border transition-all ${
                      isActive
                        ? 'bg-[#00e5ff] border-[#00e5ff] text-black scale-105'
                        : isDone
                        ? 'bg-[#00e5ff]/20 border-[#00e5ff]/40 text-[#00e5ff]'
                        : 'bg-white/5 border-white/10 text-white/80 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {alg.alternativeNotation && (
            <div className="bg-black/30 border border-white/5 rounded-2xl p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-white/40">Thay thế · {countMoves(alg.alternativeNotation)} nước</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowFeedback(true)} className="text-[10px] text-white/40 hover:text-[#FF9500] transition-colors flex items-center gap-1"><Flag className="w-3 h-3" /> Báo lỗi</button>
                  <button onClick={handleAlt} className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-semibold transition-all ${playing && activeAlg === 'alt' ? 'bg-[#00e5ff]/20 border border-[#00e5ff]/30 text-[#00e5ff]' : 'bg-[#1A6B3C] text-white hover:bg-[#1D7D47]'}`}>
                    {playing && activeAlg === 'alt' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />} Chạy thử
                  </button>
                </div>
              </div>
              <div className="font-mono text-xs text-white tracking-wide leading-relaxed">{alg.alternativeNotation}</div>
              <MoveChips notation={alg.alternativeNotation} />
            </div>
          )}

          {alg.executionTipVi && (
            <div className="bg-white/3 border border-white/5 rounded-xl px-3 py-2.5">
              <p className="text-[11px] text-white/50 italic leading-relaxed">{alg.executionTipVi}</p>
            </div>
          )}

          {showFeedback && (
            <div className="bg-[#FF9500]/10 border border-[#FF9500]/20 rounded-2xl p-4 flex flex-col gap-2">
              {feedbackSent ? (
                <div className="flex items-center gap-2 text-green-400 text-xs"><CheckCircle2 className="w-4 h-4" /> Đã gửi. Cảm ơn!</div>
              ) : (
                <>
                  <p className="text-xs text-[#FF9500] font-semibold flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Báo lỗi công thức</p>
                  <textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="Mô tả lỗi..." className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-white/30 resize-none h-16 outline-none focus:border-[#FF9500]/40" />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowFeedback(false)} className="text-xs text-white/40 hover:text-white px-3 py-1.5">Hủy</button>
                    <button onClick={() => { setFeedbackSent(true); setShowFeedback(false); }} disabled={!feedbackText.trim()} className="text-xs bg-[#FF9500] text-black font-semibold px-3 py-1.5 rounded-xl disabled:opacity-40">Gửi</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function fmtTime(ms: number) {
  if (ms < 60000) return (ms / 1000).toFixed(2);
  const m = Math.floor(ms / 60000);
  const s = ((ms % 60000) / 1000).toFixed(2).padStart(5, '0');
  return `${m}:${s}`;
}

function PracticeTab() {
  const [scramble, setScramble] = useState('');
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [splits, setSplits] = useState<number[]>([]);
  const [solvedCount, setSolvedCount] = useState(0);
  const [showCase, setShowCase] = useState<AlgorithmItem | null>(null);
  const startRef = useRef(0);
  const totalCases = PLL_CASES.length;

  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now() - elapsed;
    const id = setInterval(() => setElapsed(Date.now() - startRef.current), 30);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  // Sinh scramble ban đầu ở client (tránh hydration mismatch)
  useEffect(() => { setScramble(generateScramble()); }, []);

  const newScramble = () => { setScramble(generateScramble()); setElapsed(0); setRunning(false); };
  const handleStart = () => { setElapsed(0); setSplits([]); setSolvedCount(0); setShowCase(null); startRef.current = Date.now(); setRunning(true); };
  const handleNext = () => {
    const sp = Date.now() - startRef.current;
    setSplits((p) => [...p, sp]);
    setSolvedCount((c) => Math.min(c + 1, totalCases));
    setShowCase(PLL_CASES[solvedCount] || null);
    startRef.current = Date.now();
    setElapsed(0);
  };

  const pb = splits.length > 0 ? Math.min(...splits) : null;
  const avg = splits.length > 0 ? splits.reduce((a, b) => a + b, 0) / splits.length : null;

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <div className="bg-[#0B0F19]/80 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-white/40 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-[#64D9FF]" /> Scramble luyện tập</span>
          <button onClick={newScramble} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#64D9FF]/10 hover:bg-[#64D9FF]/20 border border-[#64D9FF]/20 rounded-xl text-xs text-[#64D9FF] font-semibold transition-all"><RefreshCw className="w-3.5 h-3.5" /> Tạo mới</button>
        </div>
        <div className="font-mono text-white text-sm tracking-wide px-3 py-2.5 bg-black/30 rounded-xl overflow-x-auto whitespace-nowrap select-all border border-white/5">{scramble}</div>
      </div>

      <div className="flex flex-col sm:flex-row gap-5">
        <div className="flex-1 bg-[#0B0F19]/80 border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 self-start">
            <Timer className="w-4 h-4 text-[#64D9FF]" />
            <span className="text-sm font-semibold text-white">Luyện tập PLL</span>
            <span className="text-xs text-white/40 font-mono">{solvedCount}/{totalCases}</span>
          </div>
          <div className="w-full h-28 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center cursor-pointer select-none" onClick={running ? handleNext : handleStart}>
            <span className="font-mono text-5xl font-black text-white tracking-tight tabular-nums">{fmtTime(elapsed)}</span>
          </div>
          <p className="text-[11px] text-white/30 text-center">{running ? 'Nhấn khi nhận ra case → ghi thời gian' : 'Nhấn để bắt đầu'}</p>
          <div className="flex gap-3 w-full">
            <button onClick={handleStart} className="flex-1 py-2 bg-[#64D9FF]/10 border border-[#64D9FF]/20 text-[#64D9FF] text-xs font-semibold rounded-xl hover:bg-[#64D9FF]/15">Bắt đầu mới</button>
            {running && <button onClick={() => setRunning(false)} className="flex-1 py-2 bg-white/5 border border-white/10 text-white/60 text-xs font-semibold rounded-xl hover:bg-white/10">Dừng</button>}
          </div>
        </div>

        <div className="w-full sm:w-56 bg-[#0B0F19]/80 border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
          <p className="text-xs font-semibold text-white/60">Thống kê</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-black/30 rounded-xl p-2 text-center"><p className="text-[8px] text-white/40 mb-1">PB</p><p className="font-mono text-xs font-bold text-[#64D9FF]">{pb !== null ? fmtTime(pb) : '—'}</p></div>
            <div className="bg-black/30 rounded-xl p-2 text-center"><p className="text-[8px] text-white/40 mb-1">TB</p><p className="font-mono text-xs font-bold text-white">{avg !== null ? fmtTime(avg) : '—'}</p></div>
            <div className="bg-black/30 rounded-xl p-2 text-center"><p className="text-[8px] text-white/40 mb-1">Lần</p><p className="font-mono text-xs font-bold text-white">{splits.length}</p></div>
          </div>
          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
            {splits.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-[10px] text-white/50 font-mono px-1">
                <span>#{i + 1}</span>
                <span className={s === pb ? 'text-[#64D9FF] font-bold' : ''}>{fmtTime(s)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showCase && (
        <div className="bg-[#0B0F19]/80 border border-[#64D9FF]/20 rounded-3xl p-5 flex flex-col gap-2">
          <p className="text-xs font-semibold text-[#64D9FF]">Case vừa giải: {showCase.code}</p>
          <p className="font-mono text-xs text-white leading-relaxed">{showCase.notation}</p>
          <MoveChips notation={showCase.notation} highlight />
        </div>
      )}
    </div>
  );
}

export default function PLLPage() {
  const [tab, setTab] = useState<'formula' | 'practice'>('formula');
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('Tất cả');
  const [selectedAlg, setSelectedAlg] = useState<AlgorithmItem | null>(null);
  const [showFav, setShowFav] = useState(false);

  const groups = useMemo(() => {
    const cats = Array.from(new Set(PLL_CASES.map((a) => a.subCategory)));
    return ['Tất cả', ...cats];
  }, []);

  const filteredCases = useMemo(() => {
    let cases = PLL_CASES;
    if (showFav) cases = cases.filter((a) => a.isFavorite);
    if (group !== 'Tất cả') cases = cases.filter((a) => a.subCategory === group);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      cases = cases.filter((a) => a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.notation.toLowerCase().includes(q));
    }
    return cases;
  }, [group, search, showFav]);

  return (
    <div className="min-h-screen bg-[#070A12] text-white flex flex-col">
      {/* Main Global Taskbar */}
      <Navbar activeTab="learn" />

      <div className="bg-[#080c15]/90 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar max-w-full">
            <span className="text-xs font-mono text-white/40 uppercase tracking-wider shrink-0">Học CFOP:</span>
            <nav className="flex gap-1 shrink-0">
              {NAV_PAGES.map((p) => (
                <Link key={p} href={`/learn/${p}`} className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all uppercase whitespace-nowrap shrink-0 ${p === 'pll' ? 'bg-[#00e5ff] text-black shadow-sm' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>{p === 'basic' ? 'Cơ bản' : p}</Link>
              ))}
            </nav>
          </div>
          <div className="flex gap-1 p-1 bg-black/40 border border-white/10 rounded-2xl">
            {(['formula', 'practice'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${tab === t ? 'bg-[#00e5ff] text-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                {t === 'formula' ? <><BookOpen className="w-3.5 h-3.5" /> Công thức</> : <><Dumbbell className="w-3.5 h-3.5" /> Luyện tập</>}
              </button>
            ))}
          </div>
        </div>

        {tab === 'formula' && (
          <div className="max-w-6xl mx-auto px-4 pb-3 flex items-center gap-2 overflow-x-auto">
            <button onClick={() => setShowFav((v) => !v)} className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all border flex-shrink-0 ${showFav ? 'bg-yellow-400/15 border-yellow-400/30 text-yellow-400' : 'border-white/10 text-white/50 hover:text-white hover:bg-white/5'}`}><Star className="w-3 h-3" /> Yêu thích</button>
            {groups.map((g) => (
              <button key={g} onClick={() => setGroup(g)} className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all border whitespace-nowrap flex-shrink-0 ${group === g ? 'bg-[#64D9FF]/15 border-[#64D9FF]/30 text-[#64D9FF]' : 'border-white/10 text-white/50 hover:text-white hover:bg-white/5'}`}>{g === 'Tất cả' ? g : viSub(g)}</button>
            ))}
            <div className="relative ml-auto flex-shrink-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm PLL T, Ua..." className="pl-7 pr-3 py-1 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 outline-none focus:border-[#64D9FF]/30 w-32" />
            </div>
          </div>
        )}
      </div>

      {tab === 'formula' ? (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-6">
          {filteredCases.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-white/30"><Search className="w-10 h-10 opacity-30" /><p className="text-sm">Không tìm thấy kết quả</p></div>
          ) : (
            <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {filteredCases.map((alg) => <PLLCard key={alg.id} alg={alg} onClick={() => setSelectedAlg(alg)} />)}
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-3xl mx-auto w-full px-4 py-6"><PracticeTab /></div>
      )}

      {selectedAlg && <PLLPopup alg={selectedAlg} onClose={() => setSelectedAlg(null)} />}
    </div>
  );
}
