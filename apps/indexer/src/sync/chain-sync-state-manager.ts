/**
 * Chain sync state manager
 * Manages the synchronization state for blockchain indexing
 */

import { DatabaseService } from '../services/database.service.js';
import { LoggerService } from '../services/logger.service.js';
import { IndexerError } from '../utils/errors.js';

export interface ChainSyncState {
  chain: string;
  lastBlock: number;
  lastBlockHash: string;
  lastTimestamp: number;
  lastProcessedAt: Date;
}

export class ChainSyncStateManager {
  private db: DatabaseService;
  private logger: LoggerService;
  private chain: string;
  private currentState: ChainSyncState | null = null;

  constructor(chain: string) {
    this.chain = chain;
    this.db = DatabaseService.getInstance();
    this.logger = LoggerService.getInstance();
  }

  /**
   * Initialize the sync state manager
   */
  async initialize(): Promise<void> {
    try {
      await this.loadState();
      this.logger.info('Chain sync state manager initialized', {
        chain: this.chain,
        lastBlock: this.currentState?.lastBlock || 0
      });
    } catch (error) {
      throw new IndexerError(
        `Failed to initialize sync state manager: ${(error as Error).message}`,
        'SYNC_STATE_INIT_FAILED',
        true,
        { error }
      );
    }
  }

  /**
   * Load current sync state from database
   */
  private async loadState(): Promise<void> {
    try {
      const state = await this.db.getChainSyncState(this.chain);
      if (state) {
        this.currentState = {
          chain: state.chain,
          lastBlock: state.lastBlock,
          lastBlockHash: state.lastBlockHash,
          lastTimestamp: Math.floor(state.lastTimestamp.getTime() / 1000),
          lastProcessedAt: state.updatedAt
        };
      } else {
        // Initialize with genesis block
        this.currentState = {
          chain: this.chain,
          lastBlock: 0,
          lastBlockHash: '',
          lastTimestamp: 0,
          lastProcessedAt: new Date()
        };
      }
    } catch (error) {
      throw new IndexerError(
        `Failed to load sync state: ${(error as Error).message}`,
        'SYNC_STATE_LOAD_FAILED',
        true,
        { error }
      );
    }
  }

  /**
   * Get current sync state
   */
  getState(): ChainSyncState | null {
    return this.currentState;
  }

  /**
   * Update sync state after processing a block
   */
  async updateState(blockData: {
    number: number;
    hash: string;
    timestamp: number;
  }): Promise<void> {
    try {
      this.currentState = {
        chain: this.chain,
        lastBlock: blockData.number,
        lastBlockHash: blockData.hash,
        lastTimestamp: blockData.timestamp,
        lastProcessedAt: new Date()
      };

      await this.db.updateChainSyncState({
        chain: this.chain,
        lastBlock: blockData.number,
        lastBlockHash: blockData.hash,
        lastTimestamp: blockData.timestamp
      });

      this.logger.debug('Sync state updated', {
        chain: this.chain,
        lastBlock: blockData.number,
        lastBlockHash: blockData.hash
      });
    } catch (error) {
      throw new IndexerError(
        `Failed to update sync state: ${(error as Error).message}`,
        'SYNC_STATE_UPDATE_FAILED',
        true,
        { error }
      );
    }
  }

  /**
   * Reset sync state to a specific block
   */
  async resetToBlock(blockNumber: number, blockHash: string, timestamp: number): Promise<void> {
    try {
      this.currentState = {
        chain: this.chain,
        lastBlock: blockNumber,
        lastBlockHash: blockHash,
        lastTimestamp: timestamp,
        lastProcessedAt: new Date()
      };

      await this.db.updateChainSyncState({
        chain: this.chain,
        lastBlock: blockNumber,
        lastBlockHash: blockHash,
        lastTimestamp: timestamp
      });

      this.logger.info('Sync state reset', {
        chain: this.chain,
        blockNumber,
        blockHash
      });
    } catch (error) {
      throw new IndexerError(
        `Failed to reset sync state: ${(error as Error).message}`,
        'SYNC_STATE_RESET_FAILED',
        true,
        { blockNumber, error }
      );
    }
  }

  /**
   * Rollback sync state (for reorg handling)
   */
  async rollbackToBlock(blockNumber: number): Promise<void> {
    try {
      if (!this.currentState) {
        throw new Error('No current state to rollback from');
      }

      if (blockNumber >= this.currentState.lastBlock) {
        throw new Error('Rollback block must be less than current block');
      }

      // We need to fetch the block data for the rollback point
      // This would be done by the block tracker in practice
      // For now, we'll just update the state to the block number
      this.currentState.lastBlock = blockNumber;
      this.currentState.lastBlockHash = ''; // Will be updated by block tracker
      this.currentState.lastProcessedAt = new Date();

      await this.db.updateChainSyncState({
        chain: this.chain,
        lastBlock: blockNumber,
        lastBlockHash: '', // Will be updated by block tracker
        lastTimestamp: this.currentState.lastTimestamp
      });

      this.logger.info('Sync state rolled back', {
        chain: this.chain,
        blockNumber
      });
    } catch (error) {
      throw new IndexerError(
        `Failed to rollback sync state: ${(error as Error).message}`,
        'SYNC_STATE_ROLLBACK_FAILED',
        true,
        { blockNumber, error }
      );
    }
  }

  /**
   * Get sync statistics
   */
  getStats(): {
    chain: string;
    lastBlock: number;
    lastProcessedAt: Date;
    isSynced: boolean;
  } {
    if (!this.currentState) {
      return {
        chain: this.chain,
        lastBlock: 0,
        lastProcessedAt: new Date(),
        isSynced: false
      };
    }

    return {
      chain: this.chain,
      lastBlock: this.currentState.lastBlock,
      lastProcessedAt: this.currentState.lastProcessedAt,
      isSynced: this.currentState.lastBlock > 0
    };
  }

  /**
   * Check if sync is healthy
   */
  isHealthy(): boolean {
    if (!this.currentState) {
      return false;
    }

    // Check if the last update was recent (within 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return this.currentState.lastProcessedAt > oneHourAgo;
  }

  /**
   * Get sync lag in seconds
   */
  getLag(currentTimestamp: number): number {
    if (!this.currentState || this.currentState.lastTimestamp === 0) {
      return 0;
    }

    return currentTimestamp - this.currentState.lastTimestamp;
  }
}