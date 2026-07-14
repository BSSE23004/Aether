/**
 * Event extraction from blockchain blocks
 */

import { LogData, ParsedEvent, ProcessedEvent } from '../types/index.js';
import { createPublicClient, http, parseAbiItem, Log } from 'viem';
import { LoggerService } from '../services/logger.service.js';
import { IndexerError } from '../utils/errors.js';
import { RetryService } from '../services/retry.service.js';
import { ContractConfig } from '../types/config.js';

export class EventExtractor {
  private client: any;
  private logger: LoggerService;
  private contracts: ContractConfig[];

  constructor(rpcUrl: string, contracts: ContractConfig[]) {
    this.contracts = contracts.filter(c => c.enabled);
    this.logger = LoggerService.getInstance();
    
    this.client = createPublicClient({
      transport: http(rpcUrl)
    });
  }

  /**
   * Extract logs from a block range
   */
  async extractLogs(fromBlock: number, toBlock: number): Promise<LogData[]> {
    try {
      const logs: LogData[] = [];
      
      for (const contract of this.contracts) {
        try {
          const contractLogs = await this.getContractLogs(
            contract.address,
            fromBlock,
            toBlock
          );
          logs.push(...contractLogs);
        } catch (error) {
          this.logger.error(`Failed to extract logs for ${contract.name}`, {
            contract: contract.address,
            error
          });
        }
      }

      this.logger.debug('Logs extracted', {
        fromBlock,
        toBlock,
        totalLogs: logs.length
      });

      return logs;
    } catch (error) {
      throw new IndexerError(
        `Failed to extract logs: ${(error as Error).message}`,
        'LOG_EXTRACTION_FAILED',
        true,
        { fromBlock, toBlock, error }
      );
    }
  }

  /**
   * Get logs for a specific contract
   */
  private async getContractLogs(
    contractAddress: string,
    fromBlock: number,
    toBlock: number
  ): Promise<LogData[]> {
    try {
      return await RetryService.withRetry(
        async () => {
          const logs = await this.client.getLogs({
            address: contractAddress as `0x${string}`,
            fromBlock: BigInt(fromBlock),
            toBlock: BigInt(toBlock)
          });

          return logs.map(log => this.formatLogData(log));
        },
        RetryService.getRpcRetryOptions()
      );
    } catch (error) {
      throw new IndexerError(
        `Failed to get contract logs: ${(error as Error).message}`,
        'CONTRACT_LOGS_FAILED',
        true,
        { contractAddress, fromBlock, toBlock, error }
      );
    }
  }

  /**
   * Format log data
   */
  private formatLogData(log: Log): LogData {
    return {
      address: log.address,
      topics: log.topics,
      data: log.data,
      blockNumber: Number(log.blockNumber),
      blockHash: log.blockHash,
      transactionHash: log.transactionHash,
      transactionIndex: Number(log.transactionIndex),
      logIndex: Number(log.logIndex),
      removed: log.removed
    };
  }

  /**
   * Parse raw logs into structured events
   */
  async parseLogs(logs: LogData[]): Promise<ParsedEvent[]> {
    const parsedEvents: ParsedEvent[] = [];

    for (const log of logs) {
      try {
        const contract = this.findContractByAddress(log.address);
        if (!contract) {
          this.logger.warn('Unknown contract address', { address: log.address });
          continue;
        }

        const parsedEvent = await this.parseLog(log, contract);
        if (parsedEvent) {
          parsedEvents.push(parsedEvent);
        }
      } catch (error) {
        this.logger.error('Failed to parse log', {
          txHash: log.transactionHash,
          logIndex: log.logIndex,
          error
        });
      }
    }

    return parsedEvents;
  }

  /**
   * Find contract by address
   */
  private findContractByAddress(address: string): ContractConfig | undefined {
    return this.contracts.find(c => 
      c.address.toLowerCase() === address.toLowerCase()
    );
  }

  /**
   * Parse a single log using contract ABI
   */
  private async parseLog(log: LogData, contract: ContractConfig): Promise<ParsedEvent | null> {
    try {
      // Find matching event in ABI
      const eventAbi = this.findEventInABI(log.topics[0], contract.abi);
      if (!eventAbi) {
        this.logger.debug('Unknown event signature', { signature: log.topics[0] });
        return null;
      }

      // Parse event using viem
      const parsed = await this.client.decodeEventLog({
        abi: [eventAbi],
        data: log.data,
        topics: log.topics
      });

      return {
        contract: contract.address,
        eventName: eventAbi.name,
        signature: log.topics[0],
        args: parsed as Record<string, any>,
        blockNumber: log.blockNumber,
        blockHash: log.blockHash,
        transactionHash: log.transactionHash,
        transactionIndex: log.transactionIndex,
        logIndex: log.logIndex,
        timestamp: 0 // Will be filled by block tracker
      };
    } catch (error) {
      this.logger.error('Failed to parse event log', {
        contract: contract.name,
        txHash: log.transactionHash,
        error
      });
      return null;
    }
  }

  /**
   * Find event in ABI by signature
   */
  private findEventInABI(signature: string, abi: any[]): any {
    for (const item of abi) {
      if (item.type === 'event') {
        // Calculate event signature
        const inputs = item.inputs?.map((input: any) => 
          `${input.type} ${input.name}`
        ).join(',') || '';
        const eventSignature = `${item.name}(${inputs})`;
        
        // In production, you'd hash this and compare with signature
        // For now, just return the event if names match
        if (item.name) {
          return item;
        }
      }
    }
    return null;
  }

  /**
   * Convert parsed events to processed events for database
   */
  convertToProcessedEvents(
    parsedEvents: ParsedEvent[],
    blockTimestamp: number
  ): ProcessedEvent[] {
    return parsedEvents.map(event => ({
      contract: event.contract,
      eventName: event.eventName,
      eventType: this.getEventType(event.eventName),
      data: event.args,
      blockNumber: event.blockNumber,
      blockHash: event.blockHash,
      transactionHash: event.transactionHash,
      logIndex: event.logIndex,
      timestamp: blockTimestamp
    }));
  }

  /**
   * Get event type from event name
   */
  private getEventType(eventName: string): string {
    const eventMapping: Record<string, string> = {
      // CommunityRegistry events
      'CommunityCreated': 'COMMUNITY_CREATED',
      'CommunityUpdated': 'COMMUNITY_UPDATED',
      'CommunityDeactivated': 'COMMUNITY_DEACTIVATED',
      'CommunityActivated': 'COMMUNITY_ACTIVATED',
      'CommunityAdminAdded': 'COMMUNITY_ADMIN_ADDED',
      'CommunityAdminRemoved': 'COMMUNITY_ADMIN_REMOVED',
      'CommunityVerificationRequested': 'COMMUNITY_VERIFICATION_REQUESTED',
      'CommunityVerified': 'COMMUNITY_VERIFIED',
      'CommunityStatsUpdated': 'COMMUNITY_STATS_UPDATED',
      
      // MembershipPass events
      'MembershipMinted': 'MEMBERSHIP_MINTED',
      'MembershipBurned': 'MEMBERSHIP_BURNED',
      'MembershipPriceUpdated': 'MEMBERSHIP_PRICE_UPDATED',
      'TreasuryUpdated': 'TREASURY_UPDATED',
      'MaxSupplyUpdated': 'MAX_SUPPLY_UPDATED',
      'MembershipExtended': 'MEMBERSHIP_EXTENDED',
      
      // Governor events
      'ProposalCreated': 'PROPOSAL_CREATED',
      'VoteCast': 'VOTE_CAST',
      'ProposalExecuted': 'PROPOSAL_EXECUTED',
      'ProposalCanceled': 'PROPOSAL_CANCELED',
      'MembershipContractUpdated': 'MEMBERSHIP_CONTRACT_UPDATED',
      'VotingParametersUpdated': 'VOTING_PARAMETERS_UPDATED'
    };

    return eventMapping[eventName] || eventName.toUpperCase();
  }

  /**
   * Get event signature from ABI
   */
  getEventSignature(contractName: string, eventName: string): string {
    const contract = this.contracts.find(c => c.name === contractName);
    if (!contract) {
      throw new IndexerError(
        `Contract ${contractName} not found`,
        'CONTRACT_NOT_FOUND',
        false
      );
    }

    const eventAbi = contract.abi.find((item: any) => 
      item.type === 'event' && item.name === eventName
    );

    if (!eventAbi) {
      throw new IndexerError(
        `Event ${eventName} not found in ${contractName}`,
        'EVENT_NOT_FOUND',
        false
      );
    }

    // In production, this would return the actual keccak256 hash
    return eventName;
  }

  /**
   * Extract events from a single block
   */
  async extractBlockEvents(blockNumber: number): Promise<ProcessedEvent[]> {
    try {
      const logs = await this.extractLogs(blockNumber, blockNumber);
      const parsedEvents = await this.parseLogs(logs);
      
      // Get block timestamp
      const block = await this.client.getBlock({ blockNumber: BigInt(blockNumber) });
      const blockTimestamp = Number(block.timestamp);

      return this.convertToProcessedEvents(parsedEvents, blockTimestamp);
    } catch (error) {
      throw new IndexerError(
        `Failed to extract block events: ${(error as Error).message}`,
        'BLOCK_EVENT_EXTRACTION_FAILED',
        true,
        { blockNumber, error }
      );
    }
  }
}