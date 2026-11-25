'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useI18nStore } from '@/lib/store/useI18nStore';
import { useTimerStore } from '@/lib/store/useTimerStore';
import { useLearnProgressStore } from '@/lib/store/useLearnProgressStore';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { CubePlayground } from '@/components/3d/CubePlayground';
import { PerformanceAnalytics } from '@/components/analytics/PerformanceAnalytics';

/* ========================================================================= */
/* CONSTANTS & DATA FROM HOMEPAGE.HTML                                       */
/* ========================================================================= */

type FaceKey = 'U' | 'D' | 'F' | 'B' | 'R' | 'L';
type CubeState = Record<FaceKey, string[]>;

const FACE_COLORS: Record<FaceKey, string> = {
  U: '#f8fafc', // White
  D: '#facc15', // Yellow
  F: '#10b981', // Green
  B: '#00b4d8', // Cyan/Blue
  R: '#ef4444', // Red
  L: '#ff6b00', // Orange
};

function createSolvedCube(): CubeState {
  return {
    U: Array(9).fill(FACE_COLORS.U),
    D: Array(9).fill(FACE_COLORS.D),
    F: Array(9).fill(FACE_COLORS.F),
    B: Array(9).fill(FACE_COLORS.B),
    R: Array(9).fill(FACE_COLORS.R),
    L: Array(9).fill(FACE_COLORS.L),
  };
}

function rotateFaceCW(arr: string[]): string[] {
  return [arr[6], arr[3], arr[0], arr[7], arr[4], arr[1], arr[8], arr[5], arr[2]];
}

function applySingleMoveToState(prev: CubeState, move: string): CubeState {
  const next: CubeState = {
    U: [...prev.U],
    D: [...prev.D],
    F: [...prev.F],
    B: [...prev.B],
    R: [...prev.R],
    L: [...prev.L],
  };
  const base = move[0];
  const times = move.includes("'") ? 3 : move.includes('2') ? 2 : 1;

  for (let t = 0; t < times; t++) {
    if (base === 'U') {
      next.U = rotateFaceCW(next.U);
      const temp = [next.F[0], next.F[1], next.F[2]];
      [next.F[0], next.F[1], next.F[2]] = [next.R[0], next.R[1], next.R[2]];
      [next.R[0], next.R[1], next.R[2]] = [next.B[0], next.B[1], next.B[2]];
      [next.B[0], next.B[1], next.B[2]] = [next.L[0], next.L[1], next.L[2]];
      [next.L[0], next.L[1], next.L[2]] = temp;
    } else if (base === 'R') {
      next.R = rotateFaceCW(next.R);
      const temp = [next.U[2], next.U[5], next.U[8]];
      [next.U[2], next.U[5], next.U[8]] = [next.F[2], next.F[5], next.F[8]];
      [next.F[2], next.F[5], next.F[8]] = [next.D[2], next.D[5], next.D[8]];
      [next.D[2], next.D[5], next.D[8]] = [next.B[6], next.B[3], next.B[0]];
      [next.B[6], next.B[3], next.B[0]] = temp;
    } else if (base === 'F') {
      next.F = rotateFaceCW(next.F);
      const temp = [next.U[6], next.U[7], next.U[8]];
      [next.U[6], next.U[7], next.U[8]] = [next.L[8], next.L[5], next.L[2]];
      [next.L[8], next.L[5], next.L[2]] = [next.D[2], next.D[1], next.D[0]];
      [next.D[2], next.D[1], next.D[0]] = [next.R[0], next.R[3], next.R[6]];
      [next.R[0], next.R[3], next.R[6]] = temp;
    } else if (base === 'L') {
      next.L = rotateFaceCW(next.L);
      const temp = [next.U[0], next.U[3], next.U[6]];
      [next.U[0], next.U[3], next.U[6]] = [next.B[8], next.B[5], next.B[2]];
      [next.B[8], next.B[5], next.B[2]] = [next.D[0], next.D[3], next.D[6]];
      [next.D[0], next.D[3], next.D[6]] = [next.F[0], next.F[3], next.F[6]];
      [next.F[0], next.F[3], next.F[6]] = temp;
    }
  }
  return next;
}

type CourseKey = 'basic' | 'cross' | 'f2l' | 'oll' | 'pll';

interface CourseAlg {
  name: string;
  notation: string;
  moves: string[];
  tip: string;
}

interface CourseInfo {
  badge: string;
  badgeClass: string;
  title: string;
  desc: string;
  fullPageHref?: string;
  algs: CourseAlg[];
}

const COURSE_DATA: Record<CourseKey, CourseInfo> = {
  basic: {
    badge: 'CƠ BẢN • SUB-60S',
    badgeClass: 'bg-rubikGreen/15 text-rubikGreen border border-rubikGreen/30',
    title: 'Cơ Bản (Layer-by-Layer)',
    desc: 'Các công thức cốt lõi dễ thuộc nhất để giải hoàn chỉnh khối Rubik 3x3x3 từ tầng 1 đến tầng 3.',
    fullPageHref: '/learn/basic',
    algs: [
      { name: 'Sexy Move (Công thức tay phải)', notation: "R U R' U'", moves: ['R', 'U', "R'", "U'"], tip: 'Dùng để đưa góc tầng 1 và xoay góc tầng 3.' },
      { name: 'Chữ thập vàng (Tầng 3)', notation: "F R U R' U' F'", moves: ['F', 'R', 'U', "R'", "U'", "F'"], tip: 'Biến dấu chấm / chữ L / thanh ngang thành chữ thập vàng.' },
      { name: 'Sune (Lật mặt vàng)', notation: "R U R' U R U2 R'", moves: ['R', 'U', "R'", 'U', 'R', 'U', 'U', "R'"], tip: 'Hoàn thiện mặt vàng nhanh chóng ở tầng cuối.' },
    ],
  },
  cross: {
    badge: 'CFOP BƯỚC 1 • CROSS',
    badgeClass: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
    title: 'Cross (Chữ Thập Đáy Tối Ưu)',
    desc: 'Giải chữ thập trắng ở mặt đáy tối ưu trong 8 bước xoay trở xuống và luyện quan sát trước trong 15s Inspection.',
    fullPageHref: '/learn/cross',
    algs: [
      { name: 'Cạnh bị lật ngược (Flipped Edge)', notation: "F R' U' R F2", moves: ['F', "R'", "U'", 'R', 'F', 'F'], tip: 'Đưa cạnh trắng bị lật đúng hướng mà không phá cạnh đã làm.' },
      { name: 'Chèn 2 cạnh liên tiếp', notation: "R' F R", moves: ["R'", 'F', 'R'], tip: 'Tận dụng bước xoay mặt F để ghép đồng thời 2 cạnh đáy.' },
    ],
  },
  f2l: {
    badge: 'TRUNG CẤP • CFOP F2L',
    badgeClass: 'bg-neonCyan/15 text-neonCyan border border-neonCyan/30',
    title: 'F2L (First Two Layers — 41 Thế)',
    desc: 'Ghép cặp góc-cạnh để giải đồng thời tầng 1 và tầng 2, cắt giảm gần một nửa số bước xoay.',
    fullPageHref: '/learn/f2l',
    algs: [
      { name: 'F2L Cơ bản #1 (Chèn phải)', notation: "U R U' R'", moves: ['U', 'R', "U'", "R'"], tip: 'Đưa cặp góc-cạnh đã ghép sẵn vào khe phải.' },
      { name: 'F2L Cơ bản #2 (Chèn bằng mặt F)', notation: "F' U' F", moves: ["F'", "U'", 'F'], tip: 'Chèn cặp vào khe trước-phải không cần xoay khối.' },
      { name: 'F2L Tách cặp góc-cạnh', notation: "R U R' U' R U R'", moves: ['R', 'U', "R'", "U'", 'R', 'U', "R'"], tip: 'Tách cặp bị dính sai màu và chèn lại chính xác.' },
    ],
  },
  oll: {
    badge: 'CFOP BƯỚC 3 • OLL',
    badgeClass: 'bg-rubikYellow/15 text-rubikYellow border border-rubikYellow/30',
    title: 'OLL (Orientation of the Last Layer)',
    desc: 'Lật toàn bộ mặt vàng trong 1 hoặc 2 bước (2-Look OLL gồm 10 công thức nền tảng cho Sub-20s).',
    fullPageHref: '/learn/oll',
    algs: [
      { name: 'OLL 27 — Sune', notation: "R U R' U R U2 R'", moves: ['R', 'U', "R'", 'U', 'R', 'U', 'U', "R'"], tip: 'Nhận diện bằng 1 góc vàng đúng hướng ở góc trước-trái.' },
      { name: 'OLL 26 — Anti-Sune', notation: "R U2 R' U' R U' R'", moves: ['R', 'U', 'U', "R'", "U'", 'R', "U'", "R'"], tip: 'Thế đối xứng ngược lại của Sune.' },
      { name: 'OLL 45 — Chữ T (T-Shape)', notation: "F R U R' U' F'", moves: ['F', 'R', 'U', "R'", "U'", "F'"], tip: 'Công thức 6 bước siêu mượt tay.' },
    ],
  },
  pll: {
    badge: 'CFOP BƯỚC 4 • PLL',
    badgeClass: 'bg-electricPurple/20 text-purple-400 border border-electricPurple/35',
    title: 'PLL (Permutation of the Last Layer)',
    desc: 'Hoán vị các viên góc và cạnh tầng cuối để hoàn tất khối Rubik. Gồm 21 thế chuẩn tốc độ cao.',
    fullPageHref: '/learn/pll',
    algs: [
      { name: 'T-Perm (PLL kinh điển)', notation: "R U R' U' R' F R2 U' R' U' R U R' F'", moves: ['R', 'U', "R'", "U'", "R'", 'F', 'R', 'R', "U'", "R'", "U'", 'R', 'U', "R'", "F'"], tip: 'Đổi 2 góc phải và 2 cạnh đối diện cực nhanh.' },
      { name: 'Jb-Perm (Siêu tốc độ)', notation: "R U R' F' R U R' U' R' F R2 U' R'", moves: ['R', 'U', "R'", "F'", 'R', 'U', "R'", "U'", "R'", 'F', 'R', 'R', "U'", "R'"], tip: 'Một trong những PLL mượt và nhanh nhất.' },
      { name: 'Ua-Perm (Hoán vị 3 cạnh)', notation: "R U' R U R U R U' R' U' R2", moves: ['R', "U'", 'R', 'U', 'R', 'U', 'R', "U'", "R'", "U'", 'R', 'R'], tip: 'Thuật toán 2-gen chỉ dùng mặt R và U.' },
    ],
  },
};

const TRANSLATIONS = {
  VI: {
    nav_timer: 'Bấm Giờ (Timer)',
    nav_3d: 'Khối 3D Tương Tác',
    nav_stats: 'Thống Kê Hiệu Năng',
    nav_battle: 'Thi Đấu',
    nav_cms: 'Quản Trị CMS',
    nav_learn: 'Học',
    hero_badge: '⚡ Nền tảng Speedcubing thế hệ mới #1 Việt Nam',
    hero_title_1: 'Chinh Phục Tốc Độ &',
    hero_title_2: 'Nghệ Thuật',
    hero_subtitle:
      'Học thuật toán trực quan trên khối 3D tương tác, theo dõi tiến bộ hiệu năng chuyên sâu và thi đấu 1v1 thời gian thực cùng cộng đồng Speedcuber.',
    cta_timer: 'Mở Bấm Giờ (Timer)',
    cta_learn: 'Khám phá lộ trình',
  },
  EN: {
    nav_timer: 'WCA Timer',
    nav_3d: '3D Interactive Cube',
    nav_stats: 'Performance Stats',
    nav_battle: '1v1 Arena',
    nav_cms: 'CMS Admin',
    nav_learn: 'Learn',
    hero_badge: '⚡ Next-Gen Speedcubing Platform #1 in Vietnam',
    hero_title_1: 'Conquer Speed &',
    hero_title_2: 'The Art of',
    hero_subtitle:
      'Master algorithms visually on an interactive 3D cube, track deep performance analytics, and compete in real-time 1v1 speedcubing arenas.',
    cta_timer: 'Open WCA Timer',
    cta_learn: 'Explore Roadmap',
  },
};

interface ToastItem {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning';
}

type HomeViewMode = 'home' | 'admin' | '3d-lab' | 'analytics-detail';

/* ========================================================================= */
/* MAIN HOMEPAGE COMPONENT                                                   */
/* ========================================================================= */

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isAdmin, logout } = useAuthStore();
  const { lang: storeLang, toggleLang: toggleStoreLang } = useI18nStore();
  const { getBestSingle, getAo5, getAo12 } = useTimerStore();
  const { masteredByUser, getUserStats } = useLearnProgressStore();
  const learnStats = getUserStats(user?.id);
  void masteredByUser;

  // View mode inside the new Homepage layout (no old Hero banner!)
  const [viewMode, setViewMode] = useState<HomeViewMode>('home');

  useEffect(() => {
    const v = searchParams.get('view');
    if (v === 'admin') setViewMode('admin');
    else if (v === '3d-lab') setViewMode('3d-lab');
    else if (v === 'analytics') setViewMode('analytics-detail');
    else setViewMode('home');
  }, [searchParams]);

  // Sync with global i18n store ('vi' | 'en' -> 'VI' | 'EN')
  const langKey = storeLang === 'en' ? 'EN' : 'VI';
  const dict = TRANSLATIONS[langKey];

  // Computed live stats from useTimerStore (with fallback to homepage defaults)
  const bestSingleMs = getBestSingle();
  const ao5Ms = getAo5();
  const ao12Ms = getAo12();
  const pbDisplay = bestSingleMs && bestSingleMs > 0 ? `${(bestSingleMs / 1000).toFixed(2)}s` : '8.42s';
  const ao5Display = ao5Ms && ao5Ms > 0 ? `${(ao5Ms / 1000).toFixed(2)}s` : '10.18s';
  const ao12Display = ao12Ms && ao12Ms > 0 ? `${(ao12Ms / 1000).toFixed(2)}s` : '10.65s';

  // Dropdowns & Modals
  const [learnDropdownOpen, setLearnDropdownOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCourseModal, setActiveCourseModal] = useState<CourseKey | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdRef = useRef(0);

  // 3D Cube state
  const [cubeState, setCubeState] = useState<CubeState>(() => createSolvedCube());
  const [cubeStatus, setCubeStatus] = useState('Kéo để xoay 360°');
  const [cubePulse, setCubePulse] = useState(false);
  const [halfSize, setHalfSize] = useState(111);

  const cubeRef = useRef<HTMLDivElement>(null);
  const rotRef = useRef({ x: -24, y: -36 });
  const isDraggingRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const demoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Chart & Matchmaking state
  const [chartTooltip, setChartTooltip] = useState({ day: 'Hôm nay', timeVal: '10.18s' });
  const [isSearchingMatch, setIsSearchingMatch] = useState(false);
  const [matchmakingLabel, setMatchmakingLabel] = useState('Tìm đối thủ nhanh (Matchmaking)');

  const learnWrapperRef = useRef<HTMLDivElement>(null);
  const profileWrapperRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const closeDropdowns = useCallback(() => {
    setLearnDropdownOpen(false);
    setProfileMenuOpen(false);
  }, []);

  // Outside click for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        learnWrapperRef.current &&
        !learnWrapperRef.current.contains(target) &&
        (!profileWrapperRef.current || !profileWrapperRef.current.contains(target))
      ) {
        closeDropdowns();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [closeDropdowns]);

  // Measure cube halfSize on mount & resize
  const updateCubeSize = useCallback(() => {
    if (cubeRef.current) {
      setHalfSize(cubeRef.current.offsetWidth / 2);
    }
  }, [viewMode]);

  useEffect(() => {
    updateCubeSize();
    window.addEventListener('resize', updateCubeSize);
    return () => window.removeEventListener('resize', updateCubeSize);
  }, [updateCubeSize]);

  // Auto-rotate 3D cube
  useEffect(() => {
    const id = setInterval(() => {
      if (!isDraggingRef.current && cubeRef.current) {
        rotRef.current.y += 0.3;
        cubeRef.current.style.transform = `rotateX(${rotRef.current.x}deg) rotateY(${rotRef.current.y}deg)`;
      }
    }, 30);
    return () => clearInterval(id);
  }, []);

  // Cleanup demo interval
  useEffect(() => {
    return () => {
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    };
  }, []);

  const triggerPulse = () => {
    setCubePulse(false);
    requestAnimationFrame(() => setCubePulse(true));
  };

  const applyCubeMove = useCallback((move: string, customStatus?: string) => {
    setCubeState((prev) => applySingleMoveToState(prev, move));
    triggerPulse();
    setCubeStatus(customStatus || `Bước vừa xoay: ${move}`);
  }, []);

  const scramble3DCube = () => {
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    const moves = ['R', 'U', 'F', "R'", "U'", "F'", 'L'];
    setCubeState((prev) => {
      let cur = prev;
      for (let i = 0; i < 14; i++) {
        const mv = moves[Math.floor(Math.random() * moves.length)];
        cur = applySingleMoveToState(cur, mv);
      }
      return cur;
    });
    triggerPulse();
    setCubeStatus('Đã trộn khối 3D!');
    showToast('Đã trộn ngẫu nhiên khối Rubik 3D!', 'info');
  };

  const reset3DCube = () => {
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    setCubeState(createSolvedCube());
    rotRef.current = { x: -24, y: -36 };
    if (cubeRef.current) {
      cubeRef.current.style.transform = `rotateX(-24deg) rotateY(-36deg)`;
    }
    setCubeStatus('Đã đưa về trạng thái giải');
  };

  const runDemoAlgorithm = (name: string, movesArr: string[]) => {
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    showToast(`Đang chạy mô phỏng 3D: ${name}`, 'success');
    let idx = 0;
    demoIntervalRef.current = setInterval(() => {
      if (idx >= movesArr.length) {
        if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
        demoIntervalRef.current = null;
        setCubeStatus(`Hoàn tất: ${name}`);
        return;
      }
      const mv = movesArr[idx];
      applyCubeMove(mv, `${name} (${idx + 1}/${movesArr.length}): ${mv}`);
      rotRef.current.y += 12;
      if (cubeRef.current) {
        cubeRef.current.style.transform = `rotateX(${rotRef.current.x}deg) rotateY(${rotRef.current.y}deg)`;
      }
      idx++;
    }, 280);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    rotRef.current.y += (e.clientX - lastPointerRef.current.x) * 0.55;
    rotRef.current.x -= (e.clientY - lastPointerRef.current.y) * 0.55;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    if (cubeRef.current) {
      cubeRef.current.style.transform = `rotateX(${rotRef.current.x}deg) rotateY(${rotRef.current.y}deg)`;
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const toggleLanguage = () => {
    const nextIsVi = storeLang === 'en';
    toggleStoreLang();
    showToast(
      nextIsVi ? 'Đã chuyển ngôn ngữ sang Tiếng Việt (VI)' : 'Switched language to English (EN)',
      'info'
    );
  };

  const openCourseModal = (key: CourseKey) => {
    closeDropdowns();
    setActiveCourseModal(key);
  };

  const practiceAlgOn3D = (levelKey: CourseKey, algIndex: number) => {
    const alg = COURSE_DATA[levelKey].algs[algIndex];
    setActiveCourseModal(null);
    setViewMode('home');
    setTimeout(() => {
      document.getElementById('hero-3d')?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => runDemoAlgorithm(alg.name, alg.moves), 350);
    }, 100);
  };

  const joinLiveRoom = (roomName: string) => {
    showToast(`Đang vào "${roomName}" — Chuẩn bị nhận Scramble chung!`, 'success');
    setTimeout(() => {
      router.push('/match');
    }, 800);
  };

  const startMatchmaking = () => {
    if (isSearchingMatch) return;
    setIsSearchingMatch(true);
    setMatchmakingLabel('Đang tìm đối thủ ELO tương đương...');
    showToast('Đang quét hàng chờ 1v1 (Sub-12)...', 'info');

    setTimeout(() => {
      setIsSearchingMatch(false);
      setMatchmakingLabel('Tìm đối thủ nhanh (Matchmaking)');
      showToast('Đã tìm thấy đối thủ: QuangMinh_3x3 (Ao5: 10.45s) — Sẵn sàng đấu!', 'success');
      setTimeout(() => {
        router.push('/match');
      }, 900);
    }, 2000);
  };

  const goToSection = (sectionId: string) => {
    if (viewMode !== 'home') {
      setViewMode('home');
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const faceTransforms: Record<FaceKey, string> = {
    F: `rotateY(0deg) translateZ(${halfSize}px)`,
    B: `rotateY(180deg) translateZ(${halfSize}px)`,
    R: `rotateY(90deg) translateZ(${halfSize}px)`,
    L: `rotateY(-90deg) translateZ(${halfSize}px)`,
    U: `rotateX(90deg) translateZ(${halfSize}px)`,
    D: `rotateX(-90deg) translateZ(${halfSize}px)`,
  };

  const currentUserName = isAuthenticated && user ? user.displayName : 'Minh Speedcuber';
  const currentUserInitial = currentUserName[0]?.toUpperCase() || 'M';

  return (
    <div className="min-h-screen bg-obsidian text-slate-100 font-sans relative selection:bg-neonCyan/30 selection:text-neonCyan flex flex-col justify-between">
      {/* Ambient Background Grid & Glows */}
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none z-0" />
      <div className="fixed top-[-14%] left-[-8%] w-[500px] h-[500px] bg-neonCyan/10 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="fixed top-[22%] right-[-8%] w-[460px] h-[460px] bg-electricPurple/12 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[28%] w-[480px] h-[480px] bg-neonCyan/5 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* ===================================================================== */}
      {/* 1. NAVIGATION BAR                                                     */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-50 w-full bg-[#06090f]/85 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Left: CUBEX Brand Logo */}
          <button
            type="button"
            onClick={() => goToSection('hero-3d')}
            className="flex items-center gap-3.5 shrink-0 group text-left"
          >
            <div className="p-[2px] rounded-xl bg-gradient-to-br from-neonCyan via-sky-500 to-electricPurple shadow-cyan-glow group-hover:scale-105 transition-transform">
              <div className="w-10 h-10 bg-[#070b13] rounded-[10px] p-2 grid grid-cols-2 grid-rows-2 gap-1">
                <span className="rounded-[3px] bg-[#00e5ff]" />
                <span className="rounded-[3px] bg-[#ff6b00]" />
                <span className="rounded-[3px] bg-[#10b981]" />
                <span className="rounded-[3px] bg-[#facc15]" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-xl font-extrabold tracking-tight text-white">CUBEX</span>
                <span className="w-2 h-2 rounded-full bg-neonCyan shadow-[0_0_10px_#00e5ff]" />
              </div>
              <span className="font-mono text-[9.5px] font-medium tracking-[0.22em] text-slate-400 mt-1 uppercase">
                THE ART OF SPEEDCUBING
              </span>
            </div>
          </button>

          {/* Center: Dark Pill Menu (Desktop) */}
          <nav className="hidden lg:flex items-center bg-[#0b0f18]/90 border border-white/[0.09] rounded-full p-1.5 shadow-lg gap-0.5 shrink-0">
            <Link
              href="/timer"
              className="whitespace-nowrap shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full text-xs xl:text-sm font-medium text-slate-300 hover:text-white hover:bg-white/[0.05] transition-all"
            >
              <svg className="w-4 h-4 text-neonCyan shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="13" r="8" />
                <path d="M12 9v4l2 2" />
                <path d="M5 3 2 6" />
                <path d="m22 6-3-3" />
                <path d="M10 2h4" />
              </svg>
              <span>{dict.nav_timer}</span>
            </Link>

            <button
              type="button"
              onClick={() => goToSection('hero-3d')}
              className={`whitespace-nowrap shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full text-xs xl:text-sm transition-all ${
                viewMode === 'home' || viewMode === '3d-lab'
                  ? 'font-semibold bg-[#1a2232] text-white border border-white/10 shadow-sm'
                  : 'font-medium text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <svg className="w-4 h-4 text-neonCyan shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
                <path d="M12 22V12" />
              </svg>
              <span>{dict.nav_3d}</span>
            </button>

            <button
              type="button"
              onClick={() => goToSection('performance-section')}
              className={`whitespace-nowrap shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full text-xs xl:text-sm transition-all ${
                viewMode === 'analytics-detail'
                  ? 'font-semibold bg-[#1a2232] text-white border border-white/10 shadow-sm'
                  : 'font-medium text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="M18 17V9" />
                <path d="M13 17V5" />
                <path d="M8 17v-3" />
              </svg>
              <span>{dict.nav_stats}</span>
            </button>

            <Link
              href="/match"
              className="whitespace-nowrap shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full text-xs xl:text-sm font-medium text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
                <line x1="13" y1="19" x2="19" y2="13" />
                <line x1="16" y1="16" x2="20" y2="20" />
                <line x1="19" y1="21" x2="21" y2="19" />
                <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
                <line x1="5" y1="14" x2="9" y2="18" />
                <line x1="7" y1="17" x2="4" y2="20" />
                <line x1="3" y1="19" x2="5" y2="21" />
              </svg>
              <span>{dict.nav_battle}</span>
            </Link>

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setViewMode('admin');
                  showToast('Đang mở Quản Trị CMS (Quyền Admin)', 'info');
                }}
                className={`whitespace-nowrap shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full text-xs xl:text-sm transition-all ${
                  viewMode === 'admin'
                    ? 'font-semibold bg-[#1a2232] text-amber-400 border border-amber-500/30 shadow-sm'
                    : 'font-medium text-amber-400 hover:text-white hover:bg-amber-500/10'
                }`}
              >
                <svg className="w-4 h-4 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                </svg>
                <span>{dict.nav_cms}</span>
              </button>
            )}

            {/* Dropdown: Học (Exact 5 items: Cơ bản, Cross, F2L, OLL, PLL) */}
            <div className="relative shrink-0" ref={learnWrapperRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setProfileMenuOpen(false);
                  setLearnDropdownOpen((v) => !v);
                }}
                className="whitespace-nowrap shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs xl:text-sm font-medium text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
                  <path d="M22 10v6" />
                  <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
                </svg>
                <span>{dict.nav_learn}</span>
                <svg
                  className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${learnDropdownOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {learnDropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-[#0d121d]/95 backdrop-blur-xl border border-white/10 shadow-2xl p-2 z-50">
                  <Link
                    href="/learn/basic"
                    onClick={closeDropdowns}
                    className="w-full text-left flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-rubikGreen/15 text-rubikGreen flex items-center justify-center font-mono font-bold text-xs">
                      CB
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-neonCyan transition-colors">Cơ bản</div>
                      <div className="text-xs text-slate-400">Layer-by-Layer • Sub-60s</div>
                    </div>
                  </Link>
                  <Link
                    href="/learn/cross"
                    onClick={closeDropdowns}
                    className="w-full text-left flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center font-mono font-bold text-xs">
                      +
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-neonCyan transition-colors">Cross</div>
                      <div className="text-xs text-slate-400">Tối ưu chữ thập ≤ 8 bước</div>
                    </div>
                  </Link>
                  <Link
                    href="/learn/f2l"
                    onClick={closeDropdowns}
                    className="w-full text-left flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-neonCyan/15 text-neonCyan flex items-center justify-center font-mono font-bold text-xs">
                      F2L
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-neonCyan transition-colors">F2L</div>
                      <div className="text-xs text-slate-400">41 thế giải 2 tầng đầu</div>
                    </div>
                  </Link>
                  <Link
                    href="/learn/oll"
                    onClick={closeDropdowns}
                    className="w-full text-left flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-rubikYellow/15 text-rubikYellow flex items-center justify-center font-mono font-bold text-xs">
                      OLL
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-neonCyan transition-colors">OLL</div>
                      <div className="text-xs text-slate-400">Lật mặt vàng (2-Look & Full)</div>
                    </div>
                  </Link>
                  <Link
                    href="/learn/pll"
                    onClick={closeDropdowns}
                    className="w-full text-left flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-electricPurple/20 text-purple-400 flex items-center justify-center font-mono font-bold text-xs">
                      PLL
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-neonCyan transition-colors">PLL</div>
                      <div className="text-xs text-slate-400">Hoán vị tầng cuối (21 thế)</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* Right: Language Toggle & Profile Pill */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#0b0f18] border border-white/[0.09] hover:border-neonCyan/50 transition-all text-sm font-bold text-white"
            >
              <svg className="w-4 h-4 text-neonCyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
              <span>{langKey}</span>
            </button>

            {/* Profile Pill or Login */}
            {isAuthenticated && user ? (
              <div className="relative hidden sm:block shrink-0" ref={profileWrapperRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLearnDropdownOpen(false);
                    setProfileMenuOpen((v) => !v);
                  }}
                  className="whitespace-nowrap flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-full bg-[#0b0f18] border border-white/[0.09] hover:border-electricPurple/50 transition-all"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={currentUserName}
                      className="w-7 h-7 rounded-full object-cover border border-neonCyan/40 bg-slate-800 shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neonCyan to-electricPurple flex items-center justify-center text-[#06090f] font-extrabold text-xs shrink-0">
                      {currentUserInitial}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-white">{currentUserName}</span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isAdmin
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-neonCyan/15 text-neonCyan border border-neonCyan/25'
                    }`}
                  >
                    {isAdmin ? 'ADMIN' : 'MEMBER'}
                  </span>
                  <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-[#0d121d]/95 backdrop-blur-xl border border-white/10 shadow-2xl p-2 z-50">
                    <div className="px-3 py-2.5 border-b border-white/[0.07] flex items-center gap-3">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={currentUserName}
                          className="w-10 h-10 rounded-full object-cover border border-neonCyan/40 bg-slate-800 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neonCyan to-electricPurple flex items-center justify-center text-[#06090f] font-extrabold text-sm shrink-0">
                          {currentUserInitial}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white truncate">{currentUserName}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        <p className="text-[11px] font-semibold text-neonCyan mt-0.5">
                          {isAdmin ? 'Quản Trị Viên' : 'Thành Viên • Sub-12'}
                          {(user.authProvider === 'Google' || user.googleUid) ? ' • Google' : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        closeDropdowns();
                        goToSection('performance-section');
                      }}
                      className="w-full text-left block px-3 py-2 text-sm text-slate-200 hover:bg-white/[0.06] rounded-xl mt-1"
                    >
                      Thống kê hiệu năng
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        closeDropdowns();
                        goToSection('roadmap-section');
                      }}
                      className="w-full text-left block px-3 py-2 text-sm text-slate-200 hover:bg-white/[0.06] rounded-xl"
                    >
                      Tiến độ học ({learnStats.overallPercent}%)
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          closeDropdowns();
                          setViewMode('admin');
                        }}
                        className="w-full text-left block px-3 py-2 text-sm text-amber-400 font-semibold hover:bg-amber-500/10 rounded-xl"
                      >
                        Quản trị CMS (Admin)
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        showToast(`Đã đồng bộ hồ sơ ${currentUserName} lên Cloud!`, 'success');
                        closeDropdowns();
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-white/[0.06] rounded-xl"
                    >
                      Đồng bộ Cloud
                    </button>
                    <Link
                      href="/login"
                      onClick={closeDropdowns}
                      className="w-full text-left block px-3 py-2 text-sm text-neonCyan font-semibold hover:bg-white/[0.06] rounded-xl"
                    >
                      Đổi tài khoản / Đăng nhập
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        closeDropdowns();
                        router.push('/login');
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-xl mt-1 border-t border-white/[0.06]"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex px-4 py-2 rounded-full bg-neonCyan text-[#06090f] font-bold text-xs hover:bg-[#33ecff] transition-all shadow-cyan-glow"
              >
                Đăng nhập
              </Link>
            )}

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="xl:hidden p-2.5 rounded-xl bg-[#0b0f18] border border-white/10 text-slate-300 hover:text-neonCyan"
              aria-label="Menu"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-white/[0.08] bg-[#080c15]/95 backdrop-blur-xl px-4 pt-3 pb-5 space-y-1.5">
            <Link
              href="/timer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#1a2232] text-white font-semibold text-sm"
            >
              <span className="w-2 h-2 rounded-full bg-neonCyan" /> Bấm Giờ (Timer)
            </Link>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                goToSection('hero-3d');
              }}
              className="w-full text-left block px-4 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 text-sm font-medium"
            >
              Khối 3D Tương Tác
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                goToSection('performance-section');
              }}
              className="w-full text-left block px-4 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 text-sm font-medium"
            >
              Thống Kê Hiệu Năng
            </button>
            <Link
              href="/match"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-left block px-4 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 text-sm font-medium"
            >
              Thi Đấu 1v1
            </Link>
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setViewMode('admin');
                  showToast('Đang mở Quản Trị CMS', 'info');
                }}
                className="w-full text-left block px-4 py-2.5 rounded-xl text-amber-400 hover:bg-amber-500/10 text-sm font-semibold"
              >
                Quản Trị CMS (Admin)
              </button>
            )}

            <div className="pt-2 pb-1 px-4 text-[11px] font-mono uppercase tracking-wider text-slate-500">Học Rubik</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 px-2">
              <Link
                href="/learn/basic"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-neonCyan/15 text-slate-200 hover:text-neonCyan text-xs font-semibold text-left"
              >
                Cơ bản
              </Link>
              {(['cross', 'f2l', 'oll', 'pll'] as const).map((k) => (
                <Link
                  key={k}
                  href={`/learn/${k}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-neonCyan/15 text-slate-200 hover:text-neonCyan text-xs font-semibold text-left"
                >
                  {k === 'cross' ? 'Cross' : k.toUpperCase()}
                </Link>
              ))}
            </div>

            <div className="pt-3 mt-2 border-t border-white/10 flex items-center justify-between gap-3 px-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neonCyan to-electricPurple flex items-center justify-center text-[#06090f] font-extrabold text-xs">
                  {currentUserInitial}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{currentUserName}</div>
                  <div className="text-xs text-neonCyan font-mono">
                    PB: {pbDisplay} • Ao5: {ao5Display}
                  </div>
                </div>
              </div>
              {!isAuthenticated && (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-neonCyan text-[#06090f] font-bold text-xs"
                >
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ===================================================================== */}
      {/* MAIN CONTENT                                                          */}
      {/* ===================================================================== */}
      {viewMode === 'admin' ? (
        <main className="relative z-10 flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="font-mono text-xs font-semibold tracking-widest text-neonCyan uppercase mb-1">CMS ADMINISTRATION</div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Hệ Thống Quản Trị CUBEX</h2>
            </div>
            <button
              type="button"
              onClick={() => setViewMode('home')}
              className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-all"
            >
              ← Quay lại Trang Chủ
            </button>
          </div>
          <AdminDashboard />
        </main>
      ) : viewMode === '3d-lab' ? (
        <main className="relative z-10 flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="font-mono text-xs font-semibold tracking-widest text-neonCyan uppercase mb-1">3D INTERACTIVE LAB</div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Phòng Mô Phỏng 3D Chuyên Sâu</h2>
            </div>
            <button
              type="button"
              onClick={() => setViewMode('home')}
              className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-all"
            >
              ← Quay lại Trang Chủ
            </button>
          </div>
          <CubePlayground />
        </main>
      ) : viewMode === 'analytics-detail' ? (
        <main className="relative z-10 flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="font-mono text-xs font-semibold tracking-widest text-neonCyan uppercase mb-1">PERFORMANCE ANALYTICS</div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Phân Tích Hiệu Năng Chi Tiết</h2>
            </div>
            <button
              type="button"
              onClick={() => setViewMode('home')}
              className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-all"
            >
              ← Quay lại Trang Chủ
            </button>
          </div>
          <PerformanceAnalytics />
        </main>
      ) : (
        <main className="relative z-10">
          {/* ================================================================= */}
          {/* 2. HERO SECTION & INTERACTIVE 3D RUBIK'S CUBE (#hero-3d)          */}
          {/* ================================================================= */}
          <section id="hero-3d" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 lg:pt-16 lg:pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
              {/* Left Column: Headline, Description, CTAs & Quick Metrics */}
              <div className="lg:col-span-6 space-y-7">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neonCyan/10 border border-neonCyan/30 text-neonCyan text-xs sm:text-sm font-semibold shadow-[0_0_20px_rgba(0,229,255,0.14)]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neonCyan opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-neonCyan" />
                  </span>
                  <span>{dict.hero_badge}</span>
                </div>

                <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.12] text-white">
                  <span>{dict.hero_title_1}</span>
                  <br />
                  <span>{dict.hero_title_2} </span>
                  <span className="bg-gradient-to-r from-neonCyan via-sky-400 to-electricPurple bg-clip-text text-transparent">
                    Rubik.
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl">{dict.hero_subtitle}</p>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <Link
                    href="/timer"
                    className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-neonCyan hover:bg-[#33ecff] text-[#06090f] font-bold text-sm sm:text-base shadow-cyan-glow hover:shadow-cyan-glow-lg transition-all active:scale-95"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <circle cx="12" cy="13" r="8" />
                      <path d="M12 9v4l2 2" />
                      <path d="M10 2h4" />
                    </svg>
                    <span>{dict.cta_timer}</span>
                  </Link>

                  <a
                    href="#roadmap-section"
                    className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-white/25 text-white font-semibold text-sm sm:text-base backdrop-blur-md transition-all active:scale-95"
                  >
                    <svg className="w-5 h-5 text-electricPurple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                    <span>{dict.cta_learn}</span>
                  </a>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/[0.08] max-w-xl">
                  <div>
                    <div className="font-mono text-xl sm:text-2xl font-extrabold text-white">50,000+</div>
                    <div className="text-xs text-slate-400 mt-0.5">Lượt giải mỗi ngày</div>
                  </div>
                  <div>
                    <div className="font-mono text-xl sm:text-2xl font-extrabold text-neonCyan">120+</div>
                    <div className="text-xs text-slate-400 mt-0.5">Thuật toán CFOP 3D</div>
                  </div>
                  <div>
                    <div className="font-mono text-xl sm:text-2xl font-extrabold text-purple-400">128+</div>
                    <div className="text-xs text-slate-400 mt-0.5">Cuber đấu Live 1v1</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive 3D Cube HUD */}
              <div className="lg:col-span-6">
                <div className="glass-card rounded-3xl p-5 sm:p-7 relative overflow-hidden border-white/10 shadow-2xl">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4 relative z-20">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rubikGreen shadow-[0_0_8px_#10b981]" />
                      <span className="font-mono text-xs tracking-wider text-slate-300 uppercase">3D CUBE ENGINE • INTERACTIVE</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-3 py-1 rounded-lg bg-white/[0.06] border border-white/10 text-neonCyan">
                        {cubeStatus}
                      </span>
                      <button
                        type="button"
                        onClick={() => setViewMode('3d-lab')}
                        className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-electricPurple/20 hover:bg-electricPurple/30 border border-electricPurple/40 text-purple-300 transition-colors"
                        title="Mở phòng Lab 3D Three.js chuyên sâu"
                      >
                        3D Lab →
                      </button>
                    </div>
                  </div>

                  {/* Floating Telemetry Pills */}
                  <div className="hidden sm:flex animate-float absolute top-20 left-5 z-20 items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#090e18]/90 border border-neonCyan/30 backdrop-blur-md shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-neonCyan" />
                    <div>
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Personal Best</div>
                      <div className="font-mono text-sm font-bold text-white">PB: {pbDisplay}</div>
                    </div>
                  </div>

                  <div className="hidden sm:flex animate-float-delayed absolute top-24 right-5 z-20 items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#090e18]/90 border border-electricPurple/35 backdrop-blur-md shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-electricPurple" />
                    <div>
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Current Avg</div>
                      <div className="font-mono text-sm font-bold text-white">Ao5: {ao5Display}</div>
                    </div>
                  </div>

                  {/* 3D Stage */}
                  <div
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    className="cube-scene relative h-[300px] sm:h-[340px] flex items-center justify-center cursor-grab active:cursor-grabbing"
                  >
                    <div className="absolute w-64 h-64 rounded-full bg-gradient-to-tr from-neonCyan/15 via-transparent to-electricPurple/15 blur-2xl pointer-events-none" />
                    <div
                      ref={cubeRef}
                      className={`cube-3d ${cubePulse ? 'cube-pulse' : ''}`}
                      style={{ transform: `rotateX(${rotRef.current.x}deg) rotateY(${rotRef.current.y}deg)` }}
                    >
                      {(['F', 'B', 'R', 'L', 'U', 'D'] as FaceKey[]).map((face) => (
                        <div key={face} className="cube-face" style={{ transform: faceTransforms[face] }}>
                          {cubeState[face].map((color, idx) => (
                            <div key={idx} className="sticker" style={{ backgroundColor: color }} />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Move Controls */}
                  <div className="mt-4 pt-4 border-t border-white/[0.08] relative z-20">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(['R', 'U', 'F'] as const).map((mv) => (
                          <button
                            key={mv}
                            type="button"
                            onClick={() => applyCubeMove(mv)}
                            className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-neonCyan/20 hover:text-neonCyan border border-white/10 font-mono text-xs font-bold transition-all active:scale-95"
                          >
                            {mv}
                          </button>
                        ))}
                        {(["R'", "U'"] as const).map((mv) => (
                          <button
                            key={mv}
                            type="button"
                            onClick={() => applyCubeMove(mv)}
                            className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-electricPurple/20 hover:text-purple-300 border border-white/10 font-mono text-xs font-bold transition-all active:scale-95"
                          >
                            {mv}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={scramble3DCube}
                          className="px-3.5 py-1.5 rounded-xl bg-neonCyan/15 hover:bg-neonCyan/25 text-neonCyan border border-neonCyan/30 font-mono text-xs font-bold transition-all active:scale-95"
                        >
                          Scramble
                        </button>
                        <button
                          type="button"
                          onClick={reset3DCube}
                          className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-slate-300 border border-white/10 font-mono text-xs font-semibold transition-all active:scale-95"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ================================================================= */}
          {/* 3. LEARNING ROADMAP (#roadmap-section) — EXACTLY 2 CARDS          */}
          {/* ================================================================= */}
          <section id="roadmap-section" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="mb-8">
              <div className="font-mono text-xs font-semibold tracking-widest text-purple-400 uppercase mb-2">LEARNING ROADMAP</div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">Lộ Trình Học Rubik Bài Bản</h2>
            </div>

            {/* Personalized Progress Banner */}
            <div className="glass-card rounded-3xl p-5 sm:p-6 mb-8 border-neonCyan/25 bg-gradient-to-r from-[#0d1526]/90 via-[#0e1324]/90 to-[#16122b]/90 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neonCyan/20 to-electricPurple/20 border border-neonCyan/30 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-neonCyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4" />
                    <path d="m16.2 7.8 2.9-2.9" />
                    <path d="M18 12h4" />
                    <path d="m16.2 16.2 2.9 2.9" />
                    <path d="M12 18v4" />
                    <path d="m4.9 19.1 2.9-2.9" />
                    <path d="M2 12h4" />
                    <path d="m4.9 4.9 2.9 2.9" />
                  </svg>
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-neonCyan/15 text-neonCyan border border-neonCyan/30 uppercase">
                      {currentUserName}
                    </span>
                    <span className="text-xs text-slate-400">
                      {learnStats.totalLearned === 0
                        ? 'Chưa bắt đầu học công thức nào'
                        : `Đã thuộc ${learnStats.totalLearned}/${learnStats.totalCases} công thức CFOP`}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Tiến độ học CFOP:{' '}
                    <span className="text-neonCyan">
                      {learnStats.totalLearned}/{learnStats.totalCases} công thức ({learnStats.overallPercent}%)
                    </span>
                  </h3>
                  <div className="w-full sm:w-96 h-2.5 rounded-full bg-white/[0.08] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-neonCyan to-electricPurple shadow-[0_0_12px_rgba(0,229,255,0.6)] transition-all duration-500"
                      style={{ width: `${learnStats.overallPercent}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => openCourseModal('pll')}
                  className="px-4 py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white font-semibold text-xs sm:text-sm transition-all"
                >
                  Xem nhanh 3D
                </button>
                <Link
                  href="/learn/pll"
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-neonCyan to-sky-400 hover:brightness-110 text-[#06090f] font-bold text-sm shadow-cyan-glow transition-all active:scale-95"
                >
                  Luyện tập ngay →
                </Link>
              </div>
            </div>

            {/* 2 Balanced Level Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 01: Cơ Bản */}
              <Link
                href="/learn/basic"
                className="glass-card glass-card-hover rounded-3xl p-7 sm:p-8 cursor-pointer flex flex-col justify-between group border-rubikGreen/20"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="px-3.5 py-1.5 rounded-xl bg-rubikGreen/15 text-rubikGreen border border-rubikGreen/30 font-mono text-xs font-bold">
                      Mục tiêu: Sub-60s
                    </span>
                    <span className="font-mono text-sm font-bold text-slate-500">01</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-neonCyan transition-colors mb-3">
                    Cơ Bản (Layer-by-Layer)
                  </h3>
                  <p className="text-sm sm:text-base text-slate-400 leading-relaxed mb-6">
                    Nắm vững phương pháp giải từng tầng với 7 bài học trực quan 3D, dễ nhớ và cực kỳ thân thiện cho người mới bắt đầu.
                  </p>
                </div>
                <div className="pt-5 border-t border-white/[0.08] flex items-center justify-between text-sm font-semibold">
                  <span className="text-slate-300 font-mono">7 bước giải & Ký hiệu 3D</span>
                  <span className="text-neonCyan group-hover:translate-x-1 transition-transform">Vào bài học →</span>
                </div>
              </Link>

              {/* Card 02: Trung Cấp */}
              <div
                onClick={() => openCourseModal('f2l')}
                className="glass-card glass-card-hover rounded-3xl p-7 sm:p-8 cursor-pointer flex flex-col justify-between group border-neonCyan/25"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="px-3.5 py-1.5 rounded-xl bg-neonCyan/15 text-neonCyan border border-neonCyan/30 font-mono text-xs font-bold">
                      Mục tiêu: Sub-20s
                    </span>
                    <span className="font-mono text-sm font-bold text-slate-500">02</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-neonCyan transition-colors mb-3">
                    Trung Cấp (CFOP - Cross, F2L & 2-Look)
                  </h3>
                  <p className="text-sm sm:text-base text-slate-400 leading-relaxed mb-6">
                    Làm chủ kỹ thuật Cross tối ưu, 41 thế F2L trực giác kết hợp 2-Look OLL/PLL giúp cắt giảm một nửa số bước xoay.
                  </p>
                </div>
                <div className="pt-5 border-t border-white/[0.08] flex items-center justify-between text-sm font-semibold">
                  <span className="text-slate-300 font-mono">41 thế F2L & 2-Look OLL/PLL</span>
                  <span className="text-neonCyan group-hover:translate-x-1 transition-transform">Xem công thức →</span>
                </div>
              </div>
            </div>
          </section>

          {/* ================================================================= */}
          {/* 4. PERFORMANCE & ARENA (#performance-section) — CLEAN 2-COL GRID  */}
          {/* ================================================================= */}
          <section id="performance-section" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="mb-8">
              <div className="font-mono text-xs font-semibold tracking-widest text-neonCyan uppercase mb-2">PERFORMANCE & ARENA</div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">Hiệu Năng & Thi Đấu Cộng Đồng</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left Column (lg:col-span-7): Thống Kê Hiệu Năng */}
              <div className="lg:col-span-7 rounded-3xl bg-[#0d111a]/90 border border-white/10 p-6 sm:p-8 flex flex-col justify-between shadow-2xl">
                {/* Top Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">Thống Kê Hiệu Năng</h3>
                    <p className="text-sm text-slate-400 mt-1">Biểu đồ tiến bộ 3x3x3 (30 ngày gần nhất)</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewMode('analytics-detail')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-slate-300 font-mono text-xs font-semibold transition-all"
                    >
                      Chi tiết
                    </button>
                    <Link
                      href="/timer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neonCyan/10 hover:bg-neonCyan/20 border border-neonCyan/30 text-neonCyan font-mono text-xs font-bold transition-all"
                    >
                      Vào bấm giờ →
                    </Link>
                  </div>
                </div>

                {/* KPI Row: EXACTLY 3 BOXES */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4 my-6 w-full">
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                    <div className="text-[11px] sm:text-xs font-mono uppercase tracking-wider text-slate-400">SINGLE BEST</div>
                    <div className="text-xl sm:text-2xl font-mono font-bold text-cyan-400 whitespace-nowrap mt-1.5">{pbDisplay}</div>
                  </div>
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                    <div className="text-[11px] sm:text-xs font-mono uppercase tracking-wider text-slate-400">CURRENT AO5</div>
                    <div className="text-xl sm:text-2xl font-mono font-bold text-white whitespace-nowrap mt-1.5">{ao5Display}</div>
                  </div>
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                    <div className="text-[11px] sm:text-xs font-mono uppercase tracking-wider text-slate-400">CURRENT AO12</div>
                    <div className="text-xl sm:text-2xl font-mono font-bold text-purple-400 whitespace-nowrap mt-1.5">{ao12Display}</div>
                  </div>
                </div>

                {/* Interactive Ao5 Progress Chart */}
                <div className="relative w-full h-56 sm:h-64 bg-[#070a10] border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[11px] text-slate-500 uppercase tracking-wider">Xu hướng Ao5 (giây)</span>
                    <div className="px-3 py-1 rounded-lg bg-[#0d121d] border border-neonCyan/30 font-mono text-xs text-slate-200 shadow-lg">
                      <span className="text-slate-400">{chartTooltip.day}: </span>
                      <span className="text-neonCyan font-bold">{chartTooltip.timeVal}</span>
                    </div>
                  </div>

                  <div className="relative flex-1 w-full min-h-0">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 600 180" preserveAspectRatio="xMidYMid meet">
                      <defs>
                        <linearGradient id="ao5AreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.30" />
                          <stop offset="65%" stopColor="#8b5cf6" stopOpacity="0.10" />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="ao5LineGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#00e5ff" />
                        </linearGradient>
                      </defs>

                      <g stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4">
                        <line x1="42" y1="18" x2="585" y2="18" />
                        <line x1="42" y1="62" x2="585" y2="62" />
                        <line x1="42" y1="106" x2="585" y2="106" />
                        <line x1="42" y1="150" x2="585" y2="150" />
                      </g>

                      <g fill="#64748b" fontFamily="JetBrains Mono, monospace" fontSize="11">
                        <text x="2" y="22">16s</text>
                        <text x="2" y="66">14s</text>
                        <text x="2" y="110">12s</text>
                        <text x="2" y="154">10s</text>
                      </g>

                      <path
                        d="M 55 31 L 142 54 L 229 73 L 316 95 L 403 116 L 490 132 L 575 146 L 575 156 L 55 156 Z"
                        fill="url(#ao5AreaGrad)"
                      />

                      <path
                        d="M 55 31 L 142 54 L 229 73 L 316 95 L 403 116 L 490 132 L 575 146"
                        fill="none"
                        stroke="url(#ao5LineGrad)"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      <g>
                        {[
                          { cx: 55, cy: 31, r: 5.5, fill: '#070a10', stroke: '#8b5cf6', sw: 3, day: 'Ngày 1', val: '15.40s' },
                          { cx: 142, cy: 54, r: 5.5, fill: '#070a10', stroke: '#7c73f7', sw: 3, day: 'Ngày 5', val: '14.35s' },
                          { cx: 229, cy: 73, r: 5.5, fill: '#070a10', stroke: '#638ef9', sw: 3, day: 'Ngày 10', val: '13.50s' },
                          { cx: 316, cy: 95, r: 5.5, fill: '#070a10', stroke: '#46aafb', sw: 3, day: 'Ngày 15', val: '12.52s' },
                          { cx: 403, cy: 116, r: 5.5, fill: '#070a10', stroke: '#29c4fd', sw: 3, day: 'Ngày 20', val: '11.55s' },
                          { cx: 490, cy: 132, r: 5.5, fill: '#070a10', stroke: '#12d9fe', sw: 3, day: 'Ngày 25', val: '10.82s' },
                          { cx: 575, cy: 146, r: 6.5, fill: '#00e5ff', stroke: '#ffffff', sw: 2.5, day: 'Hôm nay', val: ao5Display },
                        ].map((pt, i) => (
                          <circle
                            key={i}
                            cx={pt.cx}
                            cy={pt.cy}
                            r={pt.r}
                            fill={pt.fill}
                            stroke={pt.stroke}
                            strokeWidth={pt.sw}
                            className="cursor-pointer"
                            onMouseEnter={() => setChartTooltip({ day: pt.day, timeVal: pt.val })}
                            onClick={() => setChartTooltip({ day: pt.day, timeVal: pt.val })}
                          />
                        ))}
                      </g>

                      <g fill="#64748b" fontFamily="JetBrains Mono, monospace" fontSize="11" textAnchor="middle">
                        <text x="55" y="174">N1</text>
                        <text x="142" y="174">N5</text>
                        <text x="229" y="174">N10</text>
                        <text x="316" y="174">N15</text>
                        <text x="403" y="174">N20</text>
                        <text x="490" y="174">N25</text>
                        <text x="575" y="174" fill="#00e5ff">Hôm nay</text>
                      </g>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Right Column (lg:col-span-5, id="arena-card"): Thi Đấu Thời Gian Thực */}
              <div id="arena-card" className="lg:col-span-5 rounded-3xl bg-[#0d111a]/90 border border-white/10 p-6 sm:p-8 flex flex-col justify-between shadow-2xl">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rubikGreen/15 border border-rubikGreen/30 text-rubikGreen font-mono text-xs font-bold">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rubikGreen opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rubikGreen" />
                      </span>
                      LIVE 1V1 ARENA
                    </div>
                    <span className="font-mono text-xs text-slate-400">128 cubers online</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-white">Thi Đấu Thời Gian Thực</h3>
                  <p className="text-sm text-slate-400 mt-1 mb-5">
                    So tài cùng cộng đồng với cùng một Scramble chuẩn WCA và xếp hạng ELO trực tiếp.
                  </p>

                  {/* 3 Open 1v1 Rooms */}
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-neonCyan/40 transition-all flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate">Phòng Sub-15 Việt Nam</div>
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-1">
                          <span className="px-2 py-0.5 rounded bg-white/[0.06] text-slate-200">3x3x3</span>
                          <span className="text-neonCyan">Sub-15</span>
                          <span>• 1/2 người</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => joinLiveRoom('Phòng Sub-15 Việt Nam')}
                        className="shrink-0 px-3.5 py-2 rounded-xl bg-neonCyan/15 hover:bg-neonCyan text-neonCyan hover:text-[#06090f] font-bold text-xs transition-all active:scale-95"
                      >
                        Vào phòng
                      </button>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-electricPurple/40 transition-all flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate">Đấu Rank CFOP — Bo5</div>
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-1">
                          <span className="px-2 py-0.5 rounded bg-white/[0.06] text-slate-200">3x3x3</span>
                          <span className="text-purple-400">Sub-20</span>
                          <span>• 1/2 người</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => joinLiveRoom('Đấu Rank CFOP — Bo5')}
                        className="shrink-0 px-3.5 py-2 rounded-xl bg-electricPurple/20 hover:bg-electricPurple text-purple-300 hover:text-white font-bold text-xs transition-all active:scale-95"
                      >
                        Vào phòng
                      </button>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-neonCyan/40 transition-all flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate">Tốc Độ 2x2 Ortega / CLL</div>
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-1">
                          <span className="px-2 py-0.5 rounded bg-white/[0.06] text-slate-200">2x2x2</span>
                          <span className="text-rubikYellow">Sub-5</span>
                          <span>• 1/2 người</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => joinLiveRoom('Tốc Độ 2x2 Ortega / CLL')}
                        className="shrink-0 px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/20 text-white font-bold text-xs transition-all active:scale-95"
                      >
                        Vào phòng
                      </button>
                    </div>
                  </div>
                </div>

                {/* Matchmaking Large Gradient CTA */}
                <div className="mt-6 pt-5 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={startMatchmaking}
                    className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-neonCyan via-sky-500 to-electricPurple hover:brightness-110 text-[#06090f] font-extrabold text-sm shadow-cyan-glow transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    <span>{matchmakingLabel}</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ================================================================= */}
          {/* 5. WEEKLY LEADERBOARD (TOP 5 SPEEDCUBERS)                         */}
          {/* ================================================================= */}
          <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
              <div>
                <div className="font-mono text-xs font-semibold tracking-widest text-rubikYellow uppercase mb-2">WEEKLY RANKING</div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Bảng Xếp Hạng Tuần Này</h2>
              </div>
              <span className="font-mono text-xs text-slate-400 bg-white/[0.04] border border-white/10 px-3.5 py-1.5 rounded-full w-fit">
                Top 5 Speedcubers • Chuẩn WCA 3x3x3
              </span>
            </div>

            <div className="glass-card rounded-3xl overflow-hidden border-white/10">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-white/[0.02] font-mono text-xs uppercase text-slate-400">
                      <th className="py-4 px-6">Hạng</th>
                      <th className="py-4 px-6">Speedcuber</th>
                      <th className="py-4 px-6">Best Single</th>
                      <th className="py-4 px-6">Ao5</th>
                      <th className="py-4 px-6">Quốc gia / Huy hiệu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] text-sm">
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-rubikYellow">#1</td>
                      <td className="py-4 px-6 font-semibold text-white">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-rubikYellow/20 text-rubikYellow flex items-center justify-center font-bold text-xs shrink-0">
                            KH
                          </span>
                          <span>Khánh Hoàng</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-200 whitespace-nowrap">6.18s</td>
                      <td className="py-4 px-6 font-mono font-bold text-white whitespace-nowrap">7.45s</td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-rubikYellow/15 border border-rubikYellow/30 font-mono text-xs text-rubikYellow">
                          🇻🇳 VN • Grandmaster
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-slate-300">#2</td>
                      <td className="py-4 px-6 font-semibold text-white">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-slate-500/20 text-slate-200 flex items-center justify-center font-bold text-xs shrink-0">
                            TN
                          </span>
                          <span>Tuấn Nguyễn</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-200 whitespace-nowrap">6.94s</td>
                      <td className="py-4 px-6 font-mono font-bold text-white whitespace-nowrap">8.21s</td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] font-mono text-xs text-slate-300">
                          🇻🇳 VN • Master CFOP
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-rubikOrange">#3</td>
                      <td className="py-4 px-6 font-semibold text-white">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-rubikOrange/20 text-rubikOrange flex items-center justify-center font-bold text-xs shrink-0">
                            DA
                          </span>
                          <span>Đức Anh</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-200 whitespace-nowrap">7.52s</td>
                      <td className="py-4 px-6 font-mono font-bold text-white whitespace-nowrap">9.04s</td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] font-mono text-xs text-slate-300">
                          🇻🇳 VN • Roux Pro
                        </span>
                      </td>
                    </tr>
                    <tr className="bg-neonCyan/[0.09] hover:bg-neonCyan/[0.13] transition-colors">
                      <td className="py-4 px-6 font-mono font-extrabold text-neonCyan">#4</td>
                      <td className="py-4 px-6 font-bold text-white">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-neonCyan to-electricPurple text-[#06090f] flex items-center justify-center font-extrabold text-xs shrink-0">
                            {currentUserInitial}
                          </span>
                          <span>{currentUserName}</span>
                          <span className="px-2 py-0.5 rounded-full bg-neonCyan/20 text-neonCyan border border-neonCyan/40 text-[10px] font-mono uppercase">
                            Bạn
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-neonCyan whitespace-nowrap">{pbDisplay}</td>
                      <td className="py-4 px-6 font-mono font-extrabold text-white whitespace-nowrap">{ao5Display}</td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-neonCyan/15 border border-neonCyan/30 font-mono text-xs text-neonCyan">
                          🇻🇳 VN • Sub-11
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-slate-400">#5</td>
                      <td className="py-4 px-6 font-semibold text-white">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-electricPurple/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                            LM
                          </span>
                          <span>Linh Mai</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-200 whitespace-nowrap">8.95s</td>
                      <td className="py-4 px-6 font-mono font-bold text-white whitespace-nowrap">10.64s</td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] font-mono text-xs text-slate-300">
                          🇻🇳 VN • Sub-12
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* ===================================================================== */}
      {/* 6. FOOTER                                                             */}
      {/* ===================================================================== */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-[#05080e] mt-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            {/* Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-[2px] rounded-xl bg-gradient-to-br from-neonCyan via-sky-500 to-electricPurple">
                  <div className="w-8 h-8 bg-[#070b13] rounded-[9px] p-1.5 grid grid-cols-2 grid-rows-2 gap-1">
                    <span className="rounded-[2px] bg-[#00e5ff]" />
                    <span className="rounded-[2px] bg-[#ff6b00]" />
                    <span className="rounded-[2px] bg-[#10b981]" />
                    <span className="rounded-[2px] bg-[#facc15]" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-lg font-extrabold text-white">CUBEX</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-neonCyan" />
                  </div>
                  <span className="font-mono text-[9px] tracking-[0.22em] text-slate-500 uppercase">THE ART OF SPEEDCUBING</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 max-w-xs">
                Nền tảng học thuật toán Rubik 3D, phân tích hiệu năng và kết nối cộng đồng Speedcuber Việt Nam.
              </p>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
              <Link href="/timer" className="hover:text-neonCyan transition-colors">
                Bấm Giờ
              </Link>
              <button type="button" onClick={() => goToSection('hero-3d')} className="hover:text-neonCyan transition-colors">
                Khối 3D
              </button>
              <button type="button" onClick={() => goToSection('roadmap-section')} className="hover:text-neonCyan transition-colors">
                Lộ Trình Học
              </button>
              <button type="button" onClick={() => goToSection('performance-section')} className="hover:text-neonCyan transition-colors">
                Thống Kê
              </button>
              <Link href="/match" className="hover:text-neonCyan transition-colors">
                Thi Đấu
              </Link>
            </div>

            {/* Community Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => showToast('Đang mở máy chủ Discord CUBEX Vietnam...', 'info')}
                className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-all"
              >
                Discord
              </button>
              <button
                type="button"
                onClick={() => showToast('Đang mở kênh YouTube hướng dẫn CUBEX...', 'info')}
                className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-all"
              >
                YouTube
              </button>
              <button
                type="button"
                onClick={() => showToast('Đang mở quy chuẩn World Cube Association (WCA)...', 'info')}
                className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-all"
              >
                WCA
              </button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p>© 2026 CUBEX Vietnam. All rights reserved.</p>
            <p className="font-mono">THE ART OF SPEEDCUBING • v2.5</p>
          </div>
        </div>
      </footer>

      {/* ===================================================================== */}
      {/* 7. ALGORITHM LIBRARY MODAL                                            */}
      {/* ===================================================================== */}
      {activeCourseModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
          onClick={(e) => e.target === e.currentTarget && setActiveCourseModal(null)}
        >
          <div className="glass-card rounded-3xl max-w-2xl w-full p-6 sm:p-8 border-white/15 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setActiveCourseModal(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-white/[0.06] hover:bg-white/15 text-slate-300 hover:text-white transition-colors"
              aria-label="Đóng"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>

            <div className={`inline-block px-3 py-1 rounded-full font-mono text-xs font-bold mb-3 ${COURSE_DATA[activeCourseModal].badgeClass}`}>
              {COURSE_DATA[activeCourseModal].badge}
            </div>
            <h3 className="text-2xl font-extrabold text-white mb-2">{COURSE_DATA[activeCourseModal].title}</h3>
            <p className="text-sm text-slate-400 mb-6">{COURSE_DATA[activeCourseModal].desc}</p>

            <div className="space-y-3">
              {COURSE_DATA[activeCourseModal].algs.map((alg, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-white text-sm">{alg.name}</div>
                    <div className="font-mono text-sm text-neonCyan font-semibold">{alg.notation}</div>
                    <div className="text-xs text-slate-400">{alg.tip}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => practiceAlgOn3D(activeCourseModal, i)}
                    className="shrink-0 px-4 py-2 rounded-xl bg-neonCyan/15 hover:bg-neonCyan text-neonCyan hover:text-[#06090f] border border-neonCyan/30 text-xs font-bold transition-all"
                  >
                    Chạy 3D
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
              {COURSE_DATA[activeCourseModal].fullPageHref ? (
                <Link
                  href={COURSE_DATA[activeCourseModal].fullPageHref!}
                  onClick={() => setActiveCourseModal(null)}
                  className="px-5 py-2.5 rounded-xl bg-neonCyan text-[#06090f] hover:bg-[#33ecff] text-sm font-bold shadow-cyan-glow transition-all"
                >
                  Mở trang học chuyên sâu →
                </Link>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={() => setActiveCourseModal(null)}
                className="px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 text-sm font-semibold text-slate-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const colors = {
            success: 'border-rubikGreen/40 text-rubikGreen',
            info: 'border-neonCyan/40 text-neonCyan',
            warning: 'border-rubikYellow/40 text-rubikYellow',
          };
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#0d121d]/95 backdrop-blur-xl border ${
                colors[t.type] || colors.info
              } shadow-2xl text-sm font-medium transition-all duration-300`}
            >
              <span className="w-2 h-2 rounded-full bg-current shrink-0" />
              <span className="text-slate-100 leading-snug">{t.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-obsidian" />}>
      <HomePageContent />
    </Suspense>
  );
}
