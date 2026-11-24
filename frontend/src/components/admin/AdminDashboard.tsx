'use client';

import React, { useState } from 'react';
import { INITIAL_ALGORITHMS, AlgorithmItem } from '@/lib/data/algorithmsData';
import { useI18nStore } from '@/lib/store/useI18nStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import {
  ShieldAlert,
  Plus,
  Trash2,
  Edit2,
  Users,
  Database,
  BarChart3,
  CheckCircle,
  X,
  Save,
  Search
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { t } = useI18nStore();
  const { user, isAdmin, loginAsAdmin } = useAuthStore();
  const [algorithms, setAlgorithms] = useState<AlgorithmItem[]>(INITIAL_ALGORITHMS);
  const [editingAlg, setEditingAlg] = useState<AlgorithmItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Sample users directory
  const usersList = [
    { id: '1', email: 'admin@cubex.com', name: 'Cubex Administrator', role: 'Admin', solves: 342, wcaId: '2026CUBE01' },
    { id: '2', email: 'cubist@cubex.com', name: 'Minh Speedcuber', role: 'Cubist', solves: 1250, wcaId: '2025MINH02' },
    { id: '3', email: 'alex.rubik@cubex.com', name: 'Alex Nguyen', role: 'Cubist', solves: 890, wcaId: '2024ALEX01' },
    { id: '4', email: 'sarah.cube@cubex.com', name: 'Sarah Chen', role: 'Cubist', solves: 420, wcaId: '2025CHEN03' }
  ];

  const handleSaveAlgorithm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlg) return;

    if (isAddingNew) {
      const newId = Math.max(...algorithms.map((a) => a.id), 0) + 1;
      setAlgorithms([{ ...editingAlg, id: newId }, ...algorithms]);
    } else {
      setAlgorithms(algorithms.map((a) => (a.id === editingAlg.id ? editingAlg : a)));
    }

    setEditingAlg(null);
    setIsAddingNew(false);
  };

  const handleDeleteAlgorithm = (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa thuật toán này khỏi hệ thống?')) {
      setAlgorithms(algorithms.filter((a) => a.id !== id));
    }
  };

  const handleAddNew = () => {
    setEditingAlg({
      id: 0,
      category: 'F2L',
      subCategory: 'Advanced Inserts',
      code: 'F2L NEW',
      name: 'New Custom Case',
      notation: "R U R' U'",
      descriptionVi: 'Mô tả chi tiết kỹ thuật thực hiện.',
      descriptionEn: 'Detailed execution guide.',
      executionTipVi: 'Fingertrick tối ưu.',
      executionTipEn: 'Optimal fingertrick.',
      difficulty: 'Intermediate',
      orderIndex: algorithms.length + 1
    });
    setIsAddingNew(true);
  };

  if (!isAdmin) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center text-center p-8 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl">
        <ShieldAlert className="w-12 h-12 text-[#FF9500] mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Quyền Truy Cập Quản Trị Viên (Admin Required)</h3>
        <p className="text-sm text-white/50 max-w-md mb-6">
          Bạn cần đăng nhập với tài khoản có quyền Quản trị (Admin) để quản lý nội dung và người dùng.
        </p>
        <button
          onClick={loginAsAdmin}
          className="px-6 py-2.5 bg-gradient-to-r from-[#00F0FF] to-[#0088FF] text-black font-semibold text-sm rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[#00F0FF]/20"
        >
          {t('authAdminDemo')}
        </button>
      </div>
    );
  }

  const filteredAlgs = algorithms.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center gap-4 shadow-xl">
          <div className="p-3 rounded-2xl bg-[#00F0FF]/10 text-[#00F0FF]">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-white/40 uppercase font-mono">Tổng Thuật Toán</span>
            <h4 className="text-2xl font-mono font-bold text-white">{algorithms.length}</h4>
          </div>
        </div>

        <div className="p-5 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center gap-4 shadow-xl">
          <div className="p-3 rounded-2xl bg-[#00F5A0]/10 text-[#00F5A0]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-white/40 uppercase font-mono">Thành Viên Hoạt Động</span>
            <h4 className="text-2xl font-mono font-bold text-white">{usersList.length}</h4>
          </div>
        </div>

        <div className="p-5 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center gap-4 shadow-xl">
          <div className="p-3 rounded-2xl bg-[#FFD700]/10 text-[#FFD700]">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-white/40 uppercase font-mono">Tổng Lượt Giải Nền Tảng</span>
            <h4 className="text-2xl font-mono font-bold text-white">2,902</h4>
          </div>
        </div>
      </div>

      {/* Algorithm Content Repository Table */}
      <div className="p-6 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">{t('adminTitle')}</h3>
            <p className="text-xs text-white/40 mt-0.5">{t('adminSubtitle')}</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-60">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm thuật toán..."
                className="w-full pl-9 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#00F0FF]/50"
              />
            </div>

            <button
              onClick={handleAddNew}
              className="px-4 py-2 bg-[#00F0FF] text-black font-semibold text-xs rounded-xl hover:bg-[#00F0FF]/90 transition-all flex items-center gap-1.5 shadow-md shadow-[#00F0FF]/20 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{t('adminAddAlgorithm')}</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 text-white/40 font-mono uppercase tracking-wider">
              <tr>
                <th className="pb-3 pl-3">Mã</th>
                <th className="pb-3">Phân Loại</th>
                <th className="pb-3">Tên Thuật Toán</th>
                <th className="pb-3">Công Thức (Notation)</th>
                <th className="pb-3">Độ Khó</th>
                <th className="pb-3 text-right pr-3">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {filteredAlgs.map((a) => (
                <tr key={a.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 pl-3 font-mono font-bold text-[#00F0FF]">{a.code}</td>
                  <td className="py-3.5 text-white/70">{a.category} • {a.subCategory}</td>
                  <td className="py-3.5 font-semibold text-white">{a.name}</td>
                  <td className="py-3.5 font-mono text-white/90">{a.notation}</td>
                  <td className="py-3.5 text-white/60">{a.difficulty}</td>
                  <td className="py-3.5 text-right pr-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingAlg(a);
                          setIsAddingNew(false);
                        }}
                        className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                        title={t('adminEdit')}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAlgorithm(a.id)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-[#FF3B30] hover:bg-white/10 transition-colors"
                        title={t('adminDelete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Directory */}
      <div className="p-6 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl">
        <h3 className="text-lg font-bold text-white tracking-tight mb-4">{t('adminUsersTitle')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {usersList.map((u) => (
            <div key={u.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl flex flex-col justify-between">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-bold text-white text-sm">{u.name}</h4>
                  <span className="text-[11px] text-white/40 block">{u.email}</span>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  u.role === 'Admin' ? 'bg-[#FF9500]/20 text-[#FF9500]' : 'bg-[#00F0FF]/10 text-[#00F0FF]'
                }`}>
                  {u.role}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-white/50 pt-2 border-t border-white/5 mt-2">
                <span>WCA: <strong className="text-white font-mono">{u.wcaId}</strong></span>
                <span>{u.solves} solves</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for Edit / Add Algorithm */}
      {editingAlg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="w-full max-w-xl bg-[#0E131F] border border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <h3 className="text-lg font-bold text-white">
                {isAddingNew ? 'Thêm Thuật Toán Mới' : `Chỉnh Sửa ${editingAlg.code}`}
              </h3>
              <button
                onClick={() => setEditingAlg(null)}
                className="p-2 rounded-full text-white/40 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAlgorithm} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/50 block mb-1">Mã (Code)</label>
                  <input
                    type="text"
                    value={editingAlg.code}
                    onChange={(e) => setEditingAlg({ ...editingAlg, code: e.target.value })}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-white/50 block mb-1">Nhóm (Category)</label>
                  <select
                    value={editingAlg.category}
                    onChange={(e) => setEditingAlg({ ...editingAlg, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Cross">Cross</option>
                    <option value="F2L">F2L</option>
                    <option value="OLL">OLL</option>
                    <option value="PLL">PLL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-white/50 block mb-1">Tên Thuật Toán</label>
                <input
                  type="text"
                  value={editingAlg.name}
                  onChange={(e) => setEditingAlg({ ...editingAlg, name: e.target.value })}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-white/50 block mb-1">Công Thức Xoay (Notation)</label>
                <input
                  type="text"
                  value={editingAlg.notation}
                  onChange={(e) => setEditingAlg({ ...editingAlg, notation: e.target.value })}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-mono text-[#00F0FF]"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-white/50 block mb-1">Mô Tả Tiếng Việt</label>
                <textarea
                  value={editingAlg.descriptionVi}
                  onChange={(e) => setEditingAlg({ ...editingAlg, descriptionVi: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-white/50 block mb-1">Fingertrick Tip (Tiếng Việt)</label>
                <input
                  type="text"
                  value={editingAlg.executionTipVi}
                  onChange={(e) => setEditingAlg({ ...editingAlg, executionTipVi: e.target.value })}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingAlg(null)}
                  className="px-4 py-2 rounded-xl text-xs text-white/60 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00F0FF] text-black font-semibold text-xs rounded-xl hover:bg-[#00F0FF]/90 transition-all flex items-center gap-1.5 shadow-md shadow-[#00F0FF]/20"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Thay Đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
