'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTimerStore } from '@/lib/store/useTimerStore';
import { useI18nStore } from '@/lib/store/useI18nStore';
import { ScrambleNet } from './ScrambleNet';
import { SolveCelebration } from './SolveCelebration';
import { sounds } from '@/lib/audio/soundEffects';
import {
  RotateCcw,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  Award,
  Clock,
  Eye,
  EyeOff,
  Sparkles,
  BarChart3,
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Zap,
  HandMetal
} from 'lucide-react';

export const RubikTimer: React.FC = () => {
  const { t } = useI18nStore();
  const {
    status,
    elapsedMs,
    inspectionRemaining,
    scramble,
    scrambleType,
    solves,
    inspectionEnabled,
    selectedSolveId,
    setStatus,
    setElapsedMs,
    setInspectionRemaining,
    setScrambleType,
    toggleInspection,
    generateNewScramble,
    recordSolve,
    updateSolvePenalty,
    deleteSolve,
    setSelectedSolveId,
    getAo5,
    getAo12,
    getBestSingle,
    getMean
  } = useTimerStore();

  const [copied, setCopied] = useState(false);
  const [showNet, setShowNet] = useState(true);
  const [hideTimeWhileSolving, setHideTimeWhileSolving] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Celebration Modal state
  const [celebration, setCelebration] = useState<{
    isOpen: boolean;
    timeMs: number;
    rawTimeMs: number;
    penalty: 'None' | 'PlusTwo' | 'DNF';
    isPb: boolean;
    scramble: string;
    solveId: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Holding & timing refs
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const inspectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const inspectionStartRef = useRef<number>(0);
  const lastTouchTimeRef = useRef<number>(0);

  // Format milliseconds into mm:ss.xx
  const formatTime = (ms: number): string => {
    if (ms < 0) return 'DNF';
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const hundredths = Math.floor((ms % 1000) / 10);

    const secStr = minutes > 0 && seconds < 10 ? `0${seconds}` : `${seconds}`;
    const hunStr = hundredths < 10 ? `0${hundredths}` : `${hundredths}`;

    if (minutes > 0) {
      return `${minutes}:${secStr}.${hunStr}`;
    }
    return `${secStr}.${hunStr}`;
  };

  // Start Inspection Countdown
  const startInspection = useCallback(() => {
    setStatus('inspecting');
    setInspectionRemaining(15);
    inspectionStartRef.current = Date.now();

    if (inspectionIntervalRef.current) clearInterval(inspectionIntervalRef.current);
    inspectionIntervalRef.current = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - inspectionStartRef.current) / 1000);
      const remaining = 15 - elapsedSec;
      setInspectionRemaining(remaining);

      if (remaining <= -2) {
        clearInterval(inspectionIntervalRef.current!);
        recordSolve(0, 'DNF');
        setStatus('idle');
      }
    }, 200);
  }, [setStatus, setInspectionRemaining, recordSolve]);

  // Start Solve Timer (Smooth 60fps requestAnimationFrame)
  const startTimer = useCallback(() => {
    if (inspectionIntervalRef.current) {
      clearInterval(inspectionIntervalRef.current);
      inspectionIntervalRef.current = null;
    }
    setStatus('running');
    const start = performance.now();
    startTimeRef.current = start;

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const tick = () => {
      const now = performance.now();
      setElapsedMs(Math.round(now - start));
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, [setStatus, setElapsedMs]);

  // Stop Solve Timer with Spectacular Audio & Visual Completion
  const stopTimer = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    const finalElapsed = Math.round(performance.now() - startTimeRef.current);
    setElapsedMs(finalElapsed);
    setStatus('stopped');

    let penalty: 'None' | 'PlusTwo' | 'DNF' = 'None';
    if (inspectionEnabled && inspectionRemaining < 0 && inspectionRemaining >= -2) {
      penalty = 'PlusTwo';
    }

    const effectiveTime = penalty === 'PlusTwo' ? finalElapsed + 2000 : finalElapsed;
    const bestBefore = getBestSingle();
    const isPb = !bestBefore || effectiveTime < bestBefore;

    // Play victory sound chime
    if (soundOn) {
      sounds.playFinishChime(isPb);
    }

    const newId = Date.now();
    recordSolve(finalElapsed, penalty);

    // Open Cinematic Victory HUD
    setCelebration({
      isOpen: true,
      timeMs: effectiveTime,
      rawTimeMs: finalElapsed,
      penalty,
      isPb,
      scramble,
      solveId: newId
    });
  }, [
    setElapsedMs,
    setStatus,
    inspectionEnabled,
    inspectionRemaining,
    getBestSingle,
    recordSolve,
    soundOn,
    scramble
  ]);

  // Global Keyboard event handler for Spacebar & Any Key Stop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      // 1. If currently RUNNING, ANY key press immediately stops the timer!
      if (status === 'running') {
        e.preventDefault();
        stopTimer();
        return;
      }

      // 2. If celebration modal is open, Space closes it and advances to next scramble
      if (celebration?.isOpen && e.code === 'Space') {
        e.preventDefault();
        setCelebration(null);
        generateNewScramble();
        return;
      }

      // 3. Spacebar handling for starting/holding
      if (e.code === 'Space') {
        e.preventDefault();

        if (status === 'idle' || status === 'stopped') {
          if (inspectionEnabled) {
            startInspection();
            return;
          }

          setStatus('holding');
          setElapsedMs(0);
          holdTimeoutRef.current = setTimeout(() => {
            setStatus('ready');
            if (soundOn) sounds.playReadyBeep();
          }, 300);
        } else if (status === 'inspecting') {
          setStatus('holding');
          holdTimeoutRef.current = setTimeout(() => {
            setStatus('ready');
            if (soundOn) sounds.playReadyBeep();
          }, 300);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (holdTimeoutRef.current) {
          clearTimeout(holdTimeoutRef.current);
          holdTimeoutRef.current = null;
        }

        if (status === 'ready') {
          startTimer();
        } else if (status === 'holding') {
          setStatus(inspectionEnabled ? 'inspecting' : 'idle');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    status,
    inspectionEnabled,
    celebration,
    startInspection,
    startTimer,
    stopTimer,
    setStatus,
    setElapsedMs,
    soundOn,
    generateNewScramble
  ]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (inspectionIntervalRef.current) clearInterval(inspectionIntervalRef.current);
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    };
  }, []);

  // Touch screen support for mobile/tablets
  const handleTouchStart = () => {
    if (status === 'running') {
      stopTimer();
      return;
    }

    if (celebration?.isOpen) {
      setCelebration(null);
      generateNewScramble();
      return;
    }

    if (status === 'idle' || status === 'stopped') {
      if (inspectionEnabled) {
        startInspection();
        return;
      }
      setStatus('holding');
      setElapsedMs(0);
      holdTimeoutRef.current = setTimeout(() => {
        setStatus('ready');
        if (soundOn) sounds.playReadyBeep();
      }, 300);
    } else if (status === 'inspecting') {
      setStatus('holding');
      holdTimeoutRef.current = setTimeout(() => {
        setStatus('ready');
        if (soundOn) sounds.playReadyBeep();
      }, 300);
    }
  };

  const handleTouchEnd = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }

    if (status === 'ready') {
      startTimer();
    } else if (status === 'holding') {
      setStatus(inspectionEnabled ? 'inspecting' : 'idle');
    }
  };

  const copyScramble = () => {
    navigator.clipboard.writeText(scramble);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Timer Text Color based on current status
  const getTimerColorClass = () => {
    switch (status) {
      case 'holding':
        return 'text-[#FF3B30] drop-shadow-[0_0_35px_rgba(255,59,48,0.8)]';
      case 'ready':
        return 'text-[#00F5A0] drop-shadow-[0_0_45px_rgba(0,245,160,0.9)] scale-105';
      case 'inspecting':
        return inspectionRemaining <= 3
          ? 'text-[#FF3B30] animate-pulse drop-shadow-[0_0_35px_rgba(255,59,48,0.9)]'
          : inspectionRemaining <= 7
          ? 'text-[#FF9500]'
          : 'text-[#00F0FF]';
      case 'running':
        return hideTimeWhileSolving
          ? 'text-transparent'
          : 'text-[#00F0FF] drop-shadow-[0_0_40px_rgba(0,240,255,0.7)]';
      default:
        return 'text-white';
    }
  };

  const bestSingle = getBestSingle();
  const currentAo5 = getAo5();
  const currentAo12 = getAo12();
  const sessionMean = getMean();

  return (
    <div className={`w-full flex flex-col ${isFocusMode ? '' : 'xl:flex-row'} gap-6 transition-all duration-300`}>
      {/* Massive Speedcubing Stage Viewport */}
      <div
        className={`flex-1 flex flex-col justify-between p-4 sm:p-8 lg:p-10 bg-[#080C16]/90 backdrop-blur-3xl border border-white/10 rounded-[28px] sm:rounded-[32px] relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.7)] transition-all duration-300 ${
          isFocusMode ? 'min-h-[78dvh]' : 'min-h-[520px] sm:min-h-[640px]'
        }`}
      >
        {/* Subtle Ambient Radial Lighting */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px] pointer-events-none transition-all duration-500 ${
            status === 'ready'
              ? 'w-[500px] h-[500px] bg-[#00F5A0]/15'
              : status === 'holding'
              ? 'w-[500px] h-[500px] bg-[#FF3B30]/15'
              : status === 'running'
              ? 'w-[600px] h-[600px] bg-[#00F0FF]/15'
              : 'w-96 h-96 bg-[#00F0FF]/5'
          }`}
        />

        {/* Top Controls: Scramble Bar & Pro Utilities */}
        <div
          className={`flex flex-col gap-4 z-10 transition-opacity duration-300 ${
            status === 'running' ? 'opacity-15 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Scramble Type Tabs */}
            <div className="flex items-center gap-1 sm:gap-1.5 p-1 bg-black/50 border border-white/10 rounded-2xl shadow-inner overflow-x-auto no-scrollbar max-w-full">
              {(['3x3', 'cross', 'f2l', 'oll', 'pll'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setScrambleType(type)}
                  className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shrink-0 ${
                    scrambleType === type
                      ? 'bg-gradient-to-r from-[#00F0FF] to-[#0088FF] text-black shadow-lg shadow-[#00F0FF]/25 font-bold'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Pro Arena Controls */}
            <div className="flex items-center gap-2">
              {/* Sound Toggle */}
              <button
                onClick={() => {
                  setSoundOn(!soundOn);
                  sounds.enabled = !soundOn;
                }}
                className={`p-2 rounded-xl border transition-all ${
                  soundOn
                    ? 'bg-[#00F0FF]/10 border-[#00F0FF]/40 text-[#00F0FF]'
                    : 'bg-white/5 border-white/10 text-white/40'
                }`}
                title={soundOn ? 'Âm thanh: BẬT' : 'Âm thanh: TẮT'}
              >
                {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* 15s WCA Inspection */}
              <button
                onClick={toggleInspection}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
                  inspectionEnabled
                    ? 'bg-[#00F0FF]/15 border-[#00F0FF]/50 text-[#00F0FF] font-semibold'
                    : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                }`}
                title={t('timerInspectionToggle')}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>15s WCA</span>
              </button>

              {/* Hide Time Toggle */}
              <button
                onClick={() => setHideTimeWhileSolving(!hideTimeWhileSolving)}
                className={`p-2 rounded-xl border transition-all ${
                  hideTimeWhileSolving
                    ? 'bg-[#FF6B00]/15 border-[#FF6B00]/50 text-[#FF6B00]'
                    : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                }`}
                title={hideTimeWhileSolving ? 'Ẩn số khi xoay: BẬT' : 'Ẩn số khi xoay: TẮT'}
              >
                {hideTimeWhileSolving ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>

              {/* Toggle 2D Net */}
              <button
                onClick={() => setShowNet(!showNet)}
                className={`p-2 rounded-xl border transition-all ${
                  showNet
                    ? 'bg-white/15 border-white/25 text-white'
                    : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                }`}
                title="Lưới màu 2D"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>

              {/* Focus / Arena Maximize Mode */}
              <button
                onClick={() => setIsFocusMode(!isFocusMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                  isFocusMode
                    ? 'bg-[#00F0FF] text-black border-[#00F0FF] shadow-lg shadow-[#00F0FF]/30'
                    : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
                }`}
                title={isFocusMode ? 'Thoát Chế Độ Đấu Trường' : 'Chế Độ Đấu Trường Focus'}
              >
                {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isFocusMode ? 'Thu Nhỏ' : 'Đấu Trường Focus'}</span>
              </button>
            </div>
          </div>

          {/* Large Crystal Monospace Scramble Bar */}
          <div className="p-4 sm:p-5 bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-inner">
            <div className="text-center md:text-left flex-1">
              <span className="text-[11px] uppercase font-mono tracking-widest text-[#00F0FF]/80 block mb-1">
                {t('timerScramble')} ({scrambleType.toUpperCase()})
              </span>
              <p suppressHydrationWarning className="text-base sm:text-xl md:text-2xl font-mono font-medium tracking-wide text-white select-all leading-relaxed">
                {scramble}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={copyScramble}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5 transition-all text-xs flex items-center gap-1.5 font-medium"
                title={t('timerCopyScramble')}
              >
                {copied ? <Check className="w-4 h-4 text-[#00F5A0]" /> : <Copy className="w-4 h-4" />}
                <span className="hidden sm:inline">{copied ? t('timerCopied') : t('timerCopyScramble')}</span>
              </button>

              <button
                onClick={generateNewScramble}
                className="p-2.5 rounded-xl bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 text-[#00F0FF] border border-[#00F0FF]/30 transition-all text-xs flex items-center gap-1.5 font-bold"
                title={t('timerNewScramble')}
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">{t('timerNewScramble')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Center: Massive Focus Timer Digits (Dominant Stage Display) */}
        <div
          onTouchStart={() => {
            lastTouchTimeRef.current = Date.now();
            handleTouchStart();
          }}
          onTouchEnd={() => {
            lastTouchTimeRef.current = Date.now();
            handleTouchEnd();
          }}
          onMouseDown={() => {
            if (Date.now() - lastTouchTimeRef.current < 600) return;
            handleTouchStart();
          }}
          onMouseUp={() => {
            if (Date.now() - lastTouchTimeRef.current < 600) return;
            handleTouchEnd();
          }}
          className="my-auto py-8 sm:py-16 flex flex-col items-center justify-center cursor-pointer select-none relative group"
        >
          {/* Status Badge */}
          {status === 'inspecting' ? (
            <div className="flex items-center gap-2 mb-4 px-5 py-2 rounded-full bg-[#FF3B30]/20 border border-[#FF3B30]/40 text-[#FF3B30] text-sm sm:text-base font-mono font-bold animate-pulse shadow-lg shadow-[#FF3B30]/20">
              <AlertTriangle className="w-4 h-4" />
              <span>{t('timerInspection')}: {inspectionRemaining}s</span>
            </div>
          ) : status === 'ready' ? (
            <div className="flex items-center gap-2 mb-4 px-5 py-2 rounded-full bg-[#00F5A0]/20 border border-[#00F5A0]/50 text-[#00F5A0] text-sm sm:text-base font-mono font-bold shadow-lg shadow-[#00F5A0]/20 animate-bounce">
              <Sparkles className="w-4 h-4" />
              <span>{t('timerReady')} (THẢ PHÍM ĐỂ BẮT ĐẦU)</span>
            </div>
          ) : status === 'holding' ? (
            <div className="flex items-center gap-2 mb-4 px-5 py-2 rounded-full bg-[#FF3B30]/20 border border-[#FF3B30]/50 text-[#FF3B30] text-sm sm:text-base font-mono font-bold">
              <span>{t('timerHolding')}</span>
            </div>
          ) : null}

          {/* Enormous Timer Digits */}
          <div
            className={`font-mono font-black tracking-tighter transition-all duration-100 tabular-nums select-none ${getTimerColorClass()} ${
              isFocusMode
                ? 'text-[clamp(3.75rem,17vw,5.5rem)] sm:text-[140px] md:text-[180px] lg:text-[230px] xl:text-[270px]'
                : 'text-[clamp(3.25rem,15vw,4.5rem)] sm:text-9xl md:text-[130px] lg:text-[160px] xl:text-[180px]'
            } leading-none`}
          >
            {status === 'inspecting' ? inspectionRemaining : formatTime(elapsedMs)}
          </div>

          {/* Contextual instruction */}
          <p className="mt-5 sm:mt-6 text-center px-2 text-xs sm:text-sm font-sans tracking-wide text-white/40 transition-opacity group-hover:text-white/70">
            {status === 'running'
              ? '👉 Nhấn BẤT KỲ PHÍM NÀO hoặc chạm màn hình để dừng lại'
              : status === 'ready'
              ? 'Thả Space / Thả tay để bứt tốc!'
              : status === 'holding'
              ? 'Giữ yên 0.3s...'
              : 'Nhấn giữ SPACE hoặc chạm giữ vào 2 bàn tay bên dưới để chuẩn bị'}
          </p>

          {/* Dual StackMat Hand Touch Pads (WCA Style) */}
          <div
            className={`flex items-center justify-center gap-5 sm:gap-16 mt-6 sm:mt-8 transition-opacity duration-300 ${
              status === 'running' ? 'opacity-10' : 'opacity-100'
            }`}
          >
            {/* Left Touch Pad */}
            <div
              className={`flex flex-col items-center gap-2 p-4 rounded-3xl border transition-all ${
                status === 'ready'
                  ? 'bg-[#00F5A0]/20 border-[#00F5A0] shadow-[0_0_30px_rgba(0,245,160,0.5)] scale-105'
                  : status === 'holding'
                  ? 'bg-[#FF3B30]/20 border-[#FF3B30] shadow-[0_0_30px_rgba(255,59,48,0.5)]'
                  : 'bg-black/40 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <HandMetal className="w-6 h-6 text-white/60" />
              </div>
              <span className="text-[10px] font-mono uppercase text-white/40">Tay Trái</span>
            </div>

            {/* Right Touch Pad */}
            <div
              className={`flex flex-col items-center gap-2 p-4 rounded-3xl border transition-all ${
                status === 'ready'
                  ? 'bg-[#00F5A0]/20 border-[#00F5A0] shadow-[0_0_30px_rgba(0,245,160,0.5)] scale-105'
                  : status === 'holding'
                  ? 'bg-[#FF3B30]/20 border-[#FF3B30] shadow-[0_0_30px_rgba(255,59,48,0.5)]'
                  : 'bg-black/40 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <HandMetal className="w-6 h-6 text-white/60 scale-x-[-1]" />
              </div>
              <span className="text-[10px] font-mono uppercase text-white/40">Tay Phải</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Stats Pill Summary & 2D Scramble Preview */}
        <div
          className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/5 z-10 transition-opacity duration-300 ${
            status === 'running' ? 'opacity-15 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full sm:w-auto">
            <div className="px-4 py-2.5 bg-black/50 border border-white/10 rounded-2xl flex flex-col shadow-inner">
              <span className="text-[10px] text-white/40 uppercase font-mono">{t('timerAo5')}</span>
              <span className="text-base sm:text-lg font-mono font-bold text-[#00F0FF]">
                {currentAo5 ? formatTime(currentAo5) : '--'}
              </span>
            </div>

            <div className="px-4 py-2.5 bg-black/50 border border-white/10 rounded-2xl flex flex-col shadow-inner">
              <span className="text-[10px] text-white/40 uppercase font-mono">{t('timerAo12')}</span>
              <span className="text-base sm:text-lg font-mono font-bold text-[#00F5A0]">
                {currentAo12 ? formatTime(currentAo12) : '--'}
              </span>
            </div>

            <div className="px-4 py-2.5 bg-black/50 border border-white/10 rounded-2xl flex flex-col shadow-inner">
              <span className="text-[10px] text-white/40 uppercase font-mono">{t('timerBest')}</span>
              <span className="text-base sm:text-lg font-mono font-bold text-[#FFD700]">
                {bestSingle ? formatTime(bestSingle) : '--'}
              </span>
            </div>

            <div className="px-4 py-2.5 bg-black/50 border border-white/10 rounded-2xl flex flex-col shadow-inner">
              <span className="text-[10px] text-white/40 uppercase font-mono">{t('timerSolves')}</span>
              <span className="text-base sm:text-lg font-mono font-bold text-white/90">
                {solves.length}
              </span>
            </div>
          </div>

          {/* 2D Scramble Preview */}
          {showNet && (
            <div className="shrink-0">
              <ScrambleNet scramble={scramble} />
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar: History & Session (Hidden in Focus Mode) */}
      {!isFocusMode && (
        <div className="w-full xl:w-80 flex flex-col bg-[#080C16]/90 backdrop-blur-3xl border border-white/10 rounded-[32px] p-5 shadow-2xl shrink-0">
          <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#00F0FF]" />
              <h3 className="text-sm font-semibold tracking-wide text-white uppercase">
                {t('timerSession')} (Main 3x3)
              </h3>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#00F0FF]/10 text-[#00F0FF]">
              {solves.length}
            </span>
          </div>

          {/* Solve List with Linear-style scroll */}
          <div className="flex-1 overflow-y-auto max-h-[500px] space-y-2 pr-1 scrollbar-thin scrollbar-thumb-white/10">
            {solves.length === 0 ? (
              <div className="py-16 text-center text-white/30 text-xs font-mono">
                Chưa có lần giải nào. Bắt đầu bấm giờ ngay!
              </div>
            ) : (
              solves.map((solve, idx) => {
                const solveNumber = solves.length - idx;
                const isSelected = selectedSolveId === solve.id;
                const isPb = bestSingle === solve.timeMs;

                return (
                  <div
                    key={solve.id}
                    onClick={() => setSelectedSolveId(isSelected ? null : solve.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-white/15 border-[#00F0FF]/60 shadow-lg shadow-[#00F0FF]/15'
                        : 'bg-black/30 border-white/5 hover:border-white/15 hover:bg-black/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-white/40 w-6">#{solveNumber}</span>
                        <span
                          className={`text-sm font-mono font-bold ${
                            solve.penalty === 'DNF'
                              ? 'text-[#FF3B30]'
                              : isPb
                              ? 'text-[#FFD700]'
                              : 'text-white'
                          }`}
                        >
                          {formatTime(solve.timeMs)}
                          {solve.penalty === 'PlusTwo' && <span className="text-xs text-[#FF9500] ml-1">(+2)</span>}
                        </span>
                        {isPb && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#FFD700]/20 text-[#FFD700] rounded">
                            PB
                          </span>
                        )}
                      </div>

                      <span suppressHydrationWarning className="text-[10px] font-mono text-white/40">
                        {mounted
                          ? new Date(solve.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : solve.timestamp.slice(11, 16)}
                      </span>
                    </div>

                    {/* Expanded Actions for Selected Solve */}
                    {isSelected && (
                      <div className="pt-2 mt-1 border-t border-white/10 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateSolvePenalty(solve.id, solve.penalty === 'PlusTwo' ? 'None' : 'PlusTwo');
                            }}
                            className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-all ${
                              solve.penalty === 'PlusTwo'
                                ? 'bg-[#FF9500] text-black border-[#FF9500] font-bold'
                                : 'border-white/10 text-white/60 hover:text-white'
                            }`}
                          >
                            +2
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateSolvePenalty(solve.id, solve.penalty === 'DNF' ? 'None' : 'DNF');
                            }}
                            className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-all ${
                              solve.penalty === 'DNF'
                                ? 'bg-[#FF3B30] text-white border-[#FF3B30] font-bold'
                                : 'border-white/10 text-white/60 hover:text-white'
                            }`}
                          >
                            DNF
                          </button>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSolve(solve.id);
                          }}
                          className="p-1 rounded text-white/40 hover:text-[#FF3B30] transition-colors"
                          title={t('timerDeleteSolve')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Cinematic Solve Celebration Modal */}
      {celebration && (
        <SolveCelebration
          isOpen={celebration.isOpen}
          timeMs={celebration.timeMs}
          rawTimeMs={celebration.rawTimeMs}
          penalty={celebration.penalty}
          isPb={celebration.isPb}
          ao5={currentAo5}
          ao12={currentAo12}
          scramble={celebration.scramble}
          onClose={() => setCelebration(null)}
          onNextScramble={() => {
            setCelebration(null);
            generateNewScramble();
          }}
          onUpdatePenalty={(newPenalty) => {
            updateSolvePenalty(celebration.solveId, newPenalty);
            const eff = newPenalty === 'PlusTwo' ? celebration.rawTimeMs + 2000 : celebration.rawTimeMs;
            setCelebration({
              ...celebration,
              penalty: newPenalty,
              timeMs: eff
            });
          }}
        />
      )}
    </div>
  );
};
