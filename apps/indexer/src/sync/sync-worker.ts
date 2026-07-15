/**
 * Event sync worker
 * Main worker that coordinates event synchronization from blockchain to database
 */

import { BlockTracker } from '../core/block-tracker.js';
import { EventExtractor } from '../core/event-extractor.js';
import { SyncCoordinator } from './sync-coordinator.js';
import { ChainSyncStateManager } from './chain-sync-state-manager.js';
import { EventValidator } from './event-validator.js';
import { EventTransformer } from './event-transformer.js';
import { DatabaseService } from '../services/database.service.js';
import { RedisService } from '../services/redis.service.js';
import { LoggerService } from '../services/logger.service.js';
import { IndexerConfig } from '../types/config.js';
import { IndexerError } from '../utils/errors.js';

export interface SyncWorkerStats {
  chain: string;
  currentBlock: number;
  lastProcessedBlock: number;
  lag: number;
  totalEventsProcessed: number;
  totalEventsFailed: number;
  totalEventsSkipped: number;
  reorgCount: number;
  startTime: Date;
  uptime: number;
  processorStats: Record<string, any>;
}

export class SyncWorker {
  private config: IndexerConfig;
  private blockTracker: BlockTracker;
  private eventExtractor: EventExtractor;
  private syncCoordinator: SyncCoordinator;
  private chainSyncStateManager: ChainSyncStateManager;
  private eventValidator: EventValidator;
  private eventTransformer: EventTransformer;
  private db: DatabaseService;
  private redis: RedisService;
  private logger: LoggerService;
  
  private isRunning: boolean = false;
  private stats: SyncWorkerStats;
  private startTime: Date;
  private reorgCount: number = 0;

  constructor(config: IndexerConfig) {
    this.config = config;
    this.logger = LoggerService.getInstance();
    this.db = DatabaseService.getInstance();
    this.redis = RedisService.getInstance();
    
    // Get network configuration
    const network = config.networks['base-sepolia'];
    if (!network) {
      throw new IndexerError('Base Sepolia network configuration not found', 'NETWORK_NOT_FOUND', false);
    }

    // Initialize components
    this.blockTracker = new BlockTracker('base-sepolia', network.rpcUrl);
    this.eventExtractor = new EventExtractor(network.rpcUrl, config.contracts);
    this.syncCoordinator = new SyncCoordinator();
    this.chainSyncStateManager = new ChainSyncStateManager('base-sepolia');
    this.eventValidator = new EventValidator();
    this.eventTransformer = new EventTransformer();
    
    // Initialize stats
    this.startTime = new Date();
    this.stats = {
      chain: 'base-sepolia',
      currentBlock: 0,
      lastProcessedBlock: 0,
      lag: 0,
      totalEventsProcessed: 0,
      totalEventsFailed: 0,
      totalEventsSkipped: 0,
      reorgCount: 0,
      startTime: this.startTime,
      uptime: 0,
      processorStats: {}
    };
  }

  /**
   * Initialize the sync worker
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing sync worker...');

      // Set log level
      this.logger.setLogLevel(this.config.logLevel);

      // Connect to database
      await this.db.connect();

      // Connect to Redis if enabled
      if (this.config.enableRedis) {
        await this.redis.connect();
      }

      // Initialize components
      await this.blockTracker.initialize();
      await this.chainSyncStateManager.initialize();
      await this.syncCoordinator.initialize();

      this.logger.info('Sync worker initialized successfully', {
        chain: 'base-sepolia',
        processors: this.syncCoordinator.getSupportedEventTypes()
      });
    } catch (error) {
      throw new IndexerError(
        `Failed to initialize sync worker: ${(error as Error).message}`,
        'SYNC_WORKER_INIT_FAILED',
        false,
        { error }
      );
    }
  }

  /**
   * Start the sync worker
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Sync worker is already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('Starting sync worker...');

    try {
      while (this.isRunning) {
        await this.processSyncCycle();
        
        // Wait for poll interval
        await this.sleep(this.config.pollInterval);
      }
    } catch (error) {
      this.isRunning = false;
      throw new IndexerError(
        `Sync worker stopped unexpectedly: ${(error as Error).message}`,
        'SYNC_WORKER_STOPPED',
        false,
        { error }
      );
    }
  }

  /**
   * Stop the sync worker
   */
  async stop(): Promise<void> {
    this.logger.info('Stopping sync worker...');
    this.isRunning = false;

    // Disconnect from services
    await this.db.disconnect();
    if (this.config.enableRedis) {
      await this.redis.disconnect();
    }

    this.logger.info('Sync worker stopped');
  }

  /**
   * Process a single sync cycle
   */
  private async processSyncCycle(): Promise<void> {
    try {
      // Check for reorg
      const reorgInfo = await this.blockTracker.checkReorg();
      if (reorgInfo) {
        this.logger.warn('Reorg detected', {
          newBlockHash: reorgInfo.newBlockHash,
          previousBlockHash: reorgInfo.previousBlockHash,
          depth: reorgInfo.depth
        });
        
        await this.handleReorg(reorgInfo);
        this.reorgCount++;
        this.stats.reorgCount = this.reorgCount;
        return;
      }

      // Get current state
      const syncState = this.chainSyncStateManager.getState();
      const latestBlock = await this.blockTracker.getLatestBlock();
      
      this.stats.currentBlock = latestBlock.number;
      this.stats.lastProcessedBlock = syncState?.lastBlock || 0;
      this.stats.lag = latestBlock.number - this.stats.lastProcessedBlock;
      this.stats.uptime = Date.now() - this.startTime.getTime();

      // Check if we're caught up
      if (syncState && syncState.lastBlock >= latestBlock.number) {
        this.logger.debug('Caught up to latest block', {
          lastProcessed: syncState.lastBlock,
          latest: latestBlock.number
        });
        return;
      }

      // Determine next block to process
      const nextBlock = syncState ? syncState.lastBlock + 1 : latestBlock.number;
      
      // Process batch of blocks
      const batchSize = Math.min(this.config.batchSize, latestBlock.number - nextBlock + 1);
      const toBlock = nextBlock + batchSize - 1;

      this.logger.info('Processing sync cycle', {
        fromBlock: nextBlock,
        toBlock,
        batchSize
      });

      const startTime = Date.now();
      let totalEvents = 0;

      // Process each block in the range
      for (let blockNumber = nextBlock; blockNumber <= toBlock; blockNumber++) {
        try {
          const events = await this.processBlock(blockNumber);
          totalEvents += events.processed;
          
          // Update block tracker and sync state
          const blockData = await this.blockTracker.getBlock(blockNumber);
          await this.blockTracker.updateSyncState(blockData);
          await this.chainSyncStateManager.updateState(blockData);
        } catch (error) {
          this.logger.error(`Failed to process block ${blockNumber}`, { error });
          this.stats.totalEventsFailed++;
          throw error;
        }
      }

      const processingTime = Date.now() - startTime;
      this.stats.totalEventsProcessed += totalEvents;

      this.logger.info('Sync cycle completed', {
        fromBlock: nextBlock,
        toBlock,
        totalEvents,
        processingTime: `${processingTime}ms`,
        eventsPerSecond: (totalEvents / (processingTime / 1000)).toFixed(2)
      });

      // Publish stats to Redis if enabled
      if (this.config.enableRedis) {
        await this.publishStats();
      }

    } catch (error) {
      this.logger.error('Error in sync cycle', { error });
      this.stats.totalEventsFailed++;
      throw error;
    }
  }

  /**
   * Process a single block
   */
  private async processBlock(blockNumber: number): Promise<{
    processed: number;
    failed: number;
    skipped: number;
  }> {
    const startTime = Date.now();

    try {
      // Extract events from block
      const events = await this.eventExtractor.extractBlockEvents(blockNumber);
      
      if (events.length === 0) {
        this.logger.debug('No events in block', { blockNumber });
        return { processed: 0, failed: 0, skipped: 0 };
      }

      this.logger.debug('Events extracted from block', {
        blockNumber,
        eventCount: events.length
      });

      // Validate events
      const validEvents = this.eventValidator.filterValidEvents(events);
      const validationStats = this.eventValidator.getValidationStats(
        this.eventValidator.validateEvents(events)
      );

      this.logger.debug('Event validation completed', {
        total: validationStats.total,
        valid: validationStats.valid,
        invalid: validationStats.invalid,
        errorRate: `${validationStats.errorRate.toFixed(2)}%`
      });

      // Transform events
      const transformedEvents = this.eventTransformer.transformEvents(validEvents);
      const groupedEvents = this.eventTransformer.groupByEntityType(transformedEvents);

      this.logger.debug('Events transformed', {
        validEvents: validEvents.length,
        transformedEvents: transformedEvents.length,
        entityTypes: Array.from(groupedEvents.keys())
      });

      // Process events through sync coordinator
      const result = await this.syncCoordinator.processEvents(validEvents);

      if (result.failed > 0) {
        this.logger.warn('Some events failed to sync', {
          blockNumber,
          failed: result.failed,
          processed: result.processed,
          errors: result.errors
        });
      }

      const processingTime = Date.now() - startTime;
      this.logger.info('Block sync completed', {
        blockNumber,
        processed: result.processed,
        failed: result.failed,
        skipped: result.skipped,
        processingTime: `${processingTime}ms`
      });

      return {
        processed: result.processed,
        failed: result.failed,
        skipped: result.skipped
      };
    } catch (error) {
      throw new IndexerError(
        `Failed to process block ${blockNumber}: ${(error as Error).message}`,
        'BLOCK_SYNC_FAILED',
        true,
        { blockNumber, error }
      );
    }
  }

  /**
   * Handle reorg
   */
  private async handleReorg(reorgInfo: any): Promise<void> {
    this.logger.warn('Handling reorg', {
      depth: reorgInfo.depth,
      affectedBlocks: reorgInfo.affectedBlocks.length
    });

    try {
      // Rollback sync state
      const safeBlock = await this.blockTracker.handleReorg(reorgInfo);
      await this.chainSyncStateManager.rollbackToBlock(safeBlock);

      this.logger.info('Reorg handled successfully', {
        safeBlock,
        blocksDeleted: reorgInfo.affectedBlocks.length
      });
    } catch (error) {
      throw new IndexerError(
        `Failed to handle reorg: ${(error as Error).message}`,
        'REORG_HANDLE_FAILED',
        false,
        { reorgInfo, error }
      );
    }
  }

  /**
   * Publish stats to Redis
   */
  private async publishStats(): Promise<void> {
    try {
      const statsKey = 'sync-worker:stats:base-sepolia';
      await this.redis.set(statsKey, JSON.stringify(this.getStats()), 60); // TTL: 60 seconds
    } catch (error) {
      this.logger.error('Failed to publish stats to Redis', { error });
    }
  }

  /**
   * Get current stats
   */
  getStats(): SyncWorkerStats {
    this.stats.uptime = Date.now() - this.startTime.getTime();
    this.stats.processorStats = this.syncCoordinator.getStats();
    return { ...this.stats };
  }

  /**
   * Sleep for a specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const dbHealthy = await this.db.healthCheck();
      const redisHealthy = this.config.enableRedis ? await this.redis.healthCheck() : true;
      const coordinatorHealthy = await this.syncCoordinator.healthCheck();
      
      return dbHealthy && redisHealthy && coordinatorHealthy;
    } catch (error) {
      this.logger.error('Health check failed', { error });
      return false;
    }
  }
}