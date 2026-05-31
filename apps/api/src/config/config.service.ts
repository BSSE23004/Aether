/**
 * ConfigService - Environment and application configuration
 *
 * Provides typed access to environment variables with validation
 */

import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  // Server
  get nodeEnv(): string {
    return process.env.NODE_ENV || 'development';
  }

  get port(): number {
    return parseInt(process.env.PORT || '3001', 10);
  }

  get apiUrl(): string {
    return process.env.API_URL || 'http://localhost:3001';
  }

  get corsOrigin(): string {
    return process.env.CORS_ORIGIN || 'http://localhost:3000';
  }

  // Database
  get databaseUrl(): string {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    return process.env.DATABASE_URL;
  }

  get databaseHost(): string {
    return process.env.DATABASE_HOST || 'localhost';
  }

  get databasePort(): number {
    return parseInt(process.env.DATABASE_PORT || '5432', 10);
  }

  get databaseUser(): string {
    return process.env.DATABASE_USER || 'postgres';
  }

  get databasePassword(): string {
    return process.env.DATABASE_PASSWORD || '';
  }

  get databaseName(): string {
    return process.env.DATABASE_NAME || 'aether';
  }

  // Redis
  get redisUrl(): string {
    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL environment variable is required');
    }
    return process.env.REDIS_URL;
  }

  get redisHost(): string {
    return process.env.REDIS_HOST || 'localhost';
  }

  get redisPort(): number {
    return parseInt(process.env.REDIS_PORT || '6379', 10);
  }

  get redisPassword(): string {
    return process.env.REDIS_PASSWORD || '';
  }

  // Authentication
  get jwtSecret(): string {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    return process.env.JWT_SECRET;
  }

  get jwtExpiration(): string {
    return process.env.JWT_EXPIRATION || '7d';
  }

  // Blockchain
  get blockchainRpcUrl(): string {
    if (!process.env.BLOCKCHAIN_RPC_URL) {
      throw new Error('BLOCKCHAIN_RPC_URL environment variable is required');
    }
    return process.env.BLOCKCHAIN_RPC_URL;
  }

  get blockchainChainId(): number {
    return parseInt(process.env.BLOCKCHAIN_CHAIN_ID || '84532', 10);
  }

  get blockchainNetwork(): string {
    return process.env.BLOCKCHAIN_NETWORK || 'base-sepolia';
  }

  // IPFS
  get pinataApiKey(): string {
    return process.env.PINATA_API_KEY || '';
  }

  get pinataApiSecret(): string {
    return process.env.PINATA_API_SECRET || '';
  }

  get ipfsGateway(): string {
    return process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud';
  }

  // AI Service
  get aiServiceUrl(): string {
    return process.env.AI_SERVICE_URL || 'http://localhost:8000';
  }

  // Logging
  get logLevel(): string {
    return process.env.LOG_LEVEL || 'log';
  }

  // Utility methods
  isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  isTesting(): boolean {
    return this.nodeEnv === 'test';
  }
}
