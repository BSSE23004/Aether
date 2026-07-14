/**
 * Database service for Prisma operations
 */

import { PrismaClient } from '@prisma/client';
import { DatabaseError } from '../utils/errors.js';
import { RetryService } from './retry.service.js';

export class DatabaseService {
  private static instance: DatabaseService;
  private prisma: PrismaClient;
  private isConnected: boolean = false;

  private constructor() {
    this.prisma = new PrismaClient({
      log: ['error', 'warn'],
      errorFormat: 'minimal'
    });
  }

  /**
   * Get singleton instance
   */
  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Connect to database
   */
  async connect(): Promise<void> {
    try {
      await RetryService.withRetry(
        async () => {
          await this.prisma.$connect();
          this.isConnected = true;
        },
        RetryService.getDatabaseRetryOptions()
      );
      console.log('Database connected successfully');
    } catch (error) {
      throw new DatabaseError(
        `Failed to connect to database: ${(error as Error).message}`,
        { error }
      );
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this.isConnected = false;
      console.log('Database disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting from database:', error);
    }
  }

  /**
   * Get Prisma client
   */
  getClient(): PrismaClient {
    if (!this.isConnected) {
      throw new DatabaseError('Database not connected');
    }
    return this.prisma;
  }

  /**
   * Create contract events
   */
  async createContractEvents(events: any[]): Promise<void> {
    try {
      await this.prisma.contractEvent.createMany({
        data: events,
        skipDuplicates: true
      });
    } catch (error) {
      throw new DatabaseError(
        `Failed to create contract events: ${(error as Error).message}`,
        { events, error }
      );
    }
  }

  /**
   * Delete contract events by block range
   */
  async deleteContractEventsByBlockRange(
    fromBlock: number,
    toBlock: number
  ): Promise<void> {
    try {
      await this.prisma.contractEvent.deleteMany({
        where: {
          blockNumber: {
            gte: fromBlock,
            lte: toBlock
          }
        }
      });
    } catch (error) {
      throw new DatabaseError(
        `Failed to delete contract events: ${(error as Error).message}`,
        { fromBlock, toBlock, error }
      );
    }
  }

  /**
   * Update chain sync state
   */
  async updateChainSyncState(data: {
    chain: string;
    lastBlock: number;
    lastBlockHash: string;
    lastTimestamp: number;
  }): Promise<void> {
    try {
      const existingState = await this.prisma.chainSyncState.findUnique({
        where: { chain: data.chain }
      });

      if (existingState) {
        await this.prisma.chainSyncState.update({
          where: { chain: data.chain },
          data: {
            lastBlock: data.lastBlock,
            lastBlockHash: data.lastBlockHash,
            lastTimestamp: new Date(data.lastTimestamp * 1000),
            updatedAt: new Date()
          }
        });
      } else {
        await this.prisma.chainSyncState.create({
          data: {
            chain: data.chain,
            lastBlock: data.lastBlock,
            lastBlockHash: data.lastBlockHash,
            lastTimestamp: new Date(data.lastTimestamp * 1000)
          }
        });
      }
    } catch (error) {
      // If unique constraint violation, try update instead
      if ((error as any).code === 'P2002') {
        try {
          await this.prisma.chainSyncState.update({
            where: { chain: data.chain },
            data: {
              lastBlock: data.lastBlock,
              lastBlockHash: data.lastBlockHash,
              lastTimestamp: new Date(data.lastTimestamp * 1000),
              updatedAt: new Date()
            }
          });
          return;
        } catch (updateError) {
          throw new DatabaseError(
            `Failed to update chain sync state: ${(updateError as Error).message}`,
            { data, error: updateError }
          );
        }
      }
      throw new DatabaseError(
        `Failed to update chain sync state: ${(error as Error).message}`,
        { data, error }
      );
    }
  }

  /**
   * Get chain sync state
   */
  async getChainSyncState(chain: string): Promise<any | null> {
    try {
      return await this.prisma.chainSyncState.findUnique({
        where: { chain }
      });
    } catch (error) {
      throw new DatabaseError(
        `Failed to get chain sync state: ${(error as Error).message}`,
        { chain, error }
      );
    }
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(
    fn: (tx: PrismaClient) => Promise<T>
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(fn);
    } catch (error) {
      throw new DatabaseError(
        `Transaction failed: ${(error as Error).message}`,
        { error }
      );
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}