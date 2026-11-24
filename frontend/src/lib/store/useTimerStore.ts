import { create } from 'zustand';

export interface SolveItem {
  id: number;
  timeMs: number;
  rawTimeMs: number;
  penalty: 'None' | 'PlusTwo' | 'DNF';
  scramble: string;
  timestamp: string;
  notes?: string;
  tags?: string;
}

export type TimerStatus = 'idle' | 'holding' | 'ready' | 'inspecting' | 'running' | 'stopped';

interface TimerState {
  status: TimerStatus;
  elapsedMs: number;
  inspectionRemaining: number;
  scramble: string;
  scrambleType: '3x3' | 'cross' | 'f2l' | 'oll' | 'pll';
  solves: SolveItem[];
  inspectionEnabled: boolean;
  selectedSolveId: number | null;

  // Actions
  setStatus: (status: TimerStatus) => void;
  setElapsedMs: (ms: number) => void;
  setInspectionRemaining: (sec: number) => void;
  setScramble: (scramble: string) => void;
  setScrambleType: (type: '3x3' | 'cross' | 'f2l' | 'oll' | 'pll') => void;
  toggleInspection: () => void;
  generateNewScramble: () => void;
  recordSolve: (rawMs: number, penalty?: 'None' | 'PlusTwo' | 'DNF') => void;
  updateSolvePenalty: (id: number, penalty: 'None' | 'PlusTwo' | 'DNF') => void;
  deleteSolve: (id: number) => void;
  setSelectedSolveId: (id: number | null) => void;

  // Computed stats helpers
  getAo5: () => number | null;
  getAo12: () => number | null;
  getBestSingle: () => number | null;
  getMean: () => number | null;
}

const WCA_SCRAMBLE_FACES = ['U', 'D', 'L', 'R', 'F', 'B'];
const WCA_MODIFIERS = ['', "'", '2'];

export function generateLocal3x3Scramble(length = 20): string {
  const moves: string[] = [];
  let lastFace = -1;
  let secondLastFace = -1;

  for (let i = 0; i < length; i++) {
    let face: number;
    do {
      face = Math.floor(Math.random() * WCA_SCRAMBLE_FACES.length);
    } while (
      face === lastFace ||
      (Math.floor(face / 2) === Math.floor(lastFace / 2) && face === secondLastFace)
    );

    secondLastFace = lastFace;
    lastFace = face;

    const modifier = WCA_MODIFIERS[Math.floor(Math.random() * WCA_MODIFIERS.length)];
    moves.push(WCA_SCRAMBLE_FACES[face] + modifier);
  }

  return moves.join(' ');
}

const INITIAL_SOLVES: SolveItem[] = [
  { id: 1, rawTimeMs: 14230, timeMs: 14230, penalty: 'None', scramble: "R2 D' B2 L2 U2 F2 D B2 R2 B' U R2 F2 R' D' B' F2 U B2 R'", timestamp: '2026-11-20T10:00:00Z', notes: 'Smooth cross' },
  { id: 2, rawTimeMs: 13120, timeMs: 13120, penalty: 'None', scramble: "D2 F2 R2 D2 B2 R' D2 F2 L2 F2 R F' D L2 B2 F' U' B F2 D2", timestamp: '2026-11-20T11:00:00Z', notes: 'Quick F2L' },
  { id: 3, rawTimeMs: 11850, timeMs: 11850, penalty: 'None', scramble: "B2 D2 F2 L' U2 R B2 R' U2 R' U2 F' D2 L' U' B' D' R' F2 D", timestamp: '2026-11-20T12:00:00Z', notes: 'Fast PLL skip' },
  { id: 4, rawTimeMs: 12430, timeMs: 12430, penalty: 'None', scramble: "U' F2 U' L2 D B2 R2 F2 D' B2 D' F' L2 R B' F' L2 D2 U' R2", timestamp: '2026-11-21T09:00:00Z' },
  { id: 5, rawTimeMs: 10940, timeMs: 10940, penalty: 'None', scramble: "R2 U' L2 D2 B2 F2 D' L2 B2 D2 F R' D2 F2 U L2 U F R' U2", timestamp: '2026-11-21T10:00:00Z', notes: 'PB single! Smooth T-perm', tags: 'PB' },
  { id: 6, rawTimeMs: 12880, timeMs: 12880, penalty: 'None', scramble: "L2 D2 B2 U2 R2 B2 D2 L2 F' D2 F' L F' D U' L B D F2 R'", timestamp: '2026-11-21T14:00:00Z' },
  { id: 7, rawTimeMs: 13120, timeMs: 15120, penalty: 'PlusTwo', scramble: "F2 R2 U2 B2 R2 D2 F2 U2 R' D2 L B L2 F D2 U R' B' R' F", timestamp: '2026-11-22T08:00:00Z', notes: '+2 AUF misalignment' },
  { id: 8, rawTimeMs: 11420, timeMs: 11420, penalty: 'None', scramble: "D2 L2 F2 U' B2 U F2 D2 R2 B2 U' B L B2 D' L2 R' U' L2 B", timestamp: '2026-11-22T10:00:00Z', notes: 'Clean OLL 33' },
  { id: 9, rawTimeMs: 12100, timeMs: 12100, penalty: 'None', scramble: "B2 R2 D2 F2 U2 R2 U' B2 R2 D' F' L2 R D B' F' L' U2 B2", timestamp: '2026-11-23T15:00:00Z' },
  { id: 10, rawTimeMs: 11980, timeMs: 11980, penalty: 'None', scramble: "U2 B2 R2 U' B2 D' L2 D2 L2 R2 U B' L' R' F' D B2 R B2 F", timestamp: '2026-11-23T16:00:00Z', notes: 'Ao5 PR!' },
  { id: 11, rawTimeMs: 13540, timeMs: 13540, penalty: 'None', scramble: "D' L2 F2 R2 U' L2 D2 F2 D2 R2 D' F' R2 B L D' B' F2 R' B2", timestamp: '2026-11-24T09:00:00Z' },
  { id: 12, rawTimeMs: 10820, timeMs: 10820, penalty: 'None', scramble: "R2 B2 U2 F2 D2 L2 U' R2 D' L2 F' R D B2 F' L U' R' B' F'", timestamp: '2026-11-24T11:00:00Z', notes: 'Sub-11! Easy cross + free pair', tags: 'PB' }
];

const DEFAULT_SCRAMBLE = "R2 D' B2 L2 U2 F2 D B2 R2 B' U R2 F2 R' D' B' F2 U B2 R'";

export const useTimerStore = create<TimerState>((set, get) => ({
  status: 'idle',
  elapsedMs: 0,
  inspectionRemaining: 15,
  scramble: DEFAULT_SCRAMBLE,
  scrambleType: '3x3',
  solves: INITIAL_SOLVES,
  inspectionEnabled: false,
  selectedSolveId: null,

  setStatus: (status) => set({ status }),
  setElapsedMs: (elapsedMs) => set({ elapsedMs }),
  setInspectionRemaining: (inspectionRemaining) => set({ inspectionRemaining }),
  setScramble: (scramble) => set({ scramble }),
  setScrambleType: (scrambleType) => {
    set({ scrambleType });
    get().generateNewScramble();
  },
  toggleInspection: () => set((state) => ({ inspectionEnabled: !state.inspectionEnabled })),

  generateNewScramble: () => {
    const { scrambleType } = get();
    let sc = generateLocal3x3Scramble();
    if (scrambleType === 'cross') {
      sc = generateLocal3x3Scramble(14);
    } else if (scrambleType === 'f2l') {
      sc = "R U R' U' y' R' U' R U R U R' U' R' F R F'";
    } else if (scrambleType === 'oll') {
      sc = "F R U R' U' F' R U R' U R U2 R'";
    } else if (scrambleType === 'pll') {
      sc = "R U R' U' R' F R2 U' R' U' R U R' F'";
    }
    set({ scramble: sc });
  },

  recordSolve: (rawMs, penalty = 'None') => {
    const { solves, scramble } = get();
    const effective = penalty === 'PlusTwo' ? rawMs + 2000 : (penalty === 'DNF' ? -1 : rawMs);
    const newSolve: SolveItem = {
      id: Date.now(),
      rawTimeMs: rawMs,
      timeMs: effective,
      penalty,
      scramble,
      timestamp: new Date().toISOString()
    };
    set({
      solves: [newSolve, ...solves]
    });
    get().generateNewScramble();
  },

  updateSolvePenalty: (id, penalty) => {
    set((state) => ({
      solves: state.solves.map((s) => {
        if (s.id !== id) return s;
        const effective = penalty === 'PlusTwo' ? s.rawTimeMs + 2000 : (penalty === 'DNF' ? -1 : s.rawTimeMs);
        return { ...s, penalty, timeMs: effective };
      })
    }));
  },

  deleteSolve: (id) => {
    set((state) => ({
      solves: state.solves.filter((s) => s.id !== id),
      selectedSolveId: state.selectedSolveId === id ? null : state.selectedSolveId
    }));
  },

  setSelectedSolveId: (id) => set({ selectedSolveId: id }),

  getAo5: () => {
    const { solves } = get();
    if (solves.length < 5) return null;
    const subset = solves.slice(0, 5);
    const dnfs = subset.filter((s) => s.penalty === 'DNF');
    if (dnfs.length > 1) return -1;
    const sorted = [...subset].sort((a, b) => {
      if (a.penalty === 'DNF') return 1;
      if (b.penalty === 'DNF') return -1;
      return a.timeMs - b.timeMs;
    });
    // Drop best and worst
    const trimmed = sorted.slice(1, 4);
    return Math.round(trimmed.reduce((acc, s) => acc + s.timeMs, 0) / 3);
  },

  getAo12: () => {
    const { solves } = get();
    if (solves.length < 12) return null;
    const subset = solves.slice(0, 12);
    const dnfs = subset.filter((s) => s.penalty === 'DNF');
    if (dnfs.length > 1) return -1;
    const sorted = [...subset].sort((a, b) => {
      if (a.penalty === 'DNF') return 1;
      if (b.penalty === 'DNF') return -1;
      return a.timeMs - b.timeMs;
    });
    // Drop best and worst
    const trimmed = sorted.slice(1, 11);
    return Math.round(trimmed.reduce((acc, s) => acc + s.timeMs, 0) / 10);
  },

  getBestSingle: () => {
    const { solves } = get();
    const valid = solves.filter((s) => s.penalty !== 'DNF' && s.timeMs > 0);
    if (valid.length === 0) return null;
    return Math.min(...valid.map((s) => s.timeMs));
  },

  getMean: () => {
    const { solves } = get();
    const valid = solves.filter((s) => s.penalty !== 'DNF' && s.timeMs > 0);
    if (valid.length === 0) return null;
    return Math.round(valid.reduce((acc, s) => acc + s.timeMs, 0) / valid.length);
  }
}));
