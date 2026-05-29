/**
 * useLogout - logout hook
 */

'use client';

import { useCallback } from 'react';
import { useDisconnect } from 'wagmi';
import { useAuthStore } from '../stores/authStore';

export function useLogout() {
  const { disconnect } = useDisconnect();
  const { logout } = useAuthStore();

  const handleLogout = useCallback(() => {
    logout();
    disconnect();
  }, [logout, disconnect]);

  return { logout: handleLogout };
}
