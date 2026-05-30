/**
 * useNetwork - Network validation hook
 * 
 * Checks if user is connected to the correct chain (Base Sepolia)
 */

'use client';

import { useAccount } from 'wagmi';
import { AETHER_CHAIN_ID, isCorrectChain, getChainName } from '@/lib/blockchain';

export function useNetwork() {
  const { chainId } = useAccount();

  return {
    chainId,
    isCorrectChain: isCorrectChain(chainId),
    requiredChainId: AETHER_CHAIN_ID,
    chainName: getChainName(chainId),
    requiredChainName: 'Base Sepolia',
  };
}
