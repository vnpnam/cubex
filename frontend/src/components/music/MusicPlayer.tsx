'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Music, ChevronDown, ChevronUp, Repeat, Shuffle, List,
  Upload, Trash2, Loader2, Edit2, Check, X
} from 'lucide-react';
import { useMusicStore, Track, isPreferredDefaultTrackTitle, sortTracksAndPickDefault } from '@/lib/store/useMusicStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { fetchSystemTracks, fetchUserTracks, uploadUserTrack, deleteUserTrack, createSystemTrack } from '@/lib/api/musicApi';
import { saveAudioBlob, saveCoverBlob, loadAudioUrl, loadCoverUrl, deleteLocalTrack, isLocalMarker, localMarkerId, localMarker } from '@/lib/store/musicDb';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5247';

function resolveUrl(url: string) {
  if (!url) return '';
  if (
    url.startsWith('http') ||
    url.startsWith('blob:') ||
    url.startsWith('local:') ||
    url.startsWith('/api/') ||
    url.startsWith('/music/')
  ) {
    return url;
  }
  return `${API_URL}${url}`;
}

// Demo tracks – hoạt động mà không cần backend (tích hợp sẵn trên CDN)
const DEMO_TRACKS: Track[] = [
  {
    id: 1000,
    title: 'Một Màu Cô Đơn',
    artist: 'Quang Đăng Trần',
    coverUrl: null,
    audioUrl: '/music/mot-mau-co-don.mp3',
    source: 'system',
  },
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

export function MusicPlayer() {
  const store = useMusicStore();
  const { isAuthenticated, token } = useAuthStore();

  // Single audio element, created once
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Refs to track current state without triggering re-renders
  const currentTrackRef = useRef<Track | null>(null);
  const isPlayingRef = useRef(true);
  const loadedSrcRef = useRef('');
  const userManuallyPausedRef = useRef(false);
  const pendingGestureUnlockRef = useRef(false);

  const [showTrackList, setShowTrackList] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showMiniPicker, setShowMiniPicker] = useState(false);

  // Close mini picker when clicking outside
  const miniPickerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showMiniPicker) return;
    const handler = (e: MouseEvent) => {
      if (miniPickerRef.current && !miniPickerRef.current.contains(e.target as Node)) {
        setShowMiniPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMiniPicker]);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadArtist, setUploadArtist] = useState('');
  const [uploadAudio, setUploadAudio] = useState<File | null>(null);
  const [uploadCover, setUploadCover] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState('');

  // Inline edit state for tracks inside the MusicPlayer widget
  const [editingTrackId, setEditingTrackId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');

  // ── Load system/user tracks on mount ──────────────────────────────────────
  // local: markers are kept as-is in the store (audio engine resolves them on-the-fly)
  useEffect(() => {
    // Filter out local: tracks whose IDB blob is missing (e.g. cleared browser data)
    const validateLocalTracks = async (tracks: Track[]): Promise<Track[]> => {
      const results = await Promise.all(
        tracks.map(async (t) => {
          if (!isLocalMarker(t.audioUrl)) return t;
          // Just check existence without creating a persistent URL
          const id = localMarkerId(t.audioUrl);
          const url = await loadAudioUrl(id);
          if (!url) return null; // IDB blob missing, drop track
          URL.revokeObjectURL(url); // immediately revoke, engine will re-load on demand
          return t; // keep local: marker intact
        })
      );
      return results.filter(Boolean) as Track[];
    };

    const applySystemTracksAndAutoplay = (tracksToUse: Track[]) => {
      const st = useMusicStore.getState();
      const { sorted, defaultTrack } = sortTracksAndPickDefault(tracksToUse);
      st.setSystemTracks(sorted);
      const preferred = sorted.find((t) => isPreferredDefaultTrackTitle(t.title));
      const targetTrack = preferred ?? st.currentTrack ?? defaultTrack;
      if (targetTrack && !userManuallyPausedRef.current) {
        st.play(targetTrack);
      }
    };

    // Automatically push any local IndexedDB system tracks (such as "Một Màu Cô Đơn" added by Admin)
    // to the shared Next.js /api/music/system server so all other visitors also receive them!
    const syncLocalTracksToServer = async (localTracks: Track[], serverTracks: Track[]) => {
      for (const lt of localTracks) {
        if (!isLocalMarker(lt.audioUrl)) continue;
        const alreadyOnServer = serverTracks.some(
          (st) =>
            st.id === lt.id ||
            (st.title.trim().toLowerCase() === lt.title.trim().toLowerCase() &&
              !isLocalMarker(st.audioUrl))
        );
        if (alreadyOnServer) continue;

        try {
          const id = localMarkerId(lt.audioUrl);
          const blobUrl = await loadAudioUrl(id);
          if (!blobUrl) continue;
          const resp = await fetch(blobUrl);
          const blob = await resp.blob();
          URL.revokeObjectURL(blobUrl);
          await createSystemTrack(token || 'admin-token', lt.title, lt.artist, blob, undefined, lt.id);
        } catch {
          // ignore sync errors
        }
      }
    };

    fetchSystemTracks()
      .then(async (tracks) => {
        const mapped = tracks.map((t: Track) => ({
          ...t,
          source: 'system' as const,
          audioUrl: resolveUrl(t.audioUrl),
        }));
        const persisted = useMusicStore.getState().systemTracks;
        const localTracks = await validateLocalTracks(
          persisted.filter((t) => isLocalMarker(t.audioUrl))
        );

        if (localTracks.length > 0) {
          syncLocalTracksToServer(localTracks, mapped).catch(() => {});
        }

        if (mapped.length > 0) {
          const persistedById = new Map(persisted.map((t) => [t.id, t]));
          const mergedBackend = mapped.map((t: Track) => {
            const localOverride = persistedById.get(t.id);
            return localOverride
              ? { ...t, title: localOverride.title, artist: localOverride.artist }
              : t;
          });
          // Deduplicate localTracks that are already in mergedBackend by ID or title
          const uniqueLocal = localTracks.filter(
            (lt) =>
              !mergedBackend.some(
                (bt: Track) =>
                  bt.id === lt.id ||
                  bt.title.trim().toLowerCase() === lt.title.trim().toLowerCase()
              )
          );
          applySystemTracksAndAutoplay([...uniqueLocal, ...mergedBackend]);
        } else {
          if (persisted.length > 0) {
            const valid = await validateLocalTracks(persisted);
            applySystemTracksAndAutoplay(valid.length > 0 ? valid : DEMO_TRACKS);
          } else {
            applySystemTracksAndAutoplay(DEMO_TRACKS);
          }
        }
      })
      .catch(async () => {
        const persisted = useMusicStore.getState().systemTracks;
        if (persisted.length > 0) {
          const valid = await validateLocalTracks(persisted);
          applySystemTracksAndAutoplay(valid.length > 0 ? valid : DEMO_TRACKS);
        } else {
          applySystemTracksAndAutoplay(DEMO_TRACKS);
        }
      });

    if (isAuthenticated && token) {
      fetchUserTracks(token)
        .then((tracks) =>
          useMusicStore.getState().setUserTracks(
            tracks.map((t: Track) => ({ ...t, source: 'user' as const, audioUrl: resolveUrl(t.audioUrl) }))
          )
        )
        .catch(async () => {
          const persisted = useMusicStore.getState().userTracks;
          if (persisted.length > 0) {
            const valid = await validateLocalTracks(persisted);
            useMusicStore.getState().setUserTracks(valid);
          }
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // ── Create single Audio instance and wire events ONCE ────────────────────
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.autoplay = true;
    audio.volume = useMusicStore.getState().volume ?? 0.15;
    audioRef.current = audio;

    // Fallback unlock when browser blocks initial unmuted autoplay before first interaction
    const unlockOnFirstInteraction = () => {
      if (userManuallyPausedRef.current) {
        removeUnlockListeners();
        return;
      }
      const currentAudio = audioRef.current;
      if (currentAudio && currentAudio.src && currentAudio.paused) {
        isPlayingRef.current = true;
        useMusicStore.getState().play();
        currentAudio.play().then(() => {
          pendingGestureUnlockRef.current = false;
          removeUnlockListeners();
        }).catch(() => {});
      } else if (currentAudio && !currentAudio.paused) {
        pendingGestureUnlockRef.current = false;
        removeUnlockListeners();
      }
    };

    const removeUnlockListeners = () => {
      window.removeEventListener('pointerdown', unlockOnFirstInteraction);
      window.removeEventListener('keydown', unlockOnFirstInteraction);
      window.removeEventListener('touchstart', unlockOnFirstInteraction);
      window.removeEventListener('click', unlockOnFirstInteraction);
    };

    const attachUnlockListeners = () => {
      if (pendingGestureUnlockRef.current) return;
      pendingGestureUnlockRef.current = true;
      window.addEventListener('pointerdown', unlockOnFirstInteraction, { passive: true });
      window.addEventListener('keydown', unlockOnFirstInteraction, { passive: true });
      window.addEventListener('touchstart', unlockOnFirstInteraction, { passive: true });
      window.addEventListener('click', unlockOnFirstInteraction, { passive: true });
    };

    const onTimeUpdate = () => useMusicStore.getState().setCurrentTime(audio.currentTime);
    const onDurationChange = () =>
      useMusicStore.getState().setDuration(isNaN(audio.duration) ? 0 : audio.duration);

    const onCanPlay = () => {
      useMusicStore.getState().setIsLoading(false);
      useMusicStore.getState().setError(null);
      // Play automatically if intended to play
      if (isPlayingRef.current && audio.paused && !userManuallyPausedRef.current) {
        audio.play().catch(() => {
          // Browser blocked unmuted autoplay until first user gesture; attach unlock listener
          attachUnlockListeners();
        });
      }
    };

    const onPlay = () => {
      // Sync store when audio actually starts (e.g. browser resumes)
      isPlayingRef.current = true;
      pendingGestureUnlockRef.current = false;
      removeUnlockListeners();
    };

    const onPause = () => {
      // Don't sync to store here – we control pause explicitly
    };

    const onEnded = () => {
      const st = useMusicStore.getState();
      if (st.repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        // Keep playing intent, go to next track
        st.next();
      }
    };

    const onWaiting = () => useMusicStore.getState().setIsLoading(true);
    const onError = () => {
      useMusicStore.getState().setIsLoading(false);
      useMusicStore.getState().setError('Không thể tải file nhạc.');
      isPlayingRef.current = false;
      useMusicStore.getState().pause();
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('error', onError);

    return () => {
      removeUnlockListeners();
      audio.pause();
      audio.src = '';
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('error', onError);
    };
  }, []);

  // ── UNIFIED playback effect: handles both track change AND play/pause ─────
  // Uses AbortController so stale async resolutions (e.g. from previous track) are ignored.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const track = store.currentTrack;
    const shouldPlay = store.isPlaying;

    isPlayingRef.current = shouldPlay;
    currentTrackRef.current = track;

    if (!track) {
      audio.pause();
      return;
    }

    // Abort controller: cancels stale async resolutions when effect re-runs
    const controller = new AbortController();
    const { signal } = controller;

    const resolveAndLoad = async () => {
      let src = track.audioUrl;

      // Resolve local: IDB markers → real blob URL
      if (isLocalMarker(src)) {
        const resolved = await loadAudioUrl(localMarkerId(src));
        if (signal.aborted) return; // A newer track/play-state arrived; discard
        if (!resolved) {
          useMusicStore.getState().setError('Không tìm thấy file nhạc (đã bị xóa?).');
          useMusicStore.getState().setIsLoading(false);
          return;
        }
        src = resolved;
      }

      if (signal.aborted) return;

      // Use track id+source as the stable "identity" key (URL may differ for blob:)
      const trackKey = `${track.source}:${track.id}`;
      const trackChanged = trackKey !== loadedSrcRef.current;

      if (trackChanged) {
        // Pause first, then swap source
        audio.pause();
        loadedSrcRef.current = trackKey;
        audio.src = src;
        useMusicStore.getState().setCurrentTime(0);
        useMusicStore.getState().setDuration(0);
        useMusicStore.getState().setIsLoading(true);
        useMusicStore.getState().setError(null);
        audio.load();
        // onCanPlay handler will call play() if isPlayingRef is true at that point
      } else {
        // Same track, just update play/pause
        if (shouldPlay) {
          if (audio.paused) {
            audio.play().catch(() => {
              // Keep isPlaying intent alive so first user gesture unlocks playback
            });
          }
        } else {
          audio.pause();
        }
      }
    };

    resolveAndLoad();

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.currentTrack?.id, store.currentTrack?.source, store.currentTrack?.audioUrl, store.isPlaying]);

  // ── Volume ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = store.volume;
  }, [store.volume]);

  const handleUserTogglePlay = useCallback(() => {
    const currentlyPlaying = useMusicStore.getState().isPlaying;
    const audio = audioRef.current;
    // If browser blocked initial autoplay (store says isPlaying=true but audio is still paused), clicking the button should start playing immediately
    if (currentlyPlaying && audio && audio.paused) {
      userManuallyPausedRef.current = false;
      audio.play().catch(() => {});
      return;
    }
    userManuallyPausedRef.current = currentlyPlaying;
    store.togglePlay();
  }, [store]);
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = t;
    store.seek(t);
  }, [store]);

  // ── User upload (personal track) using IndexedDB for persistence ──────────
  const handleUpload = async () => {
    if (!uploadTitle || !uploadAudio) return;
    setUploadStatus('loading');
    setUploadError('');
    const audioFile = uploadAudio;
    const coverFile = uploadCover;
    const title = uploadTitle;
    const artist = uploadArtist;
    try {
      let newTrack: Track;
      const isDemo = !token || token.startsWith('mock-') || token.startsWith('demo-') || token.startsWith('admin-');
      if (!isDemo) {
        try {
          const t = await uploadUserTrack(token!, title, artist, audioFile, coverFile ?? undefined);
          newTrack = { ...t, source: 'user' as const, audioUrl: resolveUrl(t.audioUrl) };
        } catch {
          // Backend fail → store in IndexedDB with local: marker (persists to localStorage)
          const id = Date.now();
          await saveAudioBlob(id, audioFile);
          const coverUrl = coverFile ? (await saveCoverBlob(id, coverFile), URL.createObjectURL(coverFile)) : null;
          newTrack = { id, title, artist: artist || 'Unknown', coverUrl, audioUrl: localMarker(id), source: 'user' };
        }
      } else {
        // Demo/offline: IndexedDB + local: marker
        const id = Date.now();
        await saveAudioBlob(id, audioFile);
        const coverUrl = coverFile ? (await saveCoverBlob(id, coverFile), URL.createObjectURL(coverFile)) : null;
        newTrack = { id, title, artist: artist || 'Unknown', coverUrl, audioUrl: localMarker(id), source: 'user' };
      }
      store.addUserTrack(newTrack);
      setUploadStatus('success');
      setUploadTitle('');
      setUploadArtist('');
      setUploadAudio(null);
      setUploadCover(null);
      setTimeout(() => { setUploadStatus('idle'); setShowUpload(false); }, 1500);
    } catch (err: unknown) {
      setUploadStatus('error');
      setUploadError(err instanceof Error ? err.message : 'Upload thất bại');
    }
  };

  const handleDeleteUserTrack = async (id: number) => {
    const isDemo = !token || token.startsWith('demo-') || token.startsWith('mock-') || token.startsWith('admin-');
    if (isDemo) {
      store.removeUserTrack(id);
      await deleteLocalTrack(id).catch(() => {});
      return;
    }
    try {
      await deleteUserTrack(token!, id);
      store.removeUserTrack(id);
      await deleteLocalTrack(id).catch(() => {});
      if (store.currentTrack?.id === id && store.currentTrack.source === 'user') {
        store.pause();
        loadedSrcRef.current = '';
      }
    } catch {}
  };

  const fmtTime = (s: number) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const activeTracks = store.activeSource === 'system' ? store.systemTracks : store.userTracks;
  const track = store.currentTrack;

  return (
    <div className="fixed bottom-4 right-4 z-50 select-none">
      <AnimatePresence mode="wait">
        {store.isExpanded ? (
          /* ── Expanded Player ─────────────────────────────────────────── */
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-80 bg-[#0A0F1E]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <div className="flex items-center gap-2 text-xs font-mono text-white/50">
                <Music className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span>CUBEX MUSIC</span>
              </div>
              <button
                onClick={() => store.setIsExpanded(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Cover Art */}
            <div className="px-4 pb-3">
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-[#00F0FF]/10 to-[#8A2BE2]/10 border border-white/5">
                {track?.coverUrl ? (
                  <img src={resolveUrl(track.coverUrl)} alt={track.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="w-16 h-16 text-white/10" />
                  </div>
                )}
                {store.isPlaying && (
                  <div className="absolute inset-0 flex items-end justify-start p-3 gap-0.5">
                    {[1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-[#00F0FF]/70 rounded-full"
                        animate={{ height: ['4px', '14px', '6px', '12px', '4px'] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Track Info */}
            <div className="px-4 pb-2">
              {track ? (
                <>
                  <p className="text-sm font-bold text-white truncate">{track.title}</p>
                  <p className="text-xs text-white/50 truncate">{track.artist}</p>
                </>
              ) : (
                <p className="text-xs text-white/30 italic">
                  {activeTracks.length === 0 ? 'Không có nhạc' : 'Chọn bài để phát'}
                </p>
              )}
            </div>

            {/* Progress Bar */}
            <div className="px-4 pb-2">
              <input
                type="range"
                min={0}
                max={store.duration || 1}
                step={0.1}
                value={store.currentTime}
                onChange={handleSeek}
                className="w-full h-1 accent-[#00F0FF] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-white/30 mt-0.5">
                <span>{fmtTime(store.currentTime)}</span>
                <span>{fmtTime(store.duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="px-4 pb-3 flex items-center justify-between">
              <button onClick={store.prev} className="text-white/60 hover:text-white transition-colors">
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={handleUserTogglePlay}
                disabled={store.isLoading}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00F0FF] to-[#0088FF] flex items-center justify-center shadow-lg shadow-[#00F0FF]/25 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
              >
                {store.isLoading ? (
                  <Loader2 className="w-5 h-5 text-black animate-spin" />
                ) : store.isPlaying ? (
                  <Pause className="w-5 h-5 text-black" />
                ) : (
                  <Play className="w-5 h-5 text-black ml-0.5" />
                )}
              </button>

              <button onClick={store.next} className="text-white/60 hover:text-white transition-colors">
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Secondary Controls */}
            <div className="px-4 pb-3 flex items-center gap-2">
              <button
                onClick={store.toggleShuffle}
                className={`p-1.5 rounded-lg transition-colors ${store.shuffleEnabled ? 'text-[#00F0FF]' : 'text-white/40 hover:text-white'}`}
                title="Shuffle"
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  const modes = ['none', 'all', 'one'] as const;
                  const idx = modes.indexOf(store.repeatMode);
                  store.setRepeatMode(modes[(idx + 1) % 3]);
                }}
                className={`p-1.5 rounded-lg transition-colors relative ${store.repeatMode !== 'none' ? 'text-[#00F0FF]' : 'text-white/40 hover:text-white'}`}
                title={`Repeat: ${store.repeatMode}`}
              >
                <Repeat className="w-3.5 h-3.5" />
                {store.repeatMode === 'one' && (
                  <span className="absolute -top-1 -right-1 text-[8px] font-bold text-[#00F0FF]">1</span>
                )}
              </button>

              <div className="flex items-center gap-1 ml-auto flex-1">
                <button
                  onClick={() => store.setVolume(store.volume > 0 ? 0 : 0.15)}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  {store.volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={store.volume}
                  onChange={(e) => store.setVolume(parseFloat(e.target.value))}
                  className="flex-1 h-1 accent-[#00F0FF] cursor-pointer"
                />
              </div>
            </div>

            {/* Source Switcher */}
            <div className="px-4 pb-3 flex gap-2">
              <button
                onClick={() => { store.setActiveSource('system'); setShowTrackList(true); }}
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all border ${store.activeSource === 'system'
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'border-white/5 text-white/40 hover:text-white hover:border-white/10'}`}
              >
                Hệ thống
              </button>
              {isAuthenticated && (
                <button
                  onClick={() => { store.setActiveSource('user'); setShowTrackList(true); }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all border ${store.activeSource === 'user'
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'border-white/5 text-white/40 hover:text-white hover:border-white/10'}`}
                >
                  Của tôi
                </button>
              )}
            </div>

            {/* Track List */}
            {showTrackList && (
              <div className="border-t border-white/5 max-h-48 overflow-y-auto">
                {activeTracks.length === 0 ? (
                  <div className="p-4 text-center text-xs text-white/30">
                    {store.activeSource === 'user' ? 'Chưa có nhạc cá nhân' : 'Không có nhạc hệ thống'}
                  </div>
                ) : (
                  activeTracks.map((t) => (
                    <div
                      key={`${t.source}-${t.id}`}
                      className={`flex flex-col px-4 py-2.5 transition-colors ${
                        store.currentTrack?.id === t.id && store.currentTrack.source === t.source
                          ? 'bg-white/8 text-[#00F0FF]'
                          : 'hover:bg-white/5 text-white/70'
                      }`}
                    >
                      {editingTrackId === t.id ? (
                        <div className="flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="Tên bài hát"
                            className="w-full bg-black/50 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-[#00F0FF]"
                          />
                          <input
                            type="text"
                            value={editArtist}
                            onChange={(e) => setEditArtist(e.target.value)}
                            placeholder="Nghệ sĩ"
                            className="w-full bg-black/50 border border-white/15 rounded-lg px-2.5 py-1 text-[11px] text-white outline-none focus:border-[#00F0FF]"
                          />
                          <div className="flex justify-end gap-1.5 pt-0.5">
                            <button
                              type="button"
                              onClick={() => setEditingTrackId(null)}
                              className="px-2 py-0.5 rounded bg-white/10 text-[10px] text-white/60 hover:text-white"
                            >
                              Hủy
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!editTitle.trim()) return;
                                const patch = {
                                  title: editTitle.trim(),
                                  artist: editArtist.trim() || 'Unknown',
                                };
                                if (t.source === 'system') {
                                  store.updateSystemTrackInStore(t.id, patch);
                                } else {
                                  store.updateUserTrackInStore(t.id, patch);
                                }
                                setEditingTrackId(null);
                              }}
                              className="px-2.5 py-0.5 rounded bg-[#00F0FF] text-black font-bold text-[10px]"
                            >
                              Lưu
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-3 cursor-pointer"
                          onClick={() => { userManuallyPausedRef.current = false; store.play(t); }}
                        >
                          <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                            {t.coverUrl
                              ? <img src={resolveUrl(t.coverUrl)} alt="" className="w-full h-full object-cover" />
                              : <Music className="w-3 h-3 text-white/30" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{t.title}</p>
                            <p className="text-[10px] text-white/40 truncate">{t.artist}</p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTrackId(t.id);
                              setEditTitle(t.title);
                              setEditArtist(t.artist === 'Unknown' ? '' : t.artist);
                            }}
                            className="text-white/25 hover:text-amber-400 transition-colors p-1"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {t.source === 'user' && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDeleteUserTrack(t.id); }}
                              className="text-white/25 hover:text-red-400 transition-colors p-1"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}

                {/* Upload for user tracks */}
                {isAuthenticated && store.activeSource === 'user' && (
                  <div className="border-t border-white/5">
                    {!showUpload ? (
                      <button
                        onClick={() => setShowUpload(true)}
                        className="w-full py-2.5 flex items-center justify-center gap-2 text-xs text-[#00F0FF] hover:bg-white/5 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Tải nhạc lên</span>
                      </button>
                    ) : (
                      <div className="p-3 flex flex-col gap-2">
                        <input
                          type="text"
                          placeholder="Tên bài hát *"
                          value={uploadTitle}
                          onChange={(e) => setUploadTitle(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-[#00F0FF]/40"
                        />
                        <input
                          type="text"
                          placeholder="Nghệ sĩ"
                          value={uploadArtist}
                          onChange={(e) => setUploadArtist(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-[#00F0FF]/40"
                        />
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-white/50 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 hover:border-white/20 transition-colors">
                          <Upload className="w-3 h-3" />
                          <span className="truncate">{uploadAudio?.name ?? 'Chọn file nhạc (MP3/WAV/OGG)'}</span>
                          <input type="file" accept="audio/mpeg,audio/wav,audio/ogg" className="hidden"
                            onChange={(e) => setUploadAudio(e.target.files?.[0] ?? null)} />
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-white/50 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 hover:border-white/20 transition-colors">
                          <Music className="w-3 h-3" />
                          <span className="truncate">{uploadCover?.name ?? 'Ảnh bìa (tùy chọn)'}</span>
                          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                            onChange={(e) => setUploadCover(e.target.files?.[0] ?? null)} />
                        </label>
                        {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setShowUpload(false); setUploadStatus('idle'); setUploadError(''); }}
                            className="flex-1 py-1.5 rounded-xl text-xs text-white/50 bg-white/5 hover:bg-white/10 transition-colors"
                          >Hủy</button>
                          <button
                            onClick={handleUpload}
                            disabled={!uploadTitle || !uploadAudio || uploadStatus === 'loading'}
                            className="flex-1 py-1.5 rounded-xl text-xs font-semibold bg-[#00F0FF] text-black hover:bg-[#00F0FF]/90 disabled:opacity-40 transition-colors"
                          >
                            {uploadStatus === 'loading'
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                              : uploadStatus === 'success' ? '✓ Đã tải' : 'Tải lên'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Track list toggle */}
            <div className="px-4 pb-4 flex justify-center">
              <button
                onClick={() => setShowTrackList(!showTrackList)}
                className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60 transition-colors"
              >
                <List className="w-3 h-3" />
                <span>{showTrackList ? 'Ẩn danh sách' : 'Danh sách'}</span>
                {showTrackList ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {store.error && (
              <div className="px-4 pb-3">
                <p className="text-xs text-red-400">{store.error}</p>
              </div>
            )}
          </motion.div>
        ) : (
          /* ── Collapsed Player ───────────────────────────────────────── */
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-end gap-1.5"
            ref={miniPickerRef}
          >
            {/* Mini Track Picker popup */}
            <AnimatePresence>
              {showMiniPicker && (
                <motion.div
                  key="mini-picker"
                  initial={{ opacity: 0, scale: 0.9, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 8 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                  className="w-56 bg-[#0A0F1E]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                >
                  {/* Source tabs */}
                  <div className="flex border-b border-white/5">
                    <button
                      onClick={() => store.setActiveSource('system')}
                      className={`flex-1 py-2 text-[10px] font-semibold transition-colors ${store.activeSource === 'system' ? 'text-[#00F0FF] bg-white/5' : 'text-white/40 hover:text-white'}`}
                    >
                      Hệ thống
                    </button>
                    {isAuthenticated && (
                      <button
                        onClick={() => store.setActiveSource('user')}
                        className={`flex-1 py-2 text-[10px] font-semibold transition-colors ${store.activeSource === 'user' ? 'text-[#00F0FF] bg-white/5' : 'text-white/40 hover:text-white'}`}
                      >
                        Của tôi
                      </button>
                    )}
                  </div>

                  {/* Track list */}
                  <div className="max-h-44 overflow-y-auto">
                    {activeTracks.length === 0 ? (
                      <p className="text-center text-[10px] text-white/30 py-4">Không có bài hát</p>
                    ) : (
                      activeTracks.map((t) => (
                        <div
                          key={`mini-${t.source}-${t.id}`}
                          onClick={() => { userManuallyPausedRef.current = false; store.play(t); }}
                          className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors ${
                            store.currentTrack?.id === t.id && store.currentTrack.source === t.source
                              ? 'bg-[#00F0FF]/10 text-[#00F0FF]'
                              : 'hover:bg-white/5 text-white/70'
                          }`}
                        >
                          <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                            {t.coverUrl
                              ? <img src={resolveUrl(t.coverUrl)} alt="" className="w-full h-full object-cover" />
                              : <Music className="w-2.5 h-2.5 text-white/30" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-medium truncate">{t.title}</p>
                            <p className="text-[9px] text-white/40 truncate">{t.artist}</p>
                          </div>
                          {store.currentTrack?.id === t.id && store.currentTrack.source === t.source && store.isPlaying && (
                            <motion.div
                              className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] shrink-0"
                              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                              transition={{ duration: 0.8, repeat: Infinity }}
                            />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main collapsed bar */}
            <div className="flex items-center gap-1.5 bg-[#0A0F1E]/90 backdrop-blur-2xl border border-white/10 rounded-2xl px-2.5 py-2 shadow-2xl">
              {/* Music icon — click to open track picker */}
              <button
                onClick={() => setShowMiniPicker((v) => !v)}
                className="relative w-7 h-7 rounded-xl bg-gradient-to-br from-[#00F0FF]/20 to-[#8A2BE2]/20 flex items-center justify-center hover:from-[#00F0FF]/30 hover:to-[#8A2BE2]/30 transition-all"
                title="Chọn bài hát"
              >
                <Music className="w-3.5 h-3.5 text-[#00F0FF]" />
                {store.isPlaying && (
                  <motion.div
                    className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00F0FF]"
                    animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                )}
              </button>

              {/* Track name */}
              <div className="max-w-[72px]">
                <p className="text-[10px] text-white/70 truncate">{track?.title ?? 'Nhạc'}</p>
              </div>

              {/* Volume slider */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => store.setVolume(store.volume > 0 ? 0 : 0.15)}
                  className="text-white/40 hover:text-[#00F0FF] transition-colors"
                  title={store.volume === 0 ? 'Bật âm' : 'Tắt âm'}
                >
                  {store.volume === 0
                    ? <VolumeX className="w-3 h-3" />
                    : <Volume2 className="w-3 h-3" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.02}
                  value={store.volume}
                  onChange={(e) => store.setVolume(parseFloat(e.target.value))}
                  className="w-14 h-0.5 accent-[#00F0FF] cursor-pointer"
                  title={`Âm lượng: ${Math.round(store.volume * 100)}%`}
                />
              </div>

              {/* Play/Pause */}
              <button
                onClick={handleUserTogglePlay}
                className="w-7 h-7 rounded-xl bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 flex items-center justify-center transition-colors"
              >
                {store.isPlaying
                  ? <Pause className="w-3.5 h-3.5 text-[#00F0FF]" />
                  : <Play className="w-3.5 h-3.5 text-[#00F0FF] ml-0.5" />}
              </button>

              {/* Expand */}
              <button
                onClick={() => { store.setIsExpanded(true); setShowMiniPicker(false); }}
                className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                title="Mở rộng"
              >
                <ChevronUp className="w-3.5 h-3.5 text-white/50" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
