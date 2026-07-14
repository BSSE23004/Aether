/**
 * Governor event handler
 */

import { BaseHandler } from './base-handler.js';
import { ProcessedEvent } from '../types/index.js';
import { GovernanceEvent } from '../types/events.js';

export class GovernorHandler extends BaseHandler {
  constructor() {
    super('Governor');
  }

  /**
   * Get supported events
   */
  getSupportedEvents(): string[] {
    return [
      'ProposalCreated',
      'VoteCast',
      'ProposalExecuted',
      'ProposalCanceled',
      'MembershipContractUpdated',
      'VotingParametersUpdated'
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
      case 'ProposalCreated':
        await this.handleProposalCreated(event);
        break;
      case 'VoteCast':
        await this.handleVoteCast(event);
        break;
      case 'ProposalExecuted':
        await this.handleProposalExecuted(event);
        break;
      case 'ProposalCanceled':
        await this.handleProposalCanceled(event);
        break;
      case 'MembershipContractUpdated':
        await this.handleMembershipContractUpdated(event);
        break;
      case 'VotingParametersUpdated':
        await this.handleVotingParametersUpdated(event);
        break;
      default:
        this.logger.warn('Unknown event type', { event: event.eventName });
    }

    this.logEventProcessed(event);
  }

  /**
   * Handle ProposalCreated event
   */
  private async handleProposalCreated(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['proposalId', 'proposer']);

    const governanceData: GovernanceEvent = {
      proposalId: this.bigintToNumber(event.data.proposalId),
      proposer: this.normalizeAddress(event.data.proposer),
      targets: event.data.targets ? event.data.targets.map((t: string) => this.normalizeAddress(t)) : undefined,
      values: event.data.values ? event.data.values.map((v: bigint) => this.bigintToNumber(v)) : undefined,
      calldatas: event.data.calldatas,
      description: event.data.description,
      timestamp: event.timestamp
    };

    await this.db.createContractEvents([this.transformEventData(event)]);

    this.logger.info('Proposal created', {
      proposalId: governanceData.proposalId,
      proposer: governanceData.proposer,
      description: governanceData.description
    });
  }

  /**
   * Handle VoteCast event
   */
  private async handleVoteCast(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['voter', 'proposalId', 'support', 'weight']);

    const governanceData: GovernanceEvent = {
      proposalId: this.bigintToNumber(event.data.proposalId),
      voter: this.normalizeAddress(event.data.voter),
      support: this.bigintToNumber(event.data.support),
      weight: this.bigintToNumber(event.data.weight),
      timestamp: event.timestamp
    };

    await this.db.createContractEvents([this.transformEventData(event)]);

    this.logger.info('Vote cast', {
      proposalId: governanceData.proposalId,
      voter: governanceData.voter,
      support: governanceData.support,
      weight: governanceData.weight
    });
  }

  /**
   * Handle ProposalExecuted event
   */
  private async handleProposalExecuted(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['proposalId']);

    const governanceData: GovernanceEvent = {
      proposalId: this.bigintToNumber(event.data.proposalId),
      timestamp: event.timestamp
    };

    await this.db.createContractEvents([this.transformEventData(event)]);

    this.logger.info('Proposal executed', {
      proposalId: governanceData.proposalId
    });
  }

  /**
   * Handle ProposalCanceled event
   */
  private async handleProposalCanceled(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['proposalId']);

    const governanceData: GovernanceEvent = {
      proposalId: this.bigintToNumber(event.data.proposalId),
      timestamp: event.timestamp
    };

    await this.db.createContractEvents([this.transformEventData(event)]);

    this.logger.info('Proposal canceled', {
      proposalId: governanceData.proposalId
    });
  }

  /**
   * Handle MembershipContractUpdated event
   */
  private async handleMembershipContractUpdated(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['oldContract', 'newContract']);

    const oldContract = this.normalizeAddress(event.data.oldContract);
    const newContract = this.normalizeAddress(event.data.newContract);

    await this.db.createContractEvents([this.transformEventData(event)]);

    this.logger.info('Membership contract updated', {
      oldContract,
      newContract
    });
  }

  /**
   * Handle VotingParametersUpdated event
   */
  private async handleVotingParametersUpdated(event: ProcessedEvent): Promise<void> {
    this.validateEventData(event, ['votingDelay', 'votingPeriod', 'proposalThreshold']);

    const votingDelay = this.bigintToNumber(event.data.votingDelay);
    const votingPeriod = this.bigintToNumber(event.data.votingPeriod);
    const proposalThreshold = this.bigintToNumber(event.data.proposalThreshold);

    await this.db.createContractEvents([this.transformEventData(event)]);

    this.logger.info('Voting parameters updated', {
      votingDelay,
      votingPeriod,
      proposalThreshold
    });
  }
}