/**
 * Redis service for caching and coordination
 */

import { createClient } from 'redis';
import { DatabaseError } from '../utils/errors.js';
import { RetryService } from './retry.service.js';

export class RedisService {
  private static instance: RedisService;
  private client: any;
  private isConnected: boolean = false;

  private constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    }) as any;

    this.client.on('error', (error: any) => {
      console.error('Redis client error:', error);
    });

    this.client.on('connect', () => {
      console.log('Redis client connected');
    });

    this.client.on('disconnect', () => {
      console.log('Redis client disconnected');
    });
  }

  /**
   * Get singleton instance
   */
  static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    try {
      await RetryService.withRetry(
        async () => {
          await this.client.connect();
          this.isConnected = true;
        },
        {
          maxRetries: 3,
          initialDelay: 500,
          maxDelay: 5000,
          backoffMultiplier: 2
        }
      );
      console.log('Redis connected successfully');
    } catch (error) {
      throw new DatabaseError(
        `Failed to connect to Redis: ${(error as Error).message}`,
        { error }
      );
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      this.isConnected = false;
      console.log('Redis disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting from Redis:', error);
    }
  }

  /**
   * Set a value with optional expiration
   */
  async set(key: string, value: string, expiration?: number): Promise<void> {
    try {
      if (expiration) {
        await this.client.setEx(key, expiration, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      throw new DatabaseError(
        `Failed to set Redis value: ${(error as Error).message}`,
        { key, error }
      );
    }
  }

  /**
   * Get a value
   */
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      throw new DatabaseError(
        `Failed to get Redis value: ${(error as Error).message}`,
        { key, error }
      );
    }
  }

  /**
   * Delete a value
   */
  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      throw new DatabaseError(
        `Failed to delete Redis value: ${(error as Error).message}`,
        { key, error }
      );
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      throw new DatabaseError(
        `Failed to check Redis key existence: ${(error as Error).message}`,
        { key, error }
      );
    }
  }

  /**
   * Set a hash field
   */
  async hSet(key: string, field: string, value: string): Promise<void> {
    try {
      await this.client.hSet(key, field, value);
    } catch (error) {
      throw new DatabaseError(
        `Failed to set Redis hash field: ${(error as Error).message}`,
        { key, field, error }
      );
    }
  }

  /**
   * Get a hash field
   */
  async hGet(key: string, field: string): Promise<string | null> {
    try {
      return await this.client.hGet(key, field);
    } catch (error) {
      throw new DatabaseError(
        `Failed to get Redis hash field: ${(error as Error).message}`,
        { key, field, error }
      );
    }
  }

  /**
   * Get all hash fields
   */
  async hGetAll(key: string): Promise<Record<string, string>> {
    try {
      return await this.client.hGetAll(key);
    } catch (error) {
      throw new DatabaseError(
        `Failed to get Redis hash: ${(error as Error).message}`,
        { key, error }
      );
    }
  }

  /**
   * Publish to a channel
   */
  async publish(channel: string, message: string): Promise<void> {
    try {
      await this.client.publish(channel, message);
    } catch (error) {
      throw new DatabaseError(
        `Failed to publish to Redis channel: ${(error as Error).message}`,
        { channel, error }
      );
    }
  }

  /**
   * Subscribe to a channel
   */
  async subscribe(
    channel: string,
    callback: (message: string) => void
  ): Promise<void> {
    try {
      const subscriber = this.client.duplicate();
      await subscriber.connect();
      await subscriber.subscribe(channel, (message) => {
        callback(message);
      });
    } catch (error) {
      throw new DatabaseError(
        `Failed to subscribe to Redis channel: ${(error as Error).message}`,
        { channel, error }
      );
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }

  /**
   * Check if connected
   */
  isRedisConnected(): boolean {
    return this.isConnected;
  }
}