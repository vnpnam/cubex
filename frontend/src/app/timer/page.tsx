'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { RubikTimer } from '@/components/timer/RubikTimer';

export default function TimerPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-obsidian text-slate-100 relative overflow-hidden">
      {/* Ambient Background Grid & Glows matching homepage */}
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none z-0" />
      <div className="fixed top-[-14%] left-[-8%] w-[500px] h-[500px] bg-neonCyan/10 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="fixed top-[22%] right-[-8%] w-[460px] h-[460px] bg-electricPurple/12 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Top Navbar */}
      <Navbar activeTab="timer" />

      {/* Main Content Viewport — Pure Timer without old Hero banner */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 z-10 flex flex-col gap-8">
        <RubikTimer />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
