'use client';

import React, { useState, useEffect } from 'react';
import { INITIAL_ALGORITHMS, AlgorithmItem } from '@/lib/data/algorithmsData';
import { useI18nStore } from '@/lib/store/useI18nStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useMusicStore, Track } from '@/lib/store/useMusicStore';
import { createSystemTrack, updateSystemTrack, deleteSystemTrack } from '@/lib/api/musicApi';
import { saveAudioBlob, saveCoverBlob, loadAudioUrl, loadCoverUrl, localMarker, deleteLocalTrack } from '@/lib/store/musicDb';
import {
  ShieldAlert,
  Plus,
  Trash2,
  Edit2,
  Users,
  Database,
  BarChart3,
  CheckCircle,
  X,
  Save,
  Search,
  Music,
  Upload,
  ToggleLeft,
  ToggleRight,
  Star,
  Loader2,
  Mail,
  Clock
} from 'lucide-react';

interface AuditLogRecord {
  id: string | number;
  userId: string;
  email: string;
  displayName: string;
  loginMethod: string;
  loginAt: string;
  browser: string;
  device: string;
  emailStatus: string;
  resendMessageId?: string | null;
}

export const AdminDashboard: React.FC = () => {
  const { t } = useI18nStore();
  const { user, isAdmin, loginAsAdmin, token } = useAuthStore();
  const musicStore = useMusicStore();
  const [algorithms, setAlgorithms] = useState<AlgorithmItem[]>(INITIAL_ALGORITHMS);
  const [editingAlg, setEditingAlg] = useState<AlgorithmItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Music state
  const [adminTab, setAdminTab] = useState<'algorithms' | 'music' | 'users' | 'login-logs'>('algorithms');
  const [loginLogs, setLoginLogs] = useState<AuditLogRecord[]>([]);
  const [musicTitle, setMusicTitle] = useState('');
  const [musicArtist, setMusicArtist] = useState('');
  const [musicAudio, setMusicAudio] = useState<File | null>(null);
  const [musicCover, setMusicCover] = useState<File | null>(null);
  const [musicStatus, setMusicStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [musicError, setMusicError] = useState('');

  // Edit existing system track state
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [editTrackTitle, setEditTrackTitle] = useState('');
  const [editTrackArtist, setEditTrackArtist] = useState('');
  const [editTrackAudio, setEditTrackAudio] = useState<File | null>(null);
  const [editTrackCover, setEditTrackCover] = useState<File | null>(null);
  const [editTrackSaving, setEditTrackSaving] = useState(false);

  // Sample users directory with dynamic Role Management
  const [usersList, setUsersList] = useState([
    { id: '1', email: 'admin@cubex.com', username: 'admin', name: 'Cubex Administrator', role: 'Admin', solves: 342, wcaId: '2026CUBE01' },
    { id: '2', email: 'vnpnam1@cubex.vn', username: 'vnpnam1', name: 'vnpnam1', role: 'Cubist', solves: 1250, wcaId: '2026NAM01' },
    { id: '3', email: 'vnpnam2@cubex.vn', username: 'vnpnam2', name: 'vnpnam2', role: 'Cubist', solves: 890, wcaId: '2026NAM02' },
    { id: '4', email: 'cubist@cubex.com', username: 'minh', name: 'Minh Speedcuber', role: 'Cubist', solves: 420, wcaId: '2025MINH02' }
  ]);

  const handleToggleUserRole = (targetId: string) => {
    setUsersList((prev) =>
      prev.map((u) =>
        u.id === targetId
          ? { ...u, role: u.role === 'Admin' ? 'Cubist' : 'Admin' }
          : u
      )
    );
  };

  useEffect(() => {
    fetch('/api/auth/login-notify')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setLoginLogs(data);
      })
      .catch(() => {});
  }, [adminTab]);

  const handleSaveAlgorithm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlg) return;

    if (isAddingNew) {
      const newId = Math.max(...algorithms.map((a) => a.id), 0) + 1;
      setAlgorithms([{ ...editingAlg, id: newId }, ...algorithms]);
    } else {
      setAlgorithms(algorithms.map((a) => (a.id === editingAlg.id ? editingAlg : a)));
    }

    setEditingAlg(null);
    setIsAddingNew(false);
  };

  const handleDeleteAlgorithm = (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa thuật toán này khỏi hệ thống?')) {
      setAlgorithms(algorithms.filter((a) => a.id !== id));
    }
  };

  const handleAddNew = () => {
    setEditingAlg({
      id: 0,
      category: 'F2L',
      subCategory: 'Advanced Inserts',
      code: 'F2L NEW',
      name: 'New Custom Case',
      notation: "R U R' U'",
      descriptionVi: 'Mô tả chi tiết kỹ thuật thực hiện.',
      descriptionEn: 'Detailed execution guide.',
      executionTipVi: 'Fingertrick tối ưu.',
      executionTipEn: 'Optimal fingertrick.',
      difficulty: 'Intermediate',
      orderIndex: algorithms.length + 1
    });
    setIsAddingNew(true);
  };

  if (!isAdmin) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center text-center p-8 bg-[#0B0F19]/80 backdrop-blur-xl border border-red-500/20 rounded-3xl">
        <ShieldAlert className="w-14 h-14 text-[#FF9500] mb-4" />
        <span className="px-3 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-mono font-bold mb-3">
          403 FORBIDDEN • KHÔNG ĐỦ QUYỀN TRUY CẬP
        </span>
        <h3 className="text-xl font-bold text-white mb-2">Khu Vực Dành Riêng Cho Quản Trị Viên (Admin)</h3>
        <p className="text-sm text-white/50 max-w-md mb-6">
          Tài khoản hiện tại của bạn (<strong className="text-white">{user?.displayName ?? 'Khách'}</strong> — Vai trò:{' '}
          <strong className="text-neonCyan">Thành viên / Cubist</strong>) không có quyền truy cập trang Quản trị CMS. Vui lòng đăng nhập bằng tài khoản <strong className="text-amber-400">admin</strong>.
        </p>
        <a
          href="/login"
          className="px-6 py-2.5 bg-gradient-to-r from-[#FF9500] to-[#FF6B00] text-black font-bold text-sm rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[#FF9500]/20"
        >
          Đăng nhập tài khoản Admin →
        </a>
      </div>
    );
  }

  const filteredAlgs = algorithms.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Music Handlers ─────────────────────────────────────────────────────
  const handleAddTrack = async () => {
    if (!musicTitle || !musicAudio) return;
    setMusicStatus('loading');
    setMusicError('');

    // Capture file refs before any async op (they may be nulled later)
    const audioFile = musicAudio;
    const coverFile = musicCover;
    const title = musicTitle;
    const artist = musicArtist;
    const id = Date.now();

    // Always save a local IndexedDB copy for instant offline playback AND upload to shared /api/music/system
    const saveLocalBackup = async (serverAudioUrl?: string, serverCoverUrl?: string | null) => {
      await saveAudioBlob(id, audioFile);
      let coverObjectUrl: string | null = serverCoverUrl ?? null;
      if (coverFile) {
        await saveCoverBlob(id, coverFile);
        if (!coverObjectUrl) {
          coverObjectUrl = URL.createObjectURL(coverFile);
        }
      }
      const newTrack: Track = {
        id,
        title,
        artist: artist || 'Unknown',
        coverUrl: coverObjectUrl,
        audioUrl: serverAudioUrl || localMarker(id),
        source: 'system',
      };
      musicStore.setSystemTracks([
        newTrack,
        ...musicStore.systemTracks.filter((t) => t.id !== id),
      ]);
    };

    try {
      try {
        const track = await createSystemTrack(
          token || 'admin-token',
          title,
          artist,
          audioFile,
          coverFile ?? undefined,
          id
        );
        await saveLocalBackup(track.audioUrl, track.coverUrl);
      } catch {
        await saveLocalBackup();
      }
      setMusicStatus('success');
      setMusicTitle('');
      setMusicArtist('');
      setMusicAudio(null);
      setMusicCover(null);
      setTimeout(() => setMusicStatus('idle'), 2000);
    } catch {
      setMusicStatus('error');
      setMusicError('Không thể thêm bài hát.');
    }
  };

  const handleDeleteTrack = async (id: number) => {
    try {
      if (token) await deleteSystemTrack(token, id).catch(() => {});
      // Also clean up IndexedDB blob if it was a local track
      await deleteLocalTrack(id).catch(() => {});
      musicStore.setSystemTracks(musicStore.systemTracks.filter((t) => t.id !== id));
      if (musicStore.currentTrack?.id === id) musicStore.pause();
    } catch {}
  };

  const handleOpenEditTrack = (track: Track) => {
    setEditingTrack(track);
    setEditTrackTitle(track.title);
    setEditTrackArtist(track.artist === 'Unknown' ? '' : track.artist);
    setEditTrackAudio(null);
    setEditTrackCover(null);
  };

  const handleSaveEditTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrack || !editTrackTitle.trim()) return;
    setEditTrackSaving(true);

    const newTitle = editTrackTitle.trim();
    const newArtist = editTrackArtist.trim() || 'Unknown';
    let newAudioUrl = editingTrack.audioUrl;
    let newCoverUrl = editingTrack.coverUrl ?? null;

    try {
      // If user chose a replacement audio file, store it in IndexedDB
      if (editTrackAudio) {
        await saveAudioBlob(editingTrack.id, editTrackAudio);
        newAudioUrl = localMarker(editingTrack.id);
      }

      // If user chose a replacement cover image, store it in IndexedDB & create object URL
      if (editTrackCover) {
        await saveCoverBlob(editingTrack.id, editTrackCover);
        newCoverUrl = URL.createObjectURL(editTrackCover);
      }

      try {
        const updated = await updateSystemTrack(
          token || 'admin-token',
          editingTrack.id,
          { title: newTitle, artist: newArtist },
          editTrackCover ?? undefined,
          editTrackAudio ?? undefined
        );
        if (updated?.audioUrl && !editTrackAudio) {
          newAudioUrl = updated.audioUrl;
        }
        if (updated?.coverUrl && !editTrackCover) {
          newCoverUrl = updated.coverUrl;
        }
      } catch {
        // Offline / local fallback still updates store below
      }

      musicStore.updateSystemTrackInStore(editingTrack.id, {
        title: newTitle,
        artist: newArtist,
        audioUrl: newAudioUrl,
        coverUrl: newCoverUrl,
      });

      setEditingTrack(null);
    } finally {
      setEditTrackSaving(false);
    }
  };

  const handleToggleActive = async (track: Track) => {
    // Frontend-only toggle for demo mode (no backend call needed here for local tracks)
    if (token) {
      try {
        await updateSystemTrack(token, track.id, { isActive: !(track as Track & { isActive?: boolean }).isActive });
      } catch {}
    }
    // Visual toggle — in full backend integration track.isActive would be a field
    musicStore.setSystemTracks(
      musicStore.systemTracks.map((t) =>
        t.id === track.id ? { ...t, _inactive: !(t as Track & { _inactive?: boolean })._inactive } : t
      )
    );
  };

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Admin Section Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-black/40 border border-white/10 rounded-2xl w-fit">
        {([
          { id: 'algorithms' as const, label: 'Thuật Toán', icon: Database },
          { id: 'music' as const, label: 'Quản Lý Nhạc', icon: Music },
          { id: 'users' as const, label: 'Người Dùng', icon: Users },
          { id: 'login-logs' as const, label: 'Lịch Sử Đăng Nhập & Resend Email', icon: Mail },
        ]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setAdminTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              adminTab === id
                ? 'bg-white/15 text-white border border-white/15 shadow-md'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${adminTab === id ? 'text-[#00F0FF]' : ''}`} />
            {label}
          </button>
        ))}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center gap-4 shadow-xl">
          <div className="p-3 rounded-2xl bg-[#00F0FF]/10 text-[#00F0FF]">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-white/40 uppercase font-mono">Tổng Thuật Toán</span>
            <h4 className="text-2xl font-mono font-bold text-white">{algorithms.length}</h4>
          </div>
        </div>

        <div className="p-5 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center gap-4 shadow-xl">
          <div className="p-3 rounded-2xl bg-[#00F5A0]/10 text-[#00F5A0]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-white/40 uppercase font-mono">Thành Viên Hoạt Động</span>
            <h4 className="text-2xl font-mono font-bold text-white">{usersList.length}</h4>
          </div>
        </div>

        <div className="p-5 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center gap-4 shadow-xl">
          <div className="p-3 rounded-2xl bg-[#FFD700]/10 text-[#FFD700]">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-white/40 uppercase font-mono">Tổng Lượt Giải Nền Tảng</span>
            <h4 className="text-2xl font-mono font-bold text-white">2,902</h4>
          </div>
        </div>
      </div>

      {/* ── MUSIC MANAGEMENT TAB ─────────────────────────────────────────── */}
      {adminTab === 'music' && (
        <div className="flex flex-col gap-6">
          {/* Add Track Form */}
          <div className="p-6 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Music className="w-5 h-5 text-[#00F0FF]" />
              Thêm Bài Hát Mới
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/50 mb-1 block">Tên bài hát *</label>
                <input
                  type="text"
                  value={musicTitle}
                  onChange={(e) => setMusicTitle(e.target.value)}
                  placeholder="Nhập tên bài hát..."
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#00F0FF]/50"
                />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Nghệ sĩ</label>
                <input
                  type="text"
                  value={musicArtist}
                  onChange={(e) => setMusicArtist(e.target.value)}
                  placeholder="Tên nghệ sĩ..."
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#00F0FF]/50"
                />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">File nhạc * (MP3/WAV/OGG, max 20MB)</label>
                <label className="flex items-center gap-2 cursor-pointer w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white/50 hover:border-white/20 transition-colors">
                  <Upload className="w-3.5 h-3.5 text-[#00F0FF]" />
                  <span className="truncate">{musicAudio?.name ?? 'Chọn file nhạc...'}</span>
                  <input
                    type="file"
                    accept="audio/mpeg,audio/wav,audio/ogg"
                    className="hidden"
                    onChange={(e) => setMusicAudio(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Ảnh bìa (tùy chọn)</label>
                <label className="flex items-center gap-2 cursor-pointer w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white/50 hover:border-white/20 transition-colors">
                  <Music className="w-3.5 h-3.5 text-[#00F0FF]" />
                  <span className="truncate">{musicCover?.name ?? 'Chọn ảnh bìa...'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => setMusicCover(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </div>
            {musicError && <p className="text-xs text-red-400 mt-3">{musicError}</p>}
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleAddTrack}
                disabled={!musicTitle || !musicAudio || musicStatus === 'loading'}
                className="flex items-center gap-2 px-5 py-2 bg-[#00F0FF] text-black font-semibold text-xs rounded-xl hover:bg-[#00F0FF]/90 disabled:opacity-40 transition-all shadow-md shadow-[#00F0FF]/20"
              >
                {musicStatus === 'loading' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                {musicStatus === 'success' ? '✓ Đã thêm!' : 'Thêm Bài Hát'}
              </button>
              {!token && (
                <span className="text-xs text-[#FFD700]/70">
                  ⚠ Backend offline — nhạc sẽ chỉ tồn tại trong phiên này
                </span>
              )}
            </div>
          </div>

          {/* Track List */}
          <div className="p-6 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Star className="w-4 h-4 text-[#FFD700]" />
                Danh Sách Nhạc Hệ Thống ({musicStore.systemTracks.length})
              </span>
            </h3>
            {musicStore.systemTracks.length === 0 ? (
              <div className="text-center py-8 text-white/30 text-sm">
                Chưa có bài hát nào. Thêm bài hát đầu tiên ở trên.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {musicStore.systemTracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-3 p-3 bg-black/30 border border-white/5 rounded-2xl hover:border-white/10 transition-colors"
                  >
                    {/* Cover */}
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                      {track.coverUrl
                        ? <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
                        : <Music className="w-4 h-4 text-white/20" />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{track.title}</p>
                      <p className="text-xs text-white/40 truncate">{track.artist}</p>
                    </div>

                    {/* Play button */}
                    <button
                      type="button"
                      onClick={() => musicStore.play(track)}
                      className="p-2 rounded-xl bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 text-[#00F0FF] transition-colors text-xs cursor-pointer"
                      title="Phát thử"
                    >
                      ▶
                    </button>

                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditTrack(track)}
                      className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-colors cursor-pointer"
                      title="Chỉnh sửa bài hát"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDeleteTrack(track.id)}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Algorithm Content Repository Table */}
      <div className="p-6 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">{t('adminTitle')}</h3>
            <p className="text-xs text-white/40 mt-0.5">{t('adminSubtitle')}</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-60">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm thuật toán..."
                className="w-full pl-9 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#00F0FF]/50"
              />
            </div>

            <button
              onClick={handleAddNew}
              className="px-4 py-2 bg-[#00F0FF] text-black font-semibold text-xs rounded-xl hover:bg-[#00F0FF]/90 transition-all flex items-center gap-1.5 shadow-md shadow-[#00F0FF]/20 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{t('adminAddAlgorithm')}</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 text-white/40 font-mono uppercase tracking-wider">
              <tr>
                <th className="pb-3 pl-3">Mã</th>
                <th className="pb-3">Phân Loại</th>
                <th className="pb-3">Tên Thuật Toán</th>
                <th className="pb-3">Công Thức (Notation)</th>
                <th className="pb-3">Độ Khó</th>
                <th className="pb-3 text-right pr-3">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {filteredAlgs.map((a) => (
                <tr key={a.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 pl-3 font-mono font-bold text-[#00F0FF]">{a.code}</td>
                  <td className="py-3.5 text-white/70">{a.category} • {a.subCategory}</td>
                  <td className="py-3.5 font-semibold text-white">{a.name}</td>
                  <td className="py-3.5 font-mono text-white/90">{a.notation}</td>
                  <td className="py-3.5 text-white/60">{a.difficulty}</td>
                  <td className="py-3.5 text-right pr-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingAlg(a);
                          setIsAddingNew(false);
                        }}
                        className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                        title={t('adminEdit')}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAlgorithm(a.id)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-[#FF3B30] hover:bg-white/10 transition-colors"
                        title={t('adminDelete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users & Role Permission Directory */}
      <div className="p-6 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Quản Lý Người Dùng & Phân Quyền (RBAC)</h3>
            <p className="text-xs text-white/40 mt-0.5">Cấp hoặc thu hồi quyền Quản trị viên (Admin / Thành viên Cubist)</p>
          </div>
          <span className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/25 px-3 py-1 rounded-full">
            Chỉ Admin mới có quyền thay đổi
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {usersList.map((u) => (
            <div key={u.id} className="p-4 bg-black/40 border border-white/10 rounded-2xl flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">{u.name}</h4>
                  <span className="text-[11px] text-white/40 block">{u.email}</span>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                  u.role === 'Admin'
                    ? 'bg-[#FF9500]/20 text-[#FF9500] border border-[#FF9500]/30'
                    : 'bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/25'
                }`}>
                  {u.role === 'Admin' ? 'ADMIN' : 'MEMBER'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-white/50 pt-2 border-t border-white/5">
                <span>WCA: <strong className="text-white font-mono">{u.wcaId}</strong></span>
                <span>{u.solves} solves</span>
              </div>
              <button
                type="button"
                onClick={() => handleToggleUserRole(u.id)}
                className={`w-full py-1.5 px-3 rounded-xl text-xs font-semibold transition-all border ${
                  u.role === 'Admin'
                    ? 'bg-white/5 hover:bg-red-500/15 text-slate-300 hover:text-red-300 border-white/10'
                    : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border-amber-500/30'
                }`}
              >
                {u.role === 'Admin' ? 'Hạ xuống Thành viên (Cubist)' : '↑ Cấp quyền Admin'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Login History & Resend Email Audit Logs */}
      <div className="p-6 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#00F0FF]" />
              Lịch Sử Đăng Nhập & Trạng Thái Gửi Email (Resend)
            </h3>
            <p className="text-xs text-white/40 mt-0.5">
              Ghi nhận mỗi lần đăng nhập thực tế (Không lưu Access Token, ID Token hay Mật khẩu)
            </p>
          </div>
          <span className="text-xs font-mono text-[#00F0FF] bg-[#00F0FF]/10 border border-[#00F0FF]/25 px-3 py-1 rounded-full">
            {loginLogs.length} bản ghi
          </span>
        </div>

        {loginLogs.length === 0 ? (
          <div className="text-center py-8 text-white/30 text-sm">
            Chưa có bản ghi đăng nhập nào trong phiên này. Hãy thử đăng nhập tại trang /login.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 text-white/40 font-mono uppercase tracking-wider">
                <tr>
                  <th className="pb-3 pl-3">User ID</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Phương Thức</th>
                  <th className="pb-3">Thời Gian</th>
                  <th className="pb-3">Browser / Device</th>
                  <th className="pb-3">Trạng Thái Email</th>
                  <th className="pb-3 pr-3">Resend Message ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loginLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 pl-3 font-mono text-white/70">{log.userId}</td>
                    <td className="py-3 font-semibold text-white">{log.email}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 font-mono text-[11px]">
                        {log.loginMethod}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-white/70 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-white/30" />
                      {new Date(log.loginAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 text-white/70">
                      {log.browser} • <span className="text-white/40">{log.device}</span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                          log.emailStatus === 'Sent'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : log.emailStatus === 'Skipped_RateLimit'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-slate-500/20 text-slate-300'
                        }`}
                      >
                        {log.emailStatus}
                      </span>
                    </td>
                    <td className="py-3 pr-3 font-mono text-white/50">
                      {log.resendMessageId || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Edit / Add Algorithm */}
      {editingAlg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="w-full max-w-xl bg-[#0E131F] border border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <h3 className="text-lg font-bold text-white">
                {isAddingNew ? 'Thêm Thuật Toán Mới' : `Chỉnh Sửa ${editingAlg.code}`}
              </h3>
              <button
                onClick={() => setEditingAlg(null)}
                className="p-2 rounded-full text-white/40 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAlgorithm} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/50 block mb-1">Mã (Code)</label>
                  <input
                    type="text"
                    value={editingAlg.code}
                    onChange={(e) => setEditingAlg({ ...editingAlg, code: e.target.value })}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-white/50 block mb-1">Nhóm (Category)</label>
                  <select
                    value={editingAlg.category}
                    onChange={(e) => setEditingAlg({ ...editingAlg, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Cross">Cross</option>
                    <option value="F2L">F2L</option>
                    <option value="OLL">OLL</option>
                    <option value="PLL">PLL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-white/50 block mb-1">Tên Thuật Toán</label>
                <input
                  type="text"
                  value={editingAlg.name}
                  onChange={(e) => setEditingAlg({ ...editingAlg, name: e.target.value })}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-white/50 block mb-1">Công Thức Xoay (Notation)</label>
                <input
                  type="text"
                  value={editingAlg.notation}
                  onChange={(e) => setEditingAlg({ ...editingAlg, notation: e.target.value })}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-mono text-[#00F0FF]"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-white/50 block mb-1">Mô Tả Tiếng Việt</label>
                <textarea
                  value={editingAlg.descriptionVi}
                  onChange={(e) => setEditingAlg({ ...editingAlg, descriptionVi: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-white/50 block mb-1">Fingertrick Tip (Tiếng Việt)</label>
                <input
                  type="text"
                  value={editingAlg.executionTipVi}
                  onChange={(e) => setEditingAlg({ ...editingAlg, executionTipVi: e.target.value })}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingAlg(null)}
                  className="px-4 py-2 rounded-xl text-xs text-white/60 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00F0FF] text-black font-semibold text-xs rounded-xl hover:bg-[#00F0FF]/90 transition-all flex items-center gap-1.5 shadow-md shadow-[#00F0FF]/20"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Thay Đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Edit System Music Track */}
      {editingTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="w-full max-w-lg bg-[#0E131F] border border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/30 flex items-center justify-center">
                  <Music className="w-4 h-4 text-[#00F0FF]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Chỉnh Sửa Bài Hát</h3>
                  <p className="text-[11px] text-white/40">Cập nhật tên bài hát, nghệ sĩ, file nhạc hoặc ảnh bìa</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTrack(null)}
                className="p-2 rounded-full text-white/40 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTrack} className="space-y-4">
              <div>
                <label className="text-xs text-white/50 block mb-1">Tên bài hát *</label>
                <input
                  type="text"
                  value={editTrackTitle}
                  onChange={(e) => setEditTrackTitle(e.target.value)}
                  placeholder="Nhập tên bài hát..."
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#00F0FF]/50"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-white/50 block mb-1">Nghệ sĩ</label>
                <input
                  type="text"
                  value={editTrackArtist}
                  onChange={(e) => setEditTrackArtist(e.target.value)}
                  placeholder="Nhập tên nghệ sĩ..."
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#00F0FF]/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/50 block mb-1">
                    Thay file nhạc mới (tùy chọn)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white/60 hover:border-white/25 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-[#00F0FF] shrink-0" />
                    <span className="truncate">
                      {editTrackAudio?.name ?? 'Giữ nguyên file nhạc hiện tại'}
                    </span>
                    <input
                      type="file"
                      accept="audio/mpeg,audio/wav,audio/ogg"
                      className="hidden"
                      onChange={(e) => setEditTrackAudio(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>

                <div>
                  <label className="text-xs text-white/50 block mb-1">
                    Thay ảnh bìa mới (tùy chọn)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white/60 hover:border-white/25 transition-colors">
                    <Music className="w-3.5 h-3.5 text-[#00F0FF] shrink-0" />
                    <span className="truncate">
                      {editTrackCover?.name ?? 'Giữ nguyên ảnh bìa hiện tại'}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => setEditTrackCover(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingTrack(null)}
                  className="px-4 py-2 rounded-xl text-xs text-white/60 hover:text-white cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={editTrackSaving || !editTrackTitle.trim()}
                  className="px-5 py-2 bg-[#00F0FF] text-black font-semibold text-xs rounded-xl hover:bg-[#00F0FF]/90 disabled:opacity-40 transition-all flex items-center gap-1.5 shadow-md shadow-[#00F0FF]/20 cursor-pointer"
                >
                  {editTrackSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Lưu Thay Đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
