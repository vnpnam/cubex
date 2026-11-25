import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface ServerMatchPlayer {
  userId: string;
  displayName: string;
  isReady: boolean;
  wins: number;
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
        if (!existing || v.updatedAt > existing.updatedAt) {
          roomsMap.set(k, v);
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
      // Keep active rooms from last 2 hours
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

function mergePlayers(
  existingPlayers: ServerMatchPlayer[],
  incomingPlayers: ServerMatchPlayer[]
): ServerMatchPlayer[] {
  const byId = new Map<string, ServerMatchPlayer>();
  for (const p of existingPlayers) {
    byId.set(p.userId, p);
  }
  for (const p of incomingPlayers) {
    if (!byId.has(p.userId)) {
      if (byId.size < 2) {
        const firstPlayer = Array.from(byId.values())[0];
        const displayName =
          firstPlayer && firstPlayer.displayName === p.displayName
            ? `${p.displayName} (Đối thủ)`
            : p.displayName;
        byId.set(p.userId, { ...p, displayName });
      }
    } else {
      const prev = byId.get(p.userId)!;
      byId.set(p.userId, {
        ...prev,
        isReady: prev.isReady || p.isReady,
        wins: Math.max(prev.wins, p.wins),
      });
    }
  }
  return Array.from(byId.values());
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
      const room: ServerRoomSnapshot = {
        ...snapshot,
        code,
        updatedAt: Date.now(),
      };
      roomsMap.set(code, room);
      saveRoomsToTmp();
      return NextResponse.json({ room });
    }

    // 2. JOIN ROOM (Works across different devices, phones, browsers, and cold starts!)
    if (action === 'join') {
      const player = body.player as ServerMatchPlayer;
      let existing = roomsMap.get(code);

      if (!existing) {
        // If joining hit a cold serverless instance before host's next 1s sync heartbeat,
        // create the room shell so when host's 1s sync arrives, both players merge seamlessly!
        const created: ServerRoomSnapshot = {
          code,
          status: 'waiting',
          bestOf: 3,
          hostUserId: player.userId,
          players: [{ ...player, isReady: false, wins: 0 }],
          currentRound: null,
          rounds: [],
          matchWinnerId: null,
          matchWinnerName: null,
          updatedAt: Date.now(),
        };
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
        existing = {
          ...existing,
          players: [
            ...existing.players,
            {
              userId: player.userId,
              displayName: guestName,
              isReady: false,
              wins: 0,
            },
          ],
          updatedAt: Date.now(),
        };
        roomsMap.set(code, existing);
        saveRoomsToTmp();
      }

      return NextResponse.json({ room: existing });
    }

    // 3. SYNC HEARTBEAT (Merges host & guest state across serverless instances)
    if (action === 'sync') {
      const clientSnapshot = body.snapshot as ServerRoomSnapshot | undefined;
      const player = body.player as ServerMatchPlayer | undefined;
      let existing = roomsMap.get(code);

      if (!existing && clientSnapshot) {
        existing = { ...clientSnapshot, code, updatedAt: Date.now() };
        roomsMap.set(code, existing);
        saveRoomsToTmp();
        return NextResponse.json({ room: existing });
      }

      if (existing && clientSnapshot) {
        // Merge players if one side had host and other side had guest (cold start recovery)
        const mergedPlayers = mergePlayers(existing.players, clientSnapshot.players);
        if (mergedPlayers.length !== existing.players.length) {
          existing = {
            ...existing,
            bestOf: clientSnapshot.bestOf || existing.bestOf,
            players: mergedPlayers,
            updatedAt: Date.now(),
          };
          roomsMap.set(code, existing);
          saveRoomsToTmp();
        }
      } else if (existing && player) {
        const mergedPlayers = mergePlayers(existing.players, [player]);
        if (mergedPlayers.length !== existing.players.length) {
          existing = {
            ...existing,
            players: mergedPlayers,
            updatedAt: Date.now(),
          };
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
      let existing = roomsMap.get(code) || clientSnapshot;

      if (!existing) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }

      let players = existing.players.map((p) =>
        p.userId === userId ? { ...p, isReady: ready } : p
      );

      // Bot is always ready
      if (players.some((p) => p.userId === 'bot-quangminh-3x3')) {
        players = players.map((p) =>
          p.userId === 'bot-quangminh-3x3' ? { ...p, isReady: true } : p
        );
      }

      const bothReady = players.length === 2 && players.every((p) => p.isReady);
      let status = existing.status;
      let currentRound = existing.currentRound;
      const rounds = [...existing.rounds];

      if (
        bothReady &&
        (existing.status === 'waiting' || existing.currentRound?.status === 'finished')
      ) {
        status = 'playing';
        const nextRoundNum = rounds.length + 1;
        const newRound: ServerMatchRound = {
          roundId: Date.now(),
          roundNumber: nextRoundNum,
          scramble: body.scramble || generateServer3x3Scramble(20),
          startedAt: new Date().toISOString(),
          results: [],
          status: 'solving',
        };
        currentRound = newRound;
        rounds.push(newRound);
      }

      const updated: ServerRoomSnapshot = {
        ...existing,
        status,
        players,
        currentRound,
        rounds,
        updatedAt: Date.now(),
      };
      roomsMap.set(code, updated);
      saveRoomsToTmp();
      return NextResponse.json({ room: updated });
    }

    // 5. SUBMIT RESULT
    if (action === 'submit') {
      const userId = String(body.userId || '');
      const timeMs = body.timeMs as number | null;
      const clientSnapshot = body.snapshot as ServerRoomSnapshot | undefined;
      const existing = roomsMap.get(code) || clientSnapshot;

      if (!existing || !existing.currentRound) {
        return NextResponse.json({ error: 'No active round' }, { status: 400 });
      }

      const myValidTime = timeMs ?? 12000;
      const isDnf = timeMs === null;

      const results = [...(existing.currentRound.results ?? [])];
      const existingIdx = results.findIndex((r) => r.userId === userId);
      const myEntry: ServerRoundResult = {
        userId,
        timeMs: myValidTime,
        isDnf,
        isWinner: false,
      };
      if (existingIdx >= 0) results[existingIdx] = myEntry;
      else results.push(myEntry);

      // If opponent is Bot, generate Bot result
      const hasBot = existing.players.some((p) => p.userId === 'bot-quangminh-3x3');
      if (hasBot && !results.some((r) => r.userId === 'bot-quangminh-3x3')) {
        const botTimeMs = Math.round(9800 + Math.random() * 3800);
        results.push({
          userId: 'bot-quangminh-3x3',
          timeMs: botTimeMs,
          isDnf: false,
          isWinner: false,
        });
      }

      let currentRound: ServerMatchRound = {
        ...existing.currentRound,
        results,
      };
      let players = [...existing.players];
      let status = existing.status;
      let matchWinnerId = existing.matchWinnerId;
      let matchWinnerName = existing.matchWinnerName;

      if (results.length >= existing.players.length && existing.players.length === 2) {
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
          isReady: p.userId === 'bot-quangminh-3x3',
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

      const updated: ServerRoomSnapshot = {
        ...existing,
        status,
        players,
        currentRound,
        rounds,
        matchWinnerId,
        matchWinnerName,
        updatedAt: Date.now(),
      };
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
        const updated: ServerRoomSnapshot = {
          ...existing,
          players: [
            ...existing.players,
            {
              userId: 'bot-quangminh-3x3',
              displayName: 'QuangMinh_3x3 (Bot Sub-12)',
              isReady: true,
              wins: 0,
            },
          ],
          updatedAt: Date.now(),
        };
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
          (p) => p.userId !== userId && p.userId !== 'bot-quangminh-3x3'
        );
        if (remaining.length === 0) {
          roomsMap.delete(code);
        } else {
          roomsMap.set(code, {
            ...existing,
            status: 'waiting',
            players: remaining.map((p) => ({ ...p, isReady: false })),
            currentRound: null,
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
