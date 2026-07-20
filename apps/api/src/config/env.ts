/**
 * Environment validation schema
 *
 * Validates all required environment variables at startup
 */

export const envSchema = {
  // Server
  NODE_ENV: { type: 'string', default: 'development' },
  PORT: { type: 'number', default: 3001 },
  API_URL: { type: 'string', default: 'http://localhost:3001' },
  CORS_ORIGIN: { type: 'string', default: 'http://localhost:3000' },

  // Database
  DATABASE_URL: { type: 'string', required: true },
  DATABASE_HOST: { type: 'string', default: 'localhost' },
  DATABASE_PORT: { type: 'number', default: 5432 },
  DATABASE_USER: { type: 'string', default: 'postgres' },
  DATABASE_PASSWORD: { type: 'string', required: true },
  DATABASE_NAME: { type: 'string', default: 'aether' },

  // Redis
  REDIS_URL: { type: 'string', required: true },
  REDIS_HOST: { type: 'string', default: 'localhost' },
  REDIS_PORT: { type: 'number', default: 6379 },
  REDIS_PASSWORD: { type: 'string', default: '' },

  // Authentication
  JWT_SECRET: { type: 'string', required: true },
  JWT_EXPIRATION: { type: 'string', default: '7d' },

  // Blockchain
  BLOCKCHAIN_RPC_URL: { type: 'string', required: true },
  BLOCKCHAIN_CHAIN_ID: { type: 'number', default: 84532 },
  BLOCKCHAIN_NETWORK: { type: 'string', default: 'base-sepolia' },

  // IPFS / Pinata
  PINATA_API_KEY: { type: 'string', default: '' },
  PINATA_API_SECRET: { type: 'string', default: '' },
  IPFS_GATEWAY: { type: 'string', default: 'https://gateway.pinata.cloud' },
  IPFS_API_URL: { type: 'string', default: 'http://localhost:5001' },
  IPFS_GATEWAY_URL: { type: 'string', default: 'https://ipfs.io/ipfs/' },

  // AI Service (optional)
  AI_SERVICE_URL: { type: 'string', default: 'http://localhost:8000' },

  // Logging
  LOG_LEVEL: { type: 'string', default: 'log' },
};
