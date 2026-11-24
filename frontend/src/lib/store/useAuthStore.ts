import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  wcaId?: string;
  bio?: string;
  roles: string[];
  preferredLanguage: string;
  themePreference: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  setUser: (user: User | null, token?: string | null) => void;
  logout: () => void;
  loginAsDemo: () => void;
  loginAsAdmin: () => void;
}

const DEMO_USER: User = {
  id: 'cubist-demo-id',
  email: 'cubist@cubex.com',
  displayName: 'Minh Speedcuber',
  wcaId: '2025MINH02',
  bio: 'CFOP Sub-12 solver aiming for Sub-10 in 2026.',
  roles: ['Cubist'],
  preferredLanguage: 'vi',
  themePreference: 'dark'
};

const ADMIN_USER: User = {
  id: 'admin-demo-id',
  email: 'admin@cubex.com',
  displayName: 'Cubex Administrator',
  wcaId: '2026CUBE01',
  bio: 'CUBEX Lead Architect & Speedcubing Coach.',
  roles: ['Admin', 'Cubist'],
  preferredLanguage: 'vi',
  themePreference: 'dark'
};

export const useAuthStore = create<AuthState>((set) => ({
  user: DEMO_USER, // default to signed-in demo user for instant smooth experience
  token: 'mock-jwt-token-cubex-2026',
  isAuthenticated: true,
  isAdmin: false,

  setUser: (user, token) => {
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('cubex_token', token);
      else localStorage.removeItem('cubex_token');
    }
    set({
      user,
      token: token || null,
      isAuthenticated: !!user,
      isAdmin: user?.roles?.includes('Admin') ?? false
    });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cubex_token');
    }
    set({ user: null, token: null, isAuthenticated: false, isAdmin: false });
  },

  loginAsDemo: () => {
    set({
      user: DEMO_USER,
      token: 'demo-token',
      isAuthenticated: true,
      isAdmin: false
    });
  },

  loginAsAdmin: () => {
    set({
      user: ADMIN_USER,
      token: 'admin-token',
      isAuthenticated: true,
      isAdmin: true
    });
  }
}));
