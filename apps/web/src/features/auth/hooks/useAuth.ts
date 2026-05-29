/**
 * useAuth - current auth state
 */

'use client';

import { useAccount } from 'wagmi';
import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  const { address, isConnected } = useAccount();
  const { user, isAuthenticated, token } = useAuthStore();

  return {
    user,
    address,
    isConnected,
    isAuthenticated,
    hasToken: !!token,
  };
}
