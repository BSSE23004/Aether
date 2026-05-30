/**
 * Blockchain chain utilities
 * 
 * Validators and helpers for working with blockchain networks
 */

import { baseSepolia } from 'wagmi/chains';

/** Aether target network */
export const AETHER_CHAIN = baseSepolia;

/** Aether chain ID */
export const AETHER_CHAIN_ID = baseSepolia.id;

/**
 * Validate if a chain ID is correct for Aether
 */
export function isCorrectChain(chainId?: number): boolean {
  return chainId === AETHER_CHAIN_ID;
}

/**
 * Get chain name for display
 */
export function getChainName(chainId?: number): string {
  if (!chainId) return 'Unknown';
  if (chainId === AETHER_CHAIN_ID) return 'Base Sepolia';
  return `Chain ${chainId}`;
}

/**
 * Get the correct RPC URL for the chain
 */
export function getRpcUrl(chainId?: number): string {
  if (chainId === AETHER_CHAIN_ID) {
    return process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org';
  }
  return '';
}

/**
 * Chain configuration for network switching
 */
export const CHAIN_CONFIG = {
  chainId: AETHER_CHAIN_ID,
  chainName: AETHER_CHAIN.name,
  nativeCurrency: AETHER_CHAIN.nativeCurrency,
  rpcUrls: [getRpcUrl()],
  blockExplorerUrls: AETHER_CHAIN.blockExplorers?.default?.url
    ? [AETHER_CHAIN.blockExplorers.default.url]
    : [],
};
