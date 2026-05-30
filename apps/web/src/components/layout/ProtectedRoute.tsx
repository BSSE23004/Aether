/**
 * ProtectedRoute - Component wrapper for protected routes
 * 
 * Combines wallet connection check + chain validation
 * Redirects to connect page if wallet not connected
 */

'use client';

import { ReactNode } from 'react';
import { useRouteProtection } from '@/lib/routes';

interface ProtectedRouteProps {
  children: ReactNode;
  requireCorrectChain?: boolean;
}

export function ProtectedRoute({ 
  children,
  requireCorrectChain = true,
}: ProtectedRouteProps) {
  useRouteProtection({
    requireWallet: true,
    requireCorrectChain,
  });

  return <>{children}</>;
}
