import { create } from 'zustand';

export type MatchStatus = 'idle' | 'waiting' | 'playing' | 'finished';
export type RoundStatus = 'pending' | 'inspection' | 'solving' | 'finished';

export interface MatchPlayer {
  userId: string;
  displayName: string;
  isReady: boolean;
  wins: number;
}

export interface RoundResult {
  userId: string;
  timeMs: number | null;
  isDnf: boolean;
  isWinner: boolean;
}

export interface MatchRound {
  roundId: number;
  roundNumber: number;
  scramble: string;
  startedAt: string | null;
  results: RoundResult[];
  status: RoundStatus;
}

interface MatchState {
  roomCode: string | null;
  roomStatus: MatchStatus;
  bestOf: number;
  hostUserId: string | null;
  players: MatchPlayer[];
  currentRound: MatchRound | null;
  rounds: MatchRound[];
  matchWinnerId: string | null;
  matchWinnerName: string | null;
  error: string | null;
  isConnecting: boolean;

  setRoom: (code: string, status: MatchStatus, bestOf: number, hostUserId: string, players: MatchPlayer[]) => void;
  updatePlayers: (players: MatchPlayer[]) => void;
  setPlayerReady: (userId: string, ready: boolean) => void;
  startRound: (round: MatchRound) => void;
  submitResult: (userId: string, timeMs: number | null, isDnf: boolean) => void;
  finishRound: (results: RoundResult[], scores: { userId: string; wins: number }[]) => void;
  finishMatch: (winnerId: string, displayName: string) => void;
  setError: (e: string | null) => void;
  setIsConnecting: (v: boolean) => void;
  reset: () => void;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  roomCode: null,
  roomStatus: 'idle',
  bestOf: 3,
  hostUserId: null,
  players: [],
  currentRound: null,
  rounds: [],
  matchWinnerId: null,
  matchWinnerName: null,
  error: null,
  isConnecting: false,

  setRoom: (code, status, bestOf, hostUserId, players) =>
    set({ roomCode: code, roomStatus: status, bestOf, hostUserId, players }),

  updatePlayers: (players) => set({ players }),

  setPlayerReady: (userId, ready) =>
    set((s) => ({
      players: s.players.map((p) => (p.userId === userId ? { ...p, isReady: ready } : p)),
    })),

  startRound: (round) =>
    set({ currentRound: round, rounds: [...get().rounds, round] }),

  submitResult: (userId, timeMs, isDnf) =>
    set((s) => {
      if (!s.currentRound) return {};
      const results = [...(s.currentRound.results ?? [])];
      const idx = results.findIndex((r) => r.userId === userId);
      const result: RoundResult = { userId, timeMs, isDnf, isWinner: false };
      if (idx >= 0) results[idx] = result;
      else results.push(result);
      return { currentRound: { ...s.currentRound, results } };
    }),

  finishRound: (results, scores) =>
    set((s) => {
      const updatedRound = s.currentRound
        ? { ...s.currentRound, results, status: 'finished' as RoundStatus }
        : null;
      const updatedPlayers = s.players.map((p) => {
        const score = scores.find((sc) => sc.userId === p.userId);
        return score ? { ...p, wins: score.wins } : p;
      });
      return {
        currentRound: updatedRound,
        players: updatedPlayers,
        rounds: s.rounds.map((r) =>
          updatedRound && r.roundId === updatedRound.roundId ? updatedRound : r
        ),
      };
    }),

  finishMatch: (winnerId, displayName) =>
    set({ matchWinnerId: winnerId, matchWinnerName: displayName, roomStatus: 'finished' }),

  setError: (e) => set({ error: e }),
  setIsConnecting: (v) => set({ isConnecting: v }),
  reset: () =>
    set({
      roomCode: null,
      roomStatus: 'idle',
      bestOf: 3,
      hostUserId: null,
      players: [],
      currentRound: null,
      rounds: [],
      matchWinnerId: null,
      matchWinnerName: null,
      error: null,
      isConnecting: false,
    }),
}));
