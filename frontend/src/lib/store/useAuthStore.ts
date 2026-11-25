import { create } from 'zustand';

export type UserRole = 'Admin' | 'Cubist';

export interface User {
  id: string;
  username?: string;
  googleUid?: string;
  authProvider?: 'Google' | 'Password';
  email: string;
  displayName: string;
  avatarUrl?: string;
  wcaId?: string;
  bio?: string;
  roles: string[];
  preferredLanguage: string;
  themePreference: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface PresetAccount {
  username: string;
  password: string;
  user: User;
  token: string;
}

export const PRESET_ACCOUNTS: PresetAccount[] = [
  {
    username: 'admin',
    password: '123456',
    token: 'admin-token',
    user: {
      id: 'admin-demo-id',
      username: 'admin',
      authProvider: 'Password',
      email: 'admin@cubex.com',
      displayName: 'Cubex Administrator',
      wcaId: '2026CUBE01',
      bio: 'CUBEX Lead Architect & Quản trị viên hệ thống.',
      roles: ['Admin', 'Cubist'],
      preferredLanguage: 'vi',
      themePreference: 'dark',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  },
  {
    username: 'vnpnam1',
    password: '123456',
    token: 'mock-jwt-token-cubex-2026',
    user: {
      id: 'user-vnpnam1',
      username: 'vnpnam1',
      authProvider: 'Password',
      email: 'vnpnam1@cubex.vn',
      displayName: 'vnpnam1',
      wcaId: '2026NAM01',
      bio: 'Speedcuber CUBEX Việt Nam • Sub-12 CFOP.',
      roles: ['Cubist'],
      preferredLanguage: 'vi',
      themePreference: 'dark',
      createdAt: '2026-02-01T00:00:00.000Z',
    },
  },
  {
    username: 'vnpnam2',
    password: '123456',
    token: 'mock-jwt-token-cubex-2026',
    user: {
      id: 'user-vnpnam2',
      username: 'vnpnam2',
      authProvider: 'Password',
      email: 'vnpnam2@cubex.vn',
      displayName: 'vnpnam2',
      wcaId: '2026NAM02',
      bio: 'Speedcuber CUBEX Việt Nam • Đối thủ 1v1.',
      roles: ['Cubist'],
      preferredLanguage: 'vi',
      themePreference: 'dark',
      createdAt: '2026-02-01T00:00:00.000Z',
    },
  },
];

export interface GoogleAccountInput {
  googleUid: string;
  email: string;
  displayName: string;
  avatarUrl: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  setUser: (user: User | null, token?: string | null) => void;
  loginOrLinkGoogleAccount: (profile: GoogleAccountInput, jwtToken?: string) => {
    user: User;
    isNewAccount: boolean;
    wasLinkedToExistingEmail: boolean;
  };
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
  themePreference: 'dark',
  authProvider: 'Password',
  createdAt: '2026-01-15T00:00:00.000Z',
};

const ADMIN_USER: User = {
  id: 'admin-demo-id',
  email: 'admin@cubex.com',
  displayName: 'Cubex Administrator',
  wcaId: '2026CUBE01',
  bio: 'CUBEX Lead Architect & Speedcubing Coach.',
  roles: ['Admin', 'Cubist'],
  preferredLanguage: 'vi',
  themePreference: 'dark',
  authProvider: 'Password',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const ACCOUNTS_DB_KEY = 'cubex_accounts_registry_v1';

function readAccountsRegistry(): User[] {
  if (typeof window === 'undefined') return PRESET_ACCOUNTS.map((a) => a.user);
  try {
    const raw = localStorage.getItem(ACCOUNTS_DB_KEY);
    if (!raw) {
      const seed = [DEMO_USER, ...PRESET_ACCOUNTS.map((a) => a.user)];
      localStorage.setItem(ACCOUNTS_DB_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as User[];
  } catch {
    return PRESET_ACCOUNTS.map((a) => a.user);
  }
}

function writeAccountsRegistry(accounts: User[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACCOUNTS_DB_KEY, JSON.stringify(accounts));
  } catch {
    // ignore
  }
}

function loadStoredAuth(): { user: User | null; token: string | null } {
  if (typeof window === 'undefined') {
    return { user: DEMO_USER, token: 'mock-jwt-token-cubex-2026' };
  }
  try {
    const sessionUser = sessionStorage.getItem('cubex_user');
    const sessionToken = sessionStorage.getItem('cubex_token');
    if (sessionUser && sessionToken) {
      return { user: JSON.parse(sessionUser) as User, token: sessionToken };
    }

    const rawUser = localStorage.getItem('cubex_user');
    const rawToken = localStorage.getItem('cubex_token');
    if (rawUser && rawToken) {
      return { user: JSON.parse(rawUser) as User, token: rawToken };
    }
    if (localStorage.getItem('cubex_logged_out') === '1') {
      return { user: null, token: null };
    }
  } catch {
    // ignore storage errors
  }
  return { user: DEMO_USER, token: 'mock-jwt-token-cubex-2026' };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: DEMO_USER,
  token: 'mock-jwt-token-cubex-2026',
  isAuthenticated: true,
  isAdmin: false,

  setUser: (user, token) => {
    const nowIso = new Date().toISOString();
    const enrichedUser = user
      ? {
          ...user,
          createdAt: user.createdAt ?? nowIso,
          lastLoginAt: nowIso,
        }
      : null;

    if (typeof window !== 'undefined') {
      if (enrichedUser && token) {
        sessionStorage.setItem('cubex_token', token);
        sessionStorage.setItem('cubex_user', JSON.stringify(enrichedUser));
        localStorage.setItem('cubex_token', token);
        localStorage.setItem('cubex_user', JSON.stringify(enrichedUser));
        localStorage.removeItem('cubex_logged_out');

        // Sync into accounts registry without overwriting existing account fields
        const registry = readAccountsRegistry();
        const idx = registry.findIndex(
          (u) =>
            u.id === enrichedUser.id ||
            u.email.toLowerCase() === enrichedUser.email.toLowerCase()
        );
        if (idx >= 0) {
          registry[idx] = { ...registry[idx], ...enrichedUser };
        } else {
          registry.push(enrichedUser);
        }
        writeAccountsRegistry(registry);
      } else {
        sessionStorage.removeItem('cubex_token');
        sessionStorage.removeItem('cubex_user');
        localStorage.removeItem('cubex_token');
        localStorage.removeItem('cubex_user');
      }
    }
    set({
      user: enrichedUser,
      token: token || null,
      isAuthenticated: !!enrichedUser,
      isAdmin: enrichedUser?.roles?.includes('Admin') ?? false,
    });
  },

  loginOrLinkGoogleAccount: (profile, jwtToken) => {
    const nowIso = new Date().toISOString();
    const registry = readAccountsRegistry();

    // 1. Check by Google UID (Each Google UID is strictly linked to at most 1 account)
    let matched = registry.find(
      (u) => u.googleUid && u.googleUid === profile.googleUid
    );
    let isNewAccount = false;
    let wasLinkedToExistingEmail = false;

    if (matched) {
      // Returning Google user -> update lastLoginAt & refresh avatar
      matched = {
        ...matched,
        avatarUrl: profile.avatarUrl || matched.avatarUrl,
        lastLoginAt: nowIso,
      };
      const idx = registry.findIndex((u) => u.id === matched!.id);
      if (idx >= 0) registry[idx] = matched;
    } else {
      // 2. Check if an account with the same Email already exists (Email/Password account linking)
      const existingByEmail = registry.find(
        (u) => u.email.toLowerCase() === profile.email.toLowerCase()
      );

      if (existingByEmail) {
        // Safely link Google UID to existing account without overwriting existing password/roles/history
        wasLinkedToExistingEmail = true;
        matched = {
          ...existingByEmail,
          googleUid: profile.googleUid,
          avatarUrl: existingByEmail.avatarUrl || profile.avatarUrl,
          lastLoginAt: nowIso,
        };
        const idx = registry.findIndex((u) => u.id === existingByEmail.id);
        if (idx >= 0) registry[idx] = matched;
      } else {
        // 3. Brand new Google account -> Create passwordless account
        isNewAccount = true;
        const isAdminEmail = profile.email.toLowerCase() === 'admin@cubex.com';
        matched = {
          id: `google-${profile.googleUid}`,
          googleUid: profile.googleUid,
          authProvider: 'Google',
          username: profile.email.split('@')[0],
          email: profile.email,
          displayName: profile.displayName || profile.email.split('@')[0],
          avatarUrl: profile.avatarUrl,
          wcaId: '2026GOOG01',
          bio: 'Speedcuber tại cộng đồng CUBEX Việt Nam (Google OAuth 2.0).',
          roles: isAdminEmail ? ['Admin', 'Cubist'] : ['Cubist'],
          preferredLanguage: 'vi',
          themePreference: 'dark',
          createdAt: nowIso,
          lastLoginAt: nowIso,
        };
        registry.push(matched);
      }
    }

    writeAccountsRegistry(registry);

    const effectiveToken =
      jwtToken ||
      (matched.roles.includes('Admin') ? 'admin-token' : 'mock-jwt-token-cubex-2026');

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('cubex_token', effectiveToken);
      sessionStorage.setItem('cubex_user', JSON.stringify(matched));
      localStorage.setItem('cubex_token', effectiveToken);
      localStorage.setItem('cubex_user', JSON.stringify(matched));
      localStorage.removeItem('cubex_logged_out');
    }

    set({
      user: matched,
      token: effectiveToken,
      isAuthenticated: true,
      isAdmin: matched.roles.includes('Admin'),
    });

    return { user: matched, isNewAccount, wasLinkedToExistingEmail };
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('cubex_token');
      sessionStorage.removeItem('cubex_user');
      localStorage.removeItem('cubex_token');
      localStorage.removeItem('cubex_user');
      localStorage.setItem('cubex_logged_out', '1');
    }
    set({ user: null, token: null, isAuthenticated: false, isAdmin: false });
  },

  loginAsDemo: () => {
    const nowIso = new Date().toISOString();
    const demoWithLogin = { ...DEMO_USER, lastLoginAt: nowIso };
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('cubex_token', 'mock-jwt-token-cubex-2026');
      sessionStorage.setItem('cubex_user', JSON.stringify(demoWithLogin));
      localStorage.setItem('cubex_token', 'mock-jwt-token-cubex-2026');
      localStorage.setItem('cubex_user', JSON.stringify(demoWithLogin));
      localStorage.removeItem('cubex_logged_out');
    }
    set({
      user: demoWithLogin,
      token: 'mock-jwt-token-cubex-2026',
      isAuthenticated: true,
      isAdmin: false,
    });
  },

  loginAsAdmin: () => {
    const nowIso = new Date().toISOString();
    const adminWithLogin = { ...ADMIN_USER, lastLoginAt: nowIso };
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('cubex_token', 'admin-token');
      sessionStorage.setItem('cubex_user', JSON.stringify(adminWithLogin));
      localStorage.setItem('cubex_token', 'admin-token');
      localStorage.setItem('cubex_user', JSON.stringify(adminWithLogin));
      localStorage.removeItem('cubex_logged_out');
    }
    set({
      user: adminWithLogin,
      token: 'admin-token',
      isAuthenticated: true,
      isAdmin: true,
    });
  },
}));

if (typeof window !== 'undefined') {
  const initial = loadStoredAuth();
  useAuthStore.setState({
    user: initial.user,
    token: initial.token,
    isAuthenticated: !!initial.user,
    isAdmin: initial.user?.roles?.includes('Admin') ?? false,
  });
}
