import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      status: 'loading',

      setUser: (user) => set({ user, status: 'authenticated' }),

      logout: async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        set({ user: null, status: 'unauthenticated' });
        window.location.href = '/login';
      },

      checkAuth: async () => {
        try {
          const res = await fetch('/api/auth/me', { cache: 'no-store' });
          if (!res.ok) {
            set({ user: null, status: 'unauthenticated' });
            return;
          }
          const { user } = await res.json();
          set({ user, status: 'authenticated' });
        } catch {
          set({ user: null, status: 'unauthenticated' });
        }
      },
    }),
    {
      name: 'core-saas-auth',
      partialize: (state) => ({ user: state.user }),
    },
  ),
);