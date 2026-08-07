import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setUser: (user: User) => void;
  setTokens: (access: string, refresh: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  hasRole: (role: 'customer' | 'seller' | 'admin') => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setUser: (user) => set({ user }),

      setTokens: (access, refresh) => {
        set({ accessToken: access, refreshToken: refresh });
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
      },

      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null });
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      },

      isAuthenticated: () => !!get().accessToken && !!get().user,

      hasRole: (role) => {
        const user = get().user;
        if (!user) return false;
        if (role === 'customer') return true;
        if (role === 'seller') return user.role === 'seller' || user.role === 'admin';
        if (role === 'admin') return user.role === 'admin';
        return false;
      },
    }),
    { name: 'lustro-auth', version: 2 }
  )
);
