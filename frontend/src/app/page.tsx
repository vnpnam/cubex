'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { RubikTimer } from '@/components/timer/RubikTimer';
import { AlgorithmCatalog } from '@/components/learning/AlgorithmCatalog';
import { CubePlayground } from '@/components/3d/CubePlayground';
import { PerformanceAnalytics } from '@/components/analytics/PerformanceAnalytics';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { useI18nStore } from '@/lib/store/useI18nStore';
import {
  Timer,
  BookOpen,
  Box,
  BarChart3,
  Shield,
  Sparkles,
  Zap,
  ArrowRight,
  Award,
  Layers
} from 'lucide-react';

export default function HomePage() {
  const { t } = useI18nStore();
  const [activeTab, setActiveTab] = useState<'timer' | 'learn' | '3d' | 'analytics' | 'admin'>('timer');

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#070A12] relative overflow-hidden">
      {/* Dynamic Background Glows (Apple & Lusion Aesthetic) */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-gradient-to-b from-[#00F0FF]/10 via-[#0088FF]/5 to-transparent blur-[140px] pointer-events-none" />
      <div className="absolute top-[600px] -left-40 w-[600px] h-[500px] bg-[#8A2BE2]/5 blur-[160px] pointer-events-none" />
      <div className="absolute top-[800px] -right-40 w-[600px] h-[500px] bg-[#FF6B00]/5 blur-[160px] pointer-events-none" />

      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 z-10 flex flex-col gap-8">
        {/* Hero Banner when in Timer or Playground */}
        <div className="p-8 sm:p-10 bg-gradient-to-br from-[#0B0F19]/90 via-[#0F1424]/80 to-[#0B0F19]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden">
          {/* Subtle Cyber Grid Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

          <div className="relative z-10 max-w-3xl flex flex-col items-start gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#00F0FF]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>THE ART OF SPEEDCUBING • NEXT-GEN PLATFORM</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {t('heroTitle')}
            </h1>

            <p className="text-sm sm:text-base text-white/60 leading-relaxed max-w-2xl">
              {t('heroSubtitle')}
            </p>

            {/* Quick Action Jump Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setActiveTab('timer')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg ${
                  activeTab === 'timer'
                    ? 'bg-[#00F0FF] text-black shadow-[#00F0FF]/25 font-bold'
                    : 'bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                <Timer className="w-4 h-4" />
                <span>{t('heroStartTimer')}</span>
              </button>

              <button
                onClick={() => setActiveTab('learn')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg ${
                  activeTab === 'learn'
                    ? 'bg-[#00F0FF] text-black shadow-[#00F0FF]/25 font-bold'
                    : 'bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>{t('heroExploreCFOP')}</span>
              </button>

              <button
                onClick={() => setActiveTab('3d')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg ${
                  activeTab === '3d'
                    ? 'bg-[#00F0FF] text-black shadow-[#00F0FF]/25 font-bold'
                    : 'bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                <Box className="w-4 h-4" />
                <span>{t('heroTry3D')}</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg ${
                  activeTab === 'analytics'
                    ? 'bg-[#00F0FF] text-black shadow-[#00F0FF]/25 font-bold'
                    : 'bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>{t('navAnalytics')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab View Switching */}
        {activeTab === 'timer' && <RubikTimer />}
        {activeTab === 'learn' && <AlgorithmCatalog />}
        {activeTab === '3d' && <CubePlayground />}
        {activeTab === 'analytics' && <PerformanceAnalytics />}
        {activeTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
