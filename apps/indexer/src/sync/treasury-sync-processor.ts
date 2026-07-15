/**
 * Treasury event sync processor
 * Handles treasury-related events and syncs them to the database
 */

import { BaseSyncProcessor, SyncResult } from './base-sync-processor.js';
import { ProcessedEvent } from '../types/index.js';
import { EventType } from '../types/events.js';

export class TreasurySyncProcessor extends BaseSyncProcessor {
  constructor() {
    super('TreasurySyncProcessor');
  }

  /**
   * Get supported event types
   */
  getSupportedEventTypes(): string[] {
    return [
      EventType.TREASURY_UPDATED,
      EventType.MEMBERSHIP_PRICE_UPDATED,
      EventType.MAX_SUPPLY_UPDATED
    ];
  }

  /**
   * Process a single event
   */
  async processEvent(event: ProcessedEvent): Promise<void> {
    switch (event.eventType) {
      case EventType.TREASURY_UPDATED:
        await this.handleTreasuryUpdated(event);
        break;
      case EventType.MEMBERSHIP_PRICE_UPDATED:
        await this.handleMembershipPriceUpdated(event);
        break;
      case EventType.MAX_SUPPLY_UPDATED:
        await this.handleMaxSupplyUpdated(event);
        break;
      default:
        this.logger.warn('Unsupported treasury event type', { eventType: event.eventType });
    }
  }

  /**
   * Handle treasury updated event
   */
  private async handleTreasuryUpdated(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['newTreasury']);

    const newTreasury = this.normalizeAddress(event.data.newTreasury);

    // Store the event
    await this.db.createContractEvents([this.transformEventData(event)]);

    // Update treasury configuration in database
    try {
      // For now, we just store the event data
      // In production, this would update a configuration table
      this.logSyncSuccess(event, 'treasury', newTreasury);
    } catch (error) {
      this.logger.error('Failed to sync treasury updated event', {
        newTreasury,
        error
      });
      throw error;
    }
  }

  /**
   * Handle membership price updated event
   */
  private async handleMembershipPriceUpdated(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['newPrice']);

    const newPrice = this.bigintToNumber(event.data.newPrice);

    // Store the event
    await this.db.createContractEvents([this.transformEventData(event)]);

    // Update price configuration in database
    try {
      // For now, we just store the event data
      // In production, this would update a configuration table
      this.logSyncSuccess(event, 'membership_config', 'price');
    } catch (error) {
      this.logger.error('Failed to sync membership price updated event', {
        newPrice,
        error
      });
      throw error;
    }
  }

  /**
   * Handle max supply updated event
   */
  private async handleMaxSupplyUpdated(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['newMaxSupply']);

    const newMaxSupply = this.bigintToNumber(event.data.newMaxSupply);

    // Store the event
    await this.db.createContractEvents([this.transformEventData(event)]);

    // Update max supply configuration in database
    try {
      // For now, we just store the event data
      // In production, this would update a configuration table
      this.logSyncSuccess(event, 'membership_config', 'max_supply');
    } catch (error) {
      this.logger.error('Failed to sync max supply updated event', {
        newMaxSupply,
        error
      });
      throw error;
    }
  }

  /**
   * Get current treasury configuration
   */
  async getTreasuryConfig(): Promise<{
    treasuryAddress: string | null;
    membershipPrice: number | null;
    maxSupply: number | null;
  }> {
    try {
      // Get the latest treasury update event
      const treasuryEvent = await this.db.getClient().contractEvent.findFirst({
        where: {
          eventType: 'TREASURY_UPDATED'
        },
        orderBy: {
          blockNumber: 'desc'
        }
      });

      // Get the latest price update event
      const priceEvent = await this.db.getClient().contractEvent.findFirst({
        where: {
          eventType: 'MEMBERSHIP_PRICE_UPDATED'
        },
        orderBy: {
          blockNumber: 'desc'
        }
      });

      // Get the latest supply update event
      const supplyEvent = await this.db.getClient().contractEvent.findFirst({
        where: {
          eventType: 'MAX_SUPPLY_UPDATED'
        },
        orderBy: {
          blockNumber: 'desc'
        }
      });

      return {
        treasuryAddress: treasuryEvent?.data?.newTreasury || null,
        membershipPrice: priceEvent?.data?.newPrice ? this.bigintToNumber(priceEvent.data.newPrice) : null,
        maxSupply: supplyEvent?.data?.newMaxSupply ? this.bigintToNumber(supplyEvent.data.newMaxSupply) : null
      };
    } catch (error) {
      this.logger.error('Failed to get treasury configuration', { error });
      throw error;
    }
  }
}