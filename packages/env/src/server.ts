/**
 * Server-side environment variables
 * These should NOT be exposed to the client
 */

import { getEnv, validateEnv } from './index';

export const serverEnv = {
  NODE_ENV: process.env.NODE_ENV as 'development' | 'production' | 'test',
  
  // API
  API_PORT: parseInt(process.env.API_PORT || '3001'),
  API_URL: getEnv('API_URL', 'http://localhost:3001'),
  
  // Database
  DATABASE_URL: getEnv('DATABASE_URL'),
  
  // Redis
  REDIS_URL: getEnv('REDIS_URL', 'redis://localhost:6379'),
  
  // Blockchain
  BASE_SEPOLIA_RPC_URL: getEnv('BASE_SEPOLIA_RPC_URL', 'https://sepolia.base.org'),
  CHAIN_ID: 84532,
  ADMIN_WALLET_ADDRESS: process.env.ADMIN_WALLET_ADDRESS,
  
  // JWT (optional)
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
  
  // IPFS (optional Pinata)
  PINATA_API_KEY: process.env.PINATA_API_KEY,
  PINATA_API_SECRET: process.env.PINATA_API_SECRET,
  
  // AI Service
  OLLAMA_HOST: process.env.OLLAMA_HOST || 'http://localhost:11434',
  OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'mistral',
};

export type ServerEnv = typeof serverEnv;

/**
 * Validate production environment variables
 */
export function validateProductionEnv(): void {
  if (process.env.NODE_ENV === 'production') {
    const required = ['DATABASE_URL', 'JWT_SECRET'];
    validateEnv(process.env, required);
  }
}
