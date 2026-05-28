'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { useEffect } from 'react';

export default function ConnectPage() {
  const router = useRouter();
  const { isConnected, address } = useWallet();

  useEffect(() => {
    if (isConnected && address) {
      router.push('/dashboard');
    }
  }, [isConnected, address, router]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Connect Wallet</h1>
        <p className="text-muted-foreground">
          Sign in with your Web3 wallet to access Aether
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your wallet connection is managed by RainbowKit at the top-right
            of the page.
          </p>
          <div className="rounded bg-aether-primary/10 p-4">
            <p className="text-sm font-medium text-aether-primary">
              📌 Tip: Use the "Connect Wallet" button in the top navigation
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            We support all Ethereum-compatible wallets on Base Sepolia testnet.
          </p>
        </div>
      </div>

      <Link
        href="/"
        className="block text-center text-aether-primary hover:underline"
      >
        ← Back to home
      </Link>
    </div>
  );
}
