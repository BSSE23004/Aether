/**
 * Main indexer engine that coordinates all components
 */

import { BlockTracker } from './block-tracker.js';
import { EventExtractor } from './event-extractor.js';
import { HandlerRegistry } from '../handlers/index.js';
import { DatabaseService } from '../services/database.service.js';
import { RedisService } from '../services/redis.service.js';
import { LoggerService } from '../services/logger.service.js';
import { IndexerConfig, IndexerStats } from '../types/index.js';
import { IndexerError } from '../utils/errors.js';

export class Indexer {
  private config: IndexerConfig;
  private blockTracker: BlockTracker;
  private eventExtractor: EventExtractor;
  private handlerRegistry: HandlerRegistry;
  private db: DatabaseService;
  private redis: RedisService;
  private logger: LoggerService;
  
  private isRunning: boolean = false;
  private stats: IndexerStats;
  private startTime: Date;

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
    this.handlerRegistry = new HandlerRegistry();
    
    // Initialize stats
    this.startTime = new Date();
    this.stats = {
      chain: 'base-sepolia',
      currentBlock: 0,
      lastProcessedBlock: 0,
      lag: 0,
      totalEventsProcessed: 0,
      totalErrors: 0,
      reorgCount: 0,
      startTime: this.startTime,
      uptime: 0
    };
  }

  /**
   * Initialize the indexer
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing indexer...');

      // Set log level
      this.logger.setLogLevel(this.config.logLevel);

      // Connect to database
      await this.db.connect();

      // Connect to Redis if enabled
      if (this.config.enableRedis) {
        await this.redis.connect();
      }

      // Initialize block tracker
      await this.blockTracker.initialize();

      // Initialize event handlers
      this.handlerRegistry.initializeDefaultHandlers();

      this.logger.info('Indexer initialized successfully', {
        contracts: this.config.contracts.filter(c => c.enabled).map(c => c.name),
        network: 'base-sepolia'
      });
    } catch (error) {
      throw new IndexerError(
        `Failed to initialize indexer: ${(error as Error).message}`,
        'INDEXER_INIT_FAILED',
        false,
        { error }
      );
    }
  }

  /**
   * Start the indexer
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Indexer is already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('Starting indexer...');

    try {
      while (this.isRunning) {
        await this.processBlock();
        
        // Wait for poll interval
        await this.sleep(this.config.pollInterval);
      }
    } catch (error) {
      this.isRunning = false;
      throw new IndexerError(
        `Indexer stopped unexpectedly: ${(error as Error).message}`,
        'INDEXER_STOPPED',
        false,
        { error }
      );
    }
  }

  /**
   * Stop the indexer
   */
  async stop(): Promise<void> {
    this.logger.info('Stopping indexer...');
    this.isRunning = false;

    // Disconnect from services
    await this.db.disconnect();
    if (this.config.enableRedis) {
      await this.redis.disconnect();
    }

    this.logger.info('Indexer stopped');
  }

  /**
   * Process a single block
   */
  private async processBlock(): Promise<void> {
    try {
      // Check for reorg
      const reorgInfo = await this.blockTracker.checkReorg();
      if (reorgInfo) {
        this.logger.logReorgDetected(
          reorgInfo.newBlockHash,
          reorgInfo.previousBlockHash,
          reorgInfo.depth
        );
        
        await this.blockTracker.handleReorg(reorgInfo);
        this.stats.reorgCount++;
        return;
      }

      // Get current state
      const syncState = this.blockTracker.getSyncState();
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

      this.logger.info('Processing block range', {
        fromBlock: nextBlock,
        toBlock,
        batchSize
      });

      const startTime = Date.now();
      let totalEvents = 0;

      // Process each block in the range
      for (let blockNumber = nextBlock; blockNumber <= toBlock; blockNumber++) {
        try {
          const events = await this.processSingleBlock(blockNumber);
          totalEvents += events.length;
          
          // Update block tracker
          const blockData = await this.blockTracker.getBlock(blockNumber);
          await this.blockTracker.updateSyncState(blockData);
        } catch (error) {
          this.logger.error(`Failed to process block ${blockNumber}`, { error });
          this.stats.totalErrors++;
          throw error;
        }
      }

      const processingTime = Date.now() - startTime;
      this.stats.totalEventsProcessed += totalEvents;

      this.logger.info('Block range processed', {
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
      this.logger.error('Error processing block', { error });
      this.stats.totalErrors++;
      throw error;
    }
  }

  /**
   * Process a single block
   */
  private async processSingleBlock(blockNumber: number): Promise<any[]> {
    const startTime = Date.now();

    try {
      // Extract events from block
      const events = await this.eventExtractor.extractBlockEvents(blockNumber);
      
      if (events.length === 0) {
        this.logger.debug('No events in block', { blockNumber });
        return [];
      }

      this.logger.debug('Events extracted from block', {
        blockNumber,
        eventCount: events.length
      });

      // Process events through handlers
      const result = await this.handlerRegistry.processEvents(events);

      if (result.failed > 0) {
        this.logger.warn('Some events failed to process', {
          blockNumber,
          failed: result.failed,
          processed: result.processed,
          errors: result.errors
        });
      }

      const processingTime = Date.now() - startTime;
      this.logger.logBlockProcessed(blockNumber, result.processed, processingTime);

      return events;
    } catch (error) {
      throw new IndexerError(
        `Failed to process block ${blockNumber}: ${(error as Error).message}`,
        'BLOCK_PROCESSING_FAILED',
        true,
        { blockNumber, error }
      );
    }
  }

  /**
   * Publish stats to Redis
   */
  private async publishStats(): Promise<void> {
    try {
      const statsKey = 'indexer:stats:base-sepolia';
      await this.redis.set(statsKey, JSON.stringify(this.stats), 60); // TTL: 60 seconds
    } catch (error) {
      this.logger.error('Failed to publish stats to Redis', { error });
    }
  }

  /**
   * Get current stats
   */
  getStats(): IndexerStats {
    this.stats.uptime = Date.now() - this.startTime.getTime();
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
      
      return dbHealthy && redisHealthy;
    } catch (error) {
      this.logger.error('Health check failed', { error });
      return false;
    }
  }
}