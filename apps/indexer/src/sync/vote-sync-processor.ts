/**
 * Vote event sync processor
 * Handles governance vote events and syncs them to the database
 */

import { BaseSyncProcessor, SyncResult } from './base-sync-processor.js';
import { ProcessedEvent } from '../types/index.js';
import { EventType } from '../types/events.js';

export class VoteSyncProcessor extends BaseSyncProcessor {
  constructor() {
    super('VoteSyncProcessor');
  }

  /**
   * Get supported event types
   */
  getSupportedEventTypes(): string[] {
    return [
      EventType.VOTE_CAST
    ];
  }

  /**
   * Process a single event
   */
  async processEvent(event: ProcessedEvent): Promise<void> {
    switch (event.eventType) {
      case EventType.VOTE_CAST:
        await this.handleVoteCast(event);
        break;
      default:
        this.logger.warn('Unsupported vote event type', { eventType: event.eventType });
    }
  }

  /**
   * Handle vote cast event
   */
  private async handleVoteCast(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['voter', 'proposalId', 'support', 'weight']);

    const voter = this.normalizeAddress(event.data.voter);
    const onChainProposalId = this.bigintToNumber(event.data.proposalId);
    const support = this.bigintToNumber(event.data.support);
    const weight = this.bigintToNumber(event.data.weight);

    // Store the event
    await this.db.createContractEvents([this.transformEventData(event)]);

    // Find the corresponding proposal and user
    try {
      // Find proposal by on-chain ID
      const proposal = await this.db.getClient().daoProposal.findFirst({
        where: { onChainId: onChainProposalId.toString() }
      });

      if (!proposal) {
        this.logger.debug('Proposal not found for vote, storing event only', {
          onChainProposalId,
          voter
        });
        return;
      }

      // Find voter's wallet and user
      const wallet = await this.db.getClient().wallet.findUnique({
        where: { address: voter }
      });

      if (!wallet || !wallet.userId) {
        this.logger.debug('No user found for voter wallet, storing event only', {
          voter,
          onChainProposalId
        });
        return;
      }

      // Convert support to VoteChoice enum
      // Assuming: 0=AGAINST, 1=FOR, 2=ABSTAIN
      const voteChoice = this.supportToVoteChoice(support);

      // Create vote record
      await this.db.getClient().vote.create({
        data: {
          proposalId: proposal.id,
          voterId: wallet.userId,
          choice: voteChoice,
          weight: weight,
          createdAt: this.timestampToDate(event.timestamp)
        }
      });

      this.logSyncSuccess(event, 'vote', `${voter}-${onChainProposalId}`);
    } catch (error) {
      // If vote already exists, just log it
      if ((error as any).code === 'P2002') {
        this.logger.debug('Vote already exists', { voter, onChainProposalId });
        return;
      }
      this.logger.error('Failed to sync vote cast event', {
        voter,
        onChainProposalId,
        support,
        weight,
        error
      });
      throw error;
    }
  }

  /**
   * Convert support number to VoteChoice enum
   */
  private supportToVoteChoice(support: number): string {
    switch (support) {
      case 0:
        return 'AGAINST';
      case 1:
        return 'FOR';
      case 2:
        return 'ABSTAIN';
      default:
        this.logger.warn('Unknown support type, defaulting to ABSTAIN', { support });
        return 'ABSTAIN';
    }
  }

  /**
   * Get vote statistics for a proposal
   */
  async getProposalVoteStats(proposalId: string): Promise<{
    totalVotes: number;
    forVotes: number;
    againstVotes: number;
    abstainVotes: number;
    voterCount: number;
  }> {
    try {
      const proposal = await this.db.getClient().daoProposal.findUnique({
        where: { id: proposalId },
        include: {
          votes: true
        }
      });

      if (!proposal) {
        throw new Error(`Proposal ${proposalId} not found`);
      }

      const forVotes = proposal.votes.filter(v => v.choice === 'FOR').length;
      const againstVotes = proposal.votes.filter(v => v.choice === 'AGAINST').length;
      const abstainVotes = proposal.votes.filter(v => v.choice === 'ABSTAIN').length;

      return {
        totalVotes: proposal.votes.length,
        forVotes,
        againstVotes,
        abstainVotes,
        voterCount: proposal.votes.length
      };
    } catch (error) {
      this.logger.error('Failed to get proposal vote stats', {
        proposalId,
        error
      });
      throw error;
    }
  }
}