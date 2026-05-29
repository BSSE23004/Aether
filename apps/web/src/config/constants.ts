/**
 * Application constants
 */

export const APP_NAME = 'Aether';
export const APP_VERSION = '0.1.0';

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const CACHE_TIMES = {
  INSTANT: 0,
  SHORT: 1 * 60 * 1000,      // 1 minute
  MEDIUM: 5 * 60 * 1000,     // 5 minutes
  LONG: 30 * 60 * 1000,      // 30 minutes
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
} as const;

export const WEBSOCKET = {
  RECONNECT_INTERVAL: 3000,
  MAX_RECONNECT_ATTEMPTS: 10,
  HEARTBEAT_INTERVAL: 30000,
} as const;

export const VALIDATION = {
  USERNAME_MIN: 3,
  USERNAME_MAX: 32,
  BIO_MAX: 500,
  MESSAGE_MAX: 2000,
  FILE_MAX_SIZE: 50 * 1024 * 1024, // 50MB
} as const;

export const ROUTES = {
  HOME: '/',
  AUTH: {
    CONNECT: '/auth/connect',
  },
  DASHBOARD: {
    HOME: '/dashboard',
    COMMUNITIES: '/dashboard/communities',
    MESSAGES: '/dashboard/messages',
    GOVERNANCE: '/dashboard/governance',
    STORAGE: '/dashboard/storage',
    SETTINGS: '/dashboard/settings',
  },
} as const;
