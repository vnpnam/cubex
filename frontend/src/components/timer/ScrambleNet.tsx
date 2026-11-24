'use client';

import React from 'react';

interface ScrambleNetProps {
  scramble?: string;
  className?: string;
}

// Flat net visualization of a 3x3x3 cube
// Layout:
//      [ U ]
// [ L ][ F ][ R ][ B ]
//      [ D ]
export const ScrambleNet: React.FC<ScrambleNetProps> = ({ className = '' }) => {
  // Face colors
  const U_COLOR = '#FFFFFF';
  const D_COLOR = '#FACC15';
  const F_COLOR = '#10B981';
  const B_COLOR = '#3B82F6';
  const L_COLOR = '#F97316';
  const R_COLOR = '#EF4444';

  const renderFace = (baseColor: string, label: string) => (
    <div className="grid grid-cols-3 gap-0.5 p-1 bg-black/40 rounded-md border border-white/10 w-12 h-12">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="rounded-[2px] transition-colors"
          style={{
            backgroundColor: baseColor,
            opacity: i === 4 ? 1 : 0.85
          }}
          title={`${label}${i + 1}`}
        />
      ))}
    </div>
  );

  return (
    <div className={`flex flex-col items-center justify-center p-3 bg-black/30 backdrop-blur-md rounded-2xl border border-white/5 ${className}`}>
      {/* Top: U face */}
      <div className="flex justify-center mb-0.5">
        {renderFace(U_COLOR, 'U')}
      </div>

      {/* Middle row: L, F, R, B */}
      <div className="flex gap-0.5 my-0.5">
        {renderFace(L_COLOR, 'L')}
        {renderFace(F_COLOR, 'F')}
        {renderFace(R_COLOR, 'R')}
        {renderFace(B_COLOR, 'B')}
      </div>

      {/* Bottom: D face */}
      <div className="flex justify-center mt-0.5">
        {renderFace(D_COLOR, 'D')}
      </div>
    </div>
  );
};
