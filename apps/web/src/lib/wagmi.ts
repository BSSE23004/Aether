/**
 * Wagmi configuration for Web3 wallet connection
 * 
 * Features:
 * - RainbowKit integration
 * - Base Sepolia testnet
 * - WalletConnect support
 * - Auto-reconnect to last connected wallet
 * - SSR-safe configuration
 */

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia } from 'wagmi/chains';
import { QueryClient } from '@tanstack/react-query';
import { http } from 'viem';

// Validate required environment variables
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;
if (!projectId || projectId === 'default') {
  console.warn(
    '[Wagmi] WalletConnect Project ID not configured. Get one free from https://cloud.walletconnect.com'
  );
}

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org';

if (!rpcUrl.startsWith('http')) {
  throw new Error('[Wagmi] Invalid RPC URL');
}

/**
 * Wagmi configuration with RainbowKit defaults
 * - Auto-detects and connects to previously connected wallet
 * - Supports all major wallets via WalletConnect
 * - SSR-safe for Next.js App Router
 */
export const wagmiConfig = getDefaultConfig({
  appName: 'Aether',
  projectId: projectId || 'default',
  chains: [baseSepolia],
  ssr: true, // Enable SSR support for Next.js
  transports: {
    [baseSepolia.id]: http(rpcUrl, {
      timeout: 10_000,
      batch: {
        wait: 50,
      },
    }),
  },
});

/**
 * TanStack Query client configuration
 * Optimized for blockchain data fetching with appropriate cache times
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - blockchain data is relatively stable
      gcTime: 1000 * 60 * 10, // 10 minutes - keep data in memory for quick re-renders
      retry: 2, // Retry failed requests twice for network resilience
      refetchOnWindowFocus: false, // Don't refetch when user switches tabs
    },
    mutations: {
      retry: 1,
    },
  },
});
