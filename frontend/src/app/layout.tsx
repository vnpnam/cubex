import type { Metadata, Viewport } from 'next';
import './globals.css';
import { MusicPlayer } from '@/components/music/MusicPlayer';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#06090f',
};

export const metadata: Metadata = {
  title: 'CUBEX – The Art of Speedcubing | WCA Standard Rubik 3x3 Platform',
  description:
    'Nền tảng học tập & luyện tập Rubik 3x3 chuyên nghiệp: CFOP, Beginner, 3D Rubik mô phỏng thời gian thực, bộ bấm giờ chuẩn WCA và phân tích tiến độ thông minh.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#070A12] text-white selection:bg-[#00F0FF]/30 selection:text-white font-sans overflow-x-hidden">
        {children}
        <MusicPlayer />
      </body>
    </html>
  );
}
