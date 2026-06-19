import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User } from '@/types';
import { setSessionCookies, clearSessionCookies } from '../utils/session';

interface AuthStoreState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStoreState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        setUser: (user) => {
          set({ user, isAuthenticated: !!user });
        },
        setTokens: (accessToken, refreshToken) => {
          set({ accessToken, refreshToken });
          if (accessToken && refreshToken) {
            setSessionCookies(accessToken, refreshToken);
          } else {
            clearSessionCookies();
          }
        },
        logout: () => {
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
          clearSessionCookies();
        },
      }),
      {
        name: 'aether-auth-store',
        partialize: (state) => ({
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
        }),
      }
    )
  )
);
