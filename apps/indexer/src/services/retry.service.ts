/**
 * Retry service with exponential backoff
 */

import { IndexerError } from '../utils/errors.js';

export interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: Error) => boolean;
}

export class RetryService {
  private static readonly DEFAULT_MAX_DELAY = 30000; // 30 seconds
  private static readonly DEFAULT_BACKOFF_MULTIPLIER = 2;

  /**
   * Execute a function with retry logic
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions
  ): Promise<T> {
    const {
      maxRetries,
      initialDelay,
      maxDelay = this.DEFAULT_MAX_DELAY,
      backoffMultiplier = this.DEFAULT_BACKOFF_MULTIPLIER,
      shouldRetry = () => true
    } = options;

    let lastError: Error;
    let currentDelay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Check if error is retryable
        if (!shouldRetry(error as Error)) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          throw new IndexerError(
            `Max retries (${maxRetries}) exceeded: ${lastError.message}`,
            'MAX_RETRIES_EXCEEDED',
            false,
            { originalError: lastError }
          );
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(currentDelay, maxDelay);
        
        console.warn(
          `Attempt ${attempt + 1}/${maxRetries} failed. Retrying in ${delay}ms...`,
          { error: lastError.message }
        );

        await this.sleep(delay);
        currentDelay *= backoffMultiplier;
      }
    }

    throw lastError!;
  }

  /**
   * Sleep for a specified duration
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Default retry options for RPC calls
   */
  static getRpcRetryOptions(): RetryOptions {
    return {
      maxRetries: 5,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      shouldRetry: (error: Error) => {
        // Retry on network errors and rate limits
        const retryableMessages = [
          'network',
          'timeout',
          'rate limit',
          'ECONNREFUSED',
          'ETIMEDOUT'
        ];
        return retryableMessages.some(msg => 
          error.message.toLowerCase().includes(msg)
        );
      }
    };
  }

  /**
   * Default retry options for database operations
   */
  static getDatabaseRetryOptions(): RetryOptions {
    return {
      maxRetries: 3,
      initialDelay: 500,
      maxDelay: 5000,
      backoffMultiplier: 2,
      shouldRetry: (error: Error) => {
        // Retry on connection errors and deadlocks
        const retryableMessages = [
          'connection',
          'deadlock',
          'timeout',
          'ECONNREFUSED'
        ];
        return retryableMessages.some(msg => 
          error.message.toLowerCase().includes(msg)
        );
      }
    };
  }
}