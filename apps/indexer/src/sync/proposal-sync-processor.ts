/**
 * Proposal event sync processor
 * Handles governance proposal events and syncs them to the database
 */

import { BaseSyncProcessor, SyncResult } from './base-sync-processor.js';
import { ProcessedEvent } from '../types/index.js';
import { EventType } from '../types/events.js';

export class ProposalSyncProcessor extends BaseSyncProcessor {
  constructor() {
    super('ProposalSyncProcessor');
  }

  /**
   * Get supported event types
   */
  getSupportedEventTypes(): string[] {
    return [
      EventType.PROPOSAL_CREATED,
      EventType.PROPOSAL_EXECUTED,
      EventType.PROPOSAL_CANCELED,
      EventType.VOTING_PARAMETERS_UPDATED,
      EventType.MEMBERSHIP_CONTRACT_UPDATED
    ];
  }

  /**
   * Process a single event
   */
  async processEvent(event: ProcessedEvent): Promise<void> {
    switch (event.eventType) {
      case EventType.PROPOSAL_CREATED:
        await this.handleProposalCreated(event);
        break;
      case EventType.PROPOSAL_EXECUTED:
        await this.handleProposalExecuted(event);
        break;
      case EventType.PROPOSAL_CANCELED:
        await this.handleProposalCanceled(event);
        break;
      case EventType.VOTING_PARAMETERS_UPDATED:
        await this.handleVotingParametersUpdated(event);
        break;
      case EventType.MEMBERSHIP_CONTRACT_UPDATED:
        await this.handleMembershipContractUpdated(event);
        break;
      default:
        this.logger.warn('Unsupported proposal event type', { eventType: event.eventType });
    }
  }

  /**
   * Handle proposal created event
   */
  private async handleProposalCreated(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['proposalId', 'proposer']);

    const proposalId = this.bigintToNumber(event.data.proposalId);
    const proposer = this.normalizeAddress(event.data.proposer);
    const description = event.data.description || '';
    const targets = event.data.targets || [];
    const values = event.data.values || [];
    const calldatas = event.data.calldatas || [];

    // Store the event
    await this.db.createContractEvents([this.transformEventData(event)]);

    // Store on-chain proposal metadata
    try {
      // Check if there's a wallet record for the proposer
      const wallet = await this.db.getClient().wallet.findUnique({
        where: { address: proposer }
      });

      // If wallet exists and has a user, we can create a linked proposal
      // Otherwise, we just store the event for later processing
      if (wallet && wallet.userId) {
        await this.db.getClient().daoProposal.create({
          data: {
            communityId: 'default', // Would be determined from context
            creatorId: wallet.userId,
            onChainId: proposalId.toString(),
            title: description.substring(0, 512), // Use description as title for now
            description,
            metadata: {
              targets,
              values: values.map((v: bigint) => v.toString()),
              calldatas
            },
            status: 'PENDING',
            startAt: this.timestampToDate(event.timestamp),
            createdAt: this.timestampToDate(event.timestamp),
            updatedAt: this.timestampToDate(event.timestamp)
          }
        });

        this.logSyncSuccess(event, 'proposal', proposalId.toString());
      } else {
        this.logger.debug('No user found for proposer wallet, storing event only', {
          proposer,
          proposalId
        });
      }
    } catch (error) {
      // If proposal already exists, just log it
      if ((error as any).code === 'P2002') {
        this.logger.debug('Proposal already exists', { proposalId });
        return;
      }
      this.logger.error('Failed to sync proposal created event', {
        proposalId,
        proposer,
        error
      });
      throw error;
    }
  }

  /**
   * Handle proposal executed event
   */
  private async handleProposalExecuted(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['proposalId']);

    const proposalId = this.bigintToNumber(event.data.proposalId);

    // Store the event
    await this.db.createContractEvents([this.transformEventData(event)]);

    // Update proposal status
    try {
      await this.db.getClient().daoProposal.update({
        where: { proposalId: proposalId.toString() },
        data: {
          status: 'EXECUTED',
          executedAt: this.timestampToDate(event.timestamp),
          updatedAt: this.timestampToDate(event.timestamp)
        }
      });

      this.logSyncSuccess(event, 'proposal', proposalId.toString());
    } catch (error) {
      this.logger.error('Failed to sync proposal executed event', {
        proposalId,
        error
      });
      throw error;
    }
  }

  /**
   * Handle proposal canceled event
   */
  private async handleProposalCanceled(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['proposalId']);

    const proposalId = this.bigintToNumber(event.data.proposalId);

    // Store the event
    await this.db.createContractEvents([this.transformEventData(event)]);

    // Update proposal status
    try {
      await this.db.getClient().daoProposal.update({
        where: { proposalId: proposalId.toString() },
        data: {
          status: 'CANCELED',
          canceledAt: this.timestampToDate(event.timestamp),
          updatedAt: this.timestampToDate(event.timestamp)
        }
      });

      this.logSyncSuccess(event, 'proposal', proposalId.toString());
    } catch (error) {
      this.logger.error('Failed to sync proposal canceled event', {
        proposalId,
        error
      });
      throw error;
    }
  }

  /**
   * Handle voting parameters updated event
   */
  private async handleVotingParametersUpdated(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['votingDelay', 'votingPeriod', 'proposalThreshold']);

    const votingDelay = this.bigintToNumber(event.data.votingDelay);
    const votingPeriod = this.bigintToNumber(event.data.votingPeriod);
    const proposalThreshold = this.bigintToNumber(event.data.proposalThreshold);

    // Store the event
    await this.db.createContractEvents([this.transformEventData(event)]);

    // Update governance parameters
    try {
      // Note: This would update a governance configuration table if it existed
      // For now, we just store the event
      this.logSyncSuccess(event, 'governance_config', 'voting_parameters');
    } catch (error) {
      this.logger.error('Failed to sync voting parameters updated event', {
        votingDelay,
        votingPeriod,
        proposalThreshold,
        error
      });
      throw error;
    }
  }

  /**
   * Handle membership contract updated event
   */
  private async handleMembershipContractUpdated(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['oldContract', 'newContract']);

    const oldContract = this.normalizeAddress(event.data.oldContract);
    const newContract = this.normalizeAddress(event.data.newContract);

    // Store the event
    await this.db.createContractEvents([this.transformEventData(event)]);

    // Update membership contract reference
    try {
      // Note: This would update a governance configuration table if it existed
      // For now, we just store the event
      this.logSyncSuccess(event, 'governance_config', 'membership_contract');
    } catch (error) {
      this.logger.error('Failed to sync membership contract updated event', {
        oldContract,
        newContract,
        error
      });
      throw error;
    }
  }
}