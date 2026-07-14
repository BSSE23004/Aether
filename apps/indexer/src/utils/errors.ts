/**
 * Custom error classes for the indexer
 */

export class IndexerError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = true,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = 'IndexerError';
  }
}

export class RpcError extends IndexerError {
  constructor(
    message: string,
    context?: Record<string, any>
  ) {
    super(message, 'RPC_FAILURE', true, context);
    this.name = 'RpcError';
  }
}

export class DatabaseError extends IndexerError {
  constructor(
    message: string,
    context?: Record<string, any>
  ) {
    super(message, 'DATABASE_ERROR', true, context);
    this.name = 'DatabaseError';
  }
}

export class ReorgError extends IndexerError {
  constructor(
    message: string,
    context?: Record<string, any>
  ) {
    super(message, 'REORG_DETECTED', false, context);
    this.name = 'ReorgError';
  }
}

export class EventProcessingError extends IndexerError {
  constructor(
    message: string,
    context?: Record<string, any>
  ) {
    super(message, 'EVENT_PROCESSING_ERROR', true, context);
    this.name = 'EventProcessingError';
  }
}

export class ConfigError extends IndexerError {
  constructor(
    message: string,
    context?: Record<string, any>
  ) {
    super(message, 'CONFIG_ERROR', false, context);
    this.name = 'ConfigError';
  }
}

export class HandlerError extends IndexerError {
  constructor(
    message: string,
    context?: Record<string, any>
  ) {
    super(message, 'HANDLER_ERROR', true, context);
    this.name = 'HandlerError';
  }
}

export const ERROR_CODES = {
  RPC_FAILURE: 'RPC_FAILURE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  REORG_DETECTED: 'REORG_DETECTED',
  INVALID_EVENT: 'INVALID_EVENT',
  HANDLER_ERROR: 'HANDLER_ERROR',
  CONFIG_ERROR: 'CONFIG_ERROR',
  EVENT_PROCESSING_ERROR: 'EVENT_PROCESSING_ERROR'
} as const;