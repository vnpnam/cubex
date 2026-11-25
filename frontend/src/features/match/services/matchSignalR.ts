import * as signalR from '@microsoft/signalr';
import { useMatchStore, MatchPlayer, MatchRound, MatchStatus, RoundResult } from '../stores/useMatchStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { generateLocal3x3Scramble } from '@/lib/store/useTimerStore';

let connection: signalR.HubConnection | null = null;
let isOfflineSimulation = false;
let broadcastChannel: BroadcastChannel | null = null;
let storageListenerAttached = false;
let botTimerId: ReturnType<typeof setTimeout> | null = null;
let serverSyncIntervalId: ReturnType<typeof setInterval> | null = null;

const BOT_USER_ID = 'bot-quangminh-3x3';
const BOT_NAME = 'QuangMinh_3x3 (Bot Sub-12)';
const ROOM_STORAGE_PREFIX = 'cubex_match_room_';
const SESSION_TAB_ID_KEY = 'cubex_tab_player_id';

interface SharedRoomSnapshot {
  code: string;
  status: MatchStatus;
  bestOf: number;
  hostUserId: string;
  players: (MatchPlayer & { readyForRound?: number })[];
  currentRound: MatchRound | null;
  rounds: MatchRound[];
  matchWinnerId: string | null;
  matchWinnerName: string | null;
  updatedAt: number;
}

/**
 * Client-side deterministic reconciliation so local P2P tabs and server snapshots
 * always converge to the exact same round/winner/ready state.
 */
function reconcileClientSnapshot(room: SharedRoomSnapshot): SharedRoomSnapshot {
  const bestOf = room.bestOf || 3;
  const neededWins = Math.ceil(bestOf / 2);
  let players = [...(room.players || [])];

  // Reconcile rounds by roundNumber
  const roundsByNum = new Map<number, MatchRound>();
  for (const r of room.rounds || []) {
    const num = r.roundNumber || 1;
    const prev = roundsByNum.get(num);
    if (!prev) {
      roundsByNum.set(num, { ...r, roundId: num, roundNumber: num });
    } else {
      const resByUser = new Map<string, RoundResult>();
      for (const res of prev.results || []) resByUser.set(res.userId, res);
      for (const res of r.results || []) resByUser.set(res.userId, res);
      roundsByNum.set(num, {
        ...prev,
        scramble: prev.scramble || r.scramble,
        results: Array.from(resByUser.values()),
        status: prev.status === 'finished' || r.status === 'finished' ? 'finished' : 'solving',
      });
    }
  }

  if (room.currentRound) {
    const num = room.currentRound.roundNumber || 1;
    const prev = roundsByNum.get(num);
    if (!prev) {
      roundsByNum.set(num, { ...room.currentRound, roundId: num, roundNumber: num });
    } else {
      const resByUser = new Map<string, RoundResult>();
      for (const res of prev.results || []) resByUser.set(res.userId, res);
      for (const res of room.currentRound.results || []) resByUser.set(res.userId, res);
      roundsByNum.set(num, {
        ...prev,
        results: Array.from(resByUser.values()),
        status:
          prev.status === 'finished' || room.currentRound.status === 'finished'
            ? 'finished'
            : 'solving',
      });
    }
  }

  const sortedRounds = Array.from(roundsByNum.values()).sort(
    (a, b) => a.roundNumber - b.roundNumber
  );

  const winsByUser = new Map<string, number>();
  for (const p of players) winsByUser.set(p.userId, 0);

  const hasBot = players.some((p) => p.userId === BOT_USER_ID);

  const evaluatedRounds: MatchRound[] = sortedRounds.map((round) => {
    const resByUser = new Map<string, RoundResult>();
    for (const r of round.results || []) resByUser.set(r.userId, r);

    if (hasBot && resByUser.size === 1 && !resByUser.has(BOT_USER_ID)) {
      const botTimeMs = Math.round(9800 + Math.random() * 3800);
      resByUser.set(BOT_USER_ID, {
        userId: BOT_USER_ID,
        timeMs: botTimeMs,
        isDnf: false,
        isWinner: false,
      });
    }

    const allResults = Array.from(resByUser.values());

    if (players.length === 2 && allResults.length >= 2) {
      const validResults = allResults
        .filter((r) => !r.isDnf && r.timeMs !== null)
        .sort((a, b) => (a.timeMs ?? Infinity) - (b.timeMs ?? Infinity));
      const winnerId = validResults[0]?.userId ?? null;

      const finalResults = allResults.map((r) => ({
        ...r,
        isWinner: winnerId !== null && r.userId === winnerId,
      }));

      if (winnerId) {
        winsByUser.set(winnerId, (winsByUser.get(winnerId) || 0) + 1);
      }

      return {
        ...round,
        roundId: round.roundNumber,
        results: finalResults,
        status: 'finished',
      };
    }

    return {
      ...round,
      roundId: round.roundNumber,
      results: allResults,
      status: 'solving',
    };
  });

  players = players.map((p) => ({
    ...p,
    wins: winsByUser.get(p.userId) ?? p.wins ?? 0,
  }));

  let currentRound: MatchRound | null =
    evaluatedRounds.length > 0 ? evaluatedRounds[evaluatedRounds.length - 1] : null;

  if (currentRound && currentRound.status === 'solving') {
    players = players.map((p) => ({
      ...p,
      isReady: p.userId === BOT_USER_ID,
    }));
  }

  if (currentRound && currentRound.status === 'finished') {
    const nextRoundNum = currentRound.roundNumber + 1;
    players = players.map((p) => ({
      ...p,
      isReady: p.userId === BOT_USER_ID || (p.readyForRound ?? 0) >= nextRoundNum,
    }));
  }

  const matchWinner = players.find((p) => p.wins >= neededWins);
  if (matchWinner) {
    return {
      ...room,
      bestOf,
      status: 'finished',
      players: players.map((p) => ({ ...p, isReady: false })),
      currentRound,
      rounds: evaluatedRounds,
      matchWinnerId: matchWinner.userId,
      matchWinnerName: matchWinner.displayName,
      updatedAt: Date.now(),
    };
  }

  const targetNextRoundNum = evaluatedRounds.length + 1;
  const canStartNextRound =
    players.length === 2 &&
    (!currentRound || currentRound.status === 'finished') &&
    players.every((p) => p.isReady || (p.readyForRound ?? 0) >= targetNextRoundNum);

  if (canStartNextRound) {
    const newRound: MatchRound = {
      roundId: targetNextRoundNum,
      roundNumber: targetNextRoundNum,
      scramble: generateLocal3x3Scramble(20),
      startedAt: new Date().toISOString(),
      results: [],
      status: 'solving',
    };
    evaluatedRounds.push(newRound);
    currentRound = newRound;
    players = players.map((p) => ({
      ...p,
      isReady: p.userId === BOT_USER_ID,
    }));
  }

  const status: MatchStatus = evaluatedRounds.length > 0 ? 'playing' : 'waiting';

  return {
    ...room,
    bestOf,
    status,
    players,
    currentRound,
    rounds: evaluatedRounds,
    matchWinnerId: null,
    matchWinnerName: null,
    updatedAt: Date.now(),
  };
}

/**
 * Returns a unique player identity per browser tab when two tabs share the same logged-in user,
 * so testing 1v1 across 2 tabs or 2 devices always treats Player 1 and Player 2 as 2 distinct players.
 */
export function getLocalTabPlayer(): { userId: string; displayName: string } {
  const user = useAuthStore.getState().user;
  const baseName = user?.displayName ?? 'Cubist';
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

function buildSnapshotFromStore(): SharedRoomSnapshot | null {
  const st = useMatchStore.getState();
  if (!st.roomCode) return null;
  return {
    code: st.roomCode,
    status: st.roomStatus,
    bestOf: st.bestOf || 3,
    hostUserId: st.hostUserId || st.players[0]?.userId || '',
    players: st.players,
    currentRound: st.currentRound,
    rounds: st.rounds,
    matchWinnerId: st.matchWinnerId,
    matchWinnerName: st.matchWinnerName,
    updatedAt: Date.now(),
  };
}

function mergeClientSnapshots(
  a: SharedRoomSnapshot | null,
  b: SharedRoomSnapshot | null
): SharedRoomSnapshot | null {
  if (!a) return b ? reconcileClientSnapshot(b) : null;
  if (!b) return reconcileClientSnapshot(a);

  const nextRoundA = (a.rounds?.length || 0) + 1;
  const nextRoundB = (b.rounds?.length || 0) + 1;

  const playerMap = new Map<string, MatchPlayer & { readyForRound?: number }>();
  for (const p of a.players || []) {
    playerMap.set(p.userId, {
      ...p,
      readyForRound: p.readyForRound ?? (p.isReady ? nextRoundA : 0),
    });
  }
  for (const p of b.players || []) {
    const incomingReadyRound = p.readyForRound ?? (p.isReady ? nextRoundB : 0);
    if (!playerMap.has(p.userId)) {
      if (playerMap.size < 2) {
        const firstPlayer = Array.from(playerMap.values())[0];
        const displayName =
          firstPlayer && firstPlayer.displayName === p.displayName
            ? `${p.displayName} (Đối thủ)`
            : p.displayName;
        playerMap.set(p.userId, {
          ...p,
          displayName,
          readyForRound: incomingReadyRound,
        });
      }
    } else {
      const prev = playerMap.get(p.userId)!;
      const maxReadyRound = Math.max(prev.readyForRound ?? 0, incomingReadyRound);
      playerMap.set(p.userId, {
        ...prev,
        readyForRound: maxReadyRound,
        isReady: prev.isReady || p.isReady,
        wins: Math.max(prev.wins, p.wins),
      });
    }
  }

  const combinedRounds = [...(a.rounds || []), ...(b.rounds || [])];
  if (a.currentRound) combinedRounds.push(a.currentRound);
  if (b.currentRound) combinedRounds.push(b.currentRound);

  return reconcileClientSnapshot({
    code: a.code || b.code,
    status: a.status === 'playing' || b.status === 'playing' ? 'playing' : a.status,
    bestOf: a.bestOf || b.bestOf || 3,
    hostUserId: a.hostUserId || b.hostUserId,
    players: Array.from(playerMap.values()),
    currentRound: b.currentRound || a.currentRound,
    rounds: combinedRounds,
    matchWinnerId: a.matchWinnerId || b.matchWinnerId,
    matchWinnerName: a.matchWinnerName || b.matchWinnerName,
    updatedAt: Date.now(),
  });
}

function applySnapshotToStore(rawSnapshot: SharedRoomSnapshot) {
  const snapshot = reconcileClientSnapshot(rawSnapshot);
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

async function callServerRoomApi(payload: Record<string, unknown>): Promise<SharedRoomSnapshot | null> {
  try {
    const res = await fetch('/api/match/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const data = await res.json();
    if (!res.ok) {
      if (data?.error) throw new Error(data.error);
      return null;
    }
    return (data?.room as SharedRoomSnapshot) ?? null;
  } catch (err) {
    if (payload.action === 'join' && err instanceof Error && err.message.includes('đủ 2 người')) {
      throw err;
    }
    return null;
  }
}

function startServerSyncLoop() {
  if (typeof window === 'undefined') return;
  if (serverSyncIntervalId) return;

  serverSyncIntervalId = setInterval(async () => {
    const st = useMatchStore.getState();
    const code = st.roomCode;
    if (!code) return;

    const me = getLocalTabPlayer();
    const currentSnap = readSharedRoom(code) || buildSnapshotFromStore();

    const serverRoom = await callServerRoomApi({
      action: 'sync',
      code,
      player: { userId: me.userId, displayName: me.displayName, isReady: false, wins: 0 },
      snapshot: currentSnap,
    });

    if (serverRoom && useMatchStore.getState().roomCode === code) {
      const latestLocal = readSharedRoom(code) || buildSnapshotFromStore();
      const merged = mergeClientSnapshots(latestLocal, serverRoom) || serverRoom;
      writeSharedRoom(merged);
      applySnapshotToStore(merged);
    }
  }, 1000);
}

function stopServerSyncLoop() {
  if (serverSyncIntervalId) {
    clearInterval(serverSyncIntervalId);
    serverSyncIntervalId = null;
  }
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

  startServerSyncLoop();
}

export function getConnection() {
  return connection;
}

export function isUsingOfflineSimulation() {
  return isOfflineSimulation;
}

export async function connectMatch(_token: string, roomCodeHint?: string): Promise<signalR.HubConnection | null> {
  ensureLocalSyncChannels();
  connection = null;
  isOfflineSimulation = true;

  const store = useMatchStore.getState();
  const targetCode = roomCodeHint?.toUpperCase() || store.roomCode || undefined;
  store.setIsConnecting(false);
  store.setError(null);

  if (targetCode) {
    const me = getLocalTabPlayer();
    const localExisting = readSharedRoom(targetCode);

    // Check shared server room first so cross-device / phone / incognito syncs immediately
    const serverRoom = await callServerRoomApi({
      action: 'join',
      code: targetCode,
      player: { userId: me.userId, displayName: me.displayName, isReady: false, wins: 0 },
    });

    if (serverRoom) {
      // Merge with any local players if same machine
      if (localExisting && localExisting.players.length > serverRoom.players.length) {
        const synced = await callServerRoomApi({
          action: 'sync',
          code: targetCode,
          snapshot: localExisting,
        });
        const finalRoom = synced || localExisting;
        writeSharedRoom(finalRoom);
        applySnapshotToStore(finalRoom);
      } else {
        writeSharedRoom(serverRoom);
        applySnapshotToStore(serverRoom);
      }
    } else if (localExisting && localExisting.players.length > 0) {
      applySnapshotToStore(localExisting);
    } else {
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

export async function disconnectMatch() {
  stopServerSyncLoop();
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

  // Sync created room to Next.js server API so any phone / other computer can join by code
  const serverRoom = await callServerRoomApi({
    action: 'create',
    code,
    snapshot,
  });
  if (serverRoom) {
    writeSharedRoom(serverRoom);
    applySnapshotToStore(serverRoom);
  }
}

export async function joinRoom(rawCode: string) {
  ensureLocalSyncChannels();
  const code = rawCode.trim().toUpperCase();
  const me = getLocalTabPlayer();

  // 1. Try joining on the shared Next.js server API first (works across Phone, PC, Incognito, etc.)
  const serverRoom = await callServerRoomApi({
    action: 'join',
    code,
    player: {
      userId: me.userId,
      displayName: me.displayName,
      isReady: false,
      wins: 0,
    },
  });

  // 2. Also check localStorage if testing across 2 tabs of the same browser
  const localExisting = readSharedRoom(code);

  if (localExisting) {
    const alreadyInLocal = localExisting.players.some((p) => p.userId === me.userId);
    if (!alreadyInLocal && localExisting.players.length >= 2) {
      throw new Error(`Phòng ${code} đã đủ 2 người chơi.`);
    }

    const updatedPlayers = [...localExisting.players];
    if (!alreadyInLocal) {
      const hostName = localExisting.players[0]?.displayName;
      const guestName =
        hostName === me.displayName ? `${me.displayName} (Đối thủ)` : me.displayName;
      updatedPlayers.push({
        userId: me.userId,
        displayName: guestName,
        isReady: false,
        wins: 0,
      });
    }

    const updatedLocal: SharedRoomSnapshot = {
      ...localExisting,
      players: updatedPlayers,
      updatedAt: Date.now(),
    };

    writeSharedRoom(updatedLocal);
    applySnapshotToStore(updatedLocal);

    // Sync merged local state up to server
    await callServerRoomApi({
      action: 'sync',
      code,
      snapshot: updatedLocal,
    });
    return;
  }

  if (serverRoom) {
    writeSharedRoom(serverRoom);
    applySnapshotToStore(serverRoom);
    return;
  }

  // Fallback if offline: still allow entering the room code so 1s sync loop connects both players
  const fallbackRoom: SharedRoomSnapshot = {
    code,
    status: 'waiting',
    bestOf: 3,
    hostUserId: me.userId,
    players: [{ userId: me.userId, displayName: me.displayName, isReady: false, wins: 0 }],
    currentRound: null,
    rounds: [],
    matchWinnerId: null,
    matchWinnerName: null,
    updatedAt: Date.now(),
  };
  writeSharedRoom(fallbackRoom);
  applySnapshotToStore(fallbackRoom);
}

/**
 * Allows the host to optionally invite a Bot opponent if they want to practice solo without opening a 2nd tab.
 */
export function addBotOpponentToRoom() {
  const store = useMatchStore.getState();
  const code = store.roomCode;
  if (!code) return;

  const existing = readSharedRoom(code) || buildSnapshotFromStore();
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

  callServerRoomApi({
    action: 'add-bot',
    code,
    snapshot,
  }).then((serverRoom) => {
    if (serverRoom) {
      writeSharedRoom(serverRoom);
      applySnapshotToStore(serverRoom);
    }
  });
}

export async function setReady(ready: boolean) {
  const store = useMatchStore.getState();
  const code = store.roomCode;
  if (!code) return;

  const me = getLocalTabPlayer();
  const existing = readSharedRoom(code) || buildSnapshotFromStore();
  if (!existing) return;

  const targetNextRound = (existing.rounds?.length || 0) + 1;
  const players = existing.players.map((p) =>
    p.userId === me.userId
      ? { ...p, isReady: ready, readyForRound: ready ? targetNextRound : 0 }
      : p
  );

  const updated = reconcileClientSnapshot({
    ...existing,
    players,
    updatedAt: Date.now(),
  });

  writeSharedRoom(updated);
  applySnapshotToStore(updated);

  const serverRoom = await callServerRoomApi({
    action: 'ready',
    code,
    userId: me.userId,
    ready,
    scramble: updated.currentRound?.scramble || generateLocal3x3Scramble(20),
    snapshot: updated,
  });
  if (serverRoom) {
    const latestLocal = readSharedRoom(code) || updated;
    const merged = mergeClientSnapshots(latestLocal, serverRoom) || serverRoom;
    writeSharedRoom(merged);
    applySnapshotToStore(merged);
  }
}

export async function submitResult(_roundId: number, timeMs: number | null) {
  const store = useMatchStore.getState();
  const code = store.roomCode;
  if (!code) return;

  const me = getLocalTabPlayer();
  const existing = readSharedRoom(code) || buildSnapshotFromStore();
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

  const currentRound: MatchRound = {
    ...existing.currentRound,
    results,
  };

  const rounds = existing.rounds.map((r) =>
    r.roundNumber === currentRound.roundNumber ? currentRound : r
  );

  const updated = reconcileClientSnapshot({
    ...existing,
    currentRound,
    rounds,
    updatedAt: Date.now(),
  });

  writeSharedRoom(updated);
  applySnapshotToStore(updated);

  const serverRoom = await callServerRoomApi({
    action: 'submit',
    code,
    userId: me.userId,
    timeMs,
    snapshot: updated,
  });
  if (serverRoom) {
    const latestLocal = readSharedRoom(code) || updated;
    const merged = mergeClientSnapshots(latestLocal, serverRoom) || serverRoom;
    writeSharedRoom(merged);
    applySnapshotToStore(merged);
  }
}

export async function leaveRoom(explicitCode?: string) {
  stopServerSyncLoop();
  if (botTimerId) {
    clearTimeout(botTimerId);
    botTimerId = null;
  }

  const store = useMatchStore.getState();
  const code = (explicitCode || store.roomCode || '').toUpperCase();
  const me = getLocalTabPlayer();
  store.reset();

  if (!code) return;

  callServerRoomApi({
    action: 'leave',
    code,
    userId: me.userId,
  }).catch(() => {});

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
