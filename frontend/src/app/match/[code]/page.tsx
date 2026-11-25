'use client';

import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy,
  Check,
  Swords,
  Trophy,
  User,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Bot,
  Timer,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Zap,
  Sparkles,
  Crown,
  Play,
  Square,
  ShieldCheck,
  History,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useMatchStore } from '@/features/match/stores/useMatchStore';
import { Navbar } from '@/components/layout/Navbar';
import { sounds } from '@/lib/audio/soundEffects';
import {
  connectMatch,
  setReady,
  submitResult,
  leaveRoom,
  disconnectMatch,
  getLocalTabPlayer,
  isUsingOfflineSimulation,
  addBotOpponentToRoom,
} from '@/features/match/services/matchSignalR';

type TimerPhase = 'waiting' | 'ready' | 'inspecting' | 'holding' | 'armed' | 'solving' | 'submitted';

// ── 2D Cube Scramble Net Simulator for Battle Preview ────────────────────────
type FaceKey = 'U' | 'D' | 'F' | 'B' | 'L' | 'R';
type CubeFaces = Record<FaceKey, string[]>;

const FACE_COLORS: Record<FaceKey, string> = {
  U: '#FFFFFF', // White
  D: '#FACC15', // Yellow
  F: '#10B981', // Green
  B: '#3B82F6', // Blue
  L: '#F97316', // Orange
  R: '#EF4444', // Red
};

function rotateFaceCW(f: string[]): string[] {
  return [f[6], f[3], f[0], f[7], f[4], f[1], f[8], f[5], f[2]];
}

function applySingleCW(c: CubeFaces, move: FaceKey): CubeFaces {
  const n: CubeFaces = {
    U: [...c.U],
    D: [...c.D],
    F: [...c.F],
    B: [...c.B],
    L: [...c.L],
    R: [...c.R],
  };
  n[move] = rotateFaceCW(c[move]);

  if (move === 'U') {
    [n.F[0], n.F[1], n.F[2]] = [c.R[0], c.R[1], c.R[2]];
    [n.L[0], n.L[1], n.L[2]] = [c.F[0], c.F[1], c.F[2]];
    [n.B[0], n.B[1], n.B[2]] = [c.L[0], c.L[1], c.L[2]];
    [n.R[0], n.R[1], n.R[2]] = [c.B[0], c.B[1], c.B[2]];
  } else if (move === 'D') {
    [n.F[6], n.F[7], n.F[8]] = [c.L[6], c.L[7], c.L[8]];
    [n.R[6], n.R[7], n.R[8]] = [c.F[6], c.F[7], c.F[8]];
    [n.B[6], n.B[7], n.B[8]] = [c.R[6], c.R[7], c.R[8]];
    [n.L[6], n.L[7], n.L[8]] = [c.B[6], c.B[7], c.B[8]];
  } else if (move === 'R') {
    [n.U[2], n.U[5], n.U[8]] = [c.F[2], c.F[5], c.F[8]];
    [n.B[6], n.B[3], n.B[0]] = [c.U[2], c.U[5], c.U[8]];
    [n.D[2], n.D[5], n.D[8]] = [c.B[6], c.B[3], c.B[0]];
    [n.F[2], n.F[5], n.F[8]] = [c.D[2], c.D[5], c.D[8]];
  } else if (move === 'L') {
    [n.U[0], n.U[3], n.U[6]] = [c.B[8], c.B[5], c.B[2]];
    [n.F[0], n.F[3], n.F[6]] = [c.U[0], c.U[3], c.U[6]];
    [n.D[0], n.D[3], n.D[6]] = [c.F[0], c.F[3], c.F[6]];
    [n.B[8], n.B[5], n.B[2]] = [c.D[0], c.D[3], c.D[6]];
  } else if (move === 'F') {
    [n.U[6], n.U[7], n.U[8]] = [c.L[8], c.L[5], c.L[2]];
    [n.R[0], n.R[3], n.R[6]] = [c.U[6], c.U[7], c.U[8]];
    [n.D[2], n.D[1], n.D[0]] = [c.R[0], c.R[3], c.R[6]];
    [n.L[8], n.L[5], n.L[2]] = [c.D[2], c.D[1], c.D[0]];
  } else if (move === 'B') {
    [n.U[0], n.U[1], n.U[2]] = [c.R[2], c.R[5], c.R[8]];
    [n.L[6], n.L[3], n.L[0]] = [c.U[0], c.U[1], c.U[2]];
    [n.D[8], n.D[7], n.D[6]] = [c.L[6], c.L[3], c.L[0]];
    [n.R[2], n.R[5], n.R[8]] = [c.D[8], c.D[7], c.D[6]];
  }
  return n;
}

function simulateScrambleNet(scramble: string): CubeFaces {
  let cube: CubeFaces = {
    U: Array(9).fill(FACE_COLORS.U),
    D: Array(9).fill(FACE_COLORS.D),
    F: Array(9).fill(FACE_COLORS.F),
    B: Array(9).fill(FACE_COLORS.B),
    L: Array(9).fill(FACE_COLORS.L),
    R: Array(9).fill(FACE_COLORS.R),
  };

  if (!scramble) return cube;
  const tokens = scramble.trim().split(/\s+/);
  for (const tok of tokens) {
    const face = tok[0] as FaceKey;
    if (!FACE_COLORS[face]) continue;
    const mod = tok.slice(1);
    const turns = mod === '2' ? 2 : mod === "'" ? 3 : 1;
    for (let i = 0; i < turns; i++) {
      cube = applySingleCW(cube, face);
    }
  }
  return cube;
}

function BattleScrambleMiniNet({ scramble }: { scramble: string }) {
  const faces = useMemo(() => simulateScrambleNet(scramble), [scramble]);

  const renderFace = (cells: string[], key: string) => (
    <div key={key} className="grid grid-cols-3 gap-[2px] p-[3px] bg-[#05080f] rounded-[5px] border border-white/10 w-10 h-10">
      {cells.map((color, idx) => (
        <div
          key={idx}
          className="rounded-[1.5px]"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );

  return (
    <div className="inline-flex flex-col items-center justify-center p-2.5 bg-[#060913]/90 rounded-2xl border border-white/10 shrink-0">
      <div className="flex justify-center mb-[2px]">{renderFace(faces.U, 'U')}</div>
      <div className="flex gap-[2px] my-[1px]">
        {renderFace(faces.L, 'L')}
        {renderFace(faces.F, 'F')}
        {renderFace(faces.R, 'R')}
        {renderFace(faces.B, 'B')}
      </div>
      <div className="flex justify-center mt-[2px]">{renderFace(faces.D, 'D')}</div>
    </div>
  );
}

// ── Main Match Room Component ────────────────────────────────────────────────
export default function MatchRoomPage() {
  const params = useParams();
  const code = (params?.code as string)?.toUpperCase() ?? '';
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuthStore();
  const store = useMatchStore();

  const [copied, setCopied] = useState(false);
  const [timerPhase, setTimerPhase] = useState<TimerPhase>('waiting');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [myTime, setMyTime] = useState<number | null>(null);
  const [inspectionSec, setInspectionSec] = useState(15);
  const [useInspection, setUseInspection] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showNet, setShowNet] = useState(true);
  const [blindSolve, setBlindSolve] = useState(false);

  const rafRef = useRef<number | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inspectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerPhaseRef = useRef<TimerPhase>('waiting');
  const lastTouchRef = useRef<number>(0);

  useEffect(() => {
    timerPhaseRef.current = timerPhase;
  }, [timerPhase]);

  // Connect on mount — DO NOT call leaveRoom() in cleanup so React 18 Strict Mode does not wipe the room
  useEffect(() => {
    if (!token || !code) return;
    connectMatch(token, code).catch(() => {
      store.setError('Không thể kết nối server thi đấu.');
    });
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (inspectionIntervalRef.current) clearInterval(inspectionIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, code]);

  // Reset timer when new round starts
  useEffect(() => {
    if (store.currentRound && store.currentRound.status === 'solving') {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (inspectionIntervalRef.current) clearInterval(inspectionIntervalRef.current);
      setTimerPhase('ready');
      setElapsedMs(0);
      setMyTime(null);
      setInspectionSec(15);
    }
    if (store.currentRound?.status === 'finished') {
      setTimerPhase('submitted');
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (inspectionIntervalRef.current) clearInterval(inspectionIntervalRef.current);
    }
  }, [store.currentRound?.roundId, store.currentRound?.status]);

  // Start 15s WCA Inspection
  const startInspectionCountdown = useCallback(() => {
    if (inspectionIntervalRef.current) clearInterval(inspectionIntervalRef.current);
    setTimerPhase('inspecting');
    setInspectionSec(15);
    if (soundEnabled) sounds.playReadyBeep();

    const started = Date.now();
    inspectionIntervalRef.current = setInterval(() => {
      const rem = 15 - Math.floor((Date.now() - started) / 1000);
      setInspectionSec(rem);
      if (rem === 8 || rem === 3) {
        if (soundEnabled) sounds.playReadyBeep();
      }
      if (rem <= 0) {
        if (inspectionIntervalRef.current) clearInterval(inspectionIntervalRef.current);
      }
    }, 250);
  }, [soundEnabled]);

  // RAF timer start
  const startTimer = useCallback(() => {
    if (inspectionIntervalRef.current) clearInterval(inspectionIntervalRef.current);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);

    startTimeRef.current = performance.now();
    setTimerPhase('solving');
    if (soundEnabled) sounds.playReadyBeep();

    const tick = () => {
      setElapsedMs(performance.now() - startTimeRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [soundEnabled]);

  // Stop timer & submit
  const stopTimer = useCallback(async (forceDnf = false) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (inspectionIntervalRef.current) clearInterval(inspectionIntervalRef.current);

    const ms = forceDnf ? null : Math.max(10, Math.round(performance.now() - startTimeRef.current));
    setMyTime(ms);
    if (ms !== null) setElapsedMs(ms);
    setTimerPhase('submitted');
    if (soundEnabled) sounds.playFinishChime(false);

    if (store.currentRound) {
      try {
        await submitResult(store.currentRound.roundId, ms);
      } catch {}
    }
  }, [store.currentRound, soundEnabled]);

  // Hold-to-start WCA logic (Spacebar or Pointer hold)
  const beginHold = useCallback(() => {
    const phase = timerPhaseRef.current;
    if (phase === 'solving') {
      stopTimer(false);
      return;
    }
    if (phase !== 'ready' && phase !== 'inspecting') return;

    setTimerPhase('holding');
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => {
      setTimerPhase('armed');
      if (soundEnabled) sounds.playReadyBeep();
    }, 280);
  }, [stopTimer, soundEnabled]);

  const releaseHold = useCallback(() => {
    const phase = timerPhaseRef.current;
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (phase === 'armed') {
      startTimer();
    } else if (phase === 'holding') {
      setTimerPhase('ready');
    }
  }, [startTimer]);

  // Keyboard Space listener (Hold & Release WCA style, or Stop while solving)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }
      e.preventDefault();
      if (e.repeat) return;

      const phase = timerPhaseRef.current;
      if (phase === 'solving') {
        stopTimer(false);
      } else if (phase === 'ready' && useInspection) {
        startInspectionCountdown();
      } else if (phase === 'ready' || phase === 'inspecting') {
        beginHold();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      const phase = timerPhaseRef.current;
      if (phase === 'holding' || phase === 'armed') {
        releaseHold();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [useInspection, beginHold, releaseHold, startInspectionCountdown, stopTimer]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#060911] flex flex-col">
        <Navbar activeTab="match" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white/50">Vui lòng đăng nhập để tham gia phòng đấu.</p>
        </div>
      </div>
    );
  }

  const activeCode = (store.roomCode || code).toUpperCase().trim();
  const tabPlayer = getLocalTabPlayer();
  const myUserId = isUsingOfflineSimulation() ? tabPlayer.userId : user?.id;
  const me = store.players.find((p) => p.userId === myUserId) ?? store.players[0];
  const opponent = store.players.find((p) => p.userId !== me?.userId);
  const bothJoined = store.players.length === 2;
  const neededWins = Math.ceil((store.bestOf || 3) / 2);

  const handleCopyCode = () => {
    if (!activeCode) return;

    const markCopied = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(activeCode)
        .then(markCopied)
        .catch(() => {
          fallbackCopy(activeCode);
          markCopied();
        });
    } else {
      fallbackCopy(activeCode);
      markCopied();
    }
  };

  const fallbackCopy = (text: string) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    } catch {}
  };

  const handleLeaveRoom = async () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (inspectionIntervalRef.current) clearInterval(inspectionIntervalRef.current);
    try {
      await leaveRoom(activeCode);
      await disconnectMatch();
    } catch {}
    store.reset();
    router.replace('/match');
  };

  const handleReady = () => setReady(true).catch(() => {});

  // Format milliseconds into big main digits & hundredths
  const splitTime = (ms: number) => {
    const totalSeconds = Math.max(0, ms) / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const hundredths = Math.floor((Math.max(0, ms) % 1000) / 10);
    const main =
      minutes > 0
        ? `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`
        : `${seconds}`;
    const sub = hundredths < 10 ? `0${hundredths}` : `${hundredths}`;
    return { main, sub };
  };

  const fmtMs = (ms: number) => (ms / 1000).toFixed(2);

  const { main: mainDigits, sub: subDigits } = splitTime(elapsedMs);
  const isWaitingState = store.roomStatus === 'waiting' || store.roomStatus === 'idle';
  const scrambleTokens = (store.currentRound?.scramble || '').trim().split(/\s+/).filter(Boolean);

  // Latest round result objects for me & opponent
  const myRoundResult = store.currentRound?.results?.find((r) => r.userId === me?.userId);
  const oppRoundResult = store.currentRound?.results?.find((r) => r.userId === opponent?.userId);

  return (
    <div className="min-h-screen bg-[#060911] text-white flex flex-col relative overflow-hidden">
      <Navbar activeTab="match" />

      {/* Dynamic Ambient Arena Lighting */}
      <div
        className={`absolute top-12 left-1/2 -translate-x-1/2 w-[850px] h-[360px] blur-[170px] pointer-events-none transition-colors duration-500 ${
          timerPhase === 'armed'
            ? 'bg-emerald-500/15'
            : timerPhase === 'holding'
            ? 'bg-amber-500/15'
            : timerPhase === 'solving'
            ? 'bg-[#00F0FF]/15'
            : 'bg-[#00F0FF]/7'
        }`}
      />

      {/* ── Top Arena Sub-Header Bar ────────────────────────────────────────── */}
      <div className="relative z-20 bg-[#080C18]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-5xl w-full mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Leave Room Button */}
          <button
            type="button"
            onClick={handleLeaveRoom}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-white/75 hover:text-red-300 transition-all text-xs font-bold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Rời phòng</span>
          </button>

          {/* Center Match Info & Copyable Room Code */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/25">
              <Swords className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span className="text-xs font-black font-mono text-[#00F0FF]">
                BO{store.bestOf || 3}
              </span>
              <span className="text-[10px] text-white/45 hidden sm:inline">
                • Chạm {neededWins} thắng
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-[#00F0FF]/40 transition-all cursor-pointer group"
              title="Nhấn để sao chép mã phòng"
            >
              <span className="text-[10px] font-mono uppercase text-white/40 hidden sm:inline">
                MÃ PHÒNG:
              </span>
              <span className="font-mono text-xs sm:text-sm font-black tracking-wider text-white group-hover:text-[#00F0FF] transition-colors">
                {activeCode}
              </span>
              {copied ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded-md">
                  <Check className="w-3 h-3" /> Đã chép
                </span>
              ) : (
                <Copy className="w-3.5 h-3.5 text-white/40 group-hover:text-[#00F0FF]" />
              )}
            </button>
          </div>

          {/* Right Quick Timer Settings */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setUseInspection((v) => !v)}
              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                useInspection
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-white/[0.03] border-white/10 text-white/45 hover:text-white/80'
              }`}
              title="Bật/Tắt 15 giây quan sát WCA trước khi giải"
            >
              <Timer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WCA 15s</span>
            </button>

            <button
              type="button"
              onClick={() => setShowNet((v) => !v)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                showNet
                  ? 'bg-[#00F0FF]/15 border-[#00F0FF]/35 text-[#00F0FF]'
                  : 'bg-white/[0.03] border-white/10 text-white/45 hover:text-white/80'
              }`}
              title="Ẩn/Hiện sơ đồ Scramble 2D"
            >
              {showNet ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => setSoundEnabled((v) => !v)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-white/[0.06] border-white/15 text-white/80'
                  : 'bg-white/[0.02] border-white/10 text-white/30'
              }`}
              title="Bật/Tắt âm thanh bấm giờ"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Arena Content ─────────────────────────────────────────────── */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 flex flex-col gap-5 relative z-10">
        {/* Match Winner Grand Banner */}
        <AnimatePresence>
          {store.matchWinnerId && (
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`p-7 rounded-3xl border text-center relative overflow-hidden shadow-2xl ${
                store.matchWinnerId === myUserId
                  ? 'bg-gradient-to-br from-[#00F0FF]/15 via-[#0B1224] to-[#0088FF]/10 border-[#00F0FF]/40'
                  : 'bg-gradient-to-br from-amber-500/15 via-[#0B1224] to-red-500/10 border-amber-500/35'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center mx-auto mb-3">
                <Trophy
                  className={`w-9 h-9 ${
                    store.matchWinnerId === myUserId ? 'text-[#00F0FF]' : 'text-amber-400'
                  }`}
                />
              </div>
              <div className="text-xs font-mono uppercase tracking-widest text-white/50 mb-1">
                KẾT THÚC TRẬN ĐẤU BO{store.bestOf}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {store.matchWinnerId === myUserId
                  ? '🏆 CHIẾN THẮNG TUYỆT ĐỐI!'
                  : `${store.matchWinnerName} giành chiến thắng!`}
              </h2>
              <p className="text-sm text-white/55 mt-1">
                Tỉ số chung cuộc:{' '}
                <strong className="text-[#00F0FF] font-mono">{me?.wins ?? 0}</strong> -{' '}
                <strong className="text-purple-300 font-mono">{opponent?.wins ?? 0}</strong>
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleLeaveRoom}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#00F0FF] to-[#00B8FF] text-[#05080f] font-black rounded-xl text-sm hover:opacity-95 transition-all cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.3)]"
                >
                  Quay về Sảnh Đấu Trường
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── HEAD-TO-HEAD VS SCOREBOARD ───────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-stretch">
          {/* Left Fighter: ME */}
          <div className="md:col-span-5">
            <FighterCard
              name={me?.displayName ?? user?.displayName ?? 'Bạn'}
              wins={me?.wins ?? 0}
              neededWins={neededWins}
              isReady={me?.isReady ?? false}
              isSolving={timerPhase === 'solving'}
              latestTimeMs={myRoundResult?.timeMs ?? (timerPhase === 'submitted' ? myTime : null)}
              isRoundWinner={myRoundResult?.isWinner ?? false}
              isMe
            />
          </div>

          {/* Center VS Score Pillar */}
          <div className="md:col-span-1 flex md:flex-col items-center justify-center py-1 md:py-0">
            <div className="px-3.5 py-2 rounded-2xl bg-[#0B1020] border border-white/10 flex md:flex-col items-center justify-center gap-1.5 shadow-lg">
              <span className="text-lg sm:text-xl font-black font-mono text-[#00F0FF]">
                {me?.wins ?? 0}
              </span>
              <span className="text-[10px] font-black font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/40">
                VS
              </span>
              <span className="text-lg sm:text-xl font-black font-mono text-purple-300">
                {opponent?.wins ?? 0}
              </span>
            </div>
          </div>

          {/* Right Fighter: OPPONENT */}
          <div className="md:col-span-5">
            {opponent ? (
              <FighterCard
                name={opponent.displayName}
                wins={opponent.wins}
                neededWins={neededWins}
                isReady={opponent.isReady}
                isSolving={
                  store.roomStatus === 'playing' &&
                  store.currentRound?.status === 'solving' &&
                  !oppRoundResult
                }
                latestTimeMs={oppRoundResult?.timeMs ?? null}
                isRoundWinner={oppRoundResult?.isWinner ?? false}
                isMe={false}
              />
            ) : (
              <div className="h-full min-h-[118px] p-5 rounded-3xl bg-[#0B1020]/70 border border-dashed border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 text-center sm:text-left">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-white/25 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white/75">Đang chờ đối thủ vào phòng...</div>
                    <div className="text-xs text-white/40 mt-0.5">
                      Gửi mã <span className="font-mono font-bold text-[#00F0FF]">{activeCode}</span> hoặc mời Bot
                    </div>
                  </div>
                </div>
                {isUsingOfflineSimulation() && (
                  <button
                    type="button"
                    onClick={addBotOpponentToRoom}
                    className="px-3.5 py-2 rounded-xl bg-[#8A2BE2]/20 hover:bg-[#8A2BE2]/30 border border-[#8A2BE2]/40 text-xs font-bold text-purple-200 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                  >
                    <Bot className="w-4 h-4 text-purple-300" />
                    <span>+ Đấu với Bot Sub-12</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {store.error && (
          <div className="flex items-center gap-2.5 text-sm text-red-300 bg-red-500/10 border border-red-500/25 px-4 py-3 rounded-2xl">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{store.error}</span>
          </div>
        )}

        {/* ── WAITING ROOM CONSOLE ─────────────────────────────────────────── */}
        {isWaitingState && !store.matchWinnerId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0B1020]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden"
          >
            {!bothJoined ? (
              <div className="max-w-lg mx-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] text-[11px] font-mono font-bold mb-3">
                  <Sparkles className="w-3.5 h-3.5" /> PHÒNG CHỜ ĐẤU TRƯỜNG 1V1
                </div>
                <h3 className="text-xl font-black text-white mb-1.5">
                  Chia sẻ mã ghép trận cho đối thủ
                </h3>
                <p className="text-xs text-white/50 mb-5">
                  Đối thủ (hoặc tab trình duyệt thứ 2) chỉ cần dán mã này vào mục <strong>Gia Nhập Phòng Đấu</strong>
                </p>

                {/* Ticket Code Box */}
                <div
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-4 px-7 py-4 bg-[#060913] border-2 border-[#00F0FF]/35 hover:border-[#00F0FF] rounded-2xl cursor-pointer transition-all shadow-[0_0_30px_rgba(0,240,255,0.12)] group"
                >
                  <span className="font-mono text-3xl sm:text-4xl font-black tracking-[0.2em] text-[#00F0FF]">
                    {activeCode}
                  </span>
                  <div className="px-3 py-1.5 rounded-xl bg-[#00F0FF]/15 text-[#00F0FF] text-xs font-bold flex items-center gap-1.5">
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-300">Đã sao chép!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </div>
                </div>

                {isUsingOfflineSimulation() && (
                  <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <span className="text-xs text-white/45">
                      Muốn luyện tập phản xạ thi đấu ngay lập tức?
                    </span>
                    <button
                      type="button"
                      onClick={addBotOpponentToRoom}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8A2BE2]/30 to-[#00F0FF]/20 hover:from-[#8A2BE2]/45 hover:to-[#00F0FF]/30 border border-purple-400/35 text-xs font-black text-white flex items-center gap-2 transition-all cursor-pointer shadow-lg"
                    >
                      <Bot className="w-4 h-4 text-[#00F0FF]" />
                      <span>+ Mời Bot QuangMinh (Sub-12) Vào Đấu</span>
                    </button>
                  </div>
                )}
              </div>
            ) : !me?.isReady ? (
              <div className="max-w-md mx-auto py-2">
                <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 mb-2">
                  ✓ CẢ 2 TUYỂN THỦ ĐÃ CÓ MẶT TRONG PHÒNG
                </div>
                <h3 className="text-xl font-black text-white mb-2">
                  Bạn đã sẵn sàng bước vào Vòng 1?
                </h3>
                <p className="text-xs text-white/50 mb-5">
                  Ngay khi cả 2 nhấn Sẵn sàng, hệ thống sẽ phát đề Scramble WCA 20 bước và mở bộ bấm giờ.
                </p>
                <button
                  type="button"
                  onClick={handleReady}
                  className="px-10 py-4 bg-gradient-to-r from-[#00F0FF] to-[#00B8FF] text-[#05080f] font-black text-base rounded-2xl hover:opacity-95 active:scale-98 transition-all shadow-[0_0_30px_rgba(0,240,255,0.35)] cursor-pointer inline-flex items-center gap-2"
                >
                  <Zap className="w-5 h-5" />
                  <span>SẴN SÀNG THI ĐẤU!</span>
                </button>
              </div>
            ) : (
              <div className="py-4">
                <Loader2 className="w-7 h-7 animate-spin text-[#00F0FF] mx-auto mb-3" />
                <div className="text-base font-bold text-white">Đã sẵn sàng! Đang chờ đối thủ...</div>
                <p className="text-xs text-white/45 mt-1">
                  Vòng đấu sẽ tự động bắt đầu ngay khi đối thủ nhấn Sẵn sàng.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── ACTIVE ROUND & WCA BATTLE TIMER STAGE ────────────────────────── */}
        {store.currentRound && store.roomStatus === 'playing' && !store.matchWinnerId && (
          <div className="flex flex-col gap-4">
            {/* 1. SCRAMBLE & 2D NET CONSOLE */}
            <div className="bg-[#0B1020]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1 min-w-0 w-full">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#00F0FF]/15 border border-[#00F0FF]/30 text-[#00F0FF] font-mono text-xs font-black">
                      VÒNG {store.currentRound.roundNumber} / BO{store.bestOf}
                    </span>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-white/40">
                      WCA 3x3x3 OFFICIAL SCRAMBLE
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setBlindSolve((v) => !v)}
                    className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                      blindSolve
                        ? 'bg-purple-500/20 border-purple-400/40 text-purple-200'
                        : 'bg-white/5 border-white/10 text-white/45 hover:text-white/75'
                    }`}
                  >
                    {blindSolve ? 'Ẩn số khi giải: BẬT' : 'Ẩn số khi giải: TẮT'}
                  </button>
                </div>

                {/* Scramble Move Pills */}
                <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-[#060913] border border-white/8">
                  {scrambleTokens.map((move, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded-lg bg-white/[0.04] border border-white/8 font-mono text-sm sm:text-base font-black text-white tracking-wide"
                    >
                      {move}
                    </span>
                  ))}
                </div>
              </div>

              {/* 2D Scramble Net Preview */}
              {showNet && <BattleScrambleMiniNet scramble={store.currentRound.scramble} />}
            </div>

            {/* 2. WCA BATTLE TIMER ARENA STAGE */}
            <div
              onMouseDown={() => {
                if (Date.now() - lastTouchRef.current < 600) return;
                if (timerPhase === 'ready' || timerPhase === 'inspecting') beginHold();
                else if (timerPhase === 'solving') stopTimer(false);
              }}
              onMouseUp={() => {
                if (Date.now() - lastTouchRef.current < 600) return;
                if (timerPhase === 'holding' || timerPhase === 'armed') releaseHold();
              }}
              onTouchStart={(e) => {
                lastTouchRef.current = Date.now();
                if (timerPhase === 'ready' || timerPhase === 'inspecting') {
                  e.preventDefault();
                  beginHold();
                } else if (timerPhase === 'solving') {
                  e.preventDefault();
                  stopTimer(false);
                }
              }}
              onTouchEnd={(e) => {
                lastTouchRef.current = Date.now();
                if (timerPhase === 'holding' || timerPhase === 'armed') {
                  e.preventDefault();
                  releaseHold();
                }
              }}
              className={`relative rounded-3xl border-2 transition-all duration-200 select-none overflow-hidden flex flex-col items-center justify-center py-8 sm:py-14 px-4 sm:px-6 ${
                timerPhase === 'armed'
                  ? 'bg-emerald-950/30 border-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.25)] cursor-pointer'
                  : timerPhase === 'holding'
                  ? 'bg-amber-950/25 border-amber-400/80 shadow-[0_0_40px_rgba(245,158,11,0.2)] cursor-pointer'
                  : timerPhase === 'solving'
                  ? 'bg-[#071324]/90 border-[#00F0FF] shadow-[0_0_60px_rgba(0,240,255,0.22)] cursor-pointer'
                  : timerPhase === 'inspecting'
                  ? 'bg-amber-950/20 border-amber-400/60 cursor-pointer'
                  : 'bg-[#0B1020]/90 border-white/15 hover:border-[#00F0FF]/40 cursor-pointer'
              }`}
            >
              {/* Top Phase Status Pill inside Timer Stage */}
              <div className="mb-4 flex items-center gap-2">
                <span
                  className={`px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${
                    timerPhase === 'armed'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : timerPhase === 'holding'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : timerPhase === 'solving'
                      ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF] animate-pulse'
                      : timerPhase === 'inspecting'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : timerPhase === 'submitted'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : 'bg-white/5 border-white/15 text-white/60'
                  }`}
                >
                  {timerPhase === 'armed'
                    ? '🟢 SẴN SÀNG — THẢ TAY ĐỂ CHẠY GIỜ!'
                    : timerPhase === 'holding'
                    ? '🟡 GIỮ NGUYÊN PHÍM SPACE / CHẠM...'
                    : timerPhase === 'inspecting'
                    ? `⏱️ QUAN SÁT WCA CÒN ${inspectionSec} GIÂY`
                    : timerPhase === 'solving'
                    ? '⚡ ĐANG GIẢI — NHẤN SPACE HOẶC CHẠM ĐỂ DỪNG'
                    : timerPhase === 'submitted'
                    ? '✓ ĐÃ GHI NHẬN KẾT QUẢ VÒNG ĐẤU'
                    : 'GIỮ PHÍM SPACE HOẶC CHẠM GIỮ ĐỂ BẮT ĐẦU'}
                </span>
              </div>

              {/* Giant Digital Clock Readout */}
              {timerPhase === 'inspecting' ? (
                <div
                  className={`font-mono font-black text-7xl sm:text-8xl tracking-tight ${
                    inspectionSec <= 3 ? 'text-red-400 animate-pulse' : 'text-amber-400'
                  }`}
                >
                  {inspectionSec}s
                </div>
              ) : timerPhase === 'solving' && blindSolve ? (
                <div className="py-4 flex flex-col items-center">
                  <div className="font-mono font-black text-5xl sm:text-6xl text-[#00F0FF] tracking-widest animate-pulse">
                    SOLVING...
                  </div>
                  <p className="text-xs text-white/40 mt-2">Đang ẩn đồng hồ để tập trung tối đa</p>
                </div>
              ) : (
                <div className="flex items-baseline justify-center font-mono font-black select-none">
                  <span
                    className={`text-6xl sm:text-8xl md:text-9xl tracking-tight leading-none transition-colors ${
                      timerPhase === 'armed'
                        ? 'text-emerald-400 drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]'
                        : timerPhase === 'holding'
                        ? 'text-amber-400'
                        : timerPhase === 'solving'
                        ? 'text-[#00F0FF] drop-shadow-[0_0_35px_rgba(0,240,255,0.45)]'
                        : timerPhase === 'submitted'
                        ? 'text-white'
                        : 'text-white/90'
                    }`}
                  >
                    {mainDigits}
                  </span>
                  <span
                    className={`text-4xl sm:text-5xl md:text-6xl ml-1 ${
                      timerPhase === 'armed'
                        ? 'text-emerald-400/80'
                        : timerPhase === 'holding'
                        ? 'text-amber-400/80'
                        : timerPhase === 'solving'
                        ? 'text-[#00F0FF]/80'
                        : 'text-white/50'
                    }`}
                  >
                    .{subDigits}
                  </span>
                  <span className="text-xl sm:text-2xl text-white/30 ml-1.5 font-bold">s</span>
                </div>
              )}

              {/* Stackmat Hand & Spacebar Visual Guide + Direct Action Buttons */}
              <div
                className="mt-6 flex flex-wrap items-center justify-center gap-3"
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                {(timerPhase === 'ready' || timerPhase === 'inspecting') && (
                  <>
                    {timerPhase === 'ready' && (
                      <button
                        type="button"
                        onClick={startInspectionCountdown}
                        className="px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Timer className="w-3.5 h-3.5" />
                        <span>Đếm ngược 15s WCA</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={startTimer}
                      className="px-5 py-2 rounded-xl bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Bấm giờ ngay (hoặc Giữ SPACE)</span>
                    </button>
                  </>
                )}

                {timerPhase === 'solving' && (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => stopTimer(false)}
                      className="px-6 py-2.5 rounded-xl bg-[#00F0FF] text-[#05080f] font-black text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(0,240,255,0.4)] cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>DỪNG ĐỒNG HỒ (SPACE)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => stopTimer(true)}
                      className="px-3.5 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/35 text-red-300 font-bold text-xs cursor-pointer"
                    >
                      Báo DNF
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 3. ROUND HEAD-TO-HEAD COMPARISON & NEXT ROUND BAR */}
            {((store.currentRound.results ?? []).length > 0 ||
              store.currentRound.status === 'finished') && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0B1020]/90 border border-white/10 rounded-3xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-white/45">
                    SO SÁNH KẾT QUẢ VÒNG {store.currentRound.roundNumber}
                  </span>
                  {myRoundResult && oppRoundResult && !myRoundResult.isDnf && !oppRoundResult.isDnf && (
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                        (myRoundResult.timeMs ?? 0) <= (oppRoundResult.timeMs ?? 0)
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      Chênh lệch:{' '}
                      {(
                        ((myRoundResult.timeMs ?? 0) - (oppRoundResult.timeMs ?? 0)) /
                        1000
                      ) > 0
                        ? `+${(((myRoundResult.timeMs ?? 0) - (oppRoundResult.timeMs ?? 0)) / 1000).toFixed(2)}s`
                        : `${(((myRoundResult.timeMs ?? 0) - (oppRoundResult.timeMs ?? 0)) / 1000).toFixed(2)}s`}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {store.currentRound.results.map((r) => {
                    const p = store.players.find((pl) => pl.userId === r.userId);
                    const isMine = r.userId === me?.userId;
                    return (
                      <div
                        key={r.userId}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border ${
                          r.isWinner
                            ? 'bg-[#00F0FF]/10 border-[#00F0FF]/40'
                            : 'bg-white/[0.03] border-white/8'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {r.isWinner ? (
                            <Crown className="w-4 h-4 text-yellow-400 shrink-0" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-white/30" />
                          )}
                          <span className="text-sm font-bold text-white">
                            {p?.displayName ?? r.userId}
                          </span>
                          {isMine && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#00F0FF]/15 text-[#00F0FF]">
                              Bạn
                            </span>
                          )}
                        </div>
                        <span
                          className={`font-mono text-base font-black ${
                            r.isDnf
                              ? 'text-red-400'
                              : r.isWinner
                              ? 'text-[#00F0FF]'
                              : 'text-white/75'
                          }`}
                        >
                          {r.isDnf ? 'DNF' : `${fmtMs(r.timeMs ?? 0)}s`}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Waiting for opponent to finish solving this round */}
                {store.currentRound.status === 'solving' &&
                  store.currentRound.results.length === 1 && (
                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-[#00F0FF]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        {myRoundResult
                          ? 'Đã ghi nhận thời gian của bạn! Đang chờ đối thủ giải xong vòng này...'
                          : 'Đối thủ đã giải xong! Hãy hoàn thành lượt giải của bạn...'}
                      </span>
                    </div>
                  )}

                {/* Next round ready button */}
                {store.currentRound.status === 'finished' &&
                  store.roomStatus === 'playing' &&
                  !store.matchWinnerId && (
                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-center">
                      {!me?.isReady ? (
                        <button
                          type="button"
                          onClick={handleReady}
                          className="px-8 py-3 bg-gradient-to-r from-[#00F0FF] to-[#00B8FF] text-[#05080f] font-black rounded-2xl text-sm hover:opacity-95 transition-all shadow-[0_0_25px_rgba(0,240,255,0.3)] cursor-pointer flex items-center gap-2"
                        >
                          <Zap className="w-4 h-4" />
                          <span>Sẵn sàng Vòng {store.currentRound.roundNumber + 1} →</span>
                        </button>
                      ) : (
                        <div className="text-xs text-white/55 flex items-center gap-2 py-1">
                          <Loader2 className="w-4 h-4 animate-spin text-[#00F0FF]" />
                          <span>Đang chờ đối thủ sẵn sàng vòng tiếp theo...</span>
                        </div>
                      )}
                    </div>
                  )}
              </motion.div>
            )}
          </div>
        )}

        {/* ── ROUND HISTORY TIMELINE ───────────────────────────────────────── */}
        {store.rounds.filter((r) => r.status === 'finished').length > 0 && (
          <div className="bg-[#0B1020]/75 border border-white/10 rounded-3xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/8 flex items-center gap-2 text-xs font-mono font-bold text-white/45">
              <History className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span>LỊCH SỬ CÁC VÁN ĐẤU</span>
            </div>
            <div className="divide-y divide-white/5">
              {store.rounds
                .filter((r) => r.status === 'finished')
                .map((round) => (
                  <div
                    key={round.roundId}
                    className="px-5 py-3 flex flex-wrap items-center justify-between gap-3"
                  >
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white/5 text-white/60">
                      VÁN #{round.roundNumber}
                    </span>
                    <div className="flex items-center gap-5">
                      {round.results.map((r) => {
                        const p = store.players.find((pl) => pl.userId === r.userId);
                        return (
                          <div key={r.userId} className="flex items-center gap-2">
                            {r.isWinner && <Trophy className="w-3.5 h-3.5 text-yellow-400" />}
                            <span className="text-xs text-white/60">
                              {p?.displayName ?? r.userId}:
                            </span>
                            <span
                              className={`text-xs font-mono font-black ${
                                r.isDnf
                                  ? 'text-red-400'
                                  : r.isWinner
                                  ? 'text-[#00F0FF]'
                                  : 'text-white/50'
                              }`}
                            >
                              {r.isDnf ? 'DNF' : `${fmtMs(r.timeMs ?? 0)}s`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Fighter Scoreboard Card ──────────────────────────────────────────────────
function FighterCard({
  name,
  wins,
  neededWins,
  isReady,
  isSolving,
  latestTimeMs,
  isRoundWinner,
  isMe,
}: {
  name: string;
  wins: number;
  neededWins: number;
  isReady: boolean;
  isSolving: boolean;
  latestTimeMs: number | null | undefined;
  isRoundWinner: boolean;
  isMe: boolean;
}) {
  return (
    <div
      className={`h-full p-4 sm:p-5 rounded-3xl border transition-all relative overflow-hidden ${
        isMe
          ? 'bg-gradient-to-br from-[#00F0FF]/10 via-[#0B1020] to-[#0B1020] border-[#00F0FF]/30'
          : 'bg-gradient-to-bl from-[#8A2BE2]/12 via-[#0B1020] to-[#0B1020] border-purple-400/25'
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-base font-black shrink-0 ${
              isMe
                ? 'bg-gradient-to-br from-[#00F0FF] to-[#0088FF] text-[#05080f] shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                : 'bg-gradient-to-br from-[#8A2BE2] to-purple-500 text-white shadow-[0_0_15px_rgba(138,43,226,0.3)]'
            }`}
          >
            {name[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm sm:text-base font-black text-white truncate">{name}</p>
              {isRoundWinner && <Crown className="w-4 h-4 text-yellow-400 shrink-0" />}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`text-[10px] font-mono uppercase tracking-wider ${
                  isMe ? 'text-[#00F0FF]' : 'text-purple-300'
                }`}
              >
                {isMe ? 'TUYỂN THỦ (BẠN)' : 'ĐỐI THỦ'}
              </span>
              {isSolving ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  Đang giải...
                </span>
              ) : isReady ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" /> Sẵn sàng
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Latest Solve Time Badge */}
        {latestTimeMs !== null && latestTimeMs !== undefined && (
          <div className="text-right shrink-0">
            <div className="text-[10px] font-mono text-white/40 uppercase"> Thời gian</div>
            <div
              className={`font-mono text-lg font-black ${
                isRoundWinner ? 'text-[#00F0FF]' : 'text-white/85'
              }`}
            >
              {(latestTimeMs / 1000).toFixed(2)}s
            </div>
          </div>
        )}
      </div>

      {/* Win Progress Bar Pips */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-1.5">
          {Array.from({ length: neededWins }).map((_, i) => {
            const won = i < wins;
            return (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full transition-all ${
                  won
                    ? isMe
                      ? 'bg-[#00F0FF] shadow-[0_0_10px_#00F0FF]'
                      : 'bg-purple-400 shadow-[0_0_10px_#a855f7]'
                    : 'bg-white/10'
                }`}
              />
            );
          })}
        </div>
        <span className="text-[11px] font-mono font-bold text-white/55 shrink-0">
          {wins}/{neededWins} thắng
        </span>
      </div>
    </div>
  );
}
