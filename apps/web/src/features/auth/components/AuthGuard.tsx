'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '@/config';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (requireAuth && !isConnected) {
      router.push(ROUTES.AUTH.CONNECT);
    }
  }, [isConnected, requireAuth, router]);

  if (requireAuth && !isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Please connect your wallet</h1>
          <p className="text-muted-foreground">
            You need to connect your wallet to access this page.
          </p>
          <Link
            href={ROUTES.AUTH.CONNECT}
            className="inline-block px-6 py-2 bg-aether-primary text-white rounded-lg"
          >
            Connect Wallet
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
