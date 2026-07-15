/**
 * Base class for event sync processors
 */

import { ProcessedEvent } from '../types/index.js';
import { DatabaseService } from '../services/database.service.js';
import { LoggerService } from '../services/logger.service.js';
import { EventProcessingError } from '../utils/errors.js';

export interface SyncResult {
  success: boolean;
  processed: number;
  failed: number;
  skipped: number;
  errors: Array<{
    eventType: string;
    txHash: string;
    error: string;
  }>;
}

export abstract class BaseSyncProcessor {
  protected db: DatabaseService;
  protected logger: LoggerService;
  protected processorName: string;

  constructor(processorName: string) {
    this.processorName = processorName;
    this.db = DatabaseService.getInstance();
    this.logger = LoggerService.getInstance();
  }

  /**
   * Get processor name
   */
  getName(): string {
    return this.processorName;
  }

  /**
   * Get supported event types
   */
  abstract getSupportedEventTypes(): string[];

  /**
   * Process a single event
   */
  abstract processEvent(event: ProcessedEvent): Promise<void>;

  /**
   * Process multiple events
   */
  async processEvents(events: ProcessedEvent[]): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      processed: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    const supportedEvents = this.getSupportedEventTypes();

    for (const event of events) {
      try {
        // Check if this processor supports the event type
        if (!supportedEvents.includes(event.eventType)) {
          result.skipped++;
          continue;
        }

        // Check for duplicates
        const isDuplicate = await this.isDuplicateEvent(event);
        if (isDuplicate) {
          this.logger.debug('Skipping duplicate event', {
            txHash: event.transactionHash,
            logIndex: event.logIndex
          });
          result.skipped++;
          continue;
        }

        await this.processEvent(event);
        result.processed++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          eventType: event.eventType,
          txHash: event.transactionHash,
          error: (error as Error).message
        });

        this.logger.error('Event sync failed', {
          processor: this.processorName,
          eventType: event.eventType,
          txHash: event.transactionHash,
          error: (error as Error).message
        });
      }
    }

    if (result.failed > 0) {
      result.success = false;
    }

    return result;
  }

  /**
   * Check if event is duplicate
   */
  protected async isDuplicateEvent(event: ProcessedEvent): Promise<boolean> {
    try {
      const existingEvent = await this.db.getClient().contractEvent.findFirst({
        where: {
          txHash: event.transactionHash,
          logIndex: event.logIndex
        }
      });
      return existingEvent !== null;
    } catch (error) {
      this.logger.error('Failed to check for duplicate event', {
        txHash: event.transactionHash,
        logIndex: event.logIndex,
        error
      });
      return false;
    }
  }

  /**
   * Validate event data
   */
  protected validateEventData(event: ProcessedEvent, requiredFields: string[]): void {
    for (const field of requiredFields) {
      if (!(field in event.data)) {
        throw new EventProcessingError(
          `Missing required field: ${field}`,
          { event, field }
        );
      }
    }
  }

  /**
   * Transform event data for database
   */
  protected transformEventData(event: ProcessedEvent): Record<string, any> {
    return {
      txHash: event.transactionHash,
      logIndex: event.logIndex,
      blockNumber: event.blockNumber,
      blockHash: event.blockHash,
      contract: event.contract,
      eventType: event.eventType,
      eventName: event.eventName,
      data: event.data,
      createdAt: new Date(event.timestamp * 1000)
    };
  }

  /**
   * Convert bigint to number
   */
  protected bigintToNumber(value: bigint | number | string): number {
    if (typeof value === 'bigint') {
      return Number(value);
    }
    if (typeof value === 'string') {
      return parseInt(value, 10);
    }
    return value;
  }

  /**
   * Normalize address
   */
  protected normalizeAddress(address: string): string {
    return address.toLowerCase();
  }

  /**
   * Convert timestamp to Date
   */
  protected timestampToDate(timestamp: number | bigint): Date {
    const ts = this.bigintToNumber(timestamp);
    return new Date(ts * 1000);
  }

  /**
   * Sanitize string input
   */
  protected sanitizeString(input: string, maxLength?: number): string {
    let sanitized = input.trim();
    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    return sanitized;
  }

  /**
   * Log successful sync
   */
  protected logSyncSuccess(event: ProcessedEvent, entityType: string, entityId: string): void {
    this.logger.info('Event synced successfully', {
      processor: this.processorName,
      entityType,
      entityId,
      eventType: event.eventType,
      txHash: event.transactionHash,
      blockNumber: event.blockNumber
    });
  }

  /**
   * Get processor statistics
   */
  getStats(): Record<string, any> {
    return {
      name: this.processorName,
      supportedEventTypes: this.getSupportedEventTypes().length
    };
  }
}