'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export function useWallet() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect, isPending: isDisconnecting } = useDisconnect();

  return {
    address,
    isConnected,
    chainId,
    connect,
    connectors,
    disconnect,
    isConnecting,
    isDisconnecting,
  };
}

export function useAuth() {
  const { address } = useWallet();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', address],
    queryFn: () =>
      address
        ? apiClient.get(`/api/users/${address}`)
        : Promise.resolve(null),
    enabled: !!address,
  });

  const isAuthenticated = !!user && !!address;

  return {
    user,
    address,
    isAuthenticated,
    isLoading,
    error,
  };
}
