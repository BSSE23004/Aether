/**
 * WalletConnectionProvider - Wallet connection state management
 * 
 * Provides:
 * - Auto-reconnection to last wallet
 * - Chain validation
 * - Connection errors handling
 * - Persistent connection state
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { useNetwork } from '@/hooks/wallet';

interface WalletConnectionContextType {
  isReady: boolean;
  isConnected: boolean;
  isCorrectChain: boolean;
  address?: string;
  error?: string;
}

const WalletConnectionContext = React.createContext<WalletConnectionContextType | undefined>(
  undefined
);

export interface WalletConnectionProviderProps {
  children: React.ReactNode;
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

/**
 * WalletConnectionProvider wraps the app with wallet state
 * Should be placed above route groups that need wallet access
 */
export function WalletConnectionProvider({
  children,
  onConnect,
  onDisconnect,
}: WalletConnectionProviderProps) {
  const { address, isConnected } = useAccount();
  const { isCorrectChain } = useNetwork();
  const { connectors } = useConnect();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string>();

  // Initialize provider on mount
  useEffect(() => {
    // Check if we should auto-reconnect
    const savedConnector = localStorage.getItem('wagmi.wallet');
    if (savedConnector) {
      // Auto-connect is handled by wagmi + RainbowKit automatically
      // We just need to mark as ready after a short delay
      const timer = setTimeout(() => setIsReady(true), 500);
      return () => clearTimeout(timer);
    }
    setIsReady(true);
  }, []);

  // Handle connection
  useEffect(() => {
    if (isConnected && address && onConnect) {
      onConnect(address);
    }
  }, [isConnected, address, onConnect]);

  // Handle disconnection
  useEffect(() => {
    if (!isConnected && onDisconnect) {
      onDisconnect();
    }
  }, [isConnected, onDisconnect]);

  // Validate chain
  useEffect(() => {
    if (isConnected && !isCorrectChain) {
      setError('Please switch to Base Sepolia network');
    } else {
      setError(undefined);
    }
  }, [isConnected, isCorrectChain]);

  const value: WalletConnectionContextType = {
    isReady,
    isConnected,
    isCorrectChain,
    address,
    error,
  };

  return (
    <WalletConnectionContext.Provider value={value}>
      {children}
    </WalletConnectionContext.Provider>
  );
}

/**
 * useWalletConnection - Access wallet connection state
 */
export function useWalletConnection() {
  const context = React.useContext(WalletConnectionContext);
  if (!context) {
    throw new Error('useWalletConnection must be used within WalletConnectionProvider');
  }
  return context;
}
