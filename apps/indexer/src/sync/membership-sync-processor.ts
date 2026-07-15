/**
 * Membership event sync processor
 * Handles membership-related events and syncs them to the database
 */

import { BaseSyncProcessor, SyncResult } from './base-sync-processor.js';
import { ProcessedEvent } from '../types/index.js';
import { EventType } from '../types/events.js';

export class MembershipSyncProcessor extends BaseSyncProcessor {
  constructor() {
    super('MembershipSyncProcessor');
  }

  /**
   * Get supported event types
   */
  getSupportedEventTypes(): string[] {
    return [
      EventType.MEMBERSHIP_MINTED,
      EventType.MEMBERSHIP_BURNED,
      EventType.MEMBERSHIP_EXTENDED,
      EventType.MEMBERSHIP_PRICE_UPDATED,
      EventType.TREASURY_UPDATED,
      EventType.MAX_SUPPLY_UPDATED
    ];
  }

  /**
   * Process a single event
   */
  async processEvent(event: ProcessedEvent): Promise<void> {
    switch (event.eventType) {
      case EventType.MEMBERSHIP_MINTED:
        await this.handleMembershipMinted(event);
        break;
      case EventType.MEMBERSHIP_BURNED:
        await this.handleMembershipBurned(event);
        break;
      case EventType.MEMBERSHIP_EXTENDED:
        await this.handleMembershipExtended(event);
        break;
      case EventType.MEMBERSHIP_PRICE_UPDATED:
        await this.handleMembershipPriceUpdated(event);
        break;
      case EventType.TREASURY_UPDATED:
        await this.handleTreasuryUpdated(event);
        break;
      case EventType.MAX_SUPPLY_UPDATED:
        await this.handleMaxSupplyUpdated(event);
        break;
      default:
        this.logger.warn('Unsupported membership event type', { eventType: event.eventType });
    }
  }

  /**
   * Handle membership minted event
   */
  private async handleMembershipMinted(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['tokenId', 'member']);

    const tokenId = this.bigintToNumber(event.data.tokenId);
    const member = this.normalizeAddress(event.data.member);
    const price = event.data.price ? this.bigintToNumber(event.data.price) : null;
    const metadataURI = event.data.metadataURI || null;

    // Store the event
    await this.db.createContractEvents([this.transformEventData(event)]);

    // Update or create membership record in database
    try {
      await this.db.getClient().wallet.upsert({
        where: { address: member },
        update: {},
        create: {
          address: member,
          userId: null, // Will be linked when user connects wallet
          createdAt: new Date()
        }
      });

      this.logSyncSuccess(event, 'membership', `${tokenId}`);
    } catch (error) {
      this.logger.error('Failed to sync membership minted event', {
        tokenId,
        member,
        error
      });
      throw error;
    }
  }

  /**
   * Handle membership burned event
   */
  private async handleMembershipBurned(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['tokenId', 'member']);

    const tokenId = this.bigintToNumber(event.data.tokenId);
    const member = this.normalizeAddress(event.data.member);

    // Store the event
    await this.db.createContractEvents([this.transformEventData(event)]);

    // Update membership status
    try {
      // Note: This would update a membership table if it existed
      // For now, we just store the event
      this.logSyncSuccess(event, 'membership', `${tokenId}`);
    } catch (error) {
      this.logger.error('Failed to sync membership burned event', {
        tokenId,
        member,
        error
      });
      throw error;
    }
  }

  /**
   * Handle membership extended event
   */
  private async handleMembershipExtended(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['tokenId', 'member', 'newExpiry']);

    const tokenId = this.bigintToNumber(event.data.tokenId);
    const member = this.normalizeAddress(event.data.member);
    const newExpiry = this.bigintToNumber(event.data.newExpiry);

    // Store the event
    await this.db.createContractEvents([this.transformEventData(event)]);

    // Update membership expiry
    try {
      // Note: This would update a membership table if it existed
      // For now, we just store the event
      this.logSyncSuccess(event, 'membership', `${tokenId}`);
    } catch (error) {
      this.logger.error('Failed to sync membership extended event', {
        tokenId,
        member,
        newExpiry,
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

    // Update price configuration
    try {
      // Note: This would update a configuration table if it existed
      // For now, we just store the event
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
   * Handle treasury updated event
   */
  private async handleTreasuryUpdated(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['newTreasury']);

    const newTreasury = this.normalizeAddress(event.data.newTreasury);

    // Store the event
    await this.db.createContractEvents([this.transformEventData(event)]);

    // Update treasury configuration
    try {
      // Note: This would update a configuration table if it existed
      // For now, we just store the event
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
   * Handle max supply updated event
   */
  private async handleMaxSupplyUpdated(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['newMaxSupply']);

    const newMaxSupply = this.bigintToNumber(event.data.newMaxSupply);

    // Store the event
    await this.db.createContractEvents([this.transformEventData(event)]);

    // Update max supply configuration
    try {
      // Note: This would update a configuration table if it existed
      // For now, we just store the event
      this.logSyncSuccess(event, 'membership_config', 'max_supply');
    } catch (error) {
      this.logger.error('Failed to sync max supply updated event', {
        newMaxSupply,
        error
      });
      throw error;
    }
  }
}