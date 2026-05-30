/**
 * useRouteProtection - Protect routes based on wallet connection
 * 
 * Usage in layout:
 * ```typescript
 * 'use client';
 * import { useRouteProtection } from '@/lib/routes';
 * 
 * export default function DashboardLayout({ children }) {
 *   useRouteProtection({ requireWallet: true, requireCorrectChain: true });
 *   return children;
 * }
 * ```
 */

'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useNetwork } from '@/hooks/wallet';
import { ROUTES } from '@/config';

interface RouteProtectionOptions {
  requireWallet?: boolean;
  requireCorrectChain?: boolean;
  redirectTo?: string;
}

export function useRouteProtection({
  requireWallet = true,
  requireCorrectChain = true,
  redirectTo = ROUTES.AUTH.CONNECT,
}: RouteProtectionOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const { isConnected } = useAccount();
  const { isCorrectChain } = useNetwork();

  useEffect(() => {
    // Check if route should be protected
    if (requireWallet && !isConnected) {
      router.push(redirectTo);
      return;
    }

    // Check if user is on correct chain
    if (requireWallet && isConnected && requireCorrectChain && !isCorrectChain) {
      // Show warning but allow access (user can still see UI while connected to wrong chain)
      console.warn('User connected to wrong chain');
    }
  }, [isConnected, isCorrectChain, requireWallet, requireCorrectChain, redirectTo, router]);
}
