/**
 * Event transformation layer
 * Transforms blockchain events into database entities
 */

import { ProcessedEvent } from '../types/index.js';
import { LoggerService } from '../services/logger.service.js';
import { EventType } from '../types/events.js';

export interface TransformedData {
  entityType: string;
  entityId: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

export class EventTransformer {
  private logger: LoggerService;

  constructor() {
    this.logger = LoggerService.getInstance();
  }

  /**
   * Transform a single event
   */
  transformEvent(event: ProcessedEvent): TransformedData | null {
    try {
      switch (event.eventType) {
        case EventType.MEMBERSHIP_MINTED:
          return this.transformMembershipMinted(event);
        case EventType.MEMBERSHIP_BURNED:
          return this.transformMembershipBurned(event);
        case EventType.MEMBERSHIP_EXTENDED:
          return this.transformMembershipExtended(event);
        case EventType.PROPOSAL_CREATED:
          return this.transformProposalCreated(event);
        case EventType.PROPOSAL_EXECUTED:
          return this.transformProposalExecuted(event);
        case EventType.PROPOSAL_CANCELED:
          return this.transformProposalCanceled(event);
        case EventType.VOTE_CAST:
          return this.transformVoteCast(event);
        case EventType.TREASURY_UPDATED:
          return this.transformTreasuryUpdated(event);
        case EventType.MEMBERSHIP_PRICE_UPDATED:
          return this.transformMembershipPriceUpdated(event);
        case EventType.MAX_SUPPLY_UPDATED:
          return this.transformMaxSupplyUpdated(event);
        default:
          this.logger.debug('No transformation for event type', { eventType: event.eventType });
          return null;
      }
    } catch (error) {
      this.logger.error('Event transformation failed', {
        eventType: event.eventType,
        txHash: event.transactionHash,
        error
      });
      return null;
    }
  }

  /**
   * Transform membership minted event
   */
  private transformMembershipMinted(event: ProcessedEvent): TransformedData {
    const tokenId = this.bigintToNumber(event.data.tokenId);
    const member = this.normalizeAddress(event.data.member);
    const price = event.data.price ? this.bigintToNumber(event.data.price) : null;

    return {
      entityType: 'membership',
      entityId: `${tokenId}`,
      data: {
        tokenId,
        member,
        price,
        metadataURI: event.data.metadataURI || null,
        mintedAt: new Date(event.timestamp * 1000)
      },
      metadata: {
        blockNumber: event.blockNumber,
        txHash: event.transactionHash
      }
    };
  }

  /**
   * Transform membership burned event
   */
  private transformMembershipBurned(event: ProcessedEvent): TransformedData {
    const tokenId = this.bigintToNumber(event.data.tokenId);
    const member = this.normalizeAddress(event.data.member);

    return {
      entityType: 'membership',
      entityId: `${tokenId}`,
      data: {
        tokenId,
        member,
        burnedAt: new Date(event.timestamp * 1000)
      },
      metadata: {
        blockNumber: event.blockNumber,
        txHash: event.transactionHash
      }
    };
  }

  /**
   * Transform membership extended event
   */
  private transformMembershipExtended(event: ProcessedEvent): TransformedData {
    const tokenId = this.bigintToNumber(event.data.tokenId);
    const member = this.normalizeAddress(event.data.member);
    const newExpiry = this.bigintToNumber(event.data.newExpiry);

    return {
      entityType: 'membership',
      entityId: `${tokenId}`,
      data: {
        tokenId,
        member,
        newExpiry: new Date(newExpiry * 1000),
        extendedAt: new Date(event.timestamp * 1000)
      },
      metadata: {
        blockNumber: event.blockNumber,
        txHash: event.transactionHash
      }
    };
  }

  /**
   * Transform proposal created event
   */
  private transformProposalCreated(event: ProcessedEvent): TransformedData {
    const proposalId = this.bigintToNumber(event.data.proposalId);
    const proposer = this.normalizeAddress(event.data.proposer);
    const description = event.data.description || '';
    const targets = event.data.targets || [];
    const values = event.data.values || [];
    const calldatas = event.data.calldatas || [];

    return {
      entityType: 'proposal',
      entityId: proposalId.toString(),
      data: {
        proposalId: proposalId.toString(),
        proposer,
        description,
        targets: targets.map((t: string) => this.normalizeAddress(t)),
        values: values.map((v: bigint) => v.toString()),
        calldatas,
        status: 'PENDING',
        createdAt: new Date(event.timestamp * 1000)
      },
      metadata: {
        blockNumber: event.blockNumber,
        txHash: event.transactionHash
      }
    };
  }

  /**
   * Transform proposal executed event
   */
  private transformProposalExecuted(event: ProcessedEvent): TransformedData {
    const proposalId = this.bigintToNumber(event.data.proposalId);

    return {
      entityType: 'proposal',
      entityId: proposalId.toString(),
      data: {
        proposalId: proposalId.toString(),
        status: 'EXECUTED',
        executedAt: new Date(event.timestamp * 1000)
      },
      metadata: {
        blockNumber: event.blockNumber,
        txHash: event.transactionHash
      }
    };
  }

  /**
   * Transform proposal canceled event
   */
  private transformProposalCanceled(event: ProcessedEvent): TransformedData {
    const proposalId = this.bigintToNumber(event.data.proposalId);

    return {
      entityType: 'proposal',
      entityId: proposalId.toString(),
      data: {
        proposalId: proposalId.toString(),
        status: 'CANCELED',
        canceledAt: new Date(event.timestamp * 1000)
      },
      metadata: {
        blockNumber: event.blockNumber,
        txHash: event.transactionHash
      }
    };
  }

  /**
   * Transform vote cast event
   */
  private transformVoteCast(event: ProcessedEvent): TransformedData {
    const proposalId = this.bigintToNumber(event.data.proposalId);
    const voter = this.normalizeAddress(event.data.voter);
    const support = this.bigintToNumber(event.data.support);
    const weight = this.bigintToNumber(event.data.weight);

    return {
      entityType: 'vote',
      entityId: `${voter}-${proposalId}`,
      data: {
        proposalId: proposalId.toString(),
        voter,
        support,
        weight,
        votedAt: new Date(event.timestamp * 1000)
      },
      metadata: {
        blockNumber: event.blockNumber,
        txHash: event.transactionHash
      }
    };
  }

  /**
   * Transform treasury updated event
   */
  private transformTreasuryUpdated(event: ProcessedEvent): TransformedData {
    const newTreasury = this.normalizeAddress(event.data.newTreasury);

    return {
      entityType: 'treasury',
      entityId: 'treasury',
      data: {
        treasuryAddress: newTreasury,
        updatedAt: new Date(event.timestamp * 1000)
      },
      metadata: {
        blockNumber: event.blockNumber,
        txHash: event.transactionHash
      }
    };
  }

  /**
   * Transform membership price updated event
   */
  private transformMembershipPriceUpdated(event: ProcessedEvent): TransformedData {
    const newPrice = this.bigintToNumber(event.data.newPrice);

    return {
      entityType: 'membership_config',
      entityId: 'price',
      data: {
        price: newPrice,
        updatedAt: new Date(event.timestamp * 1000)
      },
      metadata: {
        blockNumber: event.blockNumber,
        txHash: event.transactionHash
      }
    };
  }

  /**
   * Transform max supply updated event
   */
  private transformMaxSupplyUpdated(event: ProcessedEvent): TransformedData {
    const newMaxSupply = this.bigintToNumber(event.data.newMaxSupply);

    return {
      entityType: 'membership_config',
      entityId: 'max_supply',
      data: {
        maxSupply: newMaxSupply,
        updatedAt: new Date(event.timestamp * 1000)
      },
      metadata: {
        blockNumber: event.blockNumber,
        txHash: event.transactionHash
      }
    };
  }

  /**
   * Transform multiple events
   */
  transformEvents(events: ProcessedEvent[]): TransformedData[] {
    const transformed: TransformedData[] = [];

    for (const event of events) {
      const result = this.transformEvent(event);
      if (result) {
        transformed.push(result);
      }
    }

    return transformed;
  }

  /**
   * Group transformed data by entity type
   */
  groupByEntityType(transformedData: TransformedData[]): Map<string, TransformedData[]> {
    const grouped = new Map<string, TransformedData[]>();

    for (const data of transformedData) {
      if (!grouped.has(data.entityType)) {
        grouped.set(data.entityType, []);
      }
      grouped.get(data.entityType)!.push(data);
    }

    return grouped;
  }

  /**
   * Utility functions
   */
  private bigintToNumber(value: bigint | number | string): number {
    if (typeof value === 'bigint') {
      return Number(value);
    }
    if (typeof value === 'string') {
      return parseInt(value, 10);
    }
    return value;
  }

  private normalizeAddress(address: string): string {
    return address.toLowerCase();
  }
}