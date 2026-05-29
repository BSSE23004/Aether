/**
 * App store - global application state
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface AppState {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        theme: 'system',
        sidebarOpen: true,
        setTheme: (theme) => set({ theme }),
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
      }),
      {
        name: 'aether-app-store',
      }
    )
  )
);
