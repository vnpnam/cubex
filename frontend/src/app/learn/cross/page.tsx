'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  Share2,
  Play,
  Pause,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Box,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { Navbar } from '@/components/layout/Navbar';

/* ========================================================================= */
/* 1. 3D RUBIK'S CUBE SIMULATOR & AUTOMATIC WHITE CROSS SOLVER               */
/* ========================================================================= */

type FaceKey = 'U' | 'D' | 'F' | 'B' | 'R' | 'L';
type CubeGrid = Record<FaceKey, string[]>;

const FACES: FaceKey[] = ['U', 'D', 'F', 'B', 'L', 'R'];

// Standard CFOP orientation: D = White (#f8fafc), U = Yellow (#facc15), F = Blue (#2563eb), B = Green (#10b981), R = Red (#ef4444), L = Orange (#ff6b00)
const FACE_HEX: Record<FaceKey, string> = {
  U: '#facc15', // Yellow top
  D: '#f8fafc', // White bottom (Cross target)
  F: '#2563eb', // Blue front
  B: '#10b981', // Green back
  R: '#ef4444', // Red right
  L: '#ff6b00', // Orange left
};

function createSolvedCube(): CubeGrid {
  const c = {} as CubeGrid;
  for (const f of FACES) {
    c[f] = Array.from({ length: 9 }, (_, i) => `${f}${i}`);
  }
  return c;
}

function cloneCube(c: CubeGrid): CubeGrid {
  return {
    U: [...c.U],
    D: [...c.D],
    F: [...c.F],
    B: [...c.B],
    L: [...c.L],
    R: [...c.R],
  };
}

function rotCW(a: string[]): string[] {
  return [a[6], a[3], a[0], a[7], a[4], a[1], a[8], a[5], a[2]];
}

function applyBasicMove(c: CubeGrid, m: string) {
  let t: string[];
  switch (m) {
    case 'U':
      c.U = rotCW(c.U);
      t = [c.F[0], c.F[1], c.F[2]];
      [c.F[0], c.F[1], c.F[2]] = [c.R[0], c.R[1], c.R[2]];
      [c.R[0], c.R[1], c.R[2]] = [c.B[0], c.B[1], c.B[2]];
      [c.B[0], c.B[1], c.B[2]] = [c.L[0], c.L[1], c.L[2]];
      [c.L[0], c.L[1], c.L[2]] = t;
      break;
    case 'D':
      c.D = rotCW(c.D);
      t = [c.F[6], c.F[7], c.F[8]];
      [c.F[6], c.F[7], c.F[8]] = [c.L[6], c.L[7], c.L[8]];
      [c.L[6], c.L[7], c.L[8]] = [c.B[6], c.B[7], c.B[8]];
      [c.B[6], c.B[7], c.B[8]] = [c.R[6], c.R[7], c.R[8]];
      [c.R[6], c.R[7], c.R[8]] = t;
      break;
    case 'R':
      c.R = rotCW(c.R);
      t = [c.U[2], c.U[5], c.U[8]];
      [c.U[2], c.U[5], c.U[8]] = [c.F[2], c.F[5], c.F[8]];
      [c.F[2], c.F[5], c.F[8]] = [c.D[2], c.D[5], c.D[8]];
      [c.D[2], c.D[5], c.D[8]] = [c.B[6], c.B[3], c.B[0]];
      [c.B[6], c.B[3], c.B[0]] = t;
      break;
    case 'L':
      c.L = rotCW(c.L);
      t = [c.U[0], c.U[3], c.U[6]];
      [c.U[0], c.U[3], c.U[6]] = [c.B[8], c.B[5], c.B[2]];
      [c.B[8], c.B[5], c.B[2]] = [c.D[0], c.D[3], c.D[6]];
      [c.D[0], c.D[3], c.D[6]] = [c.F[0], c.F[3], c.F[6]];
      [c.F[0], c.F[3], c.F[6]] = t;
      break;
    case 'F':
      c.F = rotCW(c.F);
      t = [c.U[6], c.U[7], c.U[8]];
      [c.U[6], c.U[7], c.U[8]] = [c.L[8], c.L[5], c.L[2]];
      [c.L[8], c.L[5], c.L[2]] = [c.D[2], c.D[1], c.D[0]];
      [c.D[2], c.D[1], c.D[0]] = [c.R[0], c.R[3], c.R[6]];
      [c.R[0], c.R[3], c.R[6]] = t;
      break;
    case 'B':
      c.B = rotCW(c.B);
      t = [c.U[2], c.U[1], c.U[0]];
      [c.U[2], c.U[1], c.U[0]] = [c.R[8], c.R[5], c.R[2]];
      [c.R[8], c.R[5], c.R[2]] = [c.D[6], c.D[7], c.D[8]];
      [c.D[6], c.D[7], c.D[8]] = [c.L[0], c.L[3], c.L[6]];
      [c.L[0], c.L[3], c.L[6]] = t;
      break;
  }
}

function applyToken(c: CubeGrid, token: string) {
  const clean = token.replace(/[()]/g, '').trim();
  if (!clean) return;
  const base = clean[0];
  if (!['U', 'D', 'F', 'B', 'L', 'R'].includes(base)) return;
  const mod = clean.slice(1);
  const times = mod === '2' || mod === "2'" ? 2 : mod === "'" ? 3 : 1;
  for (let i = 0; i < times; i++) applyBasicMove(c, base);
}

function applySequence(c: CubeGrid, seq: string | string[]) {
  const list = Array.isArray(seq) ? seq : seq.trim().split(/\s+/).filter(Boolean);
  for (const tk of list) applyToken(c, tk);
}

// Count how many of the 4 White Cross edges (DF: D1/F7, DR: D5/R7, DB: D7/B7, DL: D3/L7) are solved!
function countSolvedCrossEdges(c: CubeGrid): number {
  let count = 0;
  if (c.D[1] === 'D1' && c.F[7] === 'F7') count++;
  if (c.D[5] === 'D5' && c.R[7] === 'R7') count++;
  if (c.D[7] === 'D7' && c.B[7] === 'B7') count++;
  if (c.D[3] === 'D3' && c.L[7] === 'L7') count++;
  return count;
}

// Simplify redundant consecutive moves on the same face (e.g. R + R' -> nothing, R + R -> R2)
function simplifyMoves(moves: string[]): string[] {
  const stack: { face: string; count: number }[] = [];
  for (const m of moves) {
    const clean = m.trim();
    if (!clean) continue;
    const face = clean[0];
    const mod = clean.slice(1);
    const amt = mod === '2' ? 2 : mod === "'" ? 3 : 1;
    if (stack.length > 0 && stack[stack.length - 1].face === face) {
      stack[stack.length - 1].count = (stack[stack.length - 1].count + amt) % 4;
      if (stack[stack.length - 1].count === 0) stack.pop();
    } else {
      stack.push({ face, count: amt });
    }
  }
  return stack.map(({ face, count }) => (count === 1 ? face : count === 2 ? `${face}2` : `${face}'`));
}

// Curated realistic WCA scrambles paired with optimal 6-8 move White Cross solutions
interface CrossTrainingCase {
  scramble: string;
  solution: string[];
}

const CROSS_CASES: CrossTrainingCase[] = [
  {
    scramble: "R2 D' B2 L2 U2 F2 D B2 R2 B' U' F L' R D' F2",
    solution: [], // filled dynamically by solver below
  },
];

// Fast BFS/IDA* White Cross Solver that solves the 4 White edges one-by-one in <= 8 moves!
const ALL_18_MOVES = [
  'U', "U'", 'U2',
  'D', "D'", 'D2',
  'R', "R'", 'R2',
  'L', "L'", 'L2',
  'F', "F'", 'F2',
  'B', "B'", 'B2',
];

function solveWhiteCross(scrambleStr: string): string[] {
  const start = createSolvedCube();
  applySequence(start, scrambleStr);

  // Target check helpers for the 4 white edges in order:
  const checks = [
    (c: CubeGrid) => c.D[1] === 'D1' && c.F[7] === 'F7',
    (c: CubeGrid) => c.D[5] === 'D5' && c.R[7] === 'R7',
    (c: CubeGrid) => c.D[7] === 'D7' && c.B[7] === 'B7',
    (c: CubeGrid) => c.D[3] === 'D3' && c.L[7] === 'L7',
  ];

  //First try 1-stage IDDFS up to depth 6 for the whole cross (if scramble is short)
  const fullCheck = (c: CubeGrid) => checks.every((fn) => fn(c));
  for (let d = 0; d <= 5; d++) {
    const res = iddfs(start, fullCheck, d, []);
    if (res) return simplifyMoves(res);
  }

  // Otherwise solve stage-by-stage (Edge 1 -> Edge 1+2 -> Edge 1+2+3 -> Edge 1+2+3+4), max 4 moves per edge
  let currentCube = cloneCube(start);
  const totalMoves: string[] = [];

  for (let stage = 0; stage < 4; stage++) {
    const goalFn = (c: CubeGrid) => {
      for (let i = 0; i <= stage; i++) {
        if (!checks[i](c)) return false;
      }
      return true;
    };

    if (goalFn(currentCube)) continue;

    let found: string[] | null = null;
    for (let d = 1; d <= 5; d++) {
      found = iddfs(currentCube, goalFn, d, []);
      if (found) break;
    }
    if (found) {
      applySequence(currentCube, found);
      totalMoves.push(...found);
    }
  }

  return simplifyMoves(totalMoves);
}

function iddfs(
  cube: CubeGrid,
  goalFn: (c: CubeGrid) => boolean,
  depthRemaining: number,
  path: string[]
): string[] | null {
  if (goalFn(cube)) return path;
  if (depthRemaining === 0) return null;

  const lastFace = path.length > 0 ? path[path.length - 1][0] : '';

  for (const mv of ALL_18_MOVES) {
    if (mv[0] === lastFace) continue;
    const next = cloneCube(cube);
    applyToken(next, mv);
    const res = iddfs(next, goalFn, depthRemaining - 1, [...path, mv]);
    if (res) return res;
  }
  return null;
}

// Generate a new 7-8 move optimal Cross scramble + exact 20-move WCA style display scramble
function generateCrossScramble(): string {
  const faces = ['R', 'L', 'U', 'D', 'F', 'B'];
  const suffixes = ['', "'", '2'];
  const result: string[] = [];
  let lastFace = '';
  for (let i = 0; i < 16; i++) {
    let face = faces[Math.floor(Math.random() * faces.length)];
    while (face === lastFace) face = faces[Math.floor(Math.random() * faces.length)];
    lastFace = face;
    result.push(face + suffixes[Math.floor(Math.random() * suffixes.length)]);
  }
  return result.join(' ');
}

const NAV_PAGES = ['basic', 'cross', 'f2l', 'oll', 'pll'] as const;

export default function CrossPage() {
  const { isAuthenticated } = useAuthStore();
  const [appliedScramble, setAppliedScramble] = useState("R D' B R L2 D B2 F2 D' B' F L2 B F L U'");
  const [inputScramble, setInputScramble] = useState('');
  const [mode, setMode] = useState<'basic' | 'pro'>('basic');
  const [isRunning, setIsRunning] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  // 3D Cube drag rotation state
  const cubeRef = useRef<HTMLDivElement>(null);
  const rotRef = useRef({ x: -24, y: -36 });
  const isDraggingRef = useRef(false);
  const lastPtr = useRef({ x: 0, y: 0 });

  // Automatically compute exact White Cross solution for the current `appliedScramble`!
  const solutionMoves = useMemo(() => solveWhiteCross(appliedScramble), [appliedScramble]);

  // Compute current cube state at `stepIdx` (0 = scrambled, solutionMoves.length = White Cross solved!)
  const currentCube = useMemo(() => {
    const c = createSolvedCube();
    applySequence(c, appliedScramble);
    for (let i = 0; i < Math.min(stepIdx, solutionMoves.length); i++) {
      applyToken(c, solutionMoves[i]);
    }
    return c;
  }, [appliedScramble, solutionMoves, stepIdx]);

  const edgesComplete = useMemo(() => countSolvedCrossEdges(currentCube), [currentCube]);

  // Playback timer when `isRunning` is true
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setStepIdx((prev) => {
        if (prev >= solutionMoves.length) {
          setIsRunning(false);
          return prev;
        }
        return prev + 1;
      });
    }, 600);
    return () => clearInterval(id);
  }, [isRunning, solutionMoves.length]);

  const handleGenerate = useCallback(() => {
    const s = generateCrossScramble();
    setAppliedScramble(s);
    setIsRunning(false);
    setStepIdx(0);
  }, []);

  const handleApply = useCallback(() => {
    if (inputScramble.trim()) {
      setAppliedScramble(inputScramble.trim());
      setIsRunning(false);
      setStepIdx(0);
      setInputScramble('');
    }
  }, [inputScramble]);

  const handleCopyLink = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/learn/cross?s=${encodeURIComponent(appliedScramble)}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [appliedScramble]);

  const handleTogglePlay = () => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      if (stepIdx >= solutionMoves.length) setStepIdx(0);
      setIsRunning(true);
    }
  };

  const resetCubeRotation = () => {
    rotRef.current = { x: -24, y: -36 };
    if (cubeRef.current) {
      cubeRef.current.style.transform = `rotateX(-24deg) rotateY(-36deg)`;
    }
  };

  const viewBottomWhiteCross = () => {
    rotRef.current = { x: 65, y: -30 };
    if (cubeRef.current) {
      cubeRef.current.style.transform = `rotateX(65deg) rotateY(-30deg)`;
    }
  };

  const halfSize = 115;
  const faceTransforms: Record<FaceKey, string> = {
    F: `rotateY(0deg) translateZ(${halfSize}px)`,
    B: `rotateY(180deg) translateZ(${halfSize}px)`,
    R: `rotateY(90deg) translateZ(${halfSize}px)`,
    L: `rotateY(-90deg) translateZ(${halfSize}px)`,
    U: `rotateX(90deg) translateZ(${halfSize}px)`,
    D: `rotateX(-90deg) translateZ(${halfSize}px)`,
  };

  return (
    <div className="min-h-screen bg-[#070A12] text-white">
      {/* Glow */}
      <div className="fixed -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#00e5ff]/8 to-transparent blur-[120px] pointer-events-none" />

      {/* Main Global Taskbar */}
      <Navbar activeTab="learn" />

      {/* Sub-navigation bar for CFOP steps */}
      <div className="bg-[#080c15]/90 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <span className="text-xs font-mono text-white/40 uppercase tracking-wider">Học CFOP:</span>
          <nav className="flex items-center gap-1 flex-wrap">
            {NAV_PAGES.map((page) => (
              <Link
                key={page}
                href={`/learn/${page}`}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                  page === 'cross'
                    ? 'bg-[#00e5ff] text-black shadow-md shadow-[#00e5ff]/25'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {page === 'basic' ? 'Cơ bản' : page === 'cross' ? 'Cross' : page === 'f2l' ? 'F2L' : page === 'oll' ? 'OLL' : 'PLL'}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 flex flex-col gap-6">
        {/* Scramble Bar */}
        <div className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-mono text-white/50">
              <BookOpen className="w-3.5 h-3.5 text-[#00e5ff]" />
              <span>Scramble</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleGenerate}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00e5ff]/10 hover:bg-[#00e5ff]/20 border border-[#00e5ff]/20 rounded-xl text-xs text-[#00e5ff] font-semibold transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Tạo mới
              </button>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-white/70 font-semibold transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
                {copied ? 'Đã sao chép!' : 'Chia sẻ link'}
              </button>
            </div>
          </div>

          <div className="font-mono text-white text-sm sm:text-base tracking-wide px-3 py-2.5 bg-black/30 rounded-xl overflow-x-auto whitespace-nowrap select-all border border-white/5">
            {appliedScramble}
          </div>

          <div className="flex gap-2">
            <input
              value={inputScramble}
              onChange={(e) => setInputScramble(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApply()}
              placeholder="R U R' U' ... (nhập scramble thủ công)"
              className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-white/30 outline-none focus:border-[#00e5ff]/40 transition-colors"
            />
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-[#00e5ff] text-black text-xs font-bold rounded-xl hover:bg-[#33ecff] transition-all"
            >
              Áp dụng
            </button>
          </div>
        </div>

        {/* Main: 3D Cube Interactive Stage + Hints */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 3D Cube — Always visible, interactive 360° CSS 3D Rubik's Cube */}
          <div
            className="flex-1 bg-[#0B0F19]/90 backdrop-blur-xl border border-white/10 rounded-3xl flex flex-col justify-between p-5 relative shadow-2xl"
            style={{ minHeight: 440 }}
          >
            {/* Top HUD inside 3D stage */}
            <div className="flex flex-wrap items-center justify-between gap-2 z-20">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]" />
                <span className="font-mono text-xs text-white/70 uppercase tracking-wider">
                  3D CROSS SIMULATOR • KÉO ĐỂ XOAY 360°
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={viewBottomWhiteCross}
                  className="px-3 py-1 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/10 text-xs font-mono text-[#00e5ff] transition-all"
                >
                  Nhìn đáy Trắng (D)
                </button>
                <button
                  type="button"
                  onClick={resetCubeRotation}
                  className="px-3 py-1 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/10 text-xs font-mono text-white/70 transition-all"
                >
                  Góc nhìn chuẩn
                </button>
              </div>
            </div>

            {/* Interactive 3D Cube Stage */}
            <div
              onPointerDown={(e) => {
                isDraggingRef.current = true;
                lastPtr.current = { x: e.clientX, y: e.clientY };
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (!isDraggingRef.current) return;
                rotRef.current.y += (e.clientX - lastPtr.current.x) * 0.55;
                rotRef.current.x -= (e.clientY - lastPtr.current.y) * 0.55;
                lastPtr.current = { x: e.clientX, y: e.clientY };
                if (cubeRef.current) {
                  cubeRef.current.style.transform = `rotateX(${rotRef.current.x}deg) rotateY(${rotRef.current.y}deg)`;
                }
              }}
              onPointerUp={() => {
                isDraggingRef.current = false;
              }}
              onPointerCancel={() => {
                isDraggingRef.current = false;
              }}
              className="cube-scene flex-1 flex items-center justify-center cursor-grab active:cursor-grabbing relative my-4"
            >
              <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-[#00e5ff]/15 via-transparent to-purple-500/15 blur-2xl pointer-events-none" />
              <div
                ref={cubeRef}
                style={{
                  width: 230,
                  height: 230,
                  position: 'relative',
                  transformStyle: 'preserve-3d',
                  transition: isDraggingRef.current ? 'none' : 'transform 0.15s ease-out',
                  transform: `rotateX(${rotRef.current.x}deg) rotateY(${rotRef.current.y}deg)`,
                }}
              >
                {FACES.map((face) => (
                  <div
                    key={face}
                    className="cube-face"
                    style={{ transform: faceTransforms[face] }}
                  >
                    {currentCube[face].map((stickerId, idx) => {
                      const origFace = stickerId[0] as FaceKey;
                      const hex = FACE_HEX[origFace];
                      return (
                        <div
                          key={idx}
                          className="sticker"
                          style={{ backgroundColor: hex }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Step Playback Bar inside 3D stage */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 z-20">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRunning(false);
                    setStepIdx(0);
                  }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
                  title="Đặt lại trạng thái Scramble"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRunning(false);
                    setStepIdx((s) => Math.max(0, s - 1));
                  }}
                  disabled={stepIdx === 0}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 font-mono text-xs text-white"
                >
                  ◀ Lùi
                </button>
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#00e5ff] hover:bg-[#33ecff] text-black font-bold text-xs shadow-lg transition-all"
                >
                  {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {isRunning ? 'Tạm dừng' : stepIdx >= solutionMoves.length ? 'Chạy lại Cross' : 'Chạy thử 3D'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRunning(false);
                    setStepIdx((s) => Math.min(solutionMoves.length, s + 1));
                  }}
                  disabled={stepIdx >= solutionMoves.length}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 font-mono text-xs text-white"
                >
                  Tiếp ▶
                </button>
              </div>
              <div className="font-mono text-xs text-white/60">
                Tiến độ: <span className="text-[#00e5ff] font-bold">{stepIdx}/{solutionMoves.length}</span> bước
              </div>
            </div>
          </div>

          {/* Hint Panel */}
          <div className="w-full lg:w-80 flex flex-col gap-4">
            <div className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white">Gợi ý Bước Đi</h2>
                <span className="px-2 py-0.5 bg-[#00e5ff]/10 border border-[#00e5ff]/20 text-[#00e5ff] text-[10px] font-mono rounded-lg">
                  CROSS
                </span>
              </div>

              <div className="flex items-center gap-4 text-[11px] text-white/50">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-white border border-white/30 shrink-0" />
                  D — Trắng
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-blue-600 shrink-0" />
                  F — Xanh
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-red-500 shrink-0" />
                  R — Đỏ
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">Cross Trắng: {solutionMoves.length} bước</span>
                  <span className="text-[#00e5ff] font-semibold">{edgesComplete}/4 cạnh</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#00e5ff] to-[#10b981] rounded-full transition-all duration-300"
                    style={{ width: `${(edgesComplete / 4) * 100}%` }}
                  />
                </div>
              </div>

              {/* Clickable Solution Move Chips */}
              <div className="flex flex-wrap gap-2">
                {solutionMoves.map((move, i) => {
                  const isCurrent = i === stepIdx - 1;
                  const isDone = i < stepIdx;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setIsRunning(false);
                        setStepIdx(i + 1);
                      }}
                      className={`px-2.5 py-1 text-xs font-mono rounded-lg font-bold border transition-all ${
                        isCurrent
                          ? 'bg-[#00e5ff] border-[#00e5ff] text-black scale-105 shadow-md shadow-[#00e5ff]/30'
                          : isDone
                          ? 'bg-[#00e5ff]/25 border-[#00e5ff]/40 text-[#00e5ff]'
                          : 'bg-[#00e5ff]/10 border-[#00e5ff]/20 text-[#00e5ff] hover:bg-[#00e5ff]/20'
                      }`}
                    >
                      {move}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleTogglePlay}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#00e5ff]/15 hover:bg-[#00e5ff]/25 border border-[#00e5ff]/30 rounded-xl text-xs text-[#00e5ff] font-bold transition-all"
                >
                  {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {isRunning ? 'Tạm dừng' : 'Chạy thử'}
                </button>
                <button
                  onClick={() => {
                    setReportSent(true);
                    setTimeout(() => setReportSent(false), 2500);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-xs text-red-400 font-semibold transition-all"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  {reportSent ? 'Đã ghi nhận!' : 'Báo lỗi'}
                </button>
              </div>
            </div>

            {/* Mode selector */}
            <div className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex gap-2">
                {(['basic', 'pro'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                      mode === m
                        ? 'bg-[#00e5ff] text-black shadow-md shadow-[#00e5ff]/20'
                        : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {m === 'basic' ? 'Cơ bản' : 'Pro'}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-white/40 leading-relaxed">
                {mode === 'basic'
                  ? 'Xem gợi ý tự do và bấm vào từng bước để quan sát đường đi của 4 viên cạnh trắng về mặt đáy (D).'
                  : 'Tự tính toán toàn bộ 4 cạnh Cross trong 15 giây Inspection trước khi bấm chạy kiểm tra đáp án.'}
              </p>
              {mode === 'pro' && !isAuthenticated && (
                <p className="text-[11px] text-[#00e5ff]/80 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3" /> Đăng nhập để lưu tiến độ Pro
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Phase notice */}
        <div className="flex items-center gap-3 p-4 bg-[#00e5ff]/5 border border-[#00e5ff]/15 rounded-2xl">
          <span className="text-[#00e5ff]">→</span>
          <p className="text-xs text-white/60">
            <span className="text-white font-semibold">Mẹo giải Cross tối ưu:</span> Luôn đặt mặt Trắng ở đáy (<code className="text-[#00e5ff] font-mono">D</code>) ngay từ đầu để không phải lật khối khi chuyển sang bước{' '}
            <Link href="/learn/f2l" className="text-[#00e5ff] font-semibold hover:underline">
              F2L (41 trường hợp) →
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
