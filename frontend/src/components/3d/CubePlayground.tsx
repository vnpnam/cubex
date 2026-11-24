'use client';

import React, { useState } from 'react';
import { InteractiveCube } from './InteractiveCube';
import { useI18nStore } from '@/lib/store/useI18nStore';
import {
  Sparkles,
  Zap,
  Play,
  Layers,
  Palette,
  Shuffle,
  Compass,
  Keyboard
} from 'lucide-react';

export const CubePlayground: React.FC = () => {
  const { t } = useI18nStore();
  const [selectedPreset, setSelectedPreset] = useState<string>('T-Perm');
  const [customAlgorithm, setCustomAlgorithm] = useState<string>("R U R' U' R' F R2 U' R' U' R U R' F'");
  const [cubeKey, setCubeKey] = useState<number>(1);

  const presets = [
    { name: 'T-Perm (PLL)', notation: "R U R' U' R' F R2 U' R' U' R U R' F'" },
    { name: 'Y-Perm (PLL)', notation: "F R U' R' U' R U R' F' R U R' U' R' F R F'" },
    { name: 'Sune (OLL)', notation: "R U R' U R U2 R'" },
    { name: 'Sexy Move', notation: "R U R' U'" },
    { name: 'Sledgehammer', notation: "R' F R F'" },
    { name: 'Superflip (Pattern)', notation: "U R2 F B R B2 R U2 L B2 R U' D' R2 F R' L B2 U2 F2" },
    { name: 'Checkerboard (Pattern)', notation: 'M2 E2 S2' },
    { name: 'Cube in a Cube', notation: "F L F U' R U F2 L2 U' L' B D' B' L2 U" }
  ];

  const handleSelectPreset = (p: typeof presets[0]) => {
    setSelectedPreset(p.name);
    setCustomAlgorithm(p.notation);
    setCubeKey((prev) => prev + 1);
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    setCubeKey((prev) => prev + 1);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Playground Header */}
      <div className="p-6 bg-[#0B0F19]/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#00F0FF] block mb-1">
            LUSION-INSPIRED 3D GRAPHICS ENGINE
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Không Gian Tương Tác 3D Siêu Thực
          </h2>
          <p className="text-xs text-white/50 mt-1 max-w-xl">
            Mô phỏng vật lý 3D khối Rubik với chuyển động động học mượt mà, ánh sáng studio và khả năng thực thi thuật toán chính xác theo chuẩn ký hiệu WCA.
          </p>
        </div>

        {/* Keyboard hints pill */}
        <div className="p-3 bg-black/40 border border-white/5 rounded-2xl flex items-center gap-3 text-xs font-mono text-white/60">
          <Keyboard className="w-4 h-4 text-[#00F0FF]" />
          <span>Gõ phím U, D, L, R, F, B, M để xoay mặt trực tiếp</span>
        </div>
      </div>

      {/* Main 3D Canvas Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[520px]">
        {/* Preset Selector Sidebar (1 Col) */}
        <div className="p-5 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5">
            <Layers className="w-4 h-4 text-[#00F0FF]" />
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Mẫu Thuật Toán (Presets)
            </h3>
          </div>

          <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[380px] scrollbar-thin">
            {presets.map((p) => {
              const isSelected = selectedPreset === p.name;
              return (
                <button
                  key={p.name}
                  onClick={() => handleSelectPreset(p)}
                  className={`p-3 rounded-2xl text-left text-xs transition-all border ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#00F0FF]/15 to-[#0088FF]/15 border-[#00F0FF]/40 text-white shadow-md'
                      : 'bg-black/30 border-white/5 text-white/60 hover:text-white hover:bg-black/50'
                  }`}
                >
                  <span className="font-bold block mb-0.5">{p.name}</span>
                  <span className="font-mono text-[10px] text-white/40 truncate block">
                    {p.notation}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom notation form */}
          <form onSubmit={handleApplyCustom} className="pt-3 border-t border-white/5 flex flex-col gap-2">
            <label className="text-[10px] font-mono text-white/40 uppercase">
              Tùy chỉnh công thức:
            </label>
            <input
              type="text"
              value={customAlgorithm}
              onChange={(e) => setCustomAlgorithm(e.target.value)}
              placeholder="Nhập moves (vd: R U R' U')..."
              className="px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-mono text-[#00F0FF] focus:outline-none focus:border-[#00F0FF]/50"
            />
            <button
              type="submit"
              className="py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/10 transition-all"
            >
              Nạp Vào Khối 3D
            </button>
          </form>
        </div>

        {/* 3D Cube Canvas (3 Cols) */}
        <div className="lg:col-span-3 p-6 bg-[#07090F]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
          <InteractiveCube
            key={cubeKey}
            algorithm={customAlgorithm}
            autoPlay={false}
            interactive={true}
            className="w-full h-full min-h-[460px]"
          />
        </div>
      </div>
    </div>
  );
};
