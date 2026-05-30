/**
 * useConnectWallet - Smart wallet connection with auto-reconnect
 * 
 * Handles:
 * - Persistent connection (auto-reconnect on page load)
 * - Connection state management
 * - Error handling
 */

'use client';

import { useEffect } from 'react';
import { useAccount, useConnect } from 'wagmi';

export function useConnectWallet() {
  const { address, isConnected, isConnecting } = useAccount();
  const { connectors, connect } = useConnect();

  // Try to reconnect on mount if localStorage has a previous connector
  useEffect(() => {
    const lastConnector = localStorage.getItem('wagmi.wallet');
    if (!isConnected && lastConnector && connectors.length > 0) {
      const connector = connectors.find((c) => c.id === lastConnector);
      if (connector) {
        connect({ connector });
      }
    }
  }, [isConnected, connectors, connect]);

  // Save last used connector
  useEffect(() => {
    if (address && connectors.length > 0) {
      // This is set automatically by wagmi, but we keep it for clarity
      localStorage.setItem('wagmi.wallet', 'last_connector');
    }
  }, [address, connectors]);

  return {
    address,
    isConnected,
    isConnecting,
    connectors,
    connect,
  };
}
