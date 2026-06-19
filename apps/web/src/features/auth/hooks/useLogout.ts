/**
 * useLogout - logout hook
 */

'use client';

import { useCallback } from 'react';
import { useDisconnect } from 'wagmi';
import { apiClient, endpoints } from '@/lib/api';
import { useAuthStore } from '../stores/authStore';

export function useLogout() {
  const { disconnect } = useDisconnect();
  const { logout, refreshToken } = useAuthStore();

  const handleLogout = useCallback(async () => {
    try {
      if (refreshToken) {
        await apiClient.post(endpoints.auth.logout, { refreshToken });
      }
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      logout();
      disconnect();
    }
  }, [logout, disconnect, refreshToken]);

  return { logout: handleLogout };
}
