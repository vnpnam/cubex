'use client';

import React, { useMemo } from 'react';

/**
 * F2LCaseDiagram
 * Renders an exact isometric 3D Rubik's cube illustration for any F2L case,
 * mathematically computed from the algorithm so that the image is 100% faithful
 * to the algorithm (matching the reference diagram style: Top U, Front-Left F=Red,
 * Front-Right R=Green, Bottom D=White, with all non-F2L-target pieces masked dark gray).
 */

type FaceName = 'U' | 'D' | 'F' | 'B' | 'L' | 'R';
type CubeGrid = Record<FaceName, string[]>;

const FACES: FaceName[] = ['U', 'D', 'F', 'B', 'L', 'R'];

function createSolved(): CubeGrid {
  const c = {} as CubeGrid;
  for (const f of FACES) {
    c[f] = Array.from({ length: 9 }, (_, i) => `${f}${i}`);
  }
  return c;
}

function rotCW(a: string[]): string[] {
  return [a[6], a[3], a[0], a[7], a[4], a[1], a[8], a[5], a[2]];
}
function rotCCW(a: string[]): string[] {
  return [a[2], a[5], a[8], a[1], a[4], a[7], a[0], a[3], a[6]];
}
function rot180(a: string[]): string[] {
  return rotCW(rotCW(a));
}

function applyBasic(c: CubeGrid, m: string) {
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
    case 'y':
      c.U = rotCW(c.U);
      c.D = rotCCW(c.D);
      t = c.F;
      c.F = c.R;
      c.R = c.B;
      c.B = c.L;
      c.L = t;
      break;
    case 'd':
      applyBasic(c, 'U');
      applyBasic(c, 'y');
      applyBasic(c, 'y');
      applyBasic(c, 'y');
      break;
    case 'u':
      applyBasic(c, 'D');
      applyBasic(c, 'y');
      break;
    case 'r':
      applyBasic(c, 'L');
      c.R = rotCW(c.R);
      c.L = rotCCW(c.L);
      t = c.U;
      c.U = c.F;
      c.F = c.D;
      c.D = rot180(c.B);
      c.B = rot180(t);
      break;
  }
}

export function invertAlgorithm(alg: string): string {
  const tokens = alg.replace(/[()]/g, ' ').trim().split(/\s+/).filter(Boolean);
  return tokens
    .reverse()
    .map((tk) => {
      const base = tk[0];
      const mod = tk.slice(1);
      if (mod === '2' || mod === "2'") return `${base}2`;
      if (mod === "'") return base;
      return `${base}'`;
    })
    .join(' ');
}

function getNetYRotation(alg: string): number {
  const tokens = alg.replace(/[()]/g, ' ').trim().split(/\s+/).filter(Boolean);
  let rot = 0;
  for (const tk of tokens) {
    const b = tk[0];
    const m = tk.slice(1);
    const t = m === '2' || m === "2'" ? 2 : m === "'" ? 3 : 1;
    if (b === 'y' || b === 'u') rot = (rot + t) % 4;
    if (b === 'd') rot = (rot + 3 * t) % 4;
  }
  return rot;
}

export function makeAlignedSetupMoves(alg: string): string {
  const rot = getNetYRotation(alg);
  const prefix = rot === 1 ? 'y ' : rot === 2 ? 'y2 ' : rot === 3 ? "y' " : '';
  return (prefix + invertAlgorithm(alg)).trim();
}

export function simulateF2LState(alg: string, partialMovesCount?: number): CubeGrid {
  const c = createSolved();
  const setup = makeAlignedSetupMoves(alg);
  const setupTokens = setup.replace(/[()]/g, ' ').trim().split(/\s+/).filter(Boolean);
  for (const tk of setupTokens) {
    const base = tk[0];
    const mod = tk.slice(1);
    const times = mod === '2' || mod === "2'" ? 2 : mod === "'" ? 3 : 1;
    for (let i = 0; i < times; i++) applyBasic(c, base);
  }

  // If partialMovesCount is provided, apply that many moves of `alg` forward
  if (partialMovesCount !== undefined && partialMovesCount > 0) {
    const algTokens = alg.replace(/[()]/g, ' ').trim().split(/\s+/).filter(Boolean);
    const limit = Math.min(partialMovesCount, algTokens.length);
    for (let step = 0; step < limit; step++) {
      const tk = algTokens[step];
      const base = tk[0];
      const mod = tk.slice(1);
      const times = mod === '2' || mod === "2'" ? 2 : mod === "'" ? 3 : 1;
      for (let i = 0; i < times; i++) applyBasic(c, base);
    }
  }
  return c;
}

// Color mapping for stickers in F2L diagram:
// We show colors for:
// - The target F2L pair: corner DFR ('D2', 'F8', 'R6') and edge FR ('F5', 'R3')
// - The solved F2L base (all other bottom 2 layer stickers: F3,F4,F6,F7, R4,R5,R7,R8, D*, B3..8, L3..8)
// - All other top-layer stickers (U layer pieces) are masked dark gray (#33363B) exactly like the reference diagram!
const RELEVANT_STICKERS = new Set([
  // Target F2L pair (corner DFR + edge FR)
  'D2', 'F8', 'R6', 'F5', 'R3',
  // Rest of solved F2L (centers + other slots)
  'F3', 'F4', 'F6', 'F7',
  'R4', 'R5', 'R7', 'R8',
  'B3', 'B4', 'B5', 'B6', 'B7', 'B8',
  'L3', 'L4', 'L5', 'L6', 'L7', 'L8',
  'D0', 'D1', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8',
]);

function getStickerColor(stickerId: string): string {
  if (!RELEVANT_STICKERS.has(stickerId)) {
    return '#36393F'; // Masked gray for non-F2L top layer pieces
  }
  const origFace = stickerId[0];
  switch (origFace) {
    case 'D':
      return '#FFFFFF'; // White bottom/corner
    case 'F':
      return '#FF1A1A'; // Bright Red front
    case 'R':
      return '#00D600'; // Bright Green right
    case 'B':
      return '#FF7700'; // Orange back
    case 'L':
      return '#0066FF'; // Blue left
    default:
      return '#36393F';
  }
}

interface F2LCaseDiagramProps {
  alg: string;
  stepCount?: number;
  size?: number;
  className?: string;
}

export const F2LCaseDiagram: React.FC<F2LCaseDiagramProps> = ({
  alg,
  stepCount,
  size = 150,
  className = '',
}) => {
  const cube = useMemo(() => simulateF2LState(alg, stepCount), [alg, stepCount]);

  // Isometric projection helper:
  // Center corner (U-F-R intersection, which is U[8] / F[2] / R[0]) is at (cx, cy).
  // Vector u = along F top edge (from center to left-up): (-dx, -dy)
  // Vector v = along R top edge (from center to right-up): (+dx, -dy)
  // Vector w = vertical down edge (from center to bottom): (0, +dz)
  const cx = 100;
  const cy = 96;
  const dx = 25;
  const dy = 13.5;
  const dz = 27;

  // Helper to format polygon points with small inset gap for black borders
  const poly = (pts: [number, number][]) => pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

  // Build 9 polygons for U face:
  // On U face:
  // row r = 0..2 (0 is back-left to back-right, 2 is front-left to front-right)
  // col c = 0..2 (0 is back-left to front-left, 2 is back-right to front-right)
  // Wait: let's check U indices!
  // U[0] = Back-Left, U[1] = Back-Center, U[2] = Back-Right
  // U[3] = Mid-Left,  U[4] = Center,      U[5] = Mid-Right
  // U[6] = Front-Left,U[7] = Front-Center,U[8] = Front-Right (closest to viewer!)
  // So moving from U[8] (r=2, c=2):
  // Decreasing col (2 -> 0) goes along F-top edge (left-up): vector A = (-dx, -dy)
  // Decreasing row (2 -> 0) goes along R-top edge (right-up): vector B = (+dx, -dy)
  const uPolys: { idx: number; pts: string; color: string }[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const idx = r * 3 + c;
      // Offset from front-right corner (r=3, c=3 is the vertex at cx, cy)
      // Wait: for cell (r, c), its 4 corners in (i, j) where i = 3 - c (0..3 along left-up) and j = 3 - r (0..3 along right-up):
      const i0 = 2 - c;
      const i1 = 3 - c;
      const j0 = 2 - r;
      const j1 = 3 - r;
      const pt = (i: number, j: number): [number, number] => [
        cx - i * dx + j * dx,
        cy - i * dy - j * dy,
      ];
      uPolys.push({
        idx,
        pts: poly([pt(i0, j0), pt(i1, j0), pt(i1, j1), pt(i0, j1)]),
        color: getStickerColor(cube.U[idx]),
      });
    }
  }

  // Build 9 polygons for F face (Front-Left face):
  // F[0] = Top-Left, F[1] = Top-Center, F[2] = Top-Right (at center vertex!)
  // F[3..5] = Mid row, F[6..8] = Bottom row
  // For cell (r, c) on F face:
  // i = 2 - c goes 0..3 along left-up (-dx, -dy)
  // k = r goes 0..3 along down (0, +dz)
  const fPolys: { idx: number; pts: string; color: string }[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const idx = r * 3 + c;
      const i0 = 2 - c;
      const i1 = 3 - c;
      const k0 = r;
      const k1 = r + 1;
      const pt = (i: number, k: number): [number, number] => [
        cx - i * dx,
        cy - i * dy + k * dz,
      ];
      fPolys.push({
        idx,
        pts: poly([pt(i0, k0), pt(i1, k0), pt(i1, k1), pt(i0, k1)]),
        color: getStickerColor(cube.F[idx]),
      });
    }
  }

  // Build 9 polygons for R face (Front-Right face):
  // R[0] = Top-Left (at center vertex!), R[1] = Top-Center, R[2] = Top-Right
  // R[3..5] = Mid row, R[6..8] = Bottom row
  // For cell (r, c) on R face:
  // j = c goes 0..3 along right-up (+dx, -dy)
  // k = r goes 0..3 along down (0, +dz)
  const rPolys: { idx: number; pts: string; color: string }[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const idx = r * 3 + c;
      const j0 = c;
      const j1 = c + 1;
      const k0 = r;
      const k1 = r + 1;
      const pt = (j: number, k: number): [number, number] => [
        cx + j * dx,
        cy - j * dy + k * dz,
      ];
      rPolys.push({
        idx,
        pts: poly([pt(j0, k0), pt(j1, k0), pt(j1, k1), pt(j0, k1)]),
        color: getStickerColor(cube.R[idx]),
      });
    }
  }

  // Outer hexagon silhouette for thick black cube body border
  const outerHex = poly([
    [cx, cy - 6 * dy],           // Top-Back vertex
    [cx + 3 * dx, cy - 3 * dy],  // Top-Right vertex
    [cx + 3 * dx, cy - 3 * dy + 3 * dz], // Bottom-Right vertex
    [cx, cy + 3 * dz],           // Bottom-Center vertex
    [cx - 3 * dx, cy - 3 * dy + 3 * dz], // Bottom-Left vertex
    [cx - 3 * dx, cy - 3 * dy],  // Top-Left vertex
  ]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="10 5 180 180"
      className={`select-none ${className}`}
    >
      {/* Black cube body base */}
      <polygon
        points={outerHex}
        fill="#111318"
        stroke="#0A0C10"
        strokeWidth="5"
        strokeLinejoin="round"
      />

      {/* Top Face (U) */}
      {uPolys.map((p) => (
        <polygon
          key={`U-${p.idx}`}
          points={p.pts}
          fill={p.color}
          stroke="#111318"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />
      ))}

      {/* Front-Left Face (F) */}
      {fPolys.map((p) => (
        <polygon
          key={`F-${p.idx}`}
          points={p.pts}
          fill={p.color}
          stroke="#111318"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />
      ))}

      {/* Front-Right Face (R) */}
      {rPolys.map((p) => (
        <polygon
          key={`R-${p.idx}`}
          points={p.pts}
          fill={p.color}
          stroke="#111318"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
};
