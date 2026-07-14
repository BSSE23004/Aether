/**
 * Network configurations for different chains
 */

export const NETWORKS: Record<string, any> = {
  'base-sepolia': {
    name: 'base-sepolia',
    chainId: 84532,
    rpcUrl: 'https://sepolia.base.org',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    blockExplorer: 'https://sepolia.basescan.org'
  },
  'base-mainnet': {
    name: 'base-mainnet',
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    blockExplorer: 'https://basescan.org'
  },
  'ethereum-sepolia': {
    name: 'ethereum-sepolia',
    chainId: 11155111,
    rpcUrl: 'https://sepolia.infura.io/v3/',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    blockExplorer: 'https://sepolia.etherscan.io'
  }
};

/**
 * Get network configuration by chain ID
 */
export function getNetworkByChainId(chainId: number): NetworkConfig | undefined {
  return Object.values(NETWORKS).find(
    network => network.chainId === chainId
  );
}

/**
 * Get network configuration by name
 */
export function getNetworkByName(name: string): NetworkConfig | undefined {
  return NETWORKS[name];
}