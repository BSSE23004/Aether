/**
 * WebSocket client for real-time communication
 */

import { env } from '@/config';
import { NetworkError } from '@/types';

export interface WebSocketMessage<T = unknown> {
  type: string;
  data: T;
  timestamp?: number;
}

export type MessageHandler<T = unknown> = (message: WebSocketMessage<T>) => void;

export interface WebSocketOptions {
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private options: Required<WebSocketOptions>;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isManualClose = false;

  constructor(options: WebSocketOptions = {}) {
    this.url = env.WS_URL;
    this.options = {
      reconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      ...options,
    };
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event: MessageEvent) => {
          try {
            const message = JSON.parse(event.data) as WebSocketMessage;
            this.handleMessage(message);
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
          }
        };

        this.ws.onerror = (event: Event) => {
          console.error('[WebSocket] Error:', event);
          this.emit('error', event);
          reject(new NetworkError('WebSocket connection failed'));
        };

        this.ws.onclose = () => {
          console.log('[WebSocket] Disconnected');
          this.stopHeartbeat();
          this.emit('disconnected');

          if (!this.isManualClose && this.options.reconnect) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        reject(new NetworkError('Failed to create WebSocket'));
      }
    });
  }

  disconnect(): void {
    this.isManualClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send<T>(type: string, data: T): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] Not connected');
      return;
    }

    const message: WebSocketMessage<T> = {
      type,
      data,
      timestamp: Date.now(),
    };

    this.ws.send(JSON.stringify(message));
  }

  on<T = unknown>(type: string, handler: MessageHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler as MessageHandler);

    // Return unsubscribe function
    return () => {
      const set = this.handlers.get(type);
      if (set) {
        set.delete(handler as MessageHandler);
      }
    };
  }

  off(type: string, handler: MessageHandler): void {
    const set = this.handlers.get(type);
    if (set) {
      set.delete(handler);
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }
  }

  private emit(type: string, data?: unknown): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.forEach(handler =>
        handler({ type, data } as WebSocketMessage)
      );
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached');
      this.emit('max_reconnect_attempts');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.options.reconnectInterval * this.reconnectAttempts;
    console.log(
      `[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`
    );

    this.reconnectTimer = setTimeout(() => {
      this.isManualClose = false;
      this.connect().catch(error => {
        console.error('[WebSocket] Reconnection failed:', error);
      });
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.send('ping', {});
    }, this.options.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const webSocketClient = new WebSocketClient();
