import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface ServerMatchPlayer {
  userId: string;
  displayName: string;
  isReady: boolean;
  wins: number;
  readyForRound?: number;
}

export interface ServerRoundResult {
  userId: string;
  timeMs: number | null;
  isDnf: boolean;
  isWinner: boolean;
}

export interface ServerMatchRound {
  roundId: number;
  roundNumber: number;
  scramble: string;
  startedAt: string;
  results: ServerRoundResult[];
  status: 'inspecting' | 'solving' | 'finished';
}

export interface ServerRoomSnapshot {
  code: string;
  status: 'idle' | 'waiting' | 'playing' | 'finished';
  bestOf: number;
  hostUserId: string;
  players: ServerMatchPlayer[];
  currentRound: ServerMatchRound | null;
  rounds: ServerMatchRound[];
  matchWinnerId: string | null;
  matchWinnerName: string | null;
  updatedAt: number;
}

const BOT_USER_ID = 'bot-quangminh-3x3';

const globalForMatch = globalThis as unknown as {
  __cubexMatchRooms?: Map<string, ServerRoomSnapshot>;
};

if (!globalForMatch.__cubexMatchRooms) {
  globalForMatch.__cubexMatchRooms = new Map();
}

const roomsMap = globalForMatch.__cubexMatchRooms;
const TMP_ROOMS_FILE = path.join('/tmp', 'cubex_match_rooms.json');

function loadRoomsFromTmp() {
  try {
    if (fs.existsSync(TMP_ROOMS_FILE)) {
      const raw = fs.readFileSync(TMP_ROOMS_FILE, 'utf-8');
      const data = JSON.parse(raw) as Record<string, ServerRoomSnapshot>;
      for (const [k, v] of Object.entries(data)) {
        const existing = roomsMap.get(k);
        if (!existing) {
          roomsMap.set(k, reconcileRoomState(v));
        } else {
          roomsMap.set(k, mergeRoomSnapshots(existing, v));
        }
      }
    }
  } catch {}
}

function saveRoomsToTmp() {
  try {
    const now = Date.now();
    const obj: Record<string, ServerRoomSnapshot> = {};
    for (const [k, v] of roomsMap.entries()) {
      if (now - v.updatedAt < 2 * 60 * 60 * 1000) {
        obj[k] = v;
      } else {
        roomsMap.delete(k);
      }
    }
    fs.writeFileSync(TMP_ROOMS_FILE, JSON.stringify(obj), 'utf-8');
  } catch {}
}

function generateServer3x3Scramble(length = 20): string {
  const faces = ['U', 'D', 'L', 'R', 'F', 'B'];
  const modifiers = ['', "'", '2'];
  const axis = [0, 0, 1, 1, 2, 2];
  const moves: string[] = [];
  let lastFace = -1;
  let secondLastFace = -1;

  for (let i = 0; i < length; i++) {
    let f = Math.floor(Math.random() * 6);
    while (
      f === lastFace ||
      (secondLastFace !== -1 && axis[f] === axis[lastFace] && axis[lastFace] === axis[secondLastFace])
    ) {
      f = Math.floor(Math.random() * 6);
    }
    const mod = modifiers[Math.floor(Math.random() * modifiers.length)];
    moves.push(`${faces[f]}${mod}`);
    secondLastFace = lastFace;
    lastFace = f;
  }
  return moves.join(' ');
}

/**
 * Deterministically evaluates all rounds, computes round winners, player win counts,
 * match winner, and auto-starts the next round if both players are ready.
 */
function reconcileRoomState(room: ServerRoomSnapshot): ServerRoomSnapshot {
  const bestOf = room.bestOf || 3;
  const neededWins = Math.ceil(bestOf / 2);
  let players = [...room.players];

  // Bot is always ready for the next round
  const nextTargetRound = (room.rounds?.length || 0) + 1;
  players = players.map((p) =>
    p.userId === BOT_USER_ID
      ? { ...p, isReady: true, readyForRound: nextTargetRound }
      : p
  );

  // 1. Reconcile each round by roundNumber
  const roundsByNum = new Map<number, ServerMatchRound>();
  for (const r of room.rounds || []) {
    const num = r.roundNumber || 1;
    const prev = roundsByNum.get(num);
    if (!prev) {
      roundsByNum.set(num, { ...r, roundId: num, roundNumber: num });
    } else {
      // Merge results by userId
      const resByUser = new Map<string, ServerRoundResult>();
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

  // Also merge room.currentRound if not in roundsByNum
  if (room.currentRound) {
    const num = room.currentRound.roundNumber || 1;
    const prev = roundsByNum.get(num);
    if (!prev) {
      roundsByNum.set(num, { ...room.currentRound, roundId: num, roundNumber: num });
    } else {
      const resByUser = new Map<string, ServerRoundResult>();
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

  // 2. For any round where both players (or 1 human + 1 bot) have submitted, finalize round winner!
  const winsByUser = new Map<string, number>();
  for (const p of players) winsByUser.set(p.userId, 0);

  const hasBot = players.some((p) => p.userId === BOT_USER_ID);

  const evaluatedRounds: ServerMatchRound[] = sortedRounds.map((round) => {
    const resByUser = new Map<string, ServerRoundResult>();
    for (const r of round.results || []) {
      resByUser.set(r.userId, r);
    }

    // If playing vs Bot and human submitted, ensure Bot has a result
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

  // Update each player's win count from actual finished rounds
  players = players.map((p) => ({
    ...p,
    wins: winsByUser.get(p.userId) ?? p.wins ?? 0,
  }));

  let currentRound: ServerMatchRound | null =
    evaluatedRounds.length > 0 ? evaluatedRounds[evaluatedRounds.length - 1] : null;

  // When a round is actively solving, players are no longer in "waiting ready" state for that round
  if (currentRound && currentRound.status === 'solving') {
    players = players.map((p) => ({
      ...p,
      isReady: p.userId === BOT_USER_ID,
    }));
  }

  // When a round just finished, reset isReady unless player has already readied for roundNumber + 1
  if (currentRound && currentRound.status === 'finished') {
    const nextRoundNum = currentRound.roundNumber + 1;
    players = players.map((p) => ({
      ...p,
      isReady: p.userId === BOT_USER_ID || (p.readyForRound ?? 0) >= nextRoundNum,
    }));
  }

  // 3. Check if match has a winner
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

  // 4. If both players are ready for the next round (or initial round 1), auto-start the round!
  const targetNextRoundNum = evaluatedRounds.length + 1;
  const canStartNextRound =
    players.length === 2 &&
    (!currentRound || currentRound.status === 'finished') &&
    players.every((p) => p.isReady || (p.readyForRound ?? 0) >= targetNextRoundNum);

  if (canStartNextRound) {
    const newRound: ServerMatchRound = {
      roundId: targetNextRoundNum,
      roundNumber: targetNextRoundNum,
      scramble: generateServer3x3Scramble(20),
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

  const status: ServerRoomSnapshot['status'] =
    evaluatedRounds.length > 0 ? 'playing' : 'waiting';

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
 * Merges two snapshots of the same room (e.g. from two different serverless instances or two client tabs)
 * and runs reconcileRoomState so no round result or ready click is ever lost.
 */
function mergeRoomSnapshots(
  a: ServerRoomSnapshot,
  b: ServerRoomSnapshot
): ServerRoomSnapshot {
  const nextRoundA = (a.rounds?.length || 0) + 1;
  const nextRoundB = (b.rounds?.length || 0) + 1;

  // Merge players (up to 2)
  const playerMap = new Map<string, ServerMatchPlayer>();
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

  const mergedBase: ServerRoomSnapshot = {
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
  };

  return reconcileRoomState(mergedBase);
}

export async function GET(req: NextRequest) {
  loadRoomsFromTmp();
  const { searchParams } = new URL(req.url);
  const code = (searchParams.get('code') || '').trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }
  const room = roomsMap.get(code) || null;
  return NextResponse.json({ room });
}

export async function POST(req: NextRequest) {
  loadRoomsFromTmp();

  try {
    const body = await req.json();
    const action = String(body.action || '');
    const code = String(body.code || '').trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ error: 'Thiếu mã phòng' }, { status: 400 });
    }

    // 1. CREATE ROOM
    if (action === 'create') {
      const snapshot = body.snapshot as ServerRoomSnapshot;
      const room = reconcileRoomState({
        ...snapshot,
        code,
        updatedAt: Date.now(),
      });
      roomsMap.set(code, room);
      saveRoomsToTmp();
      return NextResponse.json({ room });
    }

    // 2. JOIN ROOM
    if (action === 'join') {
      const player = body.player as ServerMatchPlayer;
      let existing = roomsMap.get(code);

      if (!existing) {
        const created = reconcileRoomState({
          code,
          status: 'waiting',
          bestOf: 3,
          hostUserId: player.userId,
          players: [{ ...player, isReady: false, wins: 0, readyForRound: 0 }],
          currentRound: null,
          rounds: [],
          matchWinnerId: null,
          matchWinnerName: null,
          updatedAt: Date.now(),
        });
        roomsMap.set(code, created);
        saveRoomsToTmp();
        return NextResponse.json({ room: created });
      }

      const alreadyInRoom = existing.players.some((p) => p.userId === player.userId);
      if (!alreadyInRoom && existing.players.length >= 2) {
        return NextResponse.json(
          { error: `Phòng ${code} đã đủ 2 người chơi.` },
          { status: 400 }
        );
      }

      if (!alreadyInRoom) {
        const hostName = existing.players[0]?.displayName;
        const guestName =
          hostName === player.displayName ? `${player.displayName} (Đối thủ)` : player.displayName;
        existing = reconcileRoomState({
          ...existing,
          players: [
            ...existing.players,
            {
              userId: player.userId,
              displayName: guestName,
              isReady: false,
              wins: 0,
              readyForRound: 0,
            },
          ],
          updatedAt: Date.now(),
        });
        roomsMap.set(code, existing);
        saveRoomsToTmp();
      }

      return NextResponse.json({ room: existing });
    }

    // 3. SYNC HEARTBEAT (Full bi-directional state convergence!)
    if (action === 'sync') {
      const clientSnapshot = body.snapshot as ServerRoomSnapshot | undefined;
      const player = body.player as ServerMatchPlayer | undefined;
      let existing = roomsMap.get(code);

      if (!existing && clientSnapshot) {
        existing = reconcileRoomState({ ...clientSnapshot, code, updatedAt: Date.now() });
        roomsMap.set(code, existing);
        saveRoomsToTmp();
        return NextResponse.json({ room: existing });
      }

      if (existing && clientSnapshot) {
        existing = mergeRoomSnapshots(existing, clientSnapshot);
        roomsMap.set(code, existing);
        saveRoomsToTmp();
      } else if (existing && player) {
        const hasPlayer = existing.players.some((p) => p.userId === player.userId);
        if (!hasPlayer && existing.players.length < 2) {
          existing = reconcileRoomState({
            ...existing,
            players: [...existing.players, { ...player, isReady: false, wins: 0 }],
          });
          roomsMap.set(code, existing);
          saveRoomsToTmp();
        }
      }

      return NextResponse.json({ room: existing ?? null });
    }

    // 4. SET READY / START ROUND
    if (action === 'ready') {
      const userId = String(body.userId || '');
      const ready = Boolean(body.ready);
      const clientSnapshot = body.snapshot as ServerRoomSnapshot | undefined;
      let base = roomsMap.get(code);
      if (base && clientSnapshot) {
        base = mergeRoomSnapshots(base, clientSnapshot);
      } else if (!base && clientSnapshot) {
        base = clientSnapshot;
      }

      if (!base) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }

      const targetNextRound = (base.rounds?.length || 0) + 1;
      const players = base.players.map((p) =>
        p.userId === userId
          ? {
              ...p,
              isReady: ready,
              readyForRound: ready ? targetNextRound : 0,
            }
          : p
      );

      const updated = reconcileRoomState({
        ...base,
        players,
        updatedAt: Date.now(),
      });
      roomsMap.set(code, updated);
      saveRoomsToTmp();
      return NextResponse.json({ room: updated });
    }

    // 5. SUBMIT RESULT
    if (action === 'submit') {
      const userId = String(body.userId || '');
      const timeMs = body.timeMs as number | null;
      const clientSnapshot = body.snapshot as ServerRoomSnapshot | undefined;
      let base = roomsMap.get(code);
      if (base && clientSnapshot) {
        base = mergeRoomSnapshots(base, clientSnapshot);
      } else if (!base && clientSnapshot) {
        base = clientSnapshot;
      }

      if (!base) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }

      const activeRound =
        base.currentRound ||
        (base.rounds && base.rounds.length > 0 ? base.rounds[base.rounds.length - 1] : null);

      if (!activeRound) {
        return NextResponse.json({ room: base });
      }

      const myValidTime = timeMs ?? 12000;
      const isDnf = timeMs === null;

      const results = [...(activeRound.results ?? [])];
      const existingIdx = results.findIndex((r) => r.userId === userId);
      const myEntry: ServerRoundResult = {
        userId,
        timeMs: myValidTime,
        isDnf,
        isWinner: false,
      };
      if (existingIdx >= 0) results[existingIdx] = myEntry;
      else results.push(myEntry);

      const updatedRound: ServerMatchRound = {
        ...activeRound,
        results,
      };

      const rounds = (base.rounds || []).map((r) =>
        r.roundNumber === updatedRound.roundNumber ? updatedRound : r
      );

      const updated = reconcileRoomState({
        ...base,
        currentRound: updatedRound,
        rounds,
        updatedAt: Date.now(),
      });

      roomsMap.set(code, updated);
      saveRoomsToTmp();
      return NextResponse.json({ room: updated });
    }

    // 6. INVITE BOT
    if (action === 'add-bot') {
      const clientSnapshot = body.snapshot as ServerRoomSnapshot | undefined;
      const existing = roomsMap.get(code) || clientSnapshot;
      if (!existing) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }
      if (existing.players.length < 2) {
        const updated = reconcileRoomState({
          ...existing,
          players: [
            ...existing.players,
            {
              userId: BOT_USER_ID,
              displayName: 'QuangMinh_3x3 (Bot Sub-12)',
              isReady: true,
              wins: 0,
              readyForRound: 99,
            },
          ],
          updatedAt: Date.now(),
        });
        roomsMap.set(code, updated);
        saveRoomsToTmp();
        return NextResponse.json({ room: updated });
      }
      return NextResponse.json({ room: existing });
    }

    // 7. LEAVE ROOM
    if (action === 'leave') {
      const userId = String(body.userId || '');
      const existing = roomsMap.get(code);
      if (existing) {
        const remaining = existing.players.filter(
          (p) => p.userId !== userId && p.userId !== BOT_USER_ID
        );
        if (remaining.length === 0) {
          roomsMap.delete(code);
        } else {
          roomsMap.set(code, {
            ...existing,
            status: 'waiting',
            players: remaining.map((p) => ({ ...p, isReady: false, wins: 0, readyForRound: 0 })),
            currentRound: null,
            rounds: [],
            matchWinnerId: null,
            matchWinnerName: null,
            updatedAt: Date.now(),
          });
        }
        saveRoomsToTmp();
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
