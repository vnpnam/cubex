import { create } from 'zustand';

/**
 * Total trackable CFOP algorithms across F2L (41) + OLL (57) + PLL (21) = 119 cases.
 * Progress is stored per userId so a new or unpracticed user starts at 0% (0/119).
 */
export const TOTAL_CFOP_CASES = 119;
export const TOTAL_F2L_CASES = 41;
export const TOTAL_OLL_CASES = 57;
export const TOTAL_PLL_CASES = 21;

interface LearnProgressState {
  masteredByUser: Record<string, string[]>;
  toggleMastered: (userId: string, algCode: string) => void;
  markMastered: (userId: string, algCode: string) => void;
  isMastered: (userId: string, algCode: string) => boolean;
  getUserStats: (userId?: string | null) => {
    totalLearned: number;
    totalCases: number;
    overallPercent: number;
    f2lLearned: number;
    ollLearned: number;
    pllLearned: number;
  };
}

const STORAGE_KEY = 'cubex_learn_progress_v1';

function loadProgressMap(): Record<string, string[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, string[]>;
  } catch {
    return {};
  }
}

function saveProgressMap(map: Record<string, string[]>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export const useLearnProgressStore = create<LearnProgressState>((set, get) => ({
  masteredByUser: {},

  toggleMastered: (userId, algCode) => {
    const key = userId || 'guest';
    const current = get().masteredByUser[key] ?? [];
    const exists = current.includes(algCode);
    const updatedList = exists
      ? current.filter((c) => c !== algCode)
      : [...current, algCode];

    const nextMap = {
      ...get().masteredByUser,
      [key]: updatedList,
    };
    saveProgressMap(nextMap);
    set({ masteredByUser: nextMap });
  },

  markMastered: (userId, algCode) => {
    const key = userId || 'guest';
    const current = get().masteredByUser[key] ?? [];
    if (current.includes(algCode)) return;
    const nextMap = {
      ...get().masteredByUser,
      [key]: [...current, algCode],
    };
    saveProgressMap(nextMap);
    set({ masteredByUser: nextMap });
  },

  isMastered: (userId, algCode) => {
    const key = userId || 'guest';
    const current = get().masteredByUser[key] ?? [];
    return current.includes(algCode);
  },

  getUserStats: (userId) => {
    const key = userId || 'guest';
    const list = get().masteredByUser[key] ?? [];
    const f2lLearned = list.filter((c) => c.startsWith('F2L')).length;
    const ollLearned = list.filter((c) => c.startsWith('OLL')).length;
    const pllLearned = list.filter((c) => c.startsWith('PLL')).length;
    const totalLearned = f2lLearned + ollLearned + pllLearned;
    const overallPercent = Math.min(100, Math.round((totalLearned / TOTAL_CFOP_CASES) * 100));

    return {
      totalLearned,
      totalCases: TOTAL_CFOP_CASES,
      overallPercent,
      f2lLearned,
      ollLearned,
      pllLearned,
    };
  },
}));

if (typeof window !== 'undefined') {
  useLearnProgressStore.setState({ masteredByUser: loadProgressMap() });
}
