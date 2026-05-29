/**
 * useWebSocket - hook for WebSocket communication
 */

'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { webSocketClient, type MessageHandler, type WebSocketMessage } from '@/lib/websocket';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribesRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    const connect = async () => {
      try {
        await webSocketClient.connect();
        setIsConnected(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };

    connect();

    return () => {
      unsubscribesRef.current.forEach(unsub => unsub());
      unsubscribesRef.current = [];
    };
  }, []);

  const subscribe = useCallback(
    <T = unknown>(type: string, handler: MessageHandler<T>) => {
      const unsub = webSocketClient.on(type, handler as MessageHandler);
      unsubscribesRef.current.push(unsub);
      return unsub;
    },
    []
  );

  const send = useCallback(<T>(type: string, data: T) => {
    webSocketClient.send(type, data);
  }, []);

  return {
    isConnected,
    error,
    subscribe,
    send,
  };
}
