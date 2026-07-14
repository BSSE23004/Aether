/**
 * MembershipPass event handler
 */

import { BaseHandler } from './base-handler.js';
import { ProcessedEvent } from '../types/index.js';
import { MembershipEvent } from '../types/events.js';

export class MembershipPassHandler extends BaseHandler {
  constructor() {
    super('MembershipPass');
  }

  /**
   * Get supported events
   */
  getSupportedEvents(): string[] {
    return [
      'MembershipMinted',
      'MembershipBurned',
      'MembershipPriceUpdated',
      'TreasuryUpdated',
      'MaxSupplyUpdated',
      'MembershipExtended'
    ];
  }

  /**
   * Process a single event
   */
  async processEvent(event: ProcessedEvent): Promise<void> {
    if (!this.shouldProcessEvent(event)) {
      return;
    }

    switch (event.eventName) {
      case 'MembershipMinted':
        await this.handleMembershipMinted(event);
        break;
      case 'MembershipBurned':
        await this.handleMembershipBurned(event);
        break;
      case 'MembershipPriceUpdated':
        await this.handleMembershipPriceUpdated(event);
        break;
      case 'TreasuryUpdated':
        await this.handleTreasuryUpdated(event);
        break;
      case 'MaxSupplyUpdated':
        await this.handleMaxSupplyUpdated(event);
        break;
      case 'MembershipExtended':
        await this.handleMembershipExtended(event);
        break;
      default:
        this.logger.warn('Unknown event type', { event: event.eventName });
    }

    this.logEventProcessed(event);
  }

  /**
   * Handle MembershipMinted event
   */
  private async handleMembershipMinted(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['tokenId', 'member']);

    const membershipData: MembershipEvent = {
      tokenId: this.bigintToNumber(event.data.tokenId),
      member: this.normalizeAddress(event.data.member),
      price: event.data.price ? this.bigintToNumber(event.data.price) : undefined,
      timestamp: event.timestamp
    };

    await this.db.createContractEvents([this.transformEventData(event)]);

    this.logger.info('Membership minted', {
      tokenId: membershipData.tokenId,
      member: membershipData.member,
      price: membershipData.price
    });
  }

  /**
   * Handle MembershipBurned event
   */
  private async handleMembershipBurned(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['tokenId', 'member']);

    const membershipData: MembershipEvent = {
      tokenId: this.bigintToNumber(event.data.tokenId),
      member: this.normalizeAddress(event.data.member),
      timestamp: event.timestamp
    };

    await this.db.createContractEvents([this.transformEventData(event)]);

    this.logger.info('Membership burned', {
      tokenId: membershipData.tokenId,
      member: membershipData.member
    });
  }

  /**
   * Handle MembershipPriceUpdated event
   */
  private async handleMembershipPriceUpdated(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['newPrice']);

    const newPrice = this.bigintToNumber(event.data.newPrice);

    await this.db.createContractEvents([this.transformEventData(event)]);

    this.logger.info('Membership price updated', {
      newPrice
    });
  }

  /**
   * Handle TreasuryUpdated event
   */
  private async handleTreasuryUpdated(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['newTreasury']);

    const newTreasury = this.normalizeAddress(event.data.newTreasury);

    await this.db.createContractEvents([this.transformEventData(event)]);

    this.logger.info('Treasury updated', {
      newTreasury
    });
  }

  /**
   * Handle MaxSupplyUpdated event
   */
  private async handleMaxSupplyUpdated(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['newMaxSupply']);

    const newMaxSupply = this.bigintToNumber(event.data.newMaxSupply);

    await this.db.createContractEvents([this.transformEventData(event)]);

    this.logger.info('Max supply updated', {
      newMaxSupply
    });
  }

  /**
   * Handle MembershipExtended event
   */
  private async handleMembershipExtended(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['tokenId', 'member', 'newExpiry']);

    const membershipData: MembershipEvent = {
      tokenId: this.bigintToNumber(event.data.tokenId),
      member: this.normalizeAddress(event.data.member),
      expiry: this.bigintToNumber(event.data.newExpiry),
      timestamp: event.timestamp
    };

    await this.db.createContractEvents([this.transformEventData(event)]);

    this.logger.info('Membership extended', {
      tokenId: membershipData.tokenId,
      member: membershipData.member,
      expiry: membershipData.expiry
    });
  }
}