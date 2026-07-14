/**
 * Logger service for structured logging
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogContext {
  [key: string]: any;
}

export class LoggerService {
  private static instance: LoggerService;
  private logLevel: LogLevel;

  private constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;
  }

  /**
   * Get singleton instance
   */
  static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  /**
   * Set log level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  /**
   * Format log message
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  /**
   * Debug log
   */
  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }

  /**
   * Info log
   */
  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage(LogLevel.INFO, message, context));
    }
  }

  /**
   * Warn log
   */
  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, context));
    }
  }

  /**
   * Error log
   */
  error(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(LogLevel.ERROR, message, context));
    }
  }

  /**
   * Log block processing
   */
  logBlockProcessed(blockNumber: number, eventCount: number, processingTime: number): void {
    this.info('Block processed', {
      blockNumber,
      eventCount,
      processingTime: `${processingTime}ms`
    });
  }

  /**
   * Log reorg detected
   */
  logReorgDetected(newBlockHash: string, previousBlockHash: string, depth: number): void {
    this.warn('Reorg detected', {
      newBlockHash,
      previousBlockHash,
      depth
    });
  }

  /**
   * Log event processing error
   */
  logEventProcessingError(
    blockNumber: number,
    txHash: string,
    eventName: string,
    error: string
  ): void {
    this.error('Event processing failed', {
      blockNumber,
      txHash,
      eventName,
      error
    });
  }

  /**
   * Log sync state update
   */
  logSyncStateUpdate(chain: string, lastBlock: number, lastBlockHash: string): void {
    this.info('Sync state updated', {
      chain,
      lastBlock,
      lastBlockHash
    });
  }
}