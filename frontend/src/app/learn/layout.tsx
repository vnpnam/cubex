import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Học CFOP | CUBEX',
  description: 'Học Cross, F2L, OLL, PLL với CUBEX - Nền tảng Speedcubing chuyên nghiệp',
};

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
