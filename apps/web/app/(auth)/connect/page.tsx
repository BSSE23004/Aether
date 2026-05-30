'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useEffect } from 'react';
import { ConnectWalletCard } from '@/components/wallet';
import { TopNav } from '@/components/layout/TopNav';

export default function ConnectPage() {
  const router = useRouter();
  const { isConnected, address } = useAccount();

  useEffect(() => {
    if (isConnected && address) {
      router.push('/dashboard');
    }
  }, [isConnected, address, router]);

  return (
    <>
      <TopNav />
      <div className="min-h-screen pt-16 flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold">Connect Wallet</h1>
            <p className="text-muted-foreground">
              Sign in with your Web3 wallet to access Aether
            </p>
          </div>

          {/* Connection Card */}
          <ConnectWalletCard />

          {/* Info Section */}
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                ✨ Supported Wallets
              </h3>
              <p className="text-sm text-muted-foreground">
                We support all Ethereum-compatible wallets via WalletConnect:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 pl-4">
                <li>• MetaMask</li>
                <li>• Coinbase Wallet</li>
                <li>• Ledger</li>
                <li>• Trezor</li>
                <li>• And 20+ more wallets</li>
              </ul>
            </div>
            
            <div className="border-t pt-4 space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                🔗 Network
              </h3>
              <p className="text-sm text-muted-foreground">
                Aether runs exclusively on <strong>Base Sepolia</strong> testnet.
                Make sure your wallet is configured for this network.
              </p>
            </div>
          </div>

          {/* Back Link */}
          <Link
            href="/"
            className="block text-center text-aether-primary hover:underline text-sm"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </>
  );
}
