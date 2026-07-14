/**
 * Handler registry for managing event handlers
 */

import { BaseHandler } from './base-handler.js';
import { CommunityRegistryHandler } from './community-registry.js';
import { MembershipPassHandler } from './membership-pass.js';
import { GovernorHandler } from './governor.js';
import { ProcessedEvent, HandlerResult } from '../types/index.js';
import { LoggerService } from '../services/logger.service.js';

export class HandlerRegistry {
  private handlers: Map<string, BaseHandler>;
  private logger: LoggerService;

  constructor() {
    this.handlers = new Map();
    this.logger = LoggerService.getInstance();
  }

  /**
   * Register a handler
   */
  registerHandler(handler: BaseHandler): void {
    this.handlers.set(handler.getName(), handler);
    this.logger.info('Handler registered', {
      handler: handler.getName(),
      supportedEvents: handler.getSupportedEvents()
    });
  }

  /**
   * Get handler by name
   */
  getHandler(name: string): BaseHandler | undefined {
    return this.handlers.get(name);
  }

  /**
   * Get all handlers
   */
  getAllHandlers(): BaseHandler[] {
    return Array.from(this.handlers.values());
  }

  /**
   * Initialize default handlers
   */
  initializeDefaultHandlers(): void {
    this.registerHandler(new CommunityRegistryHandler());
    this.registerHandler(new MembershipPassHandler());
    this.registerHandler(new GovernorHandler());
  }

  /**
   * Process events through all handlers
   */
  async processEvents(events: ProcessedEvent[]): Promise<HandlerResult> {
    const combinedResult: HandlerResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: []
    };

    // Group events by contract
    const eventsByContract = this.groupEventsByContract(events);

    // Process each contract's events with its handler
    for (const [contractName, contractEvents] of eventsByContract.entries()) {
      const handler = this.getHandler(`${contractName}Handler`);
      
      if (!handler) {
        this.logger.warn('No handler found for contract', { contractName });
        continue;
      }

      try {
        const result = await handler.processEvents(contractEvents);
        combinedResult.processed += result.processed;
        combinedResult.failed += result.failed;
        combinedResult.errors.push(...result.errors);

        if (!result.success) {
          combinedResult.success = false;
        }
      } catch (error) {
        combinedResult.failed += contractEvents.length;
        combinedResult.errors.push({
          event: contractName,
          error: (error as Error).message
        });
        combinedResult.success = false;
      }
    }

    return combinedResult;
  }

  /**
   * Group events by contract name
   */
  private groupEventsByContract(events: ProcessedEvent[]): Map<string, ProcessedEvent[]> {
    const grouped = new Map<string, ProcessedEvent[]>();

    for (const event of events) {
      // Extract contract name from contract address or event type
      const contractName = this.extractContractName(event);
      
      if (!grouped.has(contractName)) {
        grouped.set(contractName, []);
      }
      
      grouped.get(contractName)!.push(event);
    }

    return grouped;
  }

  /**
   * Extract contract name from event
   */
  private extractContractName(event: ProcessedEvent): string {
    // Try to determine contract name from event type
    const eventTypeMapping: Record<string, string> = {
      'COMMUNITY_CREATED': 'CommunityRegistry',
      'COMMUNITY_UPDATED': 'CommunityRegistry',
      'COMMUNITY_DEACTIVATED': 'CommunityRegistry',
      'COMMUNITY_ACTIVATED': 'CommunityRegistry',
      'COMMUNITY_ADMIN_ADDED': 'CommunityRegistry',
      'COMMUNITY_ADMIN_REMOVED': 'CommunityRegistry',
      'COMMUNITY_VERIFICATION_REQUESTED': 'CommunityRegistry',
      'COMMUNITY_VERIFIED': 'CommunityRegistry',
      'COMMUNITY_STATS_UPDATED': 'CommunityRegistry',
      
      'MEMBERSHIP_MINTED': 'MembershipPass',
      'MEMBERSHIP_BURNED': 'MembershipPass',
      'MEMBERSHIP_PRICE_UPDATED': 'MembershipPass',
      'TREASURY_UPDATED': 'MembershipPass',
      'MAX_SUPPLY_UPDATED': 'MembershipPass',
      'MEMBERSHIP_EXTENDED': 'MembershipPass',
      
      'PROPOSAL_CREATED': 'Governor',
      'VOTE_CAST': 'Governor',
      'PROPOSAL_EXECUTED': 'Governor',
      'PROPOSAL_CANCELED': 'Governor',
      'MEMBERSHIP_CONTRACT_UPDATED': 'Governor',
      'VOTING_PARAMETERS_UPDATED': 'Governor'
    };

    return eventTypeMapping[event.eventType] || 'Unknown';
  }

  /**
   * Get supported event types from all handlers
   */
  getSupportedEventTypes(): string[] {
    const eventTypes = new Set<string>();

    for (const handler of this.handlers.values()) {
      const supportedEvents = handler.getSupportedEvents();
      for (const event of supportedEvents) {
        eventTypes.add(event);
      }
    }

    return Array.from(eventTypes);
  }

  /**
   * Get handler statistics
   */
  getHandlerStats(): Record<string, any> {
    const stats: Record<string, any> = {};

    for (const [name, handler] of this.handlers.entries()) {
      stats[name] = {
        supportedEvents: handler.getSupportedEvents().length,
        supportedEventNames: handler.getSupportedEvents()
      };
    }

    return stats;
  }
}