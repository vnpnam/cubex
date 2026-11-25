'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import {
  BookOpen,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  ChevronRight,
  Compass,
  Award,
  Box,
} from 'lucide-react';

/* ========================================================================= */
/* 1. MINI 3D CUBE SIMULATOR & INTERACTIVE VIEWER FOR NOTATION & STEPS       */
/* ========================================================================= */

type FaceKey = 'U' | 'D' | 'F' | 'B' | 'R' | 'L';
type CubeState = Record<FaceKey, string[]>;

// Colors for standard cube (U=White for Steps 1-2 or Yellow for Steps 3-7)
const COLORS_YELLOW_TOP: Record<FaceKey, string> = {
  U: '#facc15', // Yellow
  D: '#f8fafc', // White
  F: '#ef4444', // Red
  R: '#10b981', // Green
  B: '#ff6b00', // Orange
  L: '#0066ff', // Blue
};

const COLORS_WHITE_TOP: Record<FaceKey, string> = {
  U: '#f8fafc', // White on top (for Steps 1 & 2 as described in the guide)
  D: '#facc15', // Yellow on bottom
  F: '#ef4444', // Red
  R: '#0066ff', // Blue
  B: '#ff6b00', // Orange
  L: '#10b981', // Green
};

function createSolvedCube(whiteTop = false): CubeState {
  const palette = whiteTop ? COLORS_WHITE_TOP : COLORS_YELLOW_TOP;
  return {
    U: Array(9).fill(palette.U),
    D: Array(9).fill(palette.D),
    F: Array(9).fill(palette.F),
    B: Array(9).fill(palette.B),
    R: Array(9).fill(palette.R),
    L: Array(9).fill(palette.L),
  };
}

function rotateFaceCW(arr: string[]): string[] {
  return [arr[6], arr[3], arr[0], arr[7], arr[4], arr[1], arr[8], arr[5], arr[2]];
}

function applyMoveToState(prev: CubeState, move: string): CubeState {
  const next: CubeState = {
    U: [...prev.U],
    D: [...prev.D],
    F: [...prev.F],
    B: [...prev.B],
    R: [...prev.R],
    L: [...prev.L],
  };
  const clean = move.replace(/[()]/g, '').trim();
  if (!clean) return next;
  const base = clean[0];
  const times = clean.includes("'") ? 3 : clean.includes('2') ? 2 : 1;

  for (let t = 0; t < times; t++) {
    if (base === 'U') {
      next.U = rotateFaceCW(next.U);
      const temp = [next.F[0], next.F[1], next.F[2]];
      [next.F[0], next.F[1], next.F[2]] = [next.R[0], next.R[1], next.R[2]];
      [next.R[0], next.R[1], next.R[2]] = [next.B[0], next.B[1], next.B[2]];
      [next.B[0], next.B[1], next.B[2]] = [next.L[0], next.L[1], next.L[2]];
      [next.L[0], next.L[1], next.L[2]] = temp;
    } else if (base === 'D') {
      next.D = rotateFaceCW(next.D);
      const temp = [next.F[6], next.F[7], next.F[8]];
      [next.F[6], next.F[7], next.F[8]] = [next.L[6], next.L[7], next.L[8]];
      [next.L[6], next.L[7], next.L[8]] = [next.B[6], next.B[7], next.B[8]];
      [next.B[6], next.B[7], next.B[8]] = [next.R[6], next.R[7], next.R[8]];
      [next.R[6], next.R[7], next.R[8]] = temp;
    } else if (base === 'R') {
      next.R = rotateFaceCW(next.R);
      const temp = [next.U[2], next.U[5], next.U[8]];
      [next.U[2], next.U[5], next.U[8]] = [next.F[2], next.F[5], next.F[8]];
      [next.F[2], next.F[5], next.F[8]] = [next.D[2], next.D[5], next.D[8]];
      [next.D[2], next.D[5], next.D[8]] = [next.B[6], next.B[3], next.B[0]];
      [next.B[6], next.B[3], next.B[0]] = temp;
    } else if (base === 'L') {
      next.L = rotateFaceCW(next.L);
      const temp = [next.U[0], next.U[3], next.U[6]];
      [next.U[0], next.U[3], next.U[6]] = [next.B[8], next.B[5], next.B[2]];
      [next.B[8], next.B[5], next.B[2]] = [next.D[0], next.D[3], next.D[6]];
      [next.D[0], next.D[3], next.D[6]] = [next.F[0], next.F[3], next.F[6]];
      [next.F[0], next.F[3], next.F[6]] = temp;
    } else if (base === 'F') {
      next.F = rotateFaceCW(next.F);
      const temp = [next.U[6], next.U[7], next.U[8]];
      [next.U[6], next.U[7], next.U[8]] = [next.L[8], next.L[5], next.L[2]];
      [next.L[8], next.L[5], next.L[2]] = [next.D[2], next.D[1], next.D[0]];
      [next.D[2], next.D[1], next.D[0]] = [next.R[0], next.R[3], next.R[6]];
      [next.R[0], next.R[3], next.R[6]] = temp;
    } else if (base === 'B') {
      next.B = rotateFaceCW(next.B);
      const temp = [next.U[2], next.U[1], next.U[0]];
      [next.U[2], next.U[1], next.U[0]] = [next.R[8], next.R[5], next.R[2]];
      [next.R[8], next.R[5], next.R[2]] = [next.D[6], next.D[7], next.D[8]];
      [next.D[6], next.D[7], next.D[8]] = [next.L[0], next.L[3], next.L[6]];
      [next.L[0], next.L[3], next.L[6]] = temp;
    }
  }
  return next;
}

function cU8(c: CubeState): string {
  return c.U[8];
}

function applyFMoveCorrect(prev: CubeState, move: string): CubeState {
  const clean = move.replace(/[()]/g, '').trim();
  if (!clean) return prev;
  const base = clean[0];
  if (base !== 'F') return applyMoveToState(prev, move);

  const next: CubeState = {
    U: [...prev.U],
    D: [...prev.D],
    F: [...prev.F],
    B: [...prev.B],
    R: [...prev.R],
    L: [...prev.L],
  };
  const times = clean.includes("'") ? 3 : clean.includes('2') ? 2 : 1;
  for (let t = 0; t < times; t++) {
    next.F = rotateFaceCW(next.F);
    const temp = [next.U[6], next.U[7], next.U[8]];
    [next.U[6], next.U[7], next.U[8]] = [next.L[8], next.L[5], next.L[2]];
    [next.L[8], next.L[5], next.L[2]] = [next.D[2], next.D[1], next.D[0]];
    [next.D[2], next.D[1], next.D[0]] = [next.R[0], next.R[3], next.R[6]];
    [next.R[0], next.R[3], next.R[6]] = temp;
  }
  return next;
}

function invertSequence(alg: string): string[] {
  return alg
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .reverse()
    .map((tk) => {
      const b = tk[0];
      const m = tk.slice(1);
      if (m === '2') return `${b}2`;
      if (m === "'") return b;
      return `${b}'`;
    });
}

/* ========================================================================= */
/* 2. SVG NOTATION DIAGRAM CARD (Visual 3D Cube Diagram with Arrows)         */
/* ========================================================================= */

interface NotationItem {
  code: string;
  title: string;
  desc: string;
  face: 'F' | 'R' | 'L' | 'U' | 'D' | 'B';
  ccw?: boolean;
}

const NOTATION_LIST: NotationItem[] = [
  { code: 'R', title: 'Right (Phải - Thuận)', desc: 'Xoay mặt bên phải theo chiều kim đồng hồ (đẩy lên).', face: 'R' },
  { code: "R'", title: 'Right Prime (Phải - Ngược)', desc: 'Xoay mặt bên phải ngược chiều kim đồng hồ (kéo xuống).', face: 'R', ccw: true },
  { code: 'L', title: 'Left (Trái - Thuận)', desc: 'Xoay mặt bên trái theo chiều kim đồng hồ (kéo xuống).', face: 'L' },
  { code: "L'", title: 'Left Prime (Trái - Ngược)', desc: 'Xoay mặt bên trái ngược chiều kim đồng hồ (đẩy lên).', face: 'L', ccw: true },
  { code: 'U', title: 'Up (Trên - Thuận)', desc: 'Xoay tầng trên cùng theo chiều kim đồng hồ (sang trái).', face: 'U' },
  { code: "U'", title: 'Up Prime (Trên - Ngược)', desc: 'Xoay tầng trên cùng ngược chiều kim đồng hồ (sang phải).', face: 'U', ccw: true },
  { code: 'D', title: 'Down (Dưới - Thuận)', desc: 'Xoay tầng dưới cùng theo chiều kim đồng hồ (sang phải).', face: 'D' },
  { code: "D'", title: 'Down Prime (Dưới - Ngược)', desc: 'Xoay tầng dưới cùng ngược chiều kim đồng hồ (sang trái).', face: 'D', ccw: true },
  { code: 'F', title: 'Front (Trước - Thuận)', desc: 'Xoay mặt trước theo chiều kim đồng hồ (sang phải).', face: 'F' },
  { code: "F'", title: 'Front Prime (Trước - Ngược)', desc: 'Xoay mặt trước ngược chiều kim đồng hồ (sang trái).', face: 'F', ccw: true },
  { code: 'B', title: 'Back (Sau - Thuận)', desc: 'Xoay mặt sau theo chiều kim đồng hồ.', face: 'B' },
  { code: "B'", title: 'Back Prime (Sau - Ngược)', desc: 'Xoay mặt sau ngược chiều kim đồng hồ.', face: 'B', ccw: true },
];

function NotationDiagramSVG({ item }: { item: NotationItem }) {
  // Isometric 3x3 cube SVG highlighting the rotating layer in Neon Cyan/Yellow with directional arrow!
  const cx = 70;
  const cy = 68;
  const dx = 17;
  const dy = 9.2;
  const dz = 18.5;

  const poly = (pts: [number, number][]) => pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

  const isUHighlighted = (r: number, c: number) => {
    if (item.face === 'U') return true;
    if (item.face === 'R' && c === 2) return true;
    if (item.face === 'L' && c === 0) return true;
    if (item.face === 'F' && r === 2) return true;
    if (item.face === 'B' && r === 0) return true;
    return false;
  };

  const isFHighlighted = (r: number, c: number) => {
    if (item.face === 'F') return true;
    if (item.face === 'U' && r === 0) return true;
    if (item.face === 'D' && r === 2) return true;
    if (item.face === 'R' && c === 2) return true;
    if (item.face === 'L' && c === 0) return true;
    return false;
  };

  const isRHighlighted = (r: number, c: number) => {
    if (item.face === 'R') return true;
    if (item.face === 'U' && r === 0) return true;
    if (item.face === 'D' && r === 2) return true;
    if (item.face === 'F' && c === 0) return true;
    if (item.face === 'B' && c === 2) return true;
    return false;
  };

  const uPolys = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const i0 = 2 - c, i1 = 3 - c, j0 = 2 - r, j1 = 3 - r;
      const pt = (i: number, j: number): [number, number] => [cx - i * dx + j * dx, cy - i * dy - j * dy];
      const hi = isUHighlighted(r, c);
      uPolys.push({
        key: `u-${r}-${c}`,
        pts: poly([pt(i0, j0), pt(i1, j0), pt(i1, j1), pt(i0, j1)]),
        fill: hi ? '#facc15' : '#262b38',
      });
    }
  }

  const fPolys = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const i0 = 2 - c, i1 = 3 - c, k0 = r, k1 = r + 1;
      const pt = (i: number, k: number): [number, number] => [cx - i * dx, cy - i * dy + k * dz];
      const hi = isFHighlighted(r, c);
      fPolys.push({
        key: `f-${r}-${c}`,
        pts: poly([pt(i0, k0), pt(i1, k0), pt(i1, k1), pt(i0, k1)]),
        fill: hi ? '#ef4444' : '#1e222d',
      });
    }
  }

  const rPolys = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const j0 = c, j1 = c + 1, k0 = r, k1 = r + 1;
      const pt = (j: number, k: number): [number, number] => [cx + j * dx, cy - j * dy + k * dz];
      const hi = isRHighlighted(r, c);
      rPolys.push({
        key: `r-${r}-${c}`,
        pts: poly([pt(j0, k0), pt(j1, k0), pt(j1, k1), pt(j0, k1)]),
        fill: hi ? '#10b981' : '#171a24',
      });
    }
  }

  // Helper to render a line with an accurately rotated triangular arrowhead at (x2, y2)
  const drawArrowLine = (x1: number, y1: number, x2: number, y2: number, color = '#00e5ff') => {
    const angleRad = Math.atan2(y2 - y1, x2 - x1);
    const angleDeg = (angleRad * 180) / Math.PI;
    // Shorten line end slightly so the stroke doesn't poke through the arrowhead tip
    const lx2 = x2 - Math.cos(angleRad) * 4;
    const ly2 = y2 - Math.sin(angleRad) * 4;
    return (
      <g>
        <line x1={x1} y1={y1} x2={lx2} y2={ly2} stroke={color} strokeWidth="3.5" strokeLinecap="round" />
        <polygon
          points="2,0 -7,-5.2 -7,5.2"
          fill={color}
          transform={`translate(${x2.toFixed(1)}, ${y2.toFixed(1)}) rotate(${angleDeg.toFixed(1)})`}
        />
      </g>
    );
  };

  // Directional arrow coordinates based on face & direction (aligned with isometric axes)
  const renderDirectionArrow = () => {
    if (item.face === 'R') {
      // Right column of F face: center x = cx - 0.5*dx = 61.5
      // R (CW) pushes UP; R' (CCW) pulls DOWN
      const x = cx - 8.5;
      const yTop = cy - 1.5;
      const yBot = cy + 37;
      return item.ccw ? drawArrowLine(x, yTop, x, yBot) : drawArrowLine(x, yBot, x, yTop);
    }
    if (item.face === 'L') {
      // Left column of F face: center x = cx - 2.5*dx = 27.5
      // L (CW) pulls DOWN; L' (CCW) pushes UP
      const x = cx - 42.5;
      const yTop = cy - 18.5;
      const yBot = cy + 20;
      return item.ccw ? drawArrowLine(x, yBot, x, yTop) : drawArrowLine(x, yTop, x, yBot);
    }
    if (item.face === 'U') {
      // Top row of F face: along F's top slope from right (cx - 0.5*dx, cy + 4) to left (cx - 2.5*dx, cy - 14.5)
      // U (CW) moves right -> left; U' (CCW) moves left -> right
      const xRight = cx - 8.5, yRight = cy + 4.5;
      const xLeft = cx - 42.5, yLeft = cy - 14;
      return item.ccw
        ? drawArrowLine(xLeft, yLeft, xRight, yRight)
        : drawArrowLine(xRight, yRight, xLeft, yLeft);
    }
    if (item.face === 'D') {
      // Bottom row of F face: along F's bottom slope
      // D (CW) moves left -> right; D' (CCW) moves right -> left
      const xLeft = cx - 42.5, yLeft = cy + 23;
      const xRight = cx - 8.5, yRight = cy + 41.5;
      return item.ccw
        ? drawArrowLine(xRight, yRight, xLeft, yLeft)
        : drawArrowLine(xLeft, yLeft, xRight, yRight);
    }
    if (item.face === 'F') {
      // Front face rotation shown along the front-most column of R face (vertical axis at x = cx + 8.5)
      // F (CW) moves top -> bottom on the R side; F' (CCW) moves bottom -> top on the R side
      const x = cx + 8.5;
      const yTop = cy - 1.5;
      const yBot = cy + 37;
      return item.ccw ? drawArrowLine(x, yBot, x, yTop) : drawArrowLine(x, yTop, x, yBot);
    }
    // B (Back face): shown along the back-right edge of U face
    // B (CW) moves right-back -> left-top; B' (CCW) moves left-top -> right-back
    const xLeftTop = cx + 6, yLeftTop = cy - 35;
    const xRightBack = cx + 38, yRightBack = cy - 17;
    return item.ccw
      ? drawArrowLine(xLeftTop, yLeftTop, xRightBack, yRightBack)
      : drawArrowLine(xRightBack, yRightBack, xLeftTop, yLeftTop);
  };

  return (
    <svg width={120} height={120} viewBox="10 8 120 125" className="select-none shrink-0">
      {uPolys.map((p) => (
        <polygon key={p.key} points={p.pts} fill={p.fill} stroke="#0b0e14" strokeWidth="2.2" strokeLinejoin="round" />
      ))}
      {fPolys.map((p) => (
        <polygon key={p.key} points={p.pts} fill={p.fill} stroke="#0b0e14" strokeWidth="2.2" strokeLinejoin="round" />
      ))}
      {rPolys.map((p) => (
        <polygon key={p.key} points={p.pts} fill={p.fill} stroke="#0b0e14" strokeWidth="2.2" strokeLinejoin="round" />
      ))}
      {renderDirectionArrow()}
    </svg>
  );
}

/* ========================================================================= */
/* 3. STEP-BY-STEP 3D WIDGET FOR EACH OF THE 7 STEPS                         */
/* ========================================================================= */

interface Step3DWidgetProps {
  title: string;
  alg: string;
  altAlg?: string;
  whiteTop?: boolean;
  caption: string;
}

function Step3DWidget({ title, alg, altAlg, whiteTop = false, caption }: Step3DWidgetProps) {
  const [selectedAlg, setSelectedAlg] = useState(alg);
  const moves = selectedAlg.trim().split(/\s+/).filter(Boolean);
  const [cubeState, setCubeState] = useState<CubeState>(() => {
    let c = createSolvedCube(whiteTop);
    for (const mv of invertSequence(alg)) {
      c = applyFMoveCorrect(c, mv);
    }
    return c;
  });
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const cubeRef = useRef<HTMLDivElement>(null);
  const rotRef = useRef({ x: -24, y: -35 });
  const isDraggingRef = useRef(false);
  const lastPtr = useRef({ x: 0, y: 0 });

  const resetToSetup = useCallback(
    (targetAlg: string) => {
      setPlaying(false);
      setStepIdx(0);
      let c = createSolvedCube(whiteTop);
      for (const mv of invertSequence(targetAlg)) {
        c = applyFMoveCorrect(c, mv);
      }
      setCubeState(c);
    },
    [whiteTop]
  );

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setStepIdx((prev) => {
        if (prev >= moves.length) {
          setPlaying(false);
          return prev;
        }
        const mv = moves[prev];
        setCubeState((c) => applyFMoveCorrect(c, mv));
        return prev + 1;
      });
    }, 550);
    return () => clearInterval(id);
  }, [playing, moves]);

  const handleStepTo = (targetStep: number) => {
    setPlaying(false);
    let c = createSolvedCube(whiteTop);
    for (const mv of invertSequence(selectedAlg)) {
      c = applyFMoveCorrect(c, mv);
    }
    for (let i = 0; i < targetStep; i++) {
      c = applyFMoveCorrect(c, moves[i]);
    }
    setCubeState(c);
    setStepIdx(targetStep);
  };

  const half = 78;
  const faceTransforms: Record<FaceKey, string> = {
    F: `rotateY(0deg) translateZ(${half}px)`,
    B: `rotateY(180deg) translateZ(${half}px)`,
    R: `rotateY(90deg) translateZ(${half}px)`,
    L: `rotateY(-90deg) translateZ(${half}px)`,
    U: `rotateX(90deg) translateZ(${half}px)`,
    D: `rotateX(-90deg) translateZ(${half}px)`,
  };

  return (
    <div className="my-5 rounded-3xl bg-[#0b101b]/95 border border-neonCyan/25 p-5 sm:p-6 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-neonCyan shadow-[0_0_8px_#00e5ff]" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-neonCyan">{title}</span>
        </div>
        {altAlg && (
          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => {
                setSelectedAlg(alg);
                resetToSetup(alg);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                selectedAlg === alg ? 'bg-neonCyan text-[#06090f]' : 'text-slate-400 hover:text-white'
              }`}
            >
              Công thức 1
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedAlg(altAlg);
                resetToSetup(altAlg);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                selectedAlg === altAlg ? 'bg-neonCyan text-[#06090f]' : 'text-slate-400 hover:text-white'
              }`}
            >
              Công thức 2
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* 3D Interactive Cube Stage */}
        <div
          onPointerDown={(e) => {
            isDraggingRef.current = true;
            lastPtr.current = { x: e.clientX, y: e.clientY };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!isDraggingRef.current) return;
            rotRef.current.y += (e.clientX - lastPtr.current.x) * 0.6;
            rotRef.current.x -= (e.clientY - lastPtr.current.y) * 0.6;
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
          className="md:col-span-5 cube-scene h-[220px] rounded-2xl bg-[#070a12] border border-white/5 flex items-center justify-center cursor-grab active:cursor-grabbing relative"
        >
          <span className="absolute top-2.5 right-3 text-[10px] font-mono text-slate-400">Kéo để xoay 360°</span>
          <div
            ref={cubeRef}
            style={{
              width: 156,
              height: 156,
              position: 'relative',
              transformStyle: 'preserve-3d',
              transform: `rotateX(${rotRef.current.x}deg) rotateY(${rotRef.current.y}deg)`,
            }}
          >
            {(['F', 'B', 'R', 'L', 'U', 'D'] as FaceKey[]).map((face) => (
              <div
                key={face}
                className="cube-face"
                style={{ transform: faceTransforms[face], padding: 6, gap: 4, borderRadius: 10 }}
              >
                {cubeState[face].map((color, idx) => (
                  <div key={idx} className="sticker" style={{ backgroundColor: color, borderRadius: 5 }} />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Formula Breakdown & Step Controls */}
        <div className="md:col-span-7 flex flex-col gap-4">
          <div>
            <div className="text-xs text-slate-400 mb-1.5">{caption}</div>
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 font-mono text-base sm:text-lg font-extrabold text-neonCyan tracking-wider">
              {selectedAlg}
            </div>
          </div>

          {/* Clickable Move Chips */}
          <div className="flex flex-wrap gap-2">
            {moves.map((m, i) => {
              const isCurrent = i === stepIdx - 1;
              const isDone = i < stepIdx;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleStepTo(i + 1)}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border transition-all ${
                    isCurrent
                      ? 'bg-neonCyan text-[#06090f] border-neonCyan scale-105 shadow-cyan-glow'
                      : isDone
                      ? 'bg-neonCyan/20 border-neonCyan/40 text-neonCyan'
                      : 'bg-white/[0.05] border-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Playback Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => resetToSetup(selectedAlg)}
              className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/10 text-slate-300 transition-colors"
              title="Đặt lại"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleStepTo(Math.max(0, stepIdx - 1))}
              disabled={stepIdx === 0}
              className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/10 disabled:opacity-30 font-mono text-xs text-white"
            >
              ◀ Bước trước
            </button>
            <button
              type="button"
              onClick={() => {
                if (playing) {
                  setPlaying(false);
                } else {
                  if (stepIdx >= moves.length) resetToSetup(selectedAlg);
                  setPlaying(true);
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neonCyan hover:bg-[#33ecff] text-[#06090f] font-bold text-xs shadow-cyan-glow transition-all"
            >
              <Play className="w-3.5 h-3.5" />
              {playing ? 'Tạm dừng' : stepIdx >= moves.length ? 'Chạy lại 3D' : 'Chạy mô phỏng 3D'}
            </button>
            <button
              type="button"
              onClick={() => handleStepTo(Math.min(moves.length, stepIdx + 1))}
              disabled={stepIdx >= moves.length}
              className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/10 disabled:opacity-30 font-mono text-xs text-white"
            >
              Bước tiếp ▶
            </button>
            <span className="font-mono text-xs text-slate-400 ml-auto">
              Bước {stepIdx}/{moves.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* 4. MAIN BEGINNER GUIDE PAGE (/learn/basic)                                */
/* ========================================================================= */

const NAV_PAGES = [
  { id: 'basic', label: 'Cơ bản', href: '/learn/basic' },
  { id: 'cross', label: 'Cross', href: '/learn/cross' },
  { id: 'f2l', label: 'F2L', href: '/learn/f2l' },
  { id: 'oll', label: 'OLL', href: '/learn/oll' },
  { id: 'pll', label: 'PLL', href: '/learn/pll' },
] as const;

export default function BasicLearnPage() {
  // Interactive 3D Notation Sandbox Cube State
  const [sandboxCube, setSandboxCube] = useState<CubeState>(() => createSolvedCube(false));
  const [lastMoveLabel, setLastMoveLabel] = useState('Nhấn vào ký hiệu bất kỳ bên dưới để xem khối 3D xoay!');
  const [pulse, setPulse] = useState(false);
  const sandboxRef = useRef<HTMLDivElement>(null);
  const sandboxRot = useRef({ x: -24, y: -36 });
  const isDraggingSandbox = useRef(false);
  const lastSandboxPtr = useRef({ x: 0, y: 0 });

  const executeNotationOnSandbox = (code: string, title: string) => {
    setSandboxCube((prev) => applyFMoveCorrect(prev, code));
    setLastMoveLabel(`Đang thực hiện: ${code} — ${title}`);
    setPulse(false);
    requestAnimationFrame(() => setPulse(true));
  };

  const resetSandbox = () => {
    setSandboxCube(createSolvedCube(false));
    sandboxRot.current = { x: -24, y: -36 };
    if (sandboxRef.current) {
      sandboxRef.current.style.transform = `rotateX(-24deg) rotateY(-36deg)`;
    }
    setLastMoveLabel('Đã đưa khối Rubik 3D về trạng thái ban đầu');
  };

  const halfSandbox = 96;
  const sandboxTransforms: Record<FaceKey, string> = {
    F: `rotateY(0deg) translateZ(${halfSandbox}px)`,
    B: `rotateY(180deg) translateZ(${halfSandbox}px)`,
    R: `rotateY(90deg) translateZ(${halfSandbox}px)`,
    L: `rotateY(-90deg) translateZ(${halfSandbox}px)`,
    U: `rotateX(90deg) translateZ(${halfSandbox}px)`,
    D: `rotateX(-90deg) translateZ(${halfSandbox}px)`,
  };

  return (
    <div className="min-h-screen bg-obsidian text-slate-100 flex flex-col">
      {/* Global Taskbar */}
      <Navbar activeTab="learn" />

      {/* Sub-navigation bar for Learning Roadmap */}
      <div className="bg-[#080c15]/90 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-8 py-2.5 sticky top-20 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-white/40 uppercase tracking-wider">Lộ trình học:</span>
            <nav className="flex items-center gap-1 flex-wrap">
              {NAV_PAGES.map((p) => (
                <Link
                  key={p.id}
                  href={p.href}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                    p.id === 'basic'
                      ? 'bg-[#00e5ff] text-black shadow-md shadow-[#00e5ff]/25'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {p.label}
                </Link>
              ))}
            </nav>
          </div>
          <span className="text-xs font-mono text-rubikGreen bg-rubikGreen/10 border border-rubikGreen/30 px-3 py-1 rounded-full">
            Phương pháp Layer-by-Layer (7 Bước)
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-10 space-y-12">
        {/* =============================================================== */}
        {/* ARTICLE HEADER & TABLE OF CONTENTS                              */}
        {/* =============================================================== */}
        <div className="glass-card rounded-3xl p-6 sm:p-10 border-white/10 relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rubikGreen/15 border border-rubikGreen/30 text-rubikGreen text-xs font-mono font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>HƯỚNG DẪN CƠ BẢN CHO NGƯỜI MỚI • LAYER-BY-LAYER</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-6 pb-6 border-b border-white/[0.08]">
            Cách chơi Rubik 3x3 dễ hiểu nhất cho người mới
          </h1>

          <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            <p>
              Hướng dẫn về cách chơi Rubik 3x3 thường sẽ mất khoảng <strong>45 phút – 1 tiếng</strong> để học, nhưng nó sẽ gây ấn tượng mạnh với mọi người vì bạn có thể giải quyết một trong những thử thách trí tuệ tuyệt vời nhất của cuộc sống.
            </p>
            <p>
              Có nhiều cách tiếp cận để giải một khối Rubik 3x3 với mức độ khó khác nhau, nhưng nhìn chung mọi người đều công nhận rằng phương pháp <strong>Layer-by-Layer (Giải từng tầng) 7 bước</strong> dưới đây là dễ học và trực quan nhất cho người mới bắt đầu.
            </p>
          </div>

          {/* Table of Contents */}
          <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-[#070a12]/90 border border-white/10">
            <div className="flex items-center gap-2 text-sm font-bold text-neonCyan uppercase font-mono tracking-wider mb-4">
              <BookOpen className="w-4 h-4" />
              <span>Nội dung chính bài viết</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-sm">
              <a href="#rubik-la-gi" className="flex items-center gap-2 text-slate-300 hover:text-neonCyan transition-colors py-1">
                <ChevronRight className="w-4 h-4 text-neonCyan shrink-0" /> 1. Rubik là gì & Cấu tạo khối Rubik 3x3
              </a>
              <a href="#ky-hieu-rubik" className="flex items-center gap-2 text-slate-300 hover:text-neonCyan transition-colors py-1">
                <ChevronRight className="w-4 h-4 text-neonCyan shrink-0" /> 2. Ký hiệu Rubik 3x3 (Hình ảnh & Mô phỏng 3D)
              </a>
              <a href="#cac-buoc-chinh" className="flex items-center gap-2 text-slate-300 hover:text-neonCyan transition-colors py-1">
                <ChevronRight className="w-4 h-4 text-neonCyan shrink-0" /> 3. Tổng quan 7 bước giải Rubik 3x3
              </a>
              <a href="#tang-1" className="flex items-center gap-2 text-slate-300 hover:text-neonCyan transition-colors py-1">
                <ChevronRight className="w-4 h-4 text-rubikGreen shrink-0" /> I. Cách xếp Rubik tầng 1 (Bước 1 & Bước 2)
              </a>
              <a href="#tang-2" className="flex items-center gap-2 text-slate-300 hover:text-neonCyan transition-colors py-1">
                <ChevronRight className="w-4 h-4 text-neonCyan shrink-0" /> II. Cách xếp Rubik tầng 2 (Bước 3)
              </a>
              <a href="#tang-3" className="flex items-center gap-2 text-slate-300 hover:text-neonCyan transition-colors py-1">
                <ChevronRight className="w-4 h-4 text-rubikYellow shrink-0" /> III. Cách xếp Rubik tầng 3 (Bước 4, 5, 6 & 7)
              </a>
            </div>
          </div>
        </div>

        {/* =============================================================== */}
        {/* SECTION: RUBIK LÀ GÌ & CẤU TẠO                                  */}
        {/* =============================================================== */}
        <section id="rubik-la-gi" className="glass-card rounded-3xl p-6 sm:p-8 border-white/10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neonCyan/15 border border-neonCyan/30 flex items-center justify-center text-neonCyan">
              <Compass className="w-5 h-5" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Rubik là gì & Cấu tạo khối 3x3</h2>
          </div>

          <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            <p>
              <strong>Khối lập phương Rubik</strong> (hay đơn giản là Rubik) là một món đồ chơi giải đố dạng cơ học được giáo sư kiến trúc người Hungary tên <strong>Ernő Rubik</strong> phát minh vào năm 1974. Chúng ta thường gọi quen miệng là Robic, Rubic hay Rubix.
            </p>
            <p>
              Khối Rubik 3x3 bao gồm <strong>6 mặt</strong>, mỗi mặt có 9 ô vuông và được ghép lại từ 27 khối lập phương nhỏ hơn围绕 trục tâm. Thông thường, Rubik tiêu chuẩn bao gồm 6 màu cơ bản: <strong>Trắng, Vàng, Đỏ, Cam, Xanh lá và Xanh dương</strong>. Trò chơi bắt đầu bằng việc xáo trộn (Scramble) tất cả vị trí ở mỗi mặt, và bạn hoàn thành khi cả 6 mặt đều đồng nhất một màu.
            </p>
          </div>

          {/* 3 Piece Types Visual Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="text-xs font-mono text-neonCyan uppercase font-bold mb-1">1. Viên trung tâm (Center)</div>
              <div className="text-lg font-bold text-white mb-2">Có 1 màu cố định</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gồm 6 viên nằm chính giữa mỗi mặt. Các viên tâm <strong>không bao giờ thay đổi vị trí tương đối</strong> với nhau (Trắng luôn đối diện Vàng, Đỏ đối diện Cam, Xanh lá đối diện Xanh dương). Màu của viên tâm quy định màu của cả mặt đó.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="text-xs font-mono text-rubikGreen uppercase font-bold mb-1">2. Viên cạnh (Edge)</div>
              <div className="text-lg font-bold text-white mb-2">Có 2 màu</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gồm 12 viên nằm giữa các viên góc. Đây là những viên tạo nên hình chữ thập (Cross) ở tầng 1, các cạnh bên tầng 2 và dấu thập vàng ở tầng 3.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="text-xs font-mono text-rubikYellow uppercase font-bold mb-1">3. Viên góc (Corner)</div>
              <div className="text-lg font-bold text-white mb-2">Có 3 màu</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gồm 8 viên nằm ở 8 đỉnh của khối lập phương. Mỗi viên góc mang 3 màu sắc tương ứng với 3 mặt giao nhau tại đỉnh đó.
              </p>
            </div>
          </div>
        </section>

        {/* =============================================================== */}
        {/* SECTION: KÝ HIỆU RUBIK 3x3 (IMAGES + INTERACTIVE 3D CUBE)       */}
        {/* =============================================================== */}
        <section id="ky-hieu-rubik" className="glass-card rounded-3xl p-6 sm:p-8 border-neonCyan/30 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono text-neonCyan uppercase tracking-widest font-bold mb-1">
                WCA STANDARD NOTATION • HÌNH ẢNH & MÔ PHỎNG 3D
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Ký hiệu Rubik 3x3 & Mô phỏng 3D trực quan
              </h2>
            </div>
            <span className="px-3.5 py-1.5 rounded-xl bg-neonCyan/10 border border-neonCyan/30 text-neonCyan text-xs font-mono font-bold w-fit">
              Nhấn vào từng thẻ ký hiệu để xoay khối 3D!
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Explanation + Interactive 3D Sandbox Cube */}
            <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-36">
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 text-sm text-slate-300">
                <p>Để đọc được công thức, bạn chỉ cần nhớ 6 chữ cái tiếng Anh đại diện cho 6 mặt khi nhìn trực diện vào khối Rubik:</p>
                <ul className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <li className="p-2 rounded-lg bg-black/40 border border-white/5"><strong className="text-neonCyan">F (Front):</strong> Mặt trước</li>
                  <li className="p-2 rounded-lg bg-black/40 border border-white/5"><strong className="text-neonCyan">B (Back):</strong> Mặt sau</li>
                  <li className="p-2 rounded-lg bg-black/40 border border-white/5"><strong className="text-neonCyan">R (Right):</strong> Mặt bên phải</li>
                  <li className="p-2 rounded-lg bg-black/40 border border-white/5"><strong className="text-neonCyan">L (Left):</strong> Mặt bên trái</li>
                  <li className="p-2 rounded-lg bg-black/40 border border-white/5"><strong className="text-neonCyan">U (Up):</strong> Mặt trên</li>
                  <li className="p-2 rounded-lg bg-black/40 border border-white/5"><strong className="text-neonCyan">D (Down):</strong> Mặt dưới</li>
                </ul>
                <div className="pt-2 border-t border-white/10 text-xs text-slate-400 space-y-1">
                  <p>• <strong>Chữ cái thường (F, R, L, U, D):</strong> Xoay mặt đó <span className="text-rubikGreen font-semibold">90° theo chiều kim đồng hồ</span>.</p>
                  <p>• <strong>Có dấu phẩy (F&apos;, R&apos;, L&apos;, U&apos;, D&apos;):</strong> Xoay mặt đó <span className="text-rubikYellow font-semibold">90° ngược chiều kim đồng hồ</span>.</p>
                  <p>• <strong>Có số 2 (R2, U2, F2):</strong> Xoay mặt đó <span className="text-neonCyan font-semibold">180° (2 lần)</span>.</p>
                </div>
              </div>

              {/* Live 3D Cube for Testing Notations */}
              <div className="rounded-3xl bg-[#080c15] border border-neonCyan/30 p-5 shadow-2xl">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-mono font-bold text-neonCyan flex items-center gap-1.5">
                    <Box className="w-4 h-4" /> KHỐI RUBIK 3D THỬ KÝ HIỆU
                  </span>
                  <button
                    type="button"
                    onClick={resetSandbox}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-mono text-white flex items-center gap-1 transition-all"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                </div>

                <div className="text-xs font-mono text-center py-1.5 px-3 rounded-xl bg-neonCyan/10 border border-neonCyan/20 text-neonCyan mb-3">
                  {lastMoveLabel}
                </div>

                <div
                  onPointerDown={(e) => {
                    isDraggingSandbox.current = true;
                    lastSandboxPtr.current = { x: e.clientX, y: e.clientY };
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                  onPointerMove={(e) => {
                    if (!isDraggingSandbox.current) return;
                    sandboxRot.current.y += (e.clientX - lastSandboxPtr.current.x) * 0.55;
                    sandboxRot.current.x -= (e.clientY - lastSandboxPtr.current.y) * 0.55;
                    lastSandboxPtr.current = { x: e.clientX, y: e.clientY };
                    if (sandboxRef.current) {
                      sandboxRef.current.style.transform = `rotateX(${sandboxRot.current.x}deg) rotateY(${sandboxRot.current.y}deg)`;
                    }
                  }}
                  onPointerUp={() => {
                    isDraggingSandbox.current = false;
                  }}
                  onPointerCancel={() => {
                    isDraggingSandbox.current = false;
                  }}
                  className="cube-scene h-[270px] flex items-center justify-center cursor-grab active:cursor-grabbing relative"
                >
                  <div
                    ref={sandboxRef}
                    className={`cube-3d ${pulse ? 'cube-pulse' : ''}`}
                    style={{
                      width: 192,
                      height: 192,
                      transform: `rotateX(${sandboxRot.current.x}deg) rotateY(${sandboxRot.current.y}deg)`,
                    }}
                  >
                    {(['F', 'B', 'R', 'L', 'U', 'D'] as FaceKey[]).map((face) => (
                      <div key={face} className="cube-face" style={{ transform: sandboxTransforms[face] }}>
                        {sandboxCube[face].map((color, idx) => (
                          <div key={idx} className="sticker" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick test buttons right below 3D cube */}
                <div className="grid grid-cols-6 gap-1.5 pt-3 border-t border-white/10">
                  {NOTA_QUICK_BTNS.map((b) => (
                    <button
                      key={b.code}
                      type="button"
                      onClick={() => executeNotationOnSandbox(b.code, b.title)}
                      className="py-1.5 rounded-lg bg-white/[0.06] hover:bg-neonCyan hover:text-[#06090f] font-mono text-xs font-bold text-white border border-white/10 transition-all active:scale-95"
                    >
                      {b.code}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: 12 Visual Notation Cards with Illustrated Cube Diagrams */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {NOTATION_LIST.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => executeNotationOnSandbox(item.code, item.title)}
                  className="group p-4 rounded-2xl bg-[#0b101b]/90 hover:bg-[#11192b] border border-white/10 hover:border-neonCyan/50 transition-all flex items-center gap-4 text-left shadow-lg"
                >
                  {/* Visual SVG Illustration of the Notation */}
                  <div className="rounded-xl bg-[#070a10] border border-white/5 p-1 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <NotationDiagramSVG item={item} />
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-xl bg-neonCyan/15 border border-neonCyan/40 font-mono text-base font-extrabold text-neonCyan">
                        {item.code}
                      </span>
                      <span className="text-[11px] font-mono text-neonCyan opacity-0 group-hover:opacity-100 transition-opacity">
                        Thử 3D ▶
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white">{item.title}</div>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* =============================================================== */}
        {/* SECTION: CÁC BƯỚC CHÍNH ĐỂ GIẢI RUBIK 3x3                       */}
        {/* =============================================================== */}
        <section id="cac-buoc-chinh" className="glass-card rounded-3xl p-6 sm:p-8 border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-electricPurple/20 border border-electricPurple/40 flex items-center justify-center text-purple-300">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Các bước chính để giải Rubik 3x3</h2>
              <p className="text-xs text-slate-400 mt-0.5">Lộ trình 7 bước chia làm 3 tầng từ dễ đến hoàn thiện</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[
              { step: 'Bước 1', layer: 'Tầng 1', title: 'Tạo dấu thập trắng', desc: 'Ghép 4 viên cạnh trắng khớp với màu tâm 4 mặt bên.' },
              { step: 'Bước 2', layer: 'Tầng 1', title: 'Giải 4 góc trắng', desc: 'Đưa 4 viên góc trắng về đúng vị trí, hoàn thiện tầng 1.' },
              { step: 'Bước 3', layer: 'Tầng 2', title: 'Hoàn thiện tầng 2', desc: 'Đưa 4 viên cạnh trung gian từ tầng 3 xuống tầng 2.' },
              { step: 'Bước 4', layer: 'Tầng 3', title: 'Tạo dấu thập vàng', desc: 'Dùng công thức F R U R\' U\' F\' tạo chữ thập vàng trên đỉnh.' },
              { step: 'Bước 5', layer: 'Tầng 3', title: 'Định hướng cạnh vàng', desc: 'Hoán vị các viên cạnh vàng khớp với màu tâm xung quanh.' },
              { step: 'Bước 6', layer: 'Tầng 3', title: 'Đưa góc về đúng vị trí', desc: 'Hoán vị 4 viên góc tầng 3 về đúng vị trí giao màu.' },
              { step: 'Bước 7', layer: 'Tầng 3', title: 'Lật góc & Hoàn thành', desc: 'Dùng R\' D\' R D lật nốt các góc vàng để giải xong Rubik.' },
            ].map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-neonCyan/15 text-neonCyan font-mono text-xs font-bold">{item.step}</span>
                    <span className="text-[11px] font-mono text-slate-400">{item.layer}</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =============================================================== */}
        {/* I. CÁCH XẾP RUBIK TẦNG 1 (BƯỚC 1 & BƯỚC 2)                      */}
        {/* =============================================================== */}
        <section id="tang-1" className="glass-card rounded-3xl p-6 sm:p-8 border-rubikGreen/30 space-y-8">
          <div className="border-b border-white/10 pb-4">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-rubikGreen">PHẦN I • FIRST LAYER</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">I. Cách xếp Rubik tầng 1</h2>
          </div>

          {/* BƯỚC 1 */}
          <div className="space-y-4">
            <h3 className="text-xl sm:text-2xl font-bold text-neonCyan">Bước 1: Tạo dấu thập trắng trên đỉnh</h3>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Bước đầu tiên cũng là bước đơn giản nhất: tạo một <strong>dấu thập trắng trên đỉnh</strong> của khối Rubik. Bạn có thể chọn màu nào để bắt đầu cũng được, nhưng trong bài hướng dẫn cho người mới này, chúng ta sẽ bắt đầu với <strong>mặt trắng</strong> trước.
            </p>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              <strong>Mục tiêu:</strong> Tạo một dấu thập trắng ở mặt trên và <strong>phải chú ý tới màu sắc của các viên trung tâm cạnh bên</strong>. Mỗi viên cạnh trắng-màu phải khớp thẳng hàng với viên tâm cùng màu ở mặt bên (Trắng-Đỏ khớp tâm Đỏ, Trắng-Xanh khớp tâm Xanh).
            </p>

            <Step3DWidget
              title="Mô phỏng 3D Bước 1 — Tạo dấu thập trắng đúng màu tâm"
              alg="F' R U' R' F2"
              whiteTop={true}
              caption="Ví dụ cách lật và đưa một viên cạnh trắng bị ngược vào đúng vị trí dấu thập trắng trên đỉnh mà không làm hỏng các cạnh đã giải:"
            />
          </div>

          {/* BƯỚC 2 */}
          <div className="space-y-4 pt-6 border-t border-white/10">
            <h3 className="text-xl sm:text-2xl font-bold text-neonCyan">Bước 2: Ghép các viên góc trắng để hoàn thiện tầng 1</h3>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Mục tiêu của bước 2 là sắp xếp lại tất cả 4 viên góc chứa màu trắng để hoàn thành toàn bộ tầng một. Để lắp được góc trắng về đúng vị trí, ta giữ mặt trắng ở trên và làm như sau:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-sm sm:text-base text-slate-300 pl-2">
              <li>Tìm các viên góc chứa màu trắng đang nằm ở tầng đáy (mặt vàng).</li>
              <li>Xoay tầng đáy (<code className="text-neonCyan font-mono">D</code>) để đưa viên góc trắng đó về ngay dưới vị trí góc đúng của nó (giữa 2 màu tâm tương ứng).</li>
              <li>Thực hiện công thức <code className="text-neonCyan font-mono font-bold">D&apos; R&apos; D R</code> (hoặc <code className="text-neonCyan font-mono font-bold">R&apos; D&apos; R D</code>) lặp lại cho đến khi góc trắng vào đúng vị trí và màu trắng hướng lên trên.</li>
              <li>Trong trường hợp góc màu trắng đã nằm ở tầng 1 nhưng sai vị trí hoặc bị lật màu, ta cũng áp dụng công thức trên để &ldquo;đẩy&rdquo; góc sai đó xuống tầng dưới rồi giải lại.</li>
            </ul>

            <Step3DWidget
              title="Mô phỏng 3D Bước 2 — Chèn góc trắng tầng 1"
              alg="D' R' D R"
              altAlg="R' D' R D"
              whiteTop={true}
              caption="Giữ mặt trắng ở trên, đặt góc cần chèn ở phía dưới-trước-phải rồi thực hiện công thức:"
            />
          </div>
        </section>

        {/* =============================================================== */}
        {/* II. CÁCH XẾP RUBIK TẦNG 2 (BƯỚC 3)                              */}
        {/* =============================================================== */}
        <section id="tang-2" className="glass-card rounded-3xl p-6 sm:p-8 border-neonCyan/30 space-y-6">
          <div className="border-b border-white/10 pb-4">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-neonCyan">PHẦN II • SECOND LAYER</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">II. Cách xếp Rubik tầng 2</h2>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl sm:text-2xl font-bold text-neonCyan">Bước 3: Ghép 4 viên cạnh còn lại để hoàn thiện tầng 2</h3>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Bây giờ hãy <strong>lật ngược khối Rubik lại</strong> (đưa mặt Trắng đã hoàn thành xuống đáy, mặt Vàng lên đỉnh) để thuận tiện quan sát tầng 2 và tầng 3. Trong bước này, bạn sẽ dùng 2 công thức đối xứng để đưa viên cạnh ở tầng 3 xuống tầng 2 mà không làm hỏng mặt trắng:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm sm:text-base text-slate-300 pl-2">
              <li>Tìm trên tầng 3 (mặt vàng) một viên cạnh <strong>KHÔNG chứa màu vàng</strong>.</li>
              <li>Xoay tầng <code className="text-neonCyan font-mono">U</code> để màu mặt bên của viên cạnh khớp với màu tâm mặt trước → tạo thành <strong>hình chữ T nằm ngược</strong>.</li>
              <li>Xem viên cạnh đó cần chuyển xuống khe bên <strong>Phải</strong> hay bên <strong>Trái</strong> rồi áp dụng công thức tương ứng:</li>
            </ol>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-neonCyan/30">
                <div className="text-xs font-mono text-neonCyan uppercase font-bold mb-1">Đưa cạnh sang khe BÊN PHẢI</div>
                <div className="font-mono text-base font-extrabold text-white">U R U&apos; R&apos; U&apos; F&apos; U F</div>
                <p className="text-xs text-slate-400 mt-1">Đẩy cạnh ra xa sang trái (U), mở khe phải lên đón rồi chèn lại bằng mặt trước (F&apos; U F).</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-electricPurple/40">
                <div className="text-xs font-mono text-purple-300 uppercase font-bold mb-1">Đưa cạnh sang khe BÊN TRÁI</div>
                <div className="font-mono text-base font-extrabold text-white">U&apos; L&apos; U L U F U&apos; F&apos;</div>
                <p className="text-xs text-slate-400 mt-1">Đẩy cạnh ra xa sang phải (U&apos;), mở khe trái lên đón rồi chèn lại bằng mặt trước (F U&apos; F&apos;).</p>
              </div>
            </div>

            <Step3DWidget
              title="Mô phỏng 3D Bước 3 — Đưa cạnh từ tầng 3 xuống tầng 2"
              alg="U R U' R' U' F' U F"
              altAlg="U' L' U L U F U' F'"
              whiteTop={false}
              caption="Công thức 1 (Chèn khe Phải: U R U' R' U' F' U F) | Công thức 2 (Chèn khe Trái: U' L' U L U F U' F'):"
            />
          </div>
        </section>

        {/* =============================================================== */}
        {/* III. CÁCH XẾP RUBIK TẦNG 3 (BƯỚC 4, 5, 6, 7)                    */}
        {/* =============================================================== */}
        <section id="tang-3" className="glass-card rounded-3xl p-6 sm:p-8 border-rubikYellow/30 space-y-10">
          <div className="border-b border-white/10 pb-4">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-rubikYellow">PHẦN III • LAST LAYER</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">III. Cách xếp Rubik tầng 3</h2>
          </div>

          {/* BƯỚC 4 */}
          <div className="space-y-4">
            <h3 className="text-xl sm:text-2xl font-bold text-rubikYellow">Bước 4: Tạo dấu thập vàng trên đỉnh</h3>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Sau khi hoàn thành 2 tầng dưới, trên mặt đỉnh sẽ xuất hiện 1 trong 3 trạng thái vàng: <strong>Dấu chấm</strong> (chưa có cạnh vàng nào), <strong>Hình chữ L nhỏ</strong> (góc 9 giờ và 12 giờ), hoặc <strong>Đường thẳng ngang</strong>.
            </p>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Bạn chỉ cần dùng công thức <code className="text-neonCyan font-mono font-bold">F R U R&apos; U&apos; F&apos;</code>:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm sm:text-base text-slate-300 pl-2">
              <li>Nếu là <strong>Dấu chấm</strong>: Thực hiện công thức 3 lần (Dấu chấm → Chữ L → Đường thẳng → Dấu thập vàng).</li>
              <li>Nếu là <strong>Chữ L</strong>: Đặt chữ L ở góc Trái-Sau rồi làm 2 lần (hoặc dùng công thức tắt <code className="text-neonCyan font-mono">F U R U&apos; R&apos; F&apos;</code> chỉ 1 lần).</li>
              <li>Nếu là <strong>Đường thẳng</strong>: Đặt đường thẳng nằm ngang (Trái sang Phải) rồi thực hiện <code className="text-neonCyan font-mono">F R U R&apos; U&apos; F&apos;</code> 1 lần.</li>
            </ul>

            <Step3DWidget
              title="Mô phỏng 3D Bước 4 — Tạo dấu thập vàng trên đỉnh"
              alg="F R U R' U' F'"
              altAlg="F U R U' R' F'"
              whiteTop={false}
              caption="Công thức 1 (Từ Đường thẳng lên Dấu thập: F R U R' U' F') | Công thức 2 (Từ Chữ L lên thẳng Dấu thập: F U R U' R' F'):"
            />
          </div>

          {/* BƯỚC 5 */}
          <div className="space-y-4 pt-6 border-t border-white/10">
            <h3 className="text-xl sm:text-2xl font-bold text-rubikYellow">Bước 5: Định hướng cho viên cạnh (Hoàn thiện dấu thập vàng)</h3>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Sau khi có dấu thập vàng, ta cần xoay cho 4 viên cạnh vàng khớp với màu tâm của 4 mặt bên. Hãy xoay tầng <code className="text-neonCyan font-mono">U</code> để tìm được 2 viên cạnh đã đúng màu tâm:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm sm:text-base text-slate-300 pl-2">
              <li>Nếu 2 viên cạnh đúng nằm <strong>liền kề nhau</strong>: Đặt 1 viên đúng ở mặt <strong>Sau</strong> và 1 viên đúng ở mặt <strong>Phải</strong> (hoặc hoán đổi 2 cạnh Trước và Trái) rồi thực hiện công thức <code className="text-neonCyan font-mono font-bold">R U R&apos; U R U2 R&apos; U</code>.</li>
              <li>Nếu 2 viên cạnh đúng nằm <strong>đối diện nhau</strong>: Thực hiện công thức ở bất kỳ hướng nào 1 lần để đưa về trường hợp liền kề, sau đó làm thêm 1 lần nữa là cả 4 cạnh sẽ khớp hoàn toàn.</li>
            </ul>

            <Step3DWidget
              title="Mô phỏng 3D Bước 5 — Hoán vị cạnh dấu thập vàng (Sune + U)"
              alg="R U R' U R U2 R' U"
              whiteTop={false}
              caption="Công thức hoán vị 2 viên cạnh Trước và Trái (giữ 2 cạnh Sau và Phải cố định):"
            />
          </div>

          {/* BƯỚC 6 */}
          <div className="space-y-4 pt-6 border-t border-white/10">
            <h3 className="text-xl sm:text-2xl font-bold text-rubikYellow">Bước 6: Định hướng vị trí cho viên góc</h3>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Ở bước này, ta đưa 4 viên góc tầng 3 về <strong>đúng vị trí giao giữa 3 màu tâm</strong> (chưa cần màu vàng phải lật lên trên ngay).
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-sm sm:text-base text-slate-300 pl-2">
              <li>Tìm 1 viên góc đã nằm ở <strong>&ldquo;đúng vị trí&rdquo;</strong> (3 màu của góc trùng với 3 màu tâm xung quanh nó).</li>
              <li>Giữ khối Rubik sao cho viên góc &ldquo;đúng vị trí&rdquo; đó nằm ở góc <strong>Trước-Phải-Trên (UFR)</strong>.</li>
              <li>Thực hiện công thức hoán vị 3 góc còn lại: <code className="text-neonCyan font-mono font-bold">U R U&apos; L&apos; U R&apos; U&apos; L</code> (1 hoặc 2 lần cho tới khi cả 4 góc đều về đúng vị trí).</li>
              <li>Nếu chưa có góc nào đúng vị trí, cứ thực hiện công thức trên 1 lần ở bất kỳ góc nào, bạn sẽ có ngay 1 viên góc về đúng vị trí.</li>
            </ul>

            <Step3DWidget
              title="Mô phỏng 3D Bước 6 — Hoán vị 3 góc tầng cuối (Niklas)"
              alg="U R U' L' U R' U' L"
              whiteTop={false}
              caption="Giữ góc đúng ở Trước-Phải-Trên, công thức sẽ dịch chuyển 3 góc còn lại mà không làm lệch dấu thập vàng:"
            />
          </div>

          {/* BƯỚC 7 */}
          <div className="space-y-4 pt-6 border-t border-white/10">
            <h3 className="text-xl sm:text-2xl font-bold text-rubikYellow">Bước 7: Hoàn thiện góc & Giải xong khối Rubik</h3>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Cuối cùng chúng ta đã đến bước quyết định! Hãy bình tĩnh thực hiện đúng quy tắc sau để lật nốt các viên góc vàng lên mặt đỉnh:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm sm:text-base text-slate-300 pl-2">
              <li>Giữ khối Rubik cố định với viên góc chưa lật vàng nằm ở vị trí <strong>Trước-Phải-Trên (UFR)</strong>.</li>
              <li>Lặp lại cụm 4 bước <code className="text-neonCyan font-mono font-bold">R&apos; D&apos; R D</code> (2 lần hoặc 4 lần) cho đến khi viên góc đó có mặt vàng lật lên trên.</li>
              <li><strong>QUAN TRỌNG:</strong> Khi góc đầu tiên đã lật vàng xong, <strong>giữ nguyên hướng cầm khối Rubik</strong>, chỉ xoay tầng trên cùng (<code className="text-neonCyan font-mono">U</code> hoặc <code className="text-neonCyan font-mono">U&apos;</code>) để đưa viên góc chưa hoàn thiện tiếp theo về đúng vị trí <strong>Trước-Phải-Trên</strong>, rồi tiếp tục lặp lại <code className="text-neonCyan font-mono font-bold">R&apos; D&apos; R D</code>.</li>
            </ol>

            {/* Important Warning Box */}
            <div className="p-4 rounded-2xl bg-rubikOrange/10 border border-rubikOrange/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rubikOrange shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                <strong className="text-rubikOrange">Lưu ý sống còn ở Bước 7:</strong> Tuyệt đối <strong>không bỏ qua bước xoay D cuối cùng</strong> trong cụm <code className="font-mono text-neonCyan">R&apos; D&apos; R D</code> ngay khi thấy màu vàng vừa lật lên, và <strong>không xoay cả khối Rubik</strong> khi chuyển sang góc tiếp theo (chỉ xoay tầng <code className="font-mono text-neonCyan">U</code>). Khi lật xong góc cuối cùng, hai tầng dưới sẽ tự động khôi phục nguyên vẹn 100%!
              </div>
            </div>

            <Step3DWidget
              title="Mô phỏng 3D Bước 7 — Lật 2 góc cuối bằng R' D' R D và xoay U"
              alg="R' D' R D R' D' R D U R' D' R D R' D' R D R' D' R D R' D' R D U'"
              whiteTop={false}
              caption="Mô phỏng đầy đủ quá trình lật 2 góc vàng cuối cùng: làm (R' D' R D)x2 cho góc thứ nhất -> xoay U đưa góc thứ hai về Trước-Phải -> làm (R' D' R D)x4 -> xoay U' hoàn tất khối Rubik!"
            />
          </div>
        </section>

        {/* =============================================================== */}
        {/* KẾT LUẬN & NEXT STEPS                                           */}
        {/* =============================================================== */}
        <section className="glass-card rounded-3xl p-6 sm:p-8 border-neonCyan/30 bg-gradient-to-r from-[#0d1526]/90 via-[#0e1324]/90 to-[#16122b]/90 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-rubikGreen uppercase">
              <Award className="w-4 h-4" /> CHÚC MỪNG BẠN ĐÃ HOÀN THÀNH KHÓA CƠ BẢN
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">
              Sẵn sàng bấm giờ hoặc nâng cấp lên CFOP Sub-20s?
            </h3>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Sau khi đã giải thành thạo 3x3 bằng phương pháp 7 bước cơ bản, hãy thử bấm giờ kiểm tra thành tích của bạn hoặc tiến lên học phương pháp <strong>CFOP (Cross, 41 F2L, 57 OLL, 21 PLL)</strong> để chinh phục mốc dưới 20 giây!
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/timer"
              className="px-6 py-3 rounded-2xl bg-neonCyan hover:bg-[#33ecff] text-[#06090f] font-bold text-sm shadow-cyan-glow transition-all"
            >
              Mở Bấm Giờ (Timer)
            </Link>
            <Link
              href="/learn/cross"
              className="px-6 py-3 rounded-2xl bg-white/[0.08] hover:bg-white/15 border border-white/15 text-white font-semibold text-sm transition-all"
            >
              Học tiếp CFOP Cross →
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

const NOTA_QUICK_BTNS = [
  { code: 'R', title: 'Right (Phải - Thuận)' },
  { code: "R'", title: 'Right Prime (Phải - Ngược)' },
  { code: 'U', title: 'Up (Trên - Thuận)' },
  { code: "U'", title: 'Up Prime (Trên - Ngược)' },
  { code: 'F', title: 'Front (Trước - Thuận)' },
  { code: "F'", title: 'Front Prime (Trước - Ngược)' },
  { code: 'L', title: 'Left (Trái - Thuận)' },
  { code: "L'", title: 'Left Prime (Trái - Ngược)' },
  { code: 'D', title: 'Down (Dưới - Thuận)' },
  { code: "D'", title: 'Down Prime (Dưới - Ngược)' },
  { code: 'B', title: 'Back (Sau - Thuận)' },
  { code: "B'", title: 'Back Prime (Sau - Ngược)' },
];
