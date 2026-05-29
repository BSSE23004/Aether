/**
 * Environment validation for frontend
 */

const requiredEnv = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_WS_URL',
  'NEXT_PUBLIC_CHAIN_ID',
  'NEXT_PUBLIC_RPC_URL',
] as const;

type RequiredEnv = typeof requiredEnv[number];

function getEnv(key: RequiredEnv): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export const env = {
  API_URL: getEnv('NEXT_PUBLIC_API_URL'),
  WS_URL: getEnv('NEXT_PUBLIC_WS_URL'),
  CHAIN_ID: parseInt(getEnv('NEXT_PUBLIC_CHAIN_ID')),
  RPC_URL: getEnv('NEXT_PUBLIC_RPC_URL'),
  WALLET_CONNECT_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'default',
  PINATA_GATEWAY: process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud',
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
};

export type Env = typeof env;
