'use client';

import React, { useState, useMemo } from 'react';
import { INITIAL_ALGORITHMS, AlgorithmItem } from '@/lib/data/algorithmsData';
import { useI18nStore } from '@/lib/store/useI18nStore';
import { AlgorithmModal } from './AlgorithmModal';
import {
  Search,
  CheckCircle,
  PlayCircle,
  Clock,
  Layers,
  ChevronRight,
  Flame,
  Star,
  BookOpen,
  Filter
} from 'lucide-react';

export const AlgorithmCatalog: React.FC = () => {
  const { lang, t } = useI18nStore();
  const [algorithms, setAlgorithms] = useState<AlgorithmItem[]>(INITIAL_ALGORITHMS);
  const [activeCategory, setActiveCategory] = useState<'All' | 'Beginner' | 'Cross' | 'F2L' | 'OLL' | 'PLL'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Learning' | 'Practicing' | 'Mastered'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmItem | null>(null);

  // Filtered algorithms list
  const filteredAlgorithms = useMemo(() => {
    return algorithms.filter((alg) => {
      // Category match
      if (activeCategory !== 'All' && alg.category !== activeCategory) {
        return false;
      }
      // Status match
      if (statusFilter !== 'All' && alg.userStatus !== statusFilter) {
        return false;
      }
      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = alg.name.toLowerCase().includes(q);
        const matchCode = alg.code.toLowerCase().includes(q);
        const matchNotation = alg.notation.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchNotation) return false;
      }
      return true;
    });
  }, [algorithms, activeCategory, statusFilter, searchQuery]);

  const handleUpdateStatus = (
    id: number,
    status: 'Learning' | 'Practicing' | 'Mastered',
    practiceTimeMs?: number
  ) => {
    setAlgorithms((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const newCount = (a.practiceCount || 0) + (practiceTimeMs ? 1 : 0);
        const newPb = practiceTimeMs
          ? Math.min(a.personalBestTimeMs || 999999, practiceTimeMs)
          : a.personalBestTimeMs;
        return {
          ...a,
          userStatus: status,
          practiceCount: newCount,
          personalBestTimeMs: newPb
        };
      })
    );

    if (selectedAlgorithm && selectedAlgorithm.id === id) {
      setSelectedAlgorithm((prev) =>
        prev
          ? {
              ...prev,
              userStatus: status,
              practiceCount: (prev.practiceCount || 0) + (practiceTimeMs ? 1 : 0),
              personalBestTimeMs: practiceTimeMs
                ? Math.min(prev.personalBestTimeMs || 999999, practiceTimeMs)
                : prev.personalBestTimeMs
            }
          : null
      );
    }
  };

  const getStatusBadge = (status?: 'Learning' | 'Practicing' | 'Mastered') => {
    switch (status) {
      case 'Mastered':
        return (
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#00F5A0]/10 border border-[#00F5A0]/30 text-[#00F5A0] flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> {t('statusMastered')}
          </span>
        );
      case 'Practicing':
        return (
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FF9500]/10 border border-[#FF9500]/30 text-[#FF9500] flex items-center gap-1">
            <Clock className="w-3 h-3" /> {t('statusPracticing')}
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50 flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> {t('statusLearning')}
          </span>
        );
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-[#0B0F19]/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-xl">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-black/40 border border-white/5 rounded-2xl w-full md:w-auto">
          {(['All', 'Beginner', 'Cross', 'F2L', 'OLL', 'PLL'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                activeCategory === cat
                  ? 'bg-gradient-to-r from-[#00F0FF] to-[#0088FF] text-black shadow-md shadow-[#00F0FF]/20'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {cat === 'All' ? t('filterAll') : cat}
            </button>
          ))}
        </div>

        {/* Search & Status Filter */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Status Dropdown / Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white/80 focus:outline-none focus:border-[#00F0FF]/50"
          >
            <option value="All">{t('filterAll')} Trạng Thái</option>
            <option value="Learning">{t('filterLearning')}</option>
            <option value="Practicing">{t('filterPracticing')}</option>
            <option value="Mastered">{t('filterMastered')}</option>
          </select>

          {/* Search Box */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#00F0FF]/50"
            />
          </div>
        </div>
      </div>

      {/* Algorithms Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAlgorithms.length === 0 ? (
          <div className="col-span-full py-16 text-center text-white/40 font-mono text-sm">
            Không tìm thấy thuật toán nào khớp với tìm kiếm.
          </div>
        ) : (
          filteredAlgorithms.map((alg) => {
            const desc = lang === 'vi' ? alg.descriptionVi : alg.descriptionEn;

            return (
              <div
                key={alg.id}
                onClick={() => setSelectedAlgorithm(alg)}
                className="group p-5 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl hover:border-[#00F0FF]/40 hover:bg-[#0E1424]/90 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-xl relative overflow-hidden"
              >
                {/* Subtle Neon Edge Highlight on Hover */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00F0FF]/0 group-hover:via-[#00F0FF] to-transparent transition-all duration-300" />

                <div>
                  {/* Top metadata */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/5 text-[#00F0FF]">
                      {alg.code}
                    </span>
                    {getStatusBadge(alg.userStatus)}
                  </div>

                  {/* Title & Subcategory */}
                  <h3 className="text-base font-bold text-white group-hover:text-[#00F0FF] transition-colors mb-1">
                    {alg.name}
                  </h3>
                  <span className="text-[11px] font-mono text-white/40 block mb-3">
                    {alg.category} • {alg.subCategory}
                  </span>

                  {/* Notation display */}
                  <div className="p-3 bg-black/40 border border-white/5 rounded-2xl mb-3">
                    <p className="text-sm font-mono font-bold text-white/90 tracking-wide line-clamp-1">
                      {alg.notation}
                    </p>
                  </div>

                  <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                    {desc}
                  </p>
                </div>

                {/* Footer bar */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/5 text-xs">
                  <div className="flex items-center gap-1.5 text-white/40 font-mono">
                    {alg.personalBestTimeMs ? (
                      <span className="text-[#FFD700] font-bold">
                        PB: {(alg.personalBestTimeMs / 1000).toFixed(2)}s
                      </span>
                    ) : (
                      <span>{alg.difficulty}</span>
                    )}
                  </div>

                  <span className="text-xs font-semibold text-[#00F0FF] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    {t('openIn3D')}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Algorithm Modal with 3D Simulation */}
      <AlgorithmModal
        algorithm={selectedAlgorithm}
        onClose={() => setSelectedAlgorithm(null)}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
};
