/**
 * WalletChainAlert - Alert when user is on wrong chain
 * 
 * Prompts user to switch to Base Sepolia testnet
 */

'use client';

import { useEffect, useState } from 'react';
import { useSwitchChain } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { useNetwork } from '@/hooks/wallet';

export function WalletChainAlert() {
  const { isCorrectChain } = useNetwork();
  const { switchChain } = useSwitchChain();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(!isCorrectChain);
  }, [isCorrectChain]);

  if (isVisible && !isCorrectChain) {
    return (
      <div className="w-full bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-yellow-800">
              Wrong Network Detected
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              Aether runs on Base Sepolia testnet. Please switch networks to continue.
            </p>
          </div>
          <button
            onClick={() => switchChain?.({ chainId: baseSepolia.id })}
            className="px-4 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition"
            disabled={!switchChain}
          >
            Switch to Base Sepolia
          </button>
        </div>
      </div>
    );
  }

  return null;
}
