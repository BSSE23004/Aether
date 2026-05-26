/**
 * Client-side environment variables
 * These must be prefixed with NEXT_PUBLIC_
 */

export const clientEnv = {
  NODE_ENV: process.env.NODE_ENV as 'development' | 'production' | 'test',
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
  CHAIN_ID: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '84532'),
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org',
  PINATA_GATEWAY: process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud',
};

export type ClientEnv = typeof clientEnv;
