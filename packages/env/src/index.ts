/**
 * Environment validation utilities
 * Shared across frontend and backend
 */

export interface Env {
  NODE_ENV: 'development' | 'production' | 'test';
  API_URL: string;
  WS_URL: string;
}

/**
 * Validate required environment variables
 */
export function validateEnv(vars: Record<string, string | undefined>, required: string[]): void {
  const missing = required.filter((key) => !vars[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Get env variable with fallback
 */
export function getEnv(key: string, fallback?: string): string {
  const value = process.env[key] || fallback;
  if (!value) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
}

/**
 * Check if running in development
 */
export function isDev(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if running in production
 */
export function isProd(): boolean {
  return process.env.NODE_ENV === 'production';
}
