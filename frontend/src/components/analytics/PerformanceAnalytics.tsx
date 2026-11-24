'use client';

import React, { useMemo } from 'react';
import { useTimerStore } from '@/lib/store/useTimerStore';
import { useI18nStore } from '@/lib/store/useI18nStore';
import { INITIAL_ALGORITHMS } from '@/lib/data/algorithmsData';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from 'recharts';
import {
  TrendingUp,
  Award,
  Zap,
  Clock,
  CheckCircle2,
  Calendar,
  Flame,
  BarChart2,
  Layers
} from 'lucide-react';

export const PerformanceAnalytics: React.FC = () => {
  const { t } = useI18nStore();
  const { solves, getBestSingle, getAo5, getAo12, getMean } = useTimerStore();

  // 1. Progression Timeline Data (Solves in chronological order)
  const timelineData = useMemo(() => {
    const reversed = [...solves].reverse();
    return reversed.map((s, idx) => {
      // Calculate rolling ao5
      let rAo5: number | null = null;
      if (idx >= 4) {
        const slice = reversed.slice(idx - 4, idx + 1);
        const valid = slice.filter((x) => x.penalty !== 'DNF');
        if (valid.length >= 4) {
          const sorted = [...slice].sort((a, b) => a.timeMs - b.timeMs);
          const trimmed = sorted.slice(1, 4);
          rAo5 = Math.round(trimmed.reduce((acc, x) => acc + x.timeMs, 0) / 3) / 1000;
        }
      }

      return {
        index: idx + 1,
        time: s.penalty === 'DNF' ? null : Math.round(s.timeMs / 10) / 100,
        ao5: rAo5,
        date: s.timestamp.slice(5, 10)
      };
    });
  }, [solves]);

  // 2. Solve Distribution Buckets (< 10s, 10-12s, 12-15s, etc.)
  const distributionData = useMemo(() => {
    const buckets = [
      { range: '< 11s', count: 0, color: '#00F5A0' },
      { range: '11-12s', count: 0, color: '#00F0FF' },
      { range: '12-13s', count: 0, color: '#0088FF' },
      { range: '13-14s', count: 0, color: '#FFD700' },
      { range: '14-16s', count: 0, color: '#FF9500' },
      { range: '16s+', count: 0, color: '#FF3B30' }
    ];

    solves.forEach((s) => {
      if (s.penalty === 'DNF') return;
      const sec = s.timeMs / 1000;
      if (sec < 11) buckets[0].count++;
      else if (sec < 12) buckets[1].count++;
      else if (sec < 13) buckets[2].count++;
      else if (sec < 14) buckets[3].count++;
      else if (sec < 16) buckets[4].count++;
      else buckets[5].count++;
    });

    return buckets;
  }, [solves]);

  // 3. Algorithm Mastery by Category
  const masteryStats = useMemo(() => {
    const categories = ['Beginner', 'Cross', 'F2L', 'OLL', 'PLL'] as const;
    return categories.map((cat) => {
      const subset = INITIAL_ALGORITHMS.filter((a) => a.category === cat);
      const total = subset.length;
      const mastered = subset.filter((a) => a.userStatus === 'Mastered').length;
      const practicing = subset.filter((a) => a.userStatus === 'Practicing').length;
      const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
      return { category: cat, total, mastered, practicing, pct };
    });
  }, []);

  const totalMastered = INITIAL_ALGORITHMS.filter((a) => a.userStatus === 'Mastered').length;
  const masteryPercentage = Math.round((totalMastered / INITIAL_ALGORITHMS.length) * 100);

  const bestSingle = getBestSingle();
  const currentAo5 = getAo5();
  const currentAo12 = getAo12();
  const meanTime = getMean();

  return (
    <div className="w-full flex flex-col gap-6">
      {/* KPI Cards Row (Linear Style) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between text-white/50 mb-3">
            <span className="text-xs uppercase font-mono tracking-wider">{t('statSinglePB')}</span>
            <Award className="w-4 h-4 text-[#FFD700]" />
          </div>
          <div className="text-3xl font-mono font-extrabold text-[#FFD700]">
            {bestSingle ? `${(bestSingle / 1000).toFixed(2)}s` : '--'}
          </div>
          <span className="text-[11px] text-white/40 mt-1">Official WCA standard</span>
        </div>

        <div className="p-5 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between text-white/50 mb-3">
            <span className="text-xs uppercase font-mono tracking-wider">{t('timerAo5')}</span>
            <TrendingUp className="w-4 h-4 text-[#00F0FF]" />
          </div>
          <div className="text-3xl font-mono font-extrabold text-[#00F0FF]">
            {currentAo5 ? `${(currentAo5 / 1000).toFixed(2)}s` : '--'}
          </div>
          <span className="text-[11px] text-white/40 mt-1">Rolling 5 solves average</span>
        </div>

        <div className="p-5 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between text-white/50 mb-3">
            <span className="text-xs uppercase font-mono tracking-wider">{t('timerAo12')}</span>
            <Zap className="w-4 h-4 text-[#00F5A0]" />
          </div>
          <div className="text-3xl font-mono font-extrabold text-[#00F5A0]">
            {currentAo12 ? `${(currentAo12 / 1000).toFixed(2)}s` : '--'}
          </div>
          <span className="text-[11px] text-white/40 mt-1">Rolling 12 solves average</span>
        </div>

        <div className="p-5 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between text-white/50 mb-3">
            <span className="text-xs uppercase font-mono tracking-wider">{t('statMasteryRate')}</span>
            <CheckCircle2 className="w-4 h-4 text-[#FF9500]" />
          </div>
          <div className="text-3xl font-mono font-extrabold text-white">
            {masteryPercentage}%
          </div>
          <span className="text-[11px] text-[#00F5A0] mt-1">{totalMastered} / {INITIAL_ALGORITHMS.length} hoàn thành</span>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progression Timeline Chart (2 Cols) */}
        <div className="lg:col-span-2 p-6 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {t('chartProgression')}
              </h3>
              <p className="text-xs text-white/40 mt-0.5">
                Đường biểu diễn thời gian từng lượt giải và đường trung bình Ao5
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-white/60">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00F0FF]" /> Single
              </span>
              <span className="flex items-center gap-1.5 text-white/60">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00F5A0]" /> Ao5
              </span>
            </div>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="index"
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={11}
                  tickLine={false}
                  domain={['dataMin - 1', 'dataMax + 1']}
                  unit="s"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F1422',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line
                  type="monotone"
                  dataKey="time"
                  name="Single"
                  stroke="#00F0FF"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#00F0FF' }}
                  activeDot={{ r: 6, fill: '#fff' }}
                />
                <Line
                  type="monotone"
                  dataKey="ao5"
                  name="Ao5"
                  stroke="#00F5A0"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Solve Distribution Bar Chart (1 Col) */}
        <div className="p-6 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight mb-1">
              {t('chartDistribution')}
            </h3>
            <p className="text-xs text-white/40 mb-6">
              Mật độ phân bổ số lần giải theo khoảng tốc độ
            </p>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="range"
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={10}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F1422',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="count" name="Số lần giải" radius={[6, 6, 0, 0]}>
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CFOP Mastery Breakdown Matrix */}
      <div className="p-6 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl">
        <h3 className="text-base font-bold text-white tracking-tight mb-4">
          {t('chartMastery')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {masteryStats.map((item) => (
            <div
              key={item.category}
              className="p-4 bg-black/40 border border-white/5 rounded-2xl flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-white uppercase">{item.category}</span>
                <span className="text-xs font-mono font-bold text-[#00F0FF]">{item.pct}%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden my-2">
                <div
                  className="h-full bg-gradient-to-r from-[#00F0FF] to-[#00F5A0] rounded-full transition-all duration-500"
                  style={{ width: `${item.pct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-white/40 mt-1">
                <span>{item.mastered} / {item.total} Mastered</span>
                <span>{item.practicing} Practicing</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
