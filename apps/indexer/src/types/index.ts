/**
 * Shared TypeScript types for the indexer
 */

export interface BlockData {
  number: number;
  hash: string;
  parentHash: string;
  timestamp: number;
  gasUsed: bigint;
  gasLimit: bigint;
  transactions: number;
}

export interface LogData {
  address: string;
  topics: string[];
  data: string;
  blockNumber: number;
  blockHash: string;
  transactionHash: string;
  transactionIndex: number;
  logIndex: number;
  removed: boolean;
}

export interface ParsedEvent {
  contract: string;
  eventName: string;
  signature: string;
  args: Record<string, any>;
  blockNumber: number;
  blockHash: string;
  transactionHash: string;
  transactionIndex: number;
  logIndex: number;
  timestamp: number;
}

export interface ProcessedEvent {
  contract: string;
  eventName: string;
  eventType: string;
  data: Record<string, any>;
  blockNumber: number;
  blockHash: string;
  transactionHash: string;
  logIndex: number;
  timestamp: number;
}

export interface SyncState {
  chain: string;
  lastBlock: number;
  lastBlockHash: string;
  lastTimestamp: number;
  lastProcessedAt: Date;
}

export interface ReorgInfo {
  detectedAt: number;
  newBlockHash: string;
  previousBlockHash: string;
  affectedBlocks: number[];
  depth: number;
}

export interface HandlerResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{
    event: string;
    error: string;
  }>;
}

export interface IndexerStats {
  chain: string;
  currentBlock: number;
  lastProcessedBlock: number;
  lag: number;
  totalEventsProcessed: number;
  totalErrors: number;
  reorgCount: number;
  startTime: Date;
  uptime: number;
}