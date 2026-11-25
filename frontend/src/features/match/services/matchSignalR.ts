import * as signalR from '@microsoft/signalr';
import { useMatchStore, MatchPlayer, MatchRound, MatchStatus, RoundResult } from '../stores/useMatchStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { generateLocal3x3Scramble } from '@/lib/store/useTimerStore';

let connection: signalR.HubConnection | null = null;
let isOfflineSimulation = false;
let broadcastChannel: BroadcastChannel | null = null;
let storageListenerAttached = false;
let botTimerId: ReturnType<typeof setTimeout> | null = null;

function sanitizeApiUrl(raw?: string): string {
  if (!raw) return 'http://localhost:5247';
  const cleaned = raw.trim().replace(/^https?:\/\/(https?:\/\/)/i, '$1');
  if (cleaned.includes('localhost:5247.trycloudflare.com')) {
    return 'http://localhost:5247';
  }
  return cleaned.replace(/\/+$/, '');
}

const API_URL = sanitizeApiUrl(process.env.NEXT_PUBLIC_API_URL);

const BOT_USER_ID = 'bot-quangminh-3x3';
const BOT_NAME = 'QuangMinh_3x3 (Bot Sub-12)';
const ROOM_STORAGE_PREFIX = 'cubex_match_room_';
const SESSION_TAB_ID_KEY = 'cubex_tab_player_id';

interface SharedRoomSnapshot {
  code: string;
  status: MatchStatus;
  bestOf: number;
  hostUserId: string;
  players: MatchPlayer[];
  currentRound: MatchRound | null;
  rounds: MatchRound[];
  matchWinnerId: string | null;
  matchWinnerName: string | null;
  updatedAt: number;
}

/**
 * Returns a unique player identity per browser tab when two tabs share the same logged-in user,
 * so testing 1v1 across 2 tabs on the same browser always treats Tab 1 and Tab 2 as 2 distinct players.
 */
export function getLocalTabPlayer(): { userId: string; displayName: string } {
  const user = useAuthStore.getState().user;
  const baseName = user?.displayName ?? 'Minh Speedcuber';
  const baseId = user?.id ?? 'cubist-user';

  if (typeof window === 'undefined') {
    return { userId: baseId, displayName: baseName };
  }

  let tabId = sessionStorage.getItem(SESSION_TAB_ID_KEY);
  if (!tabId) {
    tabId = Math.random().toString(36).substring(2, 6).toUpperCase();
    sessionStorage.setItem(SESSION_TAB_ID_KEY, tabId);
  }

  return {
    userId: `${baseId}__${tabId}`,
    displayName: baseName,
  };
}

function readSharedRoom(code: string): SharedRoomSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${ROOM_STORAGE_PREFIX}${code}`);
    if (!raw) return null;
    return JSON.parse(raw) as SharedRoomSnapshot;
  } catch {
    return null;
  }
}

function writeSharedRoom(snapshot: SharedRoomSnapshot) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${ROOM_STORAGE_PREFIX}${snapshot.code}`, JSON.stringify(snapshot));
    if (broadcastChannel) {
      broadcastChannel.postMessage(snapshot);
    }
  } catch {
    // ignore storage quota errors
  }
}

function applySnapshotToStore(snapshot: SharedRoomSnapshot) {
  const store = useMatchStore.getState();
  if (store.roomCode && store.roomCode !== snapshot.code) return;

  useMatchStore.setState({
    roomCode: snapshot.code,
    roomStatus: snapshot.status,
    bestOf: snapshot.bestOf,
    hostUserId: snapshot.hostUserId,
    players: snapshot.players,
    currentRound: snapshot.currentRound,
    rounds: snapshot.rounds,
    matchWinnerId: snapshot.matchWinnerId,
    matchWinnerName: snapshot.matchWinnerName,
    isConnecting: false,
    error: null,
  });
}

function ensureLocalSyncChannels() {
  if (typeof window === 'undefined') return;

  if (!broadcastChannel && typeof BroadcastChannel !== 'undefined') {
    broadcastChannel = new BroadcastChannel('cubex_match_p2p_channel');
    broadcastChannel.onmessage = (event: MessageEvent<SharedRoomSnapshot>) => {
      const snap = event.data;
      const currentCode = useMatchStore.getState().roomCode;
      if (snap && snap.code && (!currentCode || currentCode === snap.code)) {
        applySnapshotToStore(snap);
      }
    };
  }

  if (!storageListenerAttached) {
    storageListenerAttached = true;
    window.addEventListener('storage', (e: StorageEvent) => {
      if (!e.key || !e.key.startsWith(ROOM_STORAGE_PREFIX) || !e.newValue) return;
      try {
        const snap = JSON.parse(e.newValue) as SharedRoomSnapshot;
        const currentCode = useMatchStore.getState().roomCode;
        if (snap && snap.code && currentCode === snap.code) {
          applySnapshotToStore(snap);
        }
      } catch {
        // ignore
      }
    });
  }
}

export function getConnection() {
  return connection;
}

export function isUsingOfflineSimulation() {
  return isOfflineSimulation;
}

export async function connectMatch(token: string, roomCodeHint?: string): Promise<signalR.HubConnection | null> {
  ensureLocalSyncChannels();

  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    isOfflineSimulation = false;
    return connection;
  }

  const store = useMatchStore.getState();
  const targetCode = roomCodeHint?.toUpperCase() || store.roomCode || undefined;
  store.setIsConnecting(true);
  store.setError(null);

  // If using a local demo/mock token, use local P2P room sync directly without throwing WebSocket errors
  if (token === 'admin-token' || token === 'mock-jwt-token-cubex-2026') {
    connection = null;
    isOfflineSimulation = true;
    store.setIsConnecting(false);
    // Re-hydrate current room if already inside one, or initialize if opened via URL
    if (targetCode) {
      const existing = readSharedRoom(targetCode);
      if (existing && existing.players.length > 0) {
        applySnapshotToStore(existing);
      } else {
        const me = getLocalTabPlayer();
        const fallbackSnapshot: SharedRoomSnapshot = {
          code: targetCode,
          status: 'waiting',
          bestOf: store.bestOf || 3,
          hostUserId: me.userId,
          players: [{ userId: me.userId, displayName: me.displayName, isReady: false, wins: 0 }],
          currentRound: null,
          rounds: [],
          matchWinnerId: null,
          matchWinnerName: null,
          updatedAt: Date.now(),
        };
        writeSharedRoom(fallbackSnapshot);
        applySnapshotToStore(fallbackSnapshot);
      }
    }
    return null;
  }

  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${API_URL}/hubs/match?access_token=${token}`, {
      skipNegotiation: true,
      transport: signalR.HttpTransportType.WebSockets,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .configureLogging(signalR.LogLevel.None)
    .build();

  connection.on('RoomCreated', (state: RoomState) => {
    store.setRoom(state.code, 'waiting', state.bestOf, state.hostUserId, state.players);
    store.setIsConnecting(false);
  });

  connection.on('RoomUpdated', (state: RoomState) => {
    store.setRoom(state.code, state.status as never, state.bestOf, state.hostUserId, state.players);
    store.setIsConnecting(false);
  });

  connection.on('Reconnected', () => {
    store.setError(null);
  });

  connection.on('PlayerReady', ({ userId, ready }: { userId: string; ready: boolean }) => {
    store.setPlayerReady(userId, ready);
  });

  connection.on('PlayerDisconnected', ({ userId }: { userId: string }) => {
    store.setPlayerReady(userId, false);
  });

  connection.on('PlayerLeft', ({ userId }: { userId: string }) => {
    const { players } = useMatchStore.getState();
    store.updatePlayers(players.filter((p) => p.userId !== userId));
  });

  connection.on('RoundStarted', (data: {
    roundId: number;
    roundNumber: number;
    scramble: string;
    startedAt: string;
  }) => {
    store.startRound({
      roundId: data.roundId,
      roundNumber: data.roundNumber,
      scramble: data.scramble,
      startedAt: data.startedAt,
      results: [],
      status: 'solving',
    });
  });

  connection.on('ResultSubmitted', (data: { userId: string; timeMs: number | null; isDnf: boolean }) => {
    store.submitResult(data.userId, data.timeMs, data.isDnf);
  });

  connection.on('RoundFinished', (data: {
    roundId: number;
    results: RoundResult[];
    scores: { userId: string; wins: number }[];
  }) => {
    store.finishRound(data.results, data.scores);
  });

  connection.on('MatchFinished', (data: { winnerId: string; displayName: string }) => {
    store.finishMatch(data.winnerId, data.displayName);
  });

  connection.on('WaitingForNextRound', () => {
    const s = useMatchStore.getState();
    s.updatePlayers(s.players.map((p) => ({ ...p, isReady: false })));
  });

  connection.onreconnecting(() => store.setIsConnecting(true));
  connection.onreconnected(() => store.setIsConnecting(false));
  connection.onclose(() => {
    store.setIsConnecting(false);
  });

  try {
    await connection.start();
    isOfflineSimulation = false;
    store.setIsConnecting(false);
    return connection;
  } catch {
    connection = null;
    isOfflineSimulation = true;
    store.setError(null);
    store.setIsConnecting(false);
    if (targetCode) {
      const existing = readSharedRoom(targetCode);
      if (existing && existing.players.length > 0) {
        applySnapshotToStore(existing);
      } else {
        const me = getLocalTabPlayer();
        const fallbackSnapshot: SharedRoomSnapshot = {
          code: targetCode,
          status: 'waiting',
          bestOf: store.bestOf || 3,
          hostUserId: me.userId,
          players: [{ userId: me.userId, displayName: me.displayName, isReady: false, wins: 0 }],
          currentRound: null,
          rounds: [],
          matchWinnerId: null,
          matchWinnerName: null,
          updatedAt: Date.now(),
        };
        writeSharedRoom(fallbackSnapshot);
        applySnapshotToStore(fallbackSnapshot);
      }
    }
    return null;
  }
}

export async function disconnectMatch() {
  if (botTimerId) {
    clearTimeout(botTimerId);
    botTimerId = null;
  }
  if (connection) {
    try {
      await connection.stop();
    } catch {}
    connection = null;
  }
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'CX-';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createRoom(bestOf: number) {
  if (connection && !isOfflineSimulation) {
    await connection.invoke('CreateRoom', bestOf);
    return;
  }

  ensureLocalSyncChannels();
  const me = getLocalTabPlayer();
  const code = generateRoomCode();

  const snapshot: SharedRoomSnapshot = {
    code,
    status: 'waiting',
    bestOf,
    hostUserId: me.userId,
    players: [
      { userId: me.userId, displayName: me.displayName, isReady: false, wins: 0 },
    ],
    currentRound: null,
    rounds: [],
    matchWinnerId: null,
    matchWinnerName: null,
    updatedAt: Date.now(),
  };

  writeSharedRoom(snapshot);
  applySnapshotToStore(snapshot);
}

export async function joinRoom(rawCode: string) {
  const code = rawCode.trim().toUpperCase();
  if (connection && !isOfflineSimulation) {
    await connection.invoke('JoinRoom', code);
    return;
  }

  ensureLocalSyncChannels();
  const me = getLocalTabPlayer();
  const existing = readSharedRoom(code);

  if (!existing) {
    throw new Error(`Không tìm thấy phòng ${code}. Hãy kiểm tra lại mã phòng.`);
  }

  const alreadyInRoom = existing.players.some((p) => p.userId === me.userId);
  if (!alreadyInRoom && existing.players.length >= 2) {
    throw new Error(`Phòng ${code} đã đủ 2 người chơi.`);
  }

  let updatedPlayers = [...existing.players];
  if (!alreadyInRoom) {
    // If both tabs have the same display name, distinguish player 2 slightly so it's clear
    const hostName = existing.players[0]?.displayName;
    const guestName = hostName === me.displayName ? `${me.displayName} (Đối thủ)` : me.displayName;
    updatedPlayers.push({
      userId: me.userId,
      displayName: guestName,
      isReady: false,
      wins: 0,
    });
  }

  const updated: SharedRoomSnapshot = {
    ...existing,
    players: updatedPlayers,
    updatedAt: Date.now(),
  };

  writeSharedRoom(updated);
  applySnapshotToStore(updated);
}

/**
 * Allows the host to optionally invite a Bot opponent if they want to practice solo without opening a 2nd tab.
 */
export function addBotOpponentToRoom() {
  const store = useMatchStore.getState();
  const code = store.roomCode;
  if (!code) return;

  const existing = readSharedRoom(code);
  const basePlayers = existing?.players ?? store.players;
  if (basePlayers.length >= 2) return;

  const updatedPlayers: MatchPlayer[] = [
    ...basePlayers,
    { userId: BOT_USER_ID, displayName: BOT_NAME, isReady: true, wins: 0 },
  ];

  const snapshot: SharedRoomSnapshot = {
    code,
    status: 'waiting',
    bestOf: existing?.bestOf ?? store.bestOf,
    hostUserId: existing?.hostUserId ?? store.hostUserId ?? basePlayers[0]?.userId ?? '',
    players: updatedPlayers,
    currentRound: null,
    rounds: existing?.rounds ?? store.rounds,
    matchWinnerId: null,
    matchWinnerName: null,
    updatedAt: Date.now(),
  };

  writeSharedRoom(snapshot);
  applySnapshotToStore(snapshot);
}

export async function setReady(ready: boolean) {
  if (connection && !isOfflineSimulation) {
    await connection.invoke('SetReady', ready);
    return;
  }

  const store = useMatchStore.getState();
  const code = store.roomCode;
  if (!code) return;

  const me = getLocalTabPlayer();
  const existing = readSharedRoom(code);
  if (!existing) return;

  let players = existing.players.map((p) =>
    p.userId === me.userId ? { ...p, isReady: ready } : p
  );

  // If playing with Bot, Bot is always ready
  if (players.some((p) => p.userId === BOT_USER_ID)) {
    players = players.map((p) => (p.userId === BOT_USER_ID ? { ...p, isReady: true } : p));
  }

  const bothReady = players.length === 2 && players.every((p) => p.isReady);

  let status: MatchStatus = existing.status;
  let currentRound = existing.currentRound;
  let rounds = [...existing.rounds];

  if (bothReady && (existing.status === 'waiting' || existing.currentRound?.status === 'finished')) {
    status = 'playing';
    const nextRoundNum = rounds.length + 1;
    const newRound: MatchRound = {
      roundId: Date.now(),
      roundNumber: nextRoundNum,
      scramble: generateLocal3x3Scramble(20),
      startedAt: new Date().toISOString(),
      results: [],
      status: 'solving',
    };
    currentRound = newRound;
    rounds.push(newRound);
  }

  const updated: SharedRoomSnapshot = {
    ...existing,
    status,
    players,
    currentRound,
    rounds,
    updatedAt: Date.now(),
  };

  writeSharedRoom(updated);
  applySnapshotToStore(updated);
}

export async function submitResult(roundId: number, timeMs: number | null) {
  if (connection && !isOfflineSimulation) {
    await connection.invoke('SubmitResult', roundId, timeMs);
    return;
  }

  const store = useMatchStore.getState();
  const code = store.roomCode;
  if (!code) return;

  const me = getLocalTabPlayer();
  const existing = readSharedRoom(code);
  if (!existing || !existing.currentRound) return;

  const myValidTime = timeMs ?? 12000;
  const isDnf = timeMs === null;

  const results = [...(existing.currentRound.results ?? [])];
  const existingIdx = results.findIndex((r) => r.userId === me.userId);
  const myEntry: RoundResult = {
    userId: me.userId,
    timeMs: myValidTime,
    isDnf,
    isWinner: false,
  };
  if (existingIdx >= 0) results[existingIdx] = myEntry;
  else results.push(myEntry);

  // If opponent is Bot, generate Bot's result too
  const hasBot = existing.players.some((p) => p.userId === BOT_USER_ID);
  if (hasBot && !results.some((r) => r.userId === BOT_USER_ID)) {
    const botTimeMs = Math.round(9800 + Math.random() * 3800);
    results.push({
      userId: BOT_USER_ID,
      timeMs: botTimeMs,
      isDnf: false,
      isWinner: false,
    });
  }

  let currentRound: MatchRound = {
    ...existing.currentRound,
    results,
  };
  let players = [...existing.players];
  let status: MatchStatus = existing.status;
  let matchWinnerId = existing.matchWinnerId;
  let matchWinnerName = existing.matchWinnerName;

  // Check if both players have submitted
  if (results.length >= existing.players.length && existing.players.length === 2) {
    // Determine round winner (lowest non-DNF timeMs)
    const validResults = results
      .filter((r) => !r.isDnf && r.timeMs !== null)
      .sort((a, b) => (a.timeMs ?? Infinity) - (b.timeMs ?? Infinity));

    const roundWinnerId = validResults[0]?.userId ?? null;

    const finalResults = results.map((r) => ({
      ...r,
      isWinner: roundWinnerId !== null && r.userId === roundWinnerId,
    }));

    players = players.map((p) => ({
      ...p,
      wins: p.wins + (p.userId === roundWinnerId ? 1 : 0),
      isReady: p.userId === BOT_USER_ID, // Reset human ready state for next round
    }));

    currentRound = {
      ...currentRound,
      results: finalResults,
      status: 'finished',
    };

    const neededWins = Math.ceil(existing.bestOf / 2);
    const matchWinner = players.find((p) => p.wins >= neededWins);
    if (matchWinner) {
      status = 'finished';
      matchWinnerId = matchWinner.userId;
      matchWinnerName = matchWinner.displayName;
    }
  }

  const rounds = existing.rounds.map((r) =>
    r.roundId === currentRound.roundId ? currentRound : r
  );

  const updated: SharedRoomSnapshot = {
    ...existing,
    status,
    players,
    currentRound,
    rounds,
    matchWinnerId,
    matchWinnerName,
    updatedAt: Date.now(),
  };

  writeSharedRoom(updated);
  applySnapshotToStore(updated);
}

export async function leaveRoom(explicitCode?: string) {
  if (botTimerId) {
    clearTimeout(botTimerId);
    botTimerId = null;
  }

  const store = useMatchStore.getState();
  const code = (explicitCode || store.roomCode || '').toUpperCase();
  store.reset();

  if (connection && !isOfflineSimulation) {
    try {
      await connection.invoke('LeaveRoom');
    } catch {}
    return;
  }

  if (!code) return;

  const me = getLocalTabPlayer();
  const existing = readSharedRoom(code);
  if (existing) {
    const remaining = existing.players.filter(
      (p) => p.userId !== me.userId && p.userId !== BOT_USER_ID
    );
    if (remaining.length === 0) {
      try {
        localStorage.removeItem(`${ROOM_STORAGE_PREFIX}${code}`);
      } catch {}
    } else {
      const updated: SharedRoomSnapshot = {
        ...existing,
        status: 'waiting',
        players: remaining.map((p) => ({ ...p, isReady: false })),
        currentRound: null,
        updatedAt: Date.now(),
      };
      writeSharedRoom(updated);
    }
  }
}

interface RoomState {
  code: string;
  status: string;
  bestOf: number;
  hostUserId: string;
  players: MatchPlayer[];
}
