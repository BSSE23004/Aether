/**
 * ConnectWalletCard - Prominent wallet connection prompt
 * 
 * Displayed on landing page / auth routes
 */

'use client';

import Link from 'next/link';
import { useAccount } from 'wagmi';
import { WalletConnectButton } from './WalletConnectButton';

export function ConnectWalletCard() {
  const { isConnected } = useAccount();

  if (isConnected) {
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 border-2 border-aether-primary/20 rounded-xl bg-gradient-to-br from-aether-primary/5 to-aether-secondary/5">
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
          <p className="text-sm text-muted-foreground">
            Securely connect your Ethereum wallet to start collaborating
          </p>
        </div>

        <div className="space-y-3">
          <WalletConnectButton />

          <p className="text-xs text-muted-foreground text-center">
            No account needed. Works with any Ethereum wallet.
          </p>

          <div className="pt-2 border-t">
            <Link
              href="https://www.coinbase.com/wallet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-aether-primary hover:underline"
            >
              Don't have a wallet? Get one free →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
