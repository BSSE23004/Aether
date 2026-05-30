/**
 * WalletStatus - Connection status indicator
 * 
 * Shows current wallet connection state with visual feedback
 */

'use client';

import { useAccount, useBalance } from 'wagmi';
import { useNetwork } from '@/hooks/wallet';

export function WalletStatus() {
  const { address, isConnected, chainId } = useAccount();
  const { data: balance } = useBalance({ address, enabled: isConnected });
  const { isCorrectChain, requiredChainId } = useNetwork();

  if (!isConnected) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {/* Chain indicator */}
      {!isCorrectChain && (
        <div className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
          Wrong Network (Chain {chainId})
        </div>
      )}
      {isCorrectChain && (
        <div className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
          Base Sepolia
        </div>
      )}

      {/* Balance */}
      {balance && (
        <span className="text-muted-foreground">
          {balance.formatted.slice(0, 6)} {balance.symbol}
        </span>
      )}

      {/* Address */}
      <span className="text-muted-foreground">
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </span>
    </div>
  );
}
