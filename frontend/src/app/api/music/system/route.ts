import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface ServerSystemTrack {
  id: number;
  title: string;
  artist: string;
  coverUrl: string | null;
  audioUrl: string;
  source: 'system';
  isDefault?: boolean;
  createdAt?: string;
}

const DEFAULT_SYSTEM_TRACKS: ServerSystemTrack[] = [
  {
    id: 1001,
    title: 'Lo-Fi Speedcubing',
    artist: 'CUBEX Beats',
    coverUrl: null,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
    source: 'system',
  },
  {
    id: 1002,
    title: 'Focus Mode',
    artist: 'ChillHop',
    coverUrl: null,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3',
    source: 'system',
  },
  {
    id: 1003,
    title: 'Midnight Run',
    artist: 'CUBEX Beats',
    coverUrl: null,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2021/11/13/audio_cb4f1b5c6b.mp3',
    source: 'system',
  },
];

interface GlobalMusicCache {
  tracks: ServerSystemTrack[];
  audioBlobs: Map<number, { buffer: Buffer; mimeType: string }>;
  coverBlobs: Map<number, { buffer: Buffer; mimeType: string }>;
  initialized: boolean;
}

const globalForMusic = globalThis as unknown as {
  __cubexMusicCache?: GlobalMusicCache;
};

if (!globalForMusic.__cubexMusicCache) {
  globalForMusic.__cubexMusicCache = {
    tracks: [...DEFAULT_SYSTEM_TRACKS],
    audioBlobs: new Map(),
    coverBlobs: new Map(),
    initialized: false,
  };
}

const cache = globalForMusic.__cubexMusicCache;

function getPublicMusicDir() {
  return path.join(process.cwd(), 'public', 'music');
}

function getTmpMusicDir() {
  return path.join('/tmp', 'cubex-music');
}

function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

function isPreferredDefaultTrack(title: string): boolean {
  const norm = normalizeText(title);
  return norm.includes('mot mau co don');
}

function sortTracksWithDefaultFirst(tracks: ServerSystemTrack[]): ServerSystemTrack[] {
  return [...tracks].sort((a, b) => {
    const aPref = isPreferredDefaultTrack(a.title) || a.isDefault ? 1 : 0;
    const bPref = isPreferredDefaultTrack(b.title) || b.isDefault ? 1 : 0;
    if (aPref !== bPref) return bPref - aPref;
    return 0;
  });
}

function loadTracksFromDisk() {
  if (cache.initialized) return;
  cache.initialized = true;

  // 1. Check public/music/tracks.json (committed to repo)
  try {
    const pubJson = path.join(getPublicMusicDir(), 'tracks.json');
    if (fs.existsSync(pubJson)) {
      const parsed = JSON.parse(fs.readFileSync(pubJson, 'utf-8')) as ServerSystemTrack[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        cache.tracks = sortTracksWithDefaultFirst(parsed);
      }
    }
  } catch {}

  // 2. Check /tmp/cubex-music/tracks.json (runtime uploads on Vercel)
  try {
    const tmpJson = path.join(getTmpMusicDir(), 'tracks.json');
    if (fs.existsSync(tmpJson)) {
      const parsed = JSON.parse(fs.readFileSync(tmpJson, 'utf-8')) as ServerSystemTrack[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const byId = new Map(cache.tracks.map((t) => [t.id, t]));
        for (const t of parsed) {
          byId.set(t.id, t);
        }
        cache.tracks = sortTracksWithDefaultFirst(Array.from(byId.values()));
      }
    }
  } catch {}
}

function persistTracksMetadata() {
  cache.tracks = sortTracksWithDefaultFirst(cache.tracks);

  // Save to /tmp (always writable on Vercel & local)
  try {
    const tmpDir = getTmpMusicDir();
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'tracks.json'), JSON.stringify(cache.tracks, null, 2), 'utf-8');
  } catch {}

  // Also try saving to public/music/tracks.json (works on local dev so git push includes it!)
  try {
    const pubDir = getPublicMusicDir();
    fs.mkdirSync(pubDir, { recursive: true });
    fs.writeFileSync(path.join(pubDir, 'tracks.json'), JSON.stringify(cache.tracks, null, 2), 'utf-8');
  } catch {}
}

export async function GET(req: NextRequest) {
  loadTracksFromDisk();

  const { searchParams } = new URL(req.url);
  const streamId = searchParams.get('streamId');
  const coverId = searchParams.get('coverId');

  // Stream uploaded audio binary by ID
  if (streamId) {
    const id = Number(streamId);
    let entry = cache.audioBlobs.get(id);

    if (!entry) {
      // Try loading from /tmp or public/music
      for (const dir of [getPublicMusicDir(), getTmpMusicDir()]) {
        const filePath = path.join(dir, `track-${id}.mp3`);
        if (fs.existsSync(filePath)) {
          entry = { buffer: fs.readFileSync(filePath), mimeType: 'audio/mpeg' };
          cache.audioBlobs.set(id, entry);
          break;
        }
      }
    }

    if (!entry) {
      return new NextResponse('Audio not found', { status: 404 });
    }

    return new NextResponse(new Uint8Array(entry.buffer), {
      status: 200,
      headers: {
        'Content-Type': entry.mimeType || 'audio/mpeg',
        'Content-Length': String(entry.buffer.byteLength),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }

  // Stream uploaded cover image by ID
  if (coverId) {
    const id = Number(coverId);
    const entry = cache.coverBlobs.get(id);
    if (!entry) {
      return new NextResponse('Cover not found', { status: 404 });
    }
    return new NextResponse(new Uint8Array(entry.buffer), {
      status: 200,
      headers: {
        'Content-Type': entry.mimeType || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }

  return NextResponse.json(sortTracksWithDefaultFirst(cache.tracks));
}

export async function POST(req: NextRequest) {
  loadTracksFromDisk();

  try {
    const formData = await req.formData();
    const title = String(formData.get('title') || '').trim();
    const artist = String(formData.get('artist') || 'Unknown').trim() || 'Unknown';
    const customId = formData.get('id') ? Number(formData.get('id')) : Date.now();
    const audioFile = formData.get('audioFile') as File | null;
    const coverFile = formData.get('coverFile') as File | null;

    if (!title) {
      return NextResponse.json({ error: 'Thiếu tên bài hát' }, { status: 400 });
    }

    // Check if track with same title already exists to avoid duplicate auto-sync
    const existingByTitle = cache.tracks.find(
      (t) => normalizeText(t.title) === normalizeText(title) && t.id === customId
    );
    if (existingByTitle && !audioFile) {
      return NextResponse.json(existingByTitle);
    }

    let audioUrl = `/api/music/system?streamId=${customId}`;

    if (audioFile) {
      const arrayBuf = await audioFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      cache.audioBlobs.set(customId, {
        buffer,
        mimeType: audioFile.type || 'audio/mpeg',
      });

      // Save to /tmp
      try {
        const tmpDir = getTmpMusicDir();
        fs.mkdirSync(tmpDir, { recursive: true });
        fs.writeFileSync(path.join(tmpDir, `track-${customId}.mp3`), buffer);
      } catch {}

      // Save to public/music on local machine so git push bundles it permanently!
      try {
        const pubDir = getPublicMusicDir();
        fs.mkdirSync(pubDir, { recursive: true });
        const fileName = `track-${customId}.mp3`;
        fs.writeFileSync(path.join(pubDir, fileName), buffer);
        audioUrl = `/music/${fileName}`;
      } catch {
        // On Vercel read-only filesystem, use API stream endpoint
        audioUrl = `/api/music/system?streamId=${customId}`;
      }
    }

    let coverUrl: string | null = null;
    if (coverFile) {
      const coverBuf = Buffer.from(await coverFile.arrayBuffer());
      cache.coverBlobs.set(customId, {
        buffer: coverBuf,
        mimeType: coverFile.type || 'image/jpeg',
      });
      coverUrl = `/api/music/system?coverId=${customId}`;
    }

    const newTrack: ServerSystemTrack = {
      id: customId,
      title,
      artist,
      coverUrl,
      audioUrl,
      source: 'system',
      isDefault: isPreferredDefaultTrack(title),
      createdAt: new Date().toISOString(),
    };

    // Replace if same ID or same normalized title ("Một Màu Cô Đơn"), else add
    const existingIdx = cache.tracks.findIndex(
      (t) => t.id === customId || normalizeText(t.title) === normalizeText(title)
    );
    if (existingIdx >= 0) {
      cache.tracks[existingIdx] = newTrack;
    } else {
      cache.tracks.push(newTrack);
    }

    persistTracksMetadata();

    return NextResponse.json(newTrack);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  loadTracksFromDisk();

  try {
    const formData = await req.formData();
    const id = Number(formData.get('id'));
    const title = formData.get('title') ? String(formData.get('title')).trim() : undefined;
    const artist = formData.get('artist') ? String(formData.get('artist')).trim() : undefined;
    const audioFile = formData.get('audioFile') as File | null;
    const coverFile = formData.get('coverFile') as File | null;

    const idx = cache.tracks.findIndex((t) => t.id === id);
    if (idx < 0) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    const current = cache.tracks[idx];
    let audioUrl = current.audioUrl;
    let coverUrl = current.coverUrl;

    if (audioFile) {
      const buffer = Buffer.from(await audioFile.arrayBuffer());
      cache.audioBlobs.set(id, { buffer, mimeType: audioFile.type || 'audio/mpeg' });
      try {
        const pubDir = getPublicMusicDir();
        fs.mkdirSync(pubDir, { recursive: true });
        const fileName = `track-${id}.mp3`;
        fs.writeFileSync(path.join(pubDir, fileName), buffer);
        audioUrl = `/music/${fileName}`;
      } catch {
        audioUrl = `/api/music/system?streamId=${id}`;
      }
    }

    if (coverFile) {
      const buffer = Buffer.from(await coverFile.arrayBuffer());
      cache.coverBlobs.set(id, { buffer, mimeType: coverFile.type || 'image/jpeg' });
      coverUrl = `/api/music/system?coverId=${id}`;
    }

    const updated: ServerSystemTrack = {
      ...current,
      title: title ?? current.title,
      artist: artist ?? current.artist,
      audioUrl,
      coverUrl,
      isDefault: isPreferredDefaultTrack(title ?? current.title),
    };

    cache.tracks[idx] = updated;
    persistTracksMetadata();

    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Update failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  loadTracksFromDisk();
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  cache.tracks = cache.tracks.filter((t) => t.id !== id);
  cache.audioBlobs.delete(id);
  cache.coverBlobs.delete(id);
  persistTracksMetadata();

  return NextResponse.json({ ok: true });
}
