'use client';

import React, { useMemo } from 'react';

/**
 * PLLCaseDiagram
 * Renders the top-down 2.5D PLL diagram matching the user's reference image:
 * - 3x3 Yellow top U face grid in the center (#EEFF00)
 * - 4 angled trapezoid side-flaps colored according to their original face:
 *   F (Front/Bottom) = Red (#FF1A1A),
 *   B (Back/Top)     = Orange (#FF8800),
 *   L (Left)         = Blue (#0055FF),
 *   R (Right)        = Green (#00CC00)
 * - Exact black permutation arrows overlaid on the 3x3 grid showing where each
 *   unsolved U-layer corner/edge moves when executing the PLL algorithm!
 * - Computed directly from the inverse of `alg` (and optional `stepCount` for step-by-step animation).
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
    case 'x':
      c.R = rotCW(c.R);
      c.L = rotCCW(c.L);
      t = c.U;
      c.U = c.F;
      c.F = c.D;
      c.D = rot180(c.B);
      c.B = rot180(t);
      break;
    case 'z':
      c.F = rotCW(c.F);
      c.B = rotCCW(c.B);
      t = c.U;
      c.U = rotCW(c.L);
      c.L = rotCW(c.D);
      c.D = rotCW(c.R);
      c.R = rotCW(t);
      break;
    case 'r':
      applyBasic(c, 'L');
      applyBasic(c, 'x');
      break;
    case 'l':
      applyBasic(c, 'R');
      applyBasic(c, 'x');
      applyBasic(c, 'x');
      applyBasic(c, 'x');
      break;
    case 'f':
      applyBasic(c, 'B');
      applyBasic(c, 'z');
      break;
    case 'b':
      applyBasic(c, 'F');
      applyBasic(c, 'z');
      applyBasic(c, 'z');
      applyBasic(c, 'z');
      break;
    case 'u':
      applyBasic(c, 'D');
      applyBasic(c, 'y');
      break;
    case 'd':
      applyBasic(c, 'U');
      applyBasic(c, 'y');
      applyBasic(c, 'y');
      applyBasic(c, 'y');
      break;
    case 'M':
      applyBasic(c, 'R');
      applyBasic(c, 'L');
      applyBasic(c, 'L');
      applyBasic(c, 'L');
      applyBasic(c, 'x');
      applyBasic(c, 'x');
      applyBasic(c, 'x');
      break;
    case 'S':
      applyBasic(c, 'F');
      applyBasic(c, 'F');
      applyBasic(c, 'F');
      applyBasic(c, 'B');
      applyBasic(c, 'z');
      break;
  }
}

function applyToken(c: CubeGrid, token: string) {
  const clean = token.replace(/[()]/g, '');
  if (!clean) return;
  const base = clean[0];
  const mod = clean.slice(1);
  const times = mod === '2' || mod === "2'" ? 2 : mod === "'" ? 3 : 1;
  for (let i = 0; i < times; i++) applyBasic(c, base);
}

function realignCubeCenters(c: CubeGrid) {
  if (c.F[4] === 'U4') applyBasic(c, 'x');
  else if (c.B[4] === 'U4') {
    applyBasic(c, 'x');
    applyBasic(c, 'x');
    applyBasic(c, 'x');
  } else if (c.D[4] === 'U4') {
    applyBasic(c, 'x');
    applyBasic(c, 'x');
  } else if (c.L[4] === 'U4') applyBasic(c, 'z');
  else if (c.R[4] === 'U4') {
    applyBasic(c, 'z');
    applyBasic(c, 'z');
    applyBasic(c, 'z');
  }

  let guard = 0;
  while (c.F[4] !== 'F4' && guard < 4) {
    applyBasic(c, 'y');
    guard++;
  }
}

export function invertPLLAlg(alg: string): string {
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

export function simulatePLLState(alg: string, stepCount?: number): CubeGrid {
  const c = createSolved();
  const setupTokens = invertPLLAlg(alg).split(/\s+/).filter(Boolean);
  for (const tk of setupTokens) applyToken(c, tk);
  realignCubeCenters(c);

  if (stepCount !== undefined && stepCount > 0) {
    const algTokens = alg.replace(/[()]/g, ' ').trim().split(/\s+/).filter(Boolean);
    const limit = Math.min(stepCount, algTokens.length);
    for (let i = 0; i < limit; i++) {
      applyToken(c, algTokens[i]);
    }
    if (limit === algTokens.length) {
      realignCubeCenters(c);
    }
  }
  return c;
}

const FACE_HEX: Record<string, string> = {
  U: '#EEFF00', // Bright Yellow top
  D: '#FFFFFF', // White bottom
  F: '#FF1A1A', // Red front (bottom flap)
  B: '#FF8800', // Orange back (top flap)
  L: '#0055FF', // Blue left (left flap)
  R: '#00CC00', // Green right (right flap)
};

const BORDER = '#111318';

function pllStickerColor(sticker: string): string {
  return FACE_HEX[sticker[0]] || '#36393F';
}

interface ArrowSegment {
  from: number;
  to: number;
  bidirectional: boolean;
}

function computePermutationArrows(uFace: string[]): ArrowSegment[] {
  // uFace[curr] = 'U<home>' when U is oriented
  const destMap = new Map<number, number>();
  for (const idx of [0, 1, 2, 3, 5, 6, 7, 8]) {
    const st = uFace[idx];
    if (st[0] !== 'U') return []; // Only show permutation arrows when top layer is oriented
    const home = Number(st[1]);
    if (idx !== home) {
      destMap.set(idx, home);
    }
  }

  const visitedPairs = new Set<string>();
  const arrows: ArrowSegment[] = [];

  for (const [from, to] of destMap.entries()) {
    const reverseDest = destMap.get(to);
    if (reverseDest === from) {
      // 2-cycle (swap): draw single double-headed arrow
      const key = from < to ? `${from}-${to}` : `${to}-${from}`;
      if (!visitedPairs.has(key)) {
        visitedPairs.add(key);
        arrows.push({ from, to, bidirectional: true });
      }
    } else {
      // 3-cycle: draw single-headed arrow from -> to
      arrows.push({ from, to, bidirectional: false });
    }
  }

  return arrows;
}

interface PLLCaseDiagramProps {
  alg: string;
  stepCount?: number;
  size?: number;
  className?: string;
}

export const PLLCaseDiagram: React.FC<PLLCaseDiagramProps> = ({
  alg,
  stepCount,
  size = 140,
  className = '',
}) => {
  const cube = useMemo(() => simulatePLLState(alg, stepCount), [alg, stepCount]);
  const arrows = useMemo(() => computePermutationArrows(cube.U), [cube.U]);

  const x0 = 37;
  const y0 = 37;
  const cell = 42;
  const flap = 19;
  const bev = 6;

  const poly = (pts: [number, number][]) => pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

  // Top flap (Back face top row from left to right: B[2], B[1], B[0])
  const backStickers = [cube.B[2], cube.B[1], cube.B[0]];
  const topFlaps = backStickers.map((st, c) => {
    const lx = x0 + c * cell;
    const rx = lx + cell;
    const tlx = c === 0 ? lx + bev : lx;
    const trx = c === 2 ? rx - bev : rx;
    return {
      pts: poly([
        [tlx, y0 - flap],
        [trx, y0 - flap],
        [rx, y0],
        [lx, y0],
      ]),
      color: pllStickerColor(st),
    };
  });

  // Bottom flap (Front face top row from left to right: F[0], F[1], F[2])
  const frontStickers = [cube.F[0], cube.F[1], cube.F[2]];
  const bottomFlaps = frontStickers.map((st, c) => {
    const lx = x0 + c * cell;
    const rx = lx + cell;
    const by = y0 + 3 * cell;
    const blx = c === 0 ? lx + bev : lx;
    const brx = c === 2 ? rx - bev : rx;
    return {
      pts: poly([
        [lx, by],
        [rx, by],
        [brx, by + flap],
        [blx, by + flap],
      ]),
      color: pllStickerColor(st),
    };
  });

  // Left flap (Left face top row from back/top to front/bottom: L[0], L[1], L[2])
  const leftStickers = [cube.L[0], cube.L[1], cube.L[2]];
  const leftFlaps = leftStickers.map((st, r) => {
    const ty = y0 + r * cell;
    const by = ty + cell;
    const lty = r === 0 ? ty + bev : ty;
    const lby = r === 2 ? by - bev : by;
    return {
      pts: poly([
        [x0 - flap, lty],
        [x0, ty],
        [x0, by],
        [x0 - flap, lby],
      ]),
      color: pllStickerColor(st),
    };
  });

  // Right flap (Right face top row from back/top to front/bottom: R[2], R[1], R[0])
  const rightStickers = [cube.R[2], cube.R[1], cube.R[0]];
  const rightFlaps = rightStickers.map((st, r) => {
    const rx = x0 + 3 * cell;
    const ty = y0 + r * cell;
    const by = ty + cell;
    const rty = r === 0 ? ty + bev : ty;
    const rby = r === 2 ? by - bev : by;
    return {
      pts: poly([
        [rx, ty],
        [rx + flap, rty],
        [rx + flap, rby],
        [rx, by],
      ]),
      color: pllStickerColor(st),
    };
  });

  // Center coordinates of cell idx (0..8)
  const cellCenter = (idx: number): [number, number] => {
    const r = Math.floor(idx / 3);
    const c = idx % 3;
    return [x0 + c * cell + cell / 2, y0 + r * cell + cell / 2];
  };

  // Helper to render an arrow with clean triangular head(s)
  const renderArrow = (seg: ArrowSegment, key: number) => {
    const [x1, y1] = cellCenter(seg.from);
    const [x2, y2] = cellCenter(seg.to);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 1) return null;
    const ux = dx / len;
    const uy = dy / len;
    const px = -uy;
    const py = ux;

    // Shorten endpoints slightly so arrowheads sit nicely inside the cell centers
    const marginEnd = 4;
    const marginStart = seg.bidirectional ? 4 : 6;
    const sx = x1 + ux * marginStart;
    const sy = y1 + uy * marginStart;
    const ex = x2 - ux * marginEnd;
    const ey = y2 - uy * marginEnd;

    const headLen = 9.5;
    const headHalfW = 5.2;

    // End arrowhead at (ex, ey) pointing along (ux, uy)
    const endBaseX = ex - ux * headLen;
    const endBaseY = ey - uy * headLen;
    const endHeadPts = poly([
      [ex, ey],
      [endBaseX + px * headHalfW, endBaseY + py * headHalfW],
      [endBaseX - px * headHalfW, endBaseY - py * headHalfW],
    ]);

    // Start arrowhead if bidirectional
    const startBaseX = sx + ux * headLen;
    const startBaseY = sy + uy * headLen;
    const startHeadPts = poly([
      [sx, sy],
      [startBaseX + px * headHalfW, startBaseY + py * headHalfW],
      [startBaseX - px * headHalfW, startBaseY - py * headHalfW],
    ]);

    const lineX1 = seg.bidirectional ? startBaseX - ux * 1.5 : sx;
    const lineY1 = seg.bidirectional ? startBaseY - uy * 1.5 : sy;
    const lineX2 = endBaseX + ux * 1.5;
    const lineY2 = endBaseY + uy * 1.5;

    return (
      <g key={`arrow-${key}`}>
        <line
          x1={lineX1}
          y1={lineY1}
          x2={lineX2}
          y2={lineY2}
          stroke="#111318"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        <polygon points={endHeadPts} fill="#111318" />
        {seg.bidirectional && <polygon points={startHeadPts} fill="#111318" />}
      </g>
    );
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="8 8 184 184"
      className={`select-none ${className}`}
    >
      {/* Top (Back) Flaps */}
      {topFlaps.map((f, i) => (
        <polygon
          key={`B-${i}`}
          points={f.pts}
          fill={f.color}
          stroke={BORDER}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
      ))}

      {/* Bottom (Front) Flaps */}
      {bottomFlaps.map((f, i) => (
        <polygon
          key={`F-${i}`}
          points={f.pts}
          fill={f.color}
          stroke={BORDER}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
      ))}

      {/* Left Flaps */}
      {leftFlaps.map((f, i) => (
        <polygon
          key={`L-${i}`}
          points={f.pts}
          fill={f.color}
          stroke={BORDER}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
      ))}

      {/* Right Flaps */}
      {rightFlaps.map((f, i) => (
        <polygon
          key={`R-${i}`}
          points={f.pts}
          fill={f.color}
          stroke={BORDER}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
      ))}

      {/* Center 3x3 U Face Grid */}
      {cube.U.map((st, idx) => {
        const r = Math.floor(idx / 3);
        const c = idx % 3;
        return (
          <rect
            key={`U-${idx}`}
            x={x0 + c * cell}
            y={y0 + r * cell}
            width={cell}
            height={cell}
            fill={pllStickerColor(st)}
            stroke={BORDER}
            strokeWidth="3.8"
            strokeLinejoin="round"
          />
        );
      })}

      {/* Permutation Arrows Overlay */}
      {arrows.map((seg, i) => renderArrow(seg, i))}
    </svg>
  );
};
