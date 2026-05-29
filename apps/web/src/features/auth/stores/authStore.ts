/**
 * Auth store - authentication state
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthStoreState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStoreState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        token: null,
        isAuthenticated: false,
        setUser: (user) => {
          set({ user, isAuthenticated: !!user });
        },
        setToken: (token) => {
          set({ token });
        },
        logout: () => {
          set({ user: null, token: null, isAuthenticated: false });
        },
      }),
      {
        name: 'aether-auth-store',
        partialize: (state) => ({
          token: state.token,
        }),
      }
    )
  )
);
