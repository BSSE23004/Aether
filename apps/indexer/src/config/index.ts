/**
 * Configuration management for the blockchain indexer
 */

import { NETWORKS } from './networks.js';
import { loadContractABI } from './contracts.js';

export interface ContractConfig {
  name: string;
  address: string;
  abi: any[];
  startBlock?: number;
  enabled: boolean;
}

export interface IndexerConfig {
  networks: Record<string, any>;
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

// Default contract configurations
const DEFAULT_CONTRACTS: ContractConfig[] = [
  {
    name: 'CommunityRegistry',
    address: process.env.COMMUNITY_REGISTRY_ADDRESS || '',
    abi: [],
    startBlock: 0,
    enabled: true
  },
  {
    name: 'MembershipPass',
    address: process.env.MEMBERSHIP_PASS_ADDRESS || '',
    abi: [],
    startBlock: 0,
    enabled: true
  },
  {
    name: 'Governor',
    address: process.env.GOVERNOR_ADDRESS || '',
    abi: [],
    startBlock: 0,
    enabled: true
  }
];

// Default indexer configuration
export const DEFAULT_CONFIG: IndexerConfig = {
  networks: NETWORKS,
  contracts: DEFAULT_CONTRACTS,
  pollInterval: parseInt(process.env.POLL_INTERVAL || '2000', 10),
  batchSize: parseInt(process.env.BATCH_SIZE || '100', 10),
  maxRetries: parseInt(process.env.MAX_RETRIES || '5', 10),
  retryDelay: parseInt(process.env.RETRY_DELAY || '1000', 10),
  enableRedis: process.env.ENABLE_REDIS === 'true',
  enableNotifications: process.env.ENABLE_NOTIFICATIONS === 'true',
  databaseUrl: process.env.DATABASE_URL || '',
  redisUrl: process.env.REDIS_URL,
  logLevel: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info'
};

/**
 * Get merged configuration with environment overrides
 */
export async function getConfig(): Promise<IndexerConfig> {
  const contracts = await Promise.all(
    DEFAULT_CONTRACTS.map(async (contract) => ({
      ...contract,
      address: process.env[`${contract.name.toUpperCase()}_ADDRESS`] || contract.address,
      abi: await loadContractABI(contract.name),
      enabled: process.env[`${contract.name.toUpperCase()}_ENABLED`] !== 'false'
    }))
  );

  return {
    ...DEFAULT_CONFIG,
    networks: {
      ...NETWORKS,
      'base-sepolia': {
        ...NETWORKS['base-sepolia'],
        rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || NETWORKS['base-sepolia'].rpcUrl
      }
    },
    contracts
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: IndexerConfig): void {
  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  if (config.enableRedis && !config.redisUrl) {
    throw new Error('REDIS_URL is required when ENABLE_REDIS is true');
  }

  const enabledContracts = config.contracts.filter(c => c.enabled);
  if (enabledContracts.length === 0) {
    throw new Error('At least one contract must be enabled');
  }

  for (const contract of enabledContracts) {
    if (!contract.address) {
      throw new Error(`${contract.name}_ADDRESS is required`);
    }
  }
}