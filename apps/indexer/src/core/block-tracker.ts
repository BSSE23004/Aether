/**
 * Block tracking system for the indexer
 */

import { ReorgError, IndexerError } from '../utils/errors.js';
import { DatabaseService } from '../services/database.service.js';
import { LoggerService } from '../services/logger.service.js';
import { RetryService } from './retry.service.js';
import { BlockData, SyncState, ReorgInfo } from '../types/index.js';
import { createPublicClient, http } from 'viem';

export class BlockTracker {
  private db: DatabaseService;
  private logger: LoggerService;
  private client: any;
  private currentSyncState: SyncState | null = null;
  private chain: string;

  constructor(chain: string, rpcUrl: string) {
    this.chain = chain;
    this.db = DatabaseService.getInstance();
    this.logger = LoggerService.getInstance();
    
    this.client = createPublicClient({
      transport: http(rpcUrl)
    });
  }

  /**
   * Initialize block tracker
   */
  async initialize(): Promise<void> {
    try {
      await this.loadSyncState();
      this.logger.info('Block tracker initialized', {
        chain: this.chain,
        lastBlock: this.currentSyncState?.lastBlock || 0
      });
    } catch (error) {
      throw new IndexerError(
        `Failed to initialize block tracker: ${(error as Error).message}`,
        'BLOCK_TRACKER_INIT_FAILED',
        true,
        { error }
      );
    }
  }

  /**
   * Load sync state from database
   */
  private async loadSyncState(): Promise<void> {
    try {
      const state = await this.db.getChainSyncState(this.chain);
      if (state) {
        this.currentSyncState = {
          chain: state.chain,
          lastBlock: state.lastBlock,
          lastBlockHash: state.lastBlockHash,
          lastTimestamp: Math.floor(state.lastTimestamp.getTime() / 1000),
          lastProcessedAt: state.updatedAt
        };
      } else {
        // Initialize with genesis block
        this.currentSyncState = {
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
  getSyncState(): SyncState | null {
    return this.currentSyncState;
  }

  /**
   * Get latest block from blockchain
   */
  async getLatestBlock(): Promise<BlockData> {
    try {
      return await RetryService.withRetry(
        async () => {
          const block = await this.client.getBlock();
          return {
            number: Number(block.number),
            hash: block.hash,
            parentHash: block.parentHash,
            timestamp: Number(block.timestamp),
            gasUsed: block.gasUsed,
            gasLimit: block.gasLimit,
            transactions: block.transactions.length
          };
        },
        RetryService.getRpcRetryOptions()
      );
    } catch (error) {
      throw new IndexerError(
        `Failed to get latest block: ${(error as Error).message}`,
        'GET_LATEST_BLOCK_FAILED',
        true,
        { error }
      );
    }
  }

  /**
   * Get block by number
   */
  async getBlock(blockNumber: number): Promise<BlockData> {
    try {
      return await RetryService.withRetry(
        async () => {
          const block = await this.client.getBlock({ blockNumber: BigInt(blockNumber) });
          return {
            number: Number(block.number),
            hash: block.hash,
            parentHash: block.parentHash,
            timestamp: Number(block.timestamp),
            gasUsed: block.gasUsed,
            gasLimit: block.gasLimit,
            transactions: block.transactions.length
          };
        },
        RetryService.getRpcRetryOptions()
      );
    } catch (error) {
      throw new IndexerError(
        `Failed to get block ${blockNumber}: ${(error as Error).message}`,
        'GET_BLOCK_FAILED',
        true,
        { blockNumber, error }
      );
    }
  }

  /**
   * Get range of blocks
   */
  async getBlocks(fromBlock: number, toBlock: number): Promise<BlockData[]> {
    const blocks: BlockData[] = [];
    
    for (let blockNumber = fromBlock; blockNumber <= toBlock; blockNumber++) {
      try {
        const block = await this.getBlock(blockNumber);
        blocks.push(block);
      } catch (error) {
        this.logger.error(`Failed to get block ${blockNumber}`, { error });
        throw error;
      }
    }

    return blocks;
  }

  /**
   * Check for reorg by comparing block hashes
   */
  async checkReorg(): Promise<ReorgInfo | null> {
    if (!this.currentSyncState || this.currentSyncState.lastBlock === 0) {
      return null;
    }

    try {
      const currentBlock = await this.getBlock(this.currentSyncState.lastBlock);
      
      if (currentBlock.hash !== this.currentSyncState.lastBlockHash) {
        this.logger.warn('Reorg detected', {
          expectedHash: this.currentSyncState.lastBlockHash,
          actualHash: currentBlock.hash,
          blockNumber: this.currentSyncState.lastBlock
        });

        // Calculate reorg depth
        const depth = await this.calculateReorgDepth(
          this.currentSyncState.lastBlock,
          this.currentSyncState.lastBlockHash
        );

        return {
          detectedAt: Date.now(),
          newBlockHash: currentBlock.hash,
          previousBlockHash: this.currentSyncState.lastBlockHash,
          affectedBlocks: Array.from(
            { length: depth },
            (_, i) => this.currentSyncState!.lastBlock - i
          ),
          depth
        };
      }

      return null;
    } catch (error) {
      throw new IndexerError(
        `Failed to check for reorg: ${(error as Error).message}`,
        'REORG_CHECK_FAILED',
        true,
        { error }
      );
    }
  }

  /**
   * Calculate reorg depth by walking back the chain
   */
  private async calculateReorgDepth(
    blockNumber: number,
    expectedHash: string
  ): Promise<number> {
    let depth = 0;
    let currentBlockNumber = blockNumber;

    while (depth < 100) { // Safety limit
      try {
        const block = await this.getBlock(currentBlockNumber);
        if (block.hash === expectedHash) {
          return depth;
        }
        depth++;
        currentBlockNumber--;
      } catch (error) {
        this.logger.error(`Failed to get block ${currentBlockNumber} during reorg check`, { error });
        return depth;
      }
    }

    return depth;
  }

  /**
   * Handle reorg by rolling back to safe block
   */
  async handleReorg(reorgInfo: ReorgInfo): Promise<number> {
    this.logger.warn('Handling reorg', {
      depth: reorgInfo.depth,
      affectedBlocks: reorgInfo.affectedBlocks.length
    });

    try {
      // Delete events from affected blocks
      const fromBlock = Math.min(...reorgInfo.affectedBlocks);
      const toBlock = Math.max(...reorgInfo.affectedBlocks);
      
      await this.db.deleteContractEventsByBlockRange(fromBlock, toBlock);
      
      // Update sync state to last safe block
      const safeBlock = fromBlock - 1;
      const safeBlockData = await this.getBlock(safeBlock);
      
      this.currentSyncState = {
        chain: this.chain,
        lastBlock: safeBlock,
        lastBlockHash: safeBlockData.hash,
        lastTimestamp: safeBlockData.timestamp,
        lastProcessedAt: new Date()
      };

      await this.updateSyncState();

      this.logger.info('Reorg handled successfully', {
        safeBlock,
        blocksDeleted: reorgInfo.affectedBlocks.length
      });

      return safeBlock;
    } catch (error) {
      throw new ReorgError(
        `Failed to handle reorg: ${(error as Error).message}`,
        { reorgInfo, error }
      );
    }
  }

  /**
   * Update sync state after processing block
   */
  async updateSyncState(blockData?: BlockData): Promise<void> {
    try {
      if (blockData) {
        this.currentSyncState = {
          chain: this.chain,
          lastBlock: blockData.number,
          lastBlockHash: blockData.hash,
          lastTimestamp: blockData.timestamp,
          lastProcessedAt: new Date()
        };
      }

      if (this.currentSyncState) {
        await this.db.updateChainSyncState({
          chain: this.currentSyncState.chain,
          lastBlock: this.currentSyncState.lastBlock,
          lastBlockHash: this.currentSyncState.lastBlockHash,
          lastTimestamp: this.currentSyncState.lastTimestamp
        });

        this.logger.logSyncStateUpdate(
          this.currentSyncState.chain,
          this.currentSyncState.lastBlock,
          this.currentSyncState.lastBlockHash
        );
      }
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
   * Get processing lag
   */
  async getLag(): Promise<number> {
    try {
      const latestBlock = await this.getLatestBlock();
      const lastProcessedBlock = this.currentSyncState?.lastBlock || 0;
      return latestBlock.number - lastProcessedBlock;
    } catch (error) {
      this.logger.error('Failed to calculate lag', { error });
      return 0;
    }
  }

  /**
   * Reset sync state to specific block
   */
  async resetToBlock(blockNumber: number): Promise<void> {
    try {
      const blockData = await this.getBlock(blockNumber);
      
      this.currentSyncState = {
        chain: this.chain,
        lastBlock: blockData.number,
        lastBlockHash: blockData.hash,
        lastTimestamp: blockData.timestamp,
        lastProcessedAt: new Date()
      };

      await this.updateSyncState();
      
      this.logger.info('Sync state reset', {
        blockNumber,
        blockHash: blockData.hash
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
}