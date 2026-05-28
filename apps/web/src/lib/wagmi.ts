import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia } from 'wagmi/chains';
import { QueryClient } from '@tanstack/react-query';
import { http } from 'viem';

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'default';
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org';

export const wagmiConfig = getDefaultConfig({
  appName: 'Aether',
  projectId,
  chains: [baseSepolia],
  ssr: true,
  transports: {
    [baseSepolia.id]: http(rpcUrl),
  },
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
