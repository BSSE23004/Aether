'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useAsync } from '@/hooks';
import { apiClient, endpoints } from '@/lib/api';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  address: string | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const [user, setUser] = useState<User | null>(null);

  const fetchUser = async () => {
    if (!address) return null;
    try {
      const response = await apiClient.get(`${endpoints.users.profile(address)}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      return null;
    }
  };

  const { data, isLoading, error, execute } = useAsync(fetchUser, false);

  useEffect(() => {
    if (isConnected && address) {
      execute();
    } else {
      setUser(null);
    }
  }, [isConnected, address, execute]);

  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data]);

  const value: AuthContextType = {
    user,
    address,
    isLoading,
    error: error as Error | null,
    refetch: execute,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
