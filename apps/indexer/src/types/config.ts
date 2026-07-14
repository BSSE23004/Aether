/**
 * Configuration type definitions
 */

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorer: string;
}

export interface ContractConfig {
  name: string;
  address: string;
  abi: any[];
  startBlock?: number;
  enabled: boolean;
}

export interface IndexerConfig {
  networks: Record<string, NetworkConfig>;
  contracts: ContractConfig[];
  pollInterval: number;
  batchSize: number;
  maxRetries: number;
  retryDelay: number;
  enableRedis: boolean;
  enableNotifications: boolean;
  databaseUrl: string;
  redisUrl?: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}