'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Swords,
  Plus,
  LogIn,
  Trophy,
  Users,
  ArrowRight,
  AlertCircle,
  Loader2,
  Bot,
  Sparkles,
  ShieldCheck,
  Timer,
  ClipboardPaste,
  Zap,
  Crown,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useMatchStore } from '@/features/match/stores/useMatchStore';
import {
  connectMatch,
  createRoom,
  joinRoom,
  addBotOpponentToRoom,
} from '@/features/match/services/matchSignalR';
import { Navbar } from '@/components/layout/Navbar';

const BO_OPTIONS = [
  {
    value: 1,
    label: 'BO1',
    title: 'Sinh Tử 1 Ván',
    desc: 'Thắng 1 ván duy nhất quyết định ngôi vương',
    badge: 'Nhanh',
  },
  {
    value: 3,
    label: 'BO3',
    title: 'Tiêu Chuẩn Đấu Trường',
    desc: 'Ai chạm 2 ván thắng trước giành chiến thắng',
    badge: 'Phổ biến',
  },
  {
    value: 5,
    label: 'BO5',
    title: 'Chung Kết Masters',
    desc: 'Ai chạm 3 ván thắng trước giành chiến thắng',
    badge: 'Pro WCA',
  },
];

export default function MatchLobbyPage() {
  const router = useRouter();
  const { isAuthenticated, user, token } = useAuthStore();
  const { roomCode, roomStatus, error, reset } = useMatchStore();

  const [bestOf, setBestOf] = useState(3);
  const [joinCode, setJoinCode] = useState('');
  const [connectingMode, setConnectingMode] = useState<'create' | 'bot' | 'join' | null>(null);
  const [localError, setLocalError] = useState('');

  // Reset any stale room state on mount so leaving a room never bounces back
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect to room only when actively creating or joining a room from the lobby
  useEffect(() => {
    if (connectingMode && roomCode && (roomStatus === 'waiting' || roomStatus === 'playing')) {
      router.push(`/match/${roomCode}`);
    }
  }, [connectingMode, roomCode, roomStatus, router]);

  /**
   * Normalizes room code input whether user types 4 characters ("YUWV")
   * or pastes a full copied room code with prefix ("CX-YUWV" / "CXYUWV").
   */
  const normalizeRoomCodeInput = (raw: string): string => {
    const upper = raw.toUpperCase().trim();
    if (/^CX-/i.test(upper)) {
      return upper.replace(/^CX-/i, '').replace(/[^A-Z0-9]/g, '').slice(0, 4);
    }
    const alnum = upper.replace(/[^A-Z0-9]/g, '');
    if (alnum.length > 4 && alnum.startsWith('CX')) {
      return alnum.slice(2, 6);
    }
    return alnum.slice(0, 4);
  };

  const handleCreate = async (withBot = false) => {
    if (!token) return;
    setConnectingMode(withBot ? 'bot' : 'create');
    setLocalError('');
    try {
      await connectMatch(token);
      await createRoom(bestOf);
      if (withBot) {
        addBotOpponentToRoom();
      }
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Không thể tạo phòng.');
      setConnectingMode(null);
    }
  };

  const handleJoin = async () => {
    const normalized = normalizeRoomCodeInput(joinCode);
    if (!token || normalized.length < 4) return;
    setConnectingMode('join');
    setLocalError('');
    try {
      await connectMatch(token);
      await joinRoom(`CX-${normalized}`);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Không thể vào phòng. Hãy kiểm tra lại mã phòng.');
      setConnectingMode(null);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setJoinCode(normalizeRoomCodeInput(text));
          setLocalError('');
        }
      }
    } catch {
      // Clipboard read permission denied; user can still Ctrl+V into the input
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#060911] flex flex-col">
        <Navbar activeTab="match" />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md bg-[#0B1020]/90 border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/25 flex items-center justify-center mx-auto mb-4">
              <Swords className="w-8 h-8 text-[#00F0FF]" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Đăng nhập để vào Đấu Trường</h2>
            <p className="text-sm text-white/55 mb-6 leading-relaxed">
              Bạn cần đăng nhập tài khoản CUBEX để tạo phòng thi đấu 1v1 thời gian thực, so tài với bạn bè hoặc luyện tập với Bot AI Sub-12.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00F0FF] to-[#00B8FF] text-[#05080f] font-black text-sm hover:opacity-95 transition-all shadow-[0_0_25px_rgba(0,240,255,0.3)]"
            >
              Đi tới Trang Đăng Nhập →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060911] text-white flex flex-col relative overflow-hidden">
      <Navbar activeTab="match" />

      {/* Ambient Arena Background Glows */}
      <div className="absolute top-20 left-1/4 -translate-x-1/2 w-[520px] h-[520px] bg-[#00F0FF]/6 blur-[170px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 translate-x-1/3 w-[520px] h-[520px] bg-[#8A2BE2]/8 blur-[180px] pointer-events-none" />

      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col justify-center relative z-10">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/25 text-[#00F0FF] text-[11px] font-mono font-bold tracking-wider uppercase mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              WCA 3x3x3 HEAD-TO-HEAD ARENA • REAL-TIME BATTLE
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Đấu Trường 1v1</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-[#5CE1E6] to-[#A855F7]">
                Speedcubing
              </span>
            </h1>
            <p className="text-sm text-white/55 mt-1.5 max-w-xl">
              Thách đấu trực tiếp cùng một công thức Scramble chuẩn WCA, đồng bộ hóa thời gian thực giữa 2 người chơi hoặc luyện phản xạ áp lực với Bot Sub-12.
            </p>
          </div>

          {/* Current Fighter Badge */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#0B1120]/90 border border-white/10 self-start md:self-auto">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00F0FF] to-[#0088FF] text-black font-black text-sm flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              {(user?.displayName || 'C')[0].toUpperCase()}
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">Tuyển thủ sẵn sàng</div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                {user?.displayName || 'Cubist'}
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Error Alert */}
        {(localError || error) && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 px-4 py-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-sm text-red-300"
          >
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{localError || error}</span>
          </motion.div>
        )}

        {/* Main 2-Column Battle Console */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: CREATE ROOM & FORMAT SELECTION (7 Cols) */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="lg:col-span-7 bg-[#0B1020]/85 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden group"
          >
            <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#00F0FF]/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#00F0FF]/15 border border-[#00F0FF]/30 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-[#00F0FF]" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white">Khởi Tạo Phòng Đấu Mới</h2>
                    <p className="text-xs text-white/45">Làm chủ phòng, chọn thể thức BO và mời đối thủ</p>
                  </div>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-white/60">
                  <Crown className="w-3.5 h-3.5 text-[#00F0FF]" /> HOST
                </span>
              </div>

              {/* BO Format Selector Cards */}
              <label className="text-xs font-mono uppercase tracking-wider text-white/45 mb-2.5 block">
                Chọn thể thức thi đấu (Best Of)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {BO_OPTIONS.map((opt) => {
                  const active = bestOf === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setBestOf(opt.value)}
                      className={`text-left p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                        active
                          ? 'bg-gradient-to-br from-[#00F0FF]/15 to-[#0088FF]/5 border-[#00F0FF] shadow-[0_0_25px_rgba(0,240,255,0.15)]'
                          : 'bg-white/[0.03] border-white/10 hover:border-white/25 hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-lg font-black font-mono ${
                            active ? 'text-[#00F0FF]' : 'text-white'
                          }`}
                        >
                          {opt.label}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            active
                              ? 'bg-[#00F0FF] text-black'
                              : 'bg-white/10 text-white/55'
                          }`}
                        >
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white/90 mb-0.5">{opt.title}</p>
                      <p className="text-[11px] text-white/45 leading-snug">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => handleCreate(false)}
                disabled={connectingMode !== null}
                className="flex-1 py-3.5 px-5 rounded-2xl font-black text-sm bg-gradient-to-r from-[#00F0FF] to-[#00B8FF] text-[#05080f] hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(0,240,255,0.25)] cursor-pointer"
              >
                {connectingMode === 'create' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Swords className="w-4 h-4" />
                    <span>Tạo Phòng Đấu ({`BO${bestOf}`})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleCreate(true)}
                disabled={connectingMode !== null}
                className="py-3.5 px-5 rounded-2xl font-bold text-sm bg-[#8A2BE2]/20 hover:bg-[#8A2BE2]/30 border border-[#8A2BE2]/40 text-purple-200 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {connectingMode === 'bot' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Bot className="w-4 h-4 text-purple-300" />
                    <span>Đấu Ngay Với Bot Sub-12</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* RIGHT: JOIN ROOM BY CODE (5 Cols) */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-5 bg-[#0B1020]/85 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-[#8A2BE2]/15 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-[#8A2BE2]/20 border border-[#8A2BE2]/40 flex items-center justify-center">
                  <LogIn className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white">Gia Nhập Phòng Đấu</h2>
                  <p className="text-xs text-white/45">Nhập hoặc dán mã phòng từ đối thủ của bạn</p>
                </div>
              </div>

              <label className="text-xs font-mono uppercase tracking-wider text-white/45 mb-2.5 block">
                Mã ghép trận (Hỗ trợ dán trực tiếp CX-XXXX)
              </label>

              {/* Room Code Input Box */}
              <div className="flex items-center gap-2 bg-[#060913] border-2 border-white/10 focus-within:border-[#00F0FF] rounded-2xl px-4 py-3.5 transition-all shadow-inner mb-3">
                <span className="text-lg font-mono font-black text-[#00F0FF] select-none">CX-</span>
                <input
                  type="text"
                  placeholder="XXXX"
                  value={joinCode}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pasted = e.clipboardData.getData('text');
                    setJoinCode(normalizeRoomCodeInput(pasted));
                    setLocalError('');
                  }}
                  onChange={(e) => {
                    setJoinCode(normalizeRoomCodeInput(e.target.value));
                    setLocalError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && joinCode.length === 4) {
                      handleJoin();
                    }
                  }}
                  className="flex-1 min-w-0 bg-transparent text-white font-mono font-black text-xl tracking-[0.25em] outline-none placeholder-white/20 uppercase"
                  maxLength={10}
                />
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/70 hover:text-[#00F0FF] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  title="Dán mã từ Clipboard"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>Dán mã</span>
                </button>
              </div>

              {/* Visual 4-slot indicator */}
              <div className="grid grid-cols-4 gap-2 mb-5">
                {[0, 1, 2, 3].map((idx) => {
                  const char = joinCode[idx] || '';
                  return (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all ${
                        char ? 'bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]' : 'bg-white/10'
                      }`}
                    />
                  );
                })}
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-xs text-white/50 leading-relaxed mb-4">
                💡 <strong className="text-white/80">Mẹo test nhanh 1v1:</strong> Bạn có thể mở thêm 1 tab trình duyệt thứ 2, dán mã phòng <span className="font-mono text-[#00F0FF]">CX-XXXX</span> vào đây để đấu trực tiếp giữa 2 tab thời gian thực.
              </div>
            </div>

            <button
              type="button"
              onClick={handleJoin}
              disabled={connectingMode !== null || joinCode.length < 4}
              className="w-full py-3.5 px-5 rounded-2xl font-black text-sm bg-white text-[#05080f] hover:bg-[#00F0FF] disabled:opacity-40 disabled:hover:bg-white flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {connectingMode === 'join' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Vào Phòng Đấu Ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.div>
        </div>

        {/* Bottom Arena Features Strip */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {[
            {
              icon: Timer,
              title: 'Bộ Bấm Giờ Chuẩn WCA',
              desc: 'Giữ Space khởi động, đếm ngược Inspection 15s, hỗ trợ phạt +2s và DNF.',
            },
            {
              icon: Zap,
              title: 'Đồng Bộ Scramble & Kết Quả',
              desc: 'Cả 2 tuyển thủ giải cùng một công thức xáo 20 bước kèm sơ đồ 2D trực quan.',
            },
            {
              icon: ShieldCheck,
              title: 'P2P Đa Tab & Bot Sub-12',
              desc: 'Tự động kết nối qua SignalR hoặc P2P giữa các tab, tích hợp Bot AI luyện tập.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="p-4 bg-[#0B1020]/60 border border-white/8 rounded-2xl flex items-start gap-3.5"
            >
              <div className="w-9 h-9 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-[#00F0FF]" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">{title}</h3>
                <p className="text-[11px] text-white/45 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
