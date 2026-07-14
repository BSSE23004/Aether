/**
 * Main entry point for the blockchain indexer
 */

import { Indexer } from './core/indexer.js';
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
    logger.info('Starting Aether Blockchain Indexer...');

    // Load and validate configuration
    const config = await getConfig();
    validateConfig(config);

    logger.info('Configuration loaded', {
      logLevel: config.logLevel,
      pollInterval: config.pollInterval,
      batchSize: config.batchSize,
      enableRedis: config.enableRedis,
      enableNotifications: config.enableNotifications,
      contracts: config.contracts.filter(c => c.enabled).map(c => c.name)
    });

    // Create and initialize indexer
    const indexer = new Indexer(config);
    await indexer.initialize();

    // Start indexing
    await indexer.start();

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
  console.error('Failed to start indexer:', error);
  process.exit(1);
});