/**
 * Sync coordinator
 * Coordinates event synchronization across multiple processors
 */

import { BaseSyncProcessor, SyncResult } from './base-sync-processor.js';
import { MembershipSyncProcessor } from './membership-sync-processor.js';
import { ProposalSyncProcessor } from './proposal-sync-processor.js';
import { VoteSyncProcessor } from './vote-sync-processor.js';
import { TreasurySyncProcessor } from './treasury-sync-processor.js';
import { ProcessedEvent } from '../types/index.js';
import { LoggerService } from '../services/logger.service.js';
import { IndexerError } from '../utils/errors.js';

export interface SyncCoordinatorStats {
  totalProcessors: number;
  activeProcessors: number;
  totalEventsProcessed: number;
  totalEventsFailed: number;
  totalEventsSkipped: number;
  processorStats: Record<string, {
    processed: number;
    failed: number;
    skipped: number;
  }>;
}

export class SyncCoordinator {
  private processors: Map<string, BaseSyncProcessor>;
  private logger: LoggerService;
  private stats: SyncCoordinatorStats;

  constructor() {
    this.processors = new Map();
    this.logger = LoggerService.getInstance();
    this.stats = {
      totalProcessors: 0,
      activeProcessors: 0,
      totalEventsProcessed: 0,
      totalEventsFailed: 0,
      totalEventsSkipped: 0,
      processorStats: {}
    };
  }

  /**
   * Initialize the sync coordinator
   */
  async initialize(): Promise<void> {
    try {
      // Register default processors
      this.registerProcessor(new MembershipSyncProcessor());
      this.registerProcessor(new ProposalSyncProcessor());
      this.registerProcessor(new VoteSyncProcessor());
      this.registerProcessor(new TreasurySyncProcessor());

      this.stats.totalProcessors = this.processors.size;
      this.stats.activeProcessors = this.processors.size;

      this.logger.info('Sync coordinator initialized', {
        processors: Array.from(this.processors.keys())
      });
    } catch (error) {
      throw new IndexerError(
        `Failed to initialize sync coordinator: ${(error as Error).message}`,
        'SYNC_COORDINATOR_INIT_FAILED',
        false,
        { error }
      );
    }
  }

  /**
   * Register a sync processor
   */
  registerProcessor(processor: BaseSyncProcessor): void {
    const name = processor.getName();
    this.processors.set(name, processor);
    this.stats.processorStats[name] = {
      processed: 0,
      failed: 0,
      skipped: 0
    };

    this.logger.info('Sync processor registered', {
      name,
      supportedEvents: processor.getSupportedEventTypes()
    });
  }

  /**
   * Get processor by name
   */
  getProcessor(name: string): BaseSyncProcessor | undefined {
    return this.processors.get(name);
  }

  /**
   * Get all processors
   */
  getAllProcessors(): BaseSyncProcessor[] {
    return Array.from(this.processors.values());
  }

  /**
   * Process events through all processors
   */
  async processEvents(events: ProcessedEvent[]): Promise<SyncResult> {
    const combinedResult: SyncResult = {
      success: true,
      processed: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    if (events.length === 0) {
      this.logger.debug('No events to process');
      return combinedResult;
    }

    this.logger.info('Processing events through sync coordinator', {
      eventCount: events.length
    });

    // Process events through each processor
    for (const processor of this.processors.values()) {
      try {
        const result = await processor.processEvents(events);
        
        // Update combined result
        combinedResult.processed += result.processed;
        combinedResult.failed += result.failed;
        combinedResult.skipped += result.skipped;
        combinedResult.errors.push(...result.errors);

        // Update processor stats
        if (this.stats.processorStats[processor.getName()]) {
          this.stats.processorStats[processor.getName()].processed += result.processed;
          this.stats.processorStats[processor.getName()].failed += result.failed;
          this.stats.processorStats[processor.getName()].skipped += result.skipped;
        }

        // Update overall stats
        this.stats.totalEventsProcessed += result.processed;
        this.stats.totalEventsFailed += result.failed;
        this.stats.totalEventsSkipped += result.skipped;

        if (!result.success) {
          combinedResult.success = false;
          this.logger.warn('Processor reported failures', {
            processor: processor.getName(),
            failed: result.failed,
            errors: result.errors
          });
        }
      } catch (error) {
        combinedResult.failed += events.length;
        combinedResult.errors.push({
          eventType: 'PROCESSOR_ERROR',
          txHash: 'N/A',
          error: (error as Error).message
        });
        combinedResult.success = false;

        this.logger.error('Processor failed', {
          processor: processor.getName(),
          error: (error as Error).message
        });
      }
    }

    this.logger.info('Event sync completed', {
      totalEvents: events.length,
      processed: combinedResult.processed,
      failed: combinedResult.failed,
      skipped: combinedResult.skipped,
      success: combinedResult.success
    });

    return combinedResult;
  }

  /**
   * Process events by routing to appropriate processors
   */
  async processEventsByType(events: ProcessedEvent[]): Promise<SyncResult> {
    const combinedResult: SyncResult = {
      success: true,
      processed: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    if (events.length === 0) {
      return combinedResult;
    }

    // Group events by type for efficient processing
    const eventsByType = this.groupEventsByType(events);

    // Process each event type with the appropriate processor
    for (const [eventType, typeEvents] of eventsByType.entries()) {
      const processor = this.findProcessorForEventType(eventType);
      
      if (!processor) {
        this.logger.warn('No processor found for event type', { eventType });
        combinedResult.skipped += typeEvents.length;
        continue;
      }

      try {
        const result = await processor.processEvents(typeEvents);
        
        combinedResult.processed += result.processed;
        combinedResult.failed += result.failed;
        combinedResult.skipped += result.skipped;
        combinedResult.errors.push(...result.errors);

        if (!result.success) {
          combinedResult.success = false;
        }
      } catch (error) {
        combinedResult.failed += typeEvents.length;
        combinedResult.errors.push({
          eventType,
          txHash: 'N/A',
          error: (error as Error).message
        });
        combinedResult.success = false;
      }
    }

    return combinedResult;
  }

  /**
   * Group events by type
   */
  private groupEventsByType(events: ProcessedEvent[]): Map<string, ProcessedEvent[]> {
    const grouped = new Map<string, ProcessedEvent[]>();

    for (const event of events) {
      if (!grouped.has(event.eventType)) {
        grouped.set(event.eventType, []);
      }
      grouped.get(event.eventType)!.push(event);
    }

    return grouped;
  }

  /**
   * Find processor for event type
   */
  private findProcessorForEventType(eventType: string): BaseSyncProcessor | undefined {
    for (const processor of this.processors.values()) {
      if (processor.getSupportedEventTypes().includes(eventType)) {
        return processor;
      }
    }
    return undefined;
  }

  /**
   * Get coordinator statistics
   */
  getStats(): SyncCoordinatorStats {
    return {
      ...this.stats,
      activeProcessors: this.processors.size
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats.totalEventsProcessed = 0;
    this.stats.totalEventsFailed = 0;
    this.stats.totalEventsSkipped = 0;
    
    for (const key in this.stats.processorStats) {
      this.stats.processorStats[key] = {
        processed: 0,
        failed: 0,
        skipped: 0
      };
    }

    this.logger.info('Sync coordinator stats reset');
  }

  /**
   * Health check for all processors
   */
  async healthCheck(): Promise<boolean> {
    let allHealthy = true;

    for (const processor of this.processors.values()) {
      try {
        // Basic health check - processor is registered and has required methods
        if (typeof processor.processEvents !== 'function') {
          allHealthy = false;
          this.logger.error('Processor health check failed', {
            processor: processor.getName(),
            reason: 'processEvents method not found'
          });
        }
      } catch (error) {
        allHealthy = false;
        this.logger.error('Processor health check failed', {
          processor: processor.getName(),
          error
        });
      }
    }

    return allHealthy;
  }

  /**
   * Get supported event types from all processors
   */
  getSupportedEventTypes(): string[] {
    const eventTypes = new Set<string>();

    for (const processor of this.processors.values()) {
      for (const eventType of processor.getSupportedEventTypes()) {
        eventTypes.add(eventType);
      }
    }

    return Array.from(eventTypes);
  }
}