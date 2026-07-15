/**
 * Main entry point for the event sync worker
 */

import { SyncWorker } from './sync/sync-worker.js';
import { getConfig, validateConfig } from './config/index.js';
import { LoggerService } from './services/logger.service.js';
import { ConfigError } from './utils/errors.js';

// Setup error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

/**
 * Main function
 */
async function main(): Promise<void> {
  const logger = LoggerService.getInstance();

  try {
    logger.info('Starting Aether Event Sync Worker...');

    // Load and validate configuration
    const config = await getConfig();
    validateConfig(config);

    logger.info('Configuration loaded', {
      logLevel: config.logLevel,
      pollInterval: config.pollInterval,
      batchSize: config.batchSize,
      enableRedis: config.enableRedis,
      contracts: config.contracts.filter(c => c.enabled).map(c => c.name)
    });

    // Create and initialize sync worker
    const syncWorker = new SyncWorker(config);
    await syncWorker.initialize();

    // Start sync worker
    await syncWorker.start();

  } catch (error) {
    if (error instanceof ConfigError) {
      logger.error('Configuration error', { message: error.message, context: error.context });
    } else {
      logger.error('Fatal error', { error: (error as Error).message });
    }
    process.exit(1);
  }
}

// Run main function
main().catch((error) => {
  console.error('Failed to start sync worker:', error);
  process.exit(1);
});