/**
 * Base event handler class
 */

import { ProcessedEvent, HandlerResult } from '../types/index.js';
import { DatabaseService } from '../services/database.service.js';
import { LoggerService } from '../services/logger.service.js';
import { HandlerError } from '../utils/errors.js';

export abstract class BaseHandler {
  protected db: DatabaseService;
  protected logger: LoggerService;
  protected contractName: string;

  constructor(contractName: string) {
    this.contractName = contractName;
    this.db = DatabaseService.getInstance();
    this.logger = LoggerService.getInstance();
  }

  /**
   * Get handler name
   */
  getName(): string {
    return `${this.contractName}Handler`;
  }

  /**
   * Get supported event names
   */
  abstract getSupportedEvents(): string[];

  /**
   * Process a single event
   */
  abstract processEvent(event: ProcessedEvent): Promise<void>;

  /**
   * Process multiple events
   */
  async processEvents(events: ProcessedEvent[]): Promise<HandlerResult> {
    const result: HandlerResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: []
    };

    const supportedEvents = this.getSupportedEvents();

    for (const event of events) {
      try {
        // Check if this handler supports the event
        if (!supportedEvents.includes(event.eventName)) {
          this.logger.debug(`Event not supported by handler`, {
            event: event.eventName,
            handler: this.getName()
          });
          continue;
        }

        await this.processEvent(event);
        result.processed++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          event: event.eventName,
          error: (error as Error).message
        });

        this.logger.logEventProcessingError(
          event.blockNumber,
          event.transactionHash,
          event.eventName,
          (error as Error).message
        );
      }
    }

    // If any events failed, mark as not fully successful
    if (result.failed > 0) {
      result.success = false;
    }

    return result;
  }

  /**
   * Validate event data
   */
  protected validateEventData(event: ProcessedEvent, requiredFields: string[]): void {
    for (const field of requiredFields) {
      if (!(field in event.data)) {
        throw new HandlerError(
          `Missing required field: ${field}`,
          { event, field }
        );
      }
    }
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
   * Convert address to lowercase
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
   * Check if event should be processed
   */
  protected shouldProcessEvent(event: ProcessedEvent): boolean {
    // Check for removed events (reorg)
    if (event.data.removed === true) {
      this.logger.debug('Skipping removed event', {
        txHash: event.transactionHash,
        logIndex: event.logIndex
      });
      return false;
    }

    return true;
  }

  /**
   * Handle event processing error
   */
  protected handleProcessingError(
    event: ProcessedEvent,
    error: Error,
    isFatal: boolean = false
  ): void {
    if (isFatal) {
      throw new HandlerError(
        `Fatal error processing event: ${error.message}`,
        { event, error }
      );
    }

    this.logger.error('Non-fatal error processing event', {
      event: event.eventName,
      txHash: event.transactionHash,
      error: error.message
    });
  }

  /**
   * Transform event data to database format
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
      createdAt: this.timestampToDate(event.timestamp)
    };
  }

  /**
   * Log event processing
   */
  protected logEventProcessed(event: ProcessedEvent): void {
    this.logger.debug('Event processed', {
      contract: this.contractName,
      event: event.eventName,
      txHash: event.transactionHash,
      blockNumber: event.blockNumber
    });
  }
}