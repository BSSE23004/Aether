/**
 * Event validation system
 * Validates blockchain events before processing
 */

import { ProcessedEvent } from '../types/index.js';
import { LoggerService } from '../services/logger.service.js';
import { EventProcessingError } from '../utils/errors.js';

export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

export class EventValidator {
  private logger: LoggerService;

  constructor() {
    this.logger = LoggerService.getInstance();
  }

  /**
   * Validate a single event
   */
  validateEvent(event: ProcessedEvent): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    // Validate required fields
    if (!event.transactionHash || event.transactionHash.length !== 66) {
      errors.push({
        field: 'transactionHash',
        message: 'Invalid transaction hash'
      });
    }

    if (!event.blockHash || event.blockHash.length !== 66) {
      errors.push({
        field: 'blockHash',
        message: 'Invalid block hash'
      });
    }

    if (event.blockNumber <= 0) {
      errors.push({
        field: 'blockNumber',
        message: 'Block number must be positive'
      });
    }

    if (event.logIndex < 0) {
      errors.push({
        field: 'logIndex',
        message: 'Log index must be non-negative'
      });
    }

    if (!event.contract || event.contract.length !== 42) {
      errors.push({
        field: 'contract',
        message: 'Invalid contract address'
      });
    }

    if (!event.eventType || event.eventType.length === 0) {
      errors.push({
        field: 'eventType',
        message: 'Event type is required'
      });
    }

    if (!event.eventName || event.eventName.length === 0) {
      errors.push({
        field: 'eventName',
        message: 'Event name is required'
      });
    }

    if (event.timestamp <= 0) {
      errors.push({
        field: 'timestamp',
        message: 'Timestamp must be positive'
      });
    }

    // Validate event data
    const dataValidation = this.validateEventData(event);
    errors.push(...dataValidation.errors);

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate event data
   */
  private validateEventData(event: ProcessedEvent): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    if (!event.data || typeof event.data !== 'object') {
      errors.push({
        field: 'data',
        message: 'Event data must be an object'
      });
      return { valid: false, errors };
    }

    // Validate based on event type
    switch (event.eventType) {
      case 'MEMBERSHIP_MINTED':
        this.validateMembershipMinted(event.data, errors);
        break;
      case 'MEMBERSHIP_BURNED':
        this.validateMembershipBurned(event.data, errors);
        break;
      case 'PROPOSAL_CREATED':
        this.validateProposalCreated(event.data, errors);
        break;
      case 'VOTE_CAST':
        this.validateVoteCast(event.data, errors);
        break;
      case 'TREASURY_UPDATED':
        this.validateTreasuryUpdated(event.data, errors);
        break;
      default:
        // Generic validation for unknown event types
        this.logger.debug('No specific validation for event type', { eventType: event.eventType });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate membership minted event data
   */
  private validateMembershipMinted(data: any, errors: Array<{ field: string; message: string }>): void {
    if (!data.tokenId && data.tokenId !== 0) {
      errors.push({
        field: 'tokenId',
        message: 'Token ID is required'
      });
    }

    if (!data.member || !this.isValidAddress(data.member)) {
      errors.push({
        field: 'member',
        message: 'Valid member address is required'
      });
    }
  }

  /**
   * Validate membership burned event data
   */
  private validateMembershipBurned(data: any, errors: Array<{ field: string; message: string }>): void {
    if (!data.tokenId && data.tokenId !== 0) {
      errors.push({
        field: 'tokenId',
        message: 'Token ID is required'
      });
    }

    if (!data.member || !this.isValidAddress(data.member)) {
      errors.push({
        field: 'member',
        message: 'Valid member address is required'
      });
    }
  }

  /**
   * Validate proposal created event data
   */
  private validateProposalCreated(data: any, errors: Array<{ field: string; message: string }>): void {
    if (!data.proposalId && data.proposalId !== 0) {
      errors.push({
        field: 'proposalId',
        message: 'Proposal ID is required'
      });
    }

    if (!data.proposer || !this.isValidAddress(data.proposer)) {
      errors.push({
        field: 'proposer',
        message: 'Valid proposer address is required'
      });
    }

    if (!data.description || typeof data.description !== 'string') {
      errors.push({
        field: 'description',
        message: 'Description is required and must be a string'
      });
    }
  }

  /**
   * Validate vote cast event data
   */
  private validateVoteCast(data: any, errors: Array<{ field: string; message: string }>): void {
    if (!data.proposalId && data.proposalId !== 0) {
      errors.push({
        field: 'proposalId',
        message: 'Proposal ID is required'
      });
    }

    if (!data.voter || !this.isValidAddress(data.voter)) {
      errors.push({
        field: 'voter',
        message: 'Valid voter address is required'
      });
    }

    if (data.support === undefined || data.support === null) {
      errors.push({
        field: 'support',
        message: 'Support value is required'
      });
    }

    if (data.weight === undefined || data.weight === null) {
      errors.push({
        field: 'weight',
        message: 'Weight value is required'
      });
    }
  }

  /**
   * Validate treasury updated event data
   */
  private validateTreasuryUpdated(data: any, errors: Array<{ field: string; message: string }>): void {
    if (!data.newTreasury || !this.isValidAddress(data.newTreasury)) {
      errors.push({
        field: 'newTreasury',
        message: 'Valid new treasury address is required'
      });
    }
  }

  /**
   * Validate Ethereum address
   */
  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Validate multiple events
   */
  validateEvents(events: ProcessedEvent[]): Map<string, ValidationResult> {
    const results = new Map<string, ValidationResult>();

    for (const event of events) {
      const key = `${event.transactionHash}-${event.logIndex}`;
      results.set(key, this.validateEvent(event));
    }

    return results;
  }

  /**
   * Filter valid events
   */
  filterValidEvents(events: ProcessedEvent[]): ProcessedEvent[] {
    return events.filter(event => {
      const validation = this.validateEvent(event);
      if (!validation.valid) {
        this.logger.warn('Event validation failed', {
          txHash: event.transactionHash,
          logIndex: event.logIndex,
          errors: validation.errors
        });
      }
      return validation.valid;
    });
  }

  /**
   * Get validation statistics
   */
  getValidationStats(results: Map<string, ValidationResult>): {
    total: number;
    valid: number;
    invalid: number;
    errorRate: number;
  } {
    let valid = 0;
    let invalid = 0;

    for (const result of results.values()) {
      if (result.valid) {
        valid++;
      } else {
        invalid++;
      }
    }

    const total = valid + invalid;
    const errorRate = total > 0 ? (invalid / total) * 100 : 0;

    return {
      total,
      valid,
      invalid,
      errorRate
    };
  }
}