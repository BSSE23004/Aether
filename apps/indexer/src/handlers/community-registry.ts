/**
 * CommunityRegistry event handler
 */

import { BaseHandler } from './base-handler.js';
import { ProcessedEvent } from '../types/index.js';
import { CommunityEvent } from '../types/events.js';

export class CommunityRegistryHandler extends BaseHandler {
  constructor() {
    super('CommunityRegistry');
  }

  /**
   * Get supported events
   */
  getSupportedEvents(): string[] {
    return [
      'CommunityCreated',
      'CommunityUpdated',
      'CommunityDeactivated',
      'CommunityActivated',
      'CommunityAdminAdded',
      'CommunityAdminRemoved',
      'CommunityVerificationRequested',
      'CommunityVerified',
      'CommunityStatsUpdated'
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
      case 'CommunityCreated':
        await this.handleCommunityCreated(event);
        break;
      case 'CommunityUpdated':
        await this.handleCommunityUpdated(event);
        break;
      case 'CommunityDeactivated':
        await this.handleCommunityDeactivated(event);
        break;
      case 'CommunityActivated':
        await this.handleCommunityActivated(event);
        break;
      case 'CommunityAdminAdded':
        await this.handleCommunityAdminAdded(event);
        break;
      case 'CommunityAdminRemoved':
        await this.handleCommunityAdminRemoved(event);
        break;
      case 'CommunityVerificationRequested':
        await this.handleCommunityVerificationRequested(event);
        break;
      case 'CommunityVerified':
        await this.handleCommunityVerified(event);
        break;
      case 'CommunityStatsUpdated':
        await this.handleCommunityStatsUpdated(event);
        break;
      default:
        this.logger.warn('Unknown event type', { event: event.eventName });
    }

    this.logEventProcessed(event);
  }

  /**
   * Handle CommunityCreated event
   */
  private async handleCommunityCreated(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['communityId', 'name', 'creator']);

    const communityData: CommunityEvent = {
      communityId: this.bigintToNumber(event.data.communityId),
      name: this.sanitizeString(event.data.name, 100),
      description: event.data.description ? this.sanitizeString(event.data.description, 500) : undefined,
      metadataURI: event.data.metadataURI || undefined,
      creator: this.normalizeAddress(event.data.creator),
      admin: this.normalizeAddress(event.data.creator),
      timestamp: event.timestamp
    };

    // Store event in database
    await this.db.createContractEvents([this.transformEventData(event)]);

    this.logger.info('Community created', {
      communityId: communityData.communityId,
      name: communityData.name,
      creator: communityData.creator
    });
  }

  /**
   * Handle CommunityUpdated event
   */
  private async handleCommunityUpdated(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['communityId']);

    const communityData: CommunityEvent = {
      communityId: this.bigintToNumber(event.data.communityId),
      name: event.data.name ? this.sanitizeString(event.data.name, 100) : undefined,
      description: event.data.description ? this.sanitizeString(event.data.description, 500) : undefined,
      metadataURI: event.data.metadataURI || undefined,
      timestamp: event.timestamp
    };

    await this.db.createContractEvents([this.transformEventData(event)]);

    this.logger.info('Community updated', {
      communityId: communityData.communityId,
      name: communityData.name
    });
  }

  /**
   * Handle CommunityDeactivated event
   */
  private async handleCommunityDeactivated(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['communityId', 'admin']);

    const communityData: CommunityEvent = {
      communityId: this.bigintToNumber(event.data.communityId),
      admin: this.normalizeAddress(event.data.admin),
      timestamp: event.timestamp
    };

    await this.db.createContractEvents([this.transformEventData(event)]);

    this.logger.info('Community deactivated', {
      communityId: communityData.communityId,
      admin: communityData.admin
    });
  }

  /**
   * Handle CommunityActivated event
   */
  private async handleCommunityActivated(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['communityId', 'admin']);

    const communityData: CommunityEvent = {
      communityId: this.bigintToNumber(event.data.communityId),
      admin: this.normalizeAddress(event.data.admin),
      timestamp: event.timestamp
    };

    await this.db.createContractEvents([this.transformEventData(event)]);

    this.logger.info('Community activated', {
      communityId: communityData.communityId,
      admin: communityData.admin
    });
  }

  /**
   * Handle CommunityAdminAdded event
   */
  private async handleCommunityAdminAdded(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['communityId', 'admin', 'addedBy']);

    const communityData: CommunityEvent = {
      communityId: this.bigintToNumber(event.data.communityId),
      admin: this.normalizeAddress(event.data.admin),
      addedBy: this.normalizeAddress(event.data.addedBy),
      timestamp: event.timestamp
    };

    await this.db.createContractEvents([this.transformEventData(event)]);

    this.logger.info('Community admin added', {
      communityId: communityData.communityId,
      admin: communityData.admin,
      addedBy: communityData.addedBy
    });
  }

  /**
   * Handle CommunityAdminRemoved event
   */
  private async handleCommunityAdminRemoved(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['communityId', 'admin', 'removedBy']);

    const communityData: CommunityEvent = {
      communityId: this.bigintToNumber(event.data.communityId),
      admin: this.normalizeAddress(event.data.admin),
      removedBy: this.normalizeAddress(event.data.removedBy),
      timestamp: event.timestamp
    };

    await this.db.createContractEvents([this.transformEventData(event)]);

    this.logger.info('Community admin removed', {
      communityId: communityData.communityId,
      admin: communityData.admin,
      removedBy: communityData.removedBy
    });
  }

  /**
   * Handle CommunityVerificationRequested event
   */
  private async handleCommunityVerificationRequested(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['communityId', 'requester']);

    const communityData: CommunityEvent = {
      communityId: this.bigintToNumber(event.data.communityId),
      requester: this.normalizeAddress(event.data.requester),
      timestamp: event.timestamp
    };

    await this.db.createContractEvents([this.transformEventData(event)]);

    this.logger.info('Community verification requested', {
      communityId: communityData.communityId,
      requester: communityData.requester
    });
  }

  /**
   * Handle CommunityVerified event
   */
  private async handleCommunityVerified(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['communityId', 'verifier']);

    const communityData: CommunityEvent = {
      communityId: this.bigintToNumber(event.data.communityId),
      verifier: this.normalizeAddress(event.data.verifier),
      timestamp: event.timestamp
    };

    await this.db.createContractEvents([this.transformEventData(event)]);

    this.logger.info('Community verified', {
      communityId: communityData.communityId,
      verifier: communityData.verifier
    });
  }

  /**
   * Handle CommunityStatsUpdated event
   */
  private async handleCommunityStatsUpdated(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['communityId', 'memberCount', 'channelCount', 'messageCount']);

    const communityData: CommunityEvent = {
      communityId: this.bigintToNumber(event.data.communityId),
      memberCount: this.bigintToNumber(event.data.memberCount),
      channelCount: this.bigintToNumber(event.data.channelCount),
      messageCount: this.bigintToNumber(event.data.messageCount),
      timestamp: event.timestamp
    };

    await this.db.createContractEvents([this.transformEventData(event)]);

    this.logger.info('Community stats updated', {
      communityId: communityData.communityId,
      memberCount: communityData.memberCount,
      channelCount: communityData.channelCount,
      messageCount: communityData.messageCount
    });
  }
}