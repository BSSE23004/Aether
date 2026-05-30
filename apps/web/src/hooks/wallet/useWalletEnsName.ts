/**
 * useWalletEnsName - Get ENS name for wallet address
 */

'use client';

import { useAccount, useEnsName } from 'wagmi';

export function useWalletEnsName() {
  const { address } = useAccount();
  const { data: ensName } = useEnsName({ address, chainId: 1 }); // ENS is on mainnet

  return {
    ensName,
    displayName: ensName || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not Connected'),
  };
}
