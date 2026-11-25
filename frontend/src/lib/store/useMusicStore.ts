import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type RepeatMode = 'none' | 'one' | 'all';
export type TrackSource = 'system' | 'user';

export interface Track {
  id: number;
  title: string;
  artist: string;
  coverUrl?: string | null;
  audioUrl: string;
  source: TrackSource;
}

interface MusicState {
  // Tracks
  systemTracks: Track[];
  userTracks: Track[];
  // Playback state (never persisted as "isPlaying=true")
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  repeatMode: RepeatMode;
  shuffleEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  // UI state
  isExpanded: boolean;
  activeSource: TrackSource;
  // Actions
  setSystemTracks: (tracks: Track[]) => void;
  setUserTracks: (tracks: Track[]) => void;
  play: (track?: Track) => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  setRepeatMode: (m: RepeatMode) => void;
  toggleShuffle: () => void;
  setCurrentTime: (t: number) => void;
  setDuration: (d: number) => void;
  setIsLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  setIsExpanded: (v: boolean) => void;
  setActiveSource: (s: TrackSource) => void;
  addUserTrack: (track: Track) => void;
  removeUserTrack: (id: number) => void;
  updateSystemTrackInStore: (id: number, patch: Partial<Track>) => void;
  updateUserTrackInStore: (id: number, patch: Partial<Track>) => void;
}

export const useMusicStore = create<MusicState>()(
  persist(
    (set, get) => ({
      systemTracks: [],
      userTracks: [],
      currentTrack: null,
      isPlaying: true,
      currentTime: 0,
      duration: 0,
      volume: 0.3,
      repeatMode: 'all',
      shuffleEnabled: false,
      isLoading: false,
      error: null,
      isExpanded: false,
      activeSource: 'system',

      setSystemTracks: (tracks) =>
        set((state) => ({
          systemTracks: tracks,
          currentTrack: state.currentTrack ?? tracks[0] ?? null,
        })),
      setUserTracks: (tracks) => set({ userTracks: tracks }),

      play: (track) => {
        if (track) {
          set({ currentTrack: track, isPlaying: true, currentTime: 0, error: null });
        } else {
          set({ isPlaying: true });
        }
      },

      pause: () => set({ isPlaying: false }),

      togglePlay: () => {
        const { isPlaying, currentTrack, systemTracks, userTracks, activeSource } = get();
        if (!currentTrack) {
          // Auto-select first available track
          const list = activeSource === 'system' ? systemTracks : userTracks;
          const first = list[0] ?? systemTracks[0];
          if (first) {
            set({ currentTrack: first, isPlaying: true, currentTime: 0 });
          }
          return;
        }
        set({ isPlaying: !isPlaying });
      },

      next: () => {
        const { currentTrack, systemTracks, userTracks, activeSource, shuffleEnabled, isPlaying, repeatMode } = get();
        const list = (activeSource === 'system' ? systemTracks : userTracks).filter(Boolean);
        if (!list.length) return;
        if (!currentTrack) {
          set({ currentTrack: list[0], isPlaying, currentTime: 0 });
          return;
        }
        const idx = list.findIndex((t) => t.id === currentTrack.id && t.source === currentTrack.source);
        let next: Track;
        if (shuffleEnabled) {
          let newIdx = Math.floor(Math.random() * list.length);
          if (list.length > 1) while (newIdx === idx) newIdx = Math.floor(Math.random() * list.length);
          next = list[newIdx];
        } else {
          const nextIdx = idx + 1;
          if (nextIdx >= list.length) {
            if (repeatMode === 'all') {
              next = list[0];
            } else {
              set({ isPlaying: false, currentTime: 0 });
              return;
            }
          } else {
            next = list[nextIdx];
          }
        }
        set({ currentTrack: next, isPlaying, currentTime: 0 });
      },

      prev: () => {
        const { currentTrack, systemTracks, userTracks, activeSource, currentTime, isPlaying } = get();
        // If more than 3s in, restart; else go prev
        if (currentTime > 3) {
          set({ currentTime: 0 });
          return;
        }
        const list = (activeSource === 'system' ? systemTracks : userTracks).filter(Boolean);
        if (!list.length || !currentTrack) return;
        const idx = list.findIndex((t) => t.id === currentTrack.id && t.source === currentTrack.source);
        const prevIdx = idx - 1 < 0 ? list.length - 1 : idx - 1;
        set({ currentTrack: list[prevIdx], isPlaying, currentTime: 0 });
      },

      seek: (time) => set({ currentTime: time }),
      setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
      setRepeatMode: (m) => set({ repeatMode: m }),
      toggleShuffle: () => set((s) => ({ shuffleEnabled: !s.shuffleEnabled })),
      setCurrentTime: (t) => set({ currentTime: t }),
      setDuration: (d) => set({ duration: d }),
      setIsLoading: (v) => set({ isLoading: v }),
      setError: (e) => set({ error: e }),
      setIsExpanded: (v) => set({ isExpanded: v }),
      setActiveSource: (s) => set({ activeSource: s }),
      addUserTrack: (track) => set((st) => ({ userTracks: [track, ...st.userTracks] })),
      removeUserTrack: (id) =>
        set((st) => ({ userTracks: st.userTracks.filter((t) => t.id !== id) })),
      updateSystemTrackInStore: (id, patch) =>
        set((st) => ({
          systemTracks: st.systemTracks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
          currentTrack:
            st.currentTrack && st.currentTrack.id === id && st.currentTrack.source === 'system'
              ? { ...st.currentTrack, ...patch }
              : st.currentTrack,
        })),
      updateUserTrackInStore: (id, patch) =>
        set((st) => ({
          userTracks: st.userTracks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
          currentTrack:
            st.currentTrack && st.currentTrack.id === id && st.currentTrack.source === 'user'
              ? { ...st.currentTrack, ...patch }
              : st.currentTrack,
        })),
    }),
    {
      name: 'cubex-music',
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        const state = (persistedState as Record<string, unknown>) || {};
        if (version < 2 && (state.volume === 0.8 || state.volume === undefined)) {
          state.volume = 0.3;
        }
        return state as unknown as MusicState;
      },
      // Persist preferences but NEVER isPlaying (rule: no autoplay on reload)
      partialize: (state) => ({
        volume: state.volume,
        repeatMode: state.repeatMode,
        shuffleEnabled: state.shuffleEnabled,
        isExpanded: state.isExpanded,
        activeSource: state.activeSource,
        currentTrack: state.currentTrack,
        // Persist track lists but strip blob: URLs (they expire on page unload)
        systemTracks: state.systemTracks.filter((t) => !t.audioUrl.startsWith('blob:')),
        userTracks: state.userTracks.filter((t) => !t.audioUrl.startsWith('blob:')),
        // isPlaying intentionally excluded
      }),
    }
  )
);
