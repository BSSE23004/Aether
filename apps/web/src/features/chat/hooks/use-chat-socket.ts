import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

interface UseChatSocketOptions {
  channelId: string;
  token?: string;
  onMessageReceived?: (message: any) => void;
  onUserTyping?: (data: { userId: string; channelId: string }) => void;
  onUserStopTyping?: (data: { userId: string; channelId: string }) => void;
  onMessageRead?: (data: { userId: string; messageId: string; channelId: string }) => void;
}

export const useChatSocket = ({
  channelId,
  token,
  onMessageReceived,
  onUserTyping,
  onUserStopTyping,
  onMessageRead,
}: UseChatSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) return;

    // Initialize socket connection
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001/ws';
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Join the specific channel room when connected
      if (channelId) {
        socket.emit('join_channel', { channelId });
      }
      
      // Potential optimization: Re-fetch latest messages on reconnect to ensure no dropped events
      // queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen to real-time events from the server
    socket.on('new_message', (message) => {
      if (onMessageReceived) {
        onMessageReceived(message);
      } else {
        // Optimistic update fallback: manually update the cache
        queryClient.setQueryData(['messages', channelId], (old: any) => {
          if (!old) return [message];
          // Replace optimistic message if it exists, otherwise append
          const exists = old.find((m: any) => m.id === message.id || m.tempId === message.id);
          if (exists) {
            return old.map((m: any) => (m.id === message.id || m.tempId === message.id ? message : m));
          }
          return [message, ...old];
        });
      }
    });

    socket.on('user_typing', (data) => {
      if (onUserTyping) onUserTyping(data);
    });

    socket.on('user_stop_typing', (data) => {
      if (onUserStopTyping) onUserStopTyping(data);
    });

    socket.on('message_read', (data) => {
      if (onMessageRead) onMessageRead(data);
    });

    // Cleanup on unmount or dependency change
    return () => {
      if (channelId) {
        socket.emit('leave_channel', { channelId });
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [channelId, token, queryClient, onMessageReceived, onUserTyping, onUserStopTyping, onMessageRead]);

  const sendMessage = useCallback((content: string, metadata?: any) => {
    if (!socketRef.current || !isConnected) return false;
    
    // In a full implementation we'd do an optimistic update right here,
    // before the server broadcasts it back.
    socketRef.current.emit('send_message', { channelId, content, metadata });
    return true;
  }, [channelId, isConnected]);

  const setTyping = useCallback((isTyping: boolean) => {
    if (!socketRef.current || !isConnected) return;
    
    if (isTyping) {
      socketRef.current.emit('typing_start', { channelId });
    } else {
      socketRef.current.emit('typing_end', { channelId });
    }
  }, [channelId, isConnected]);

  const markAsRead = useCallback((messageId: string) => {
    if (!socketRef.current || !isConnected) return;
    socketRef.current.emit('read_receipt', { channelId, messageId });
  }, [channelId, isConnected]);

  return {
    isConnected,
    sendMessage,
    setTyping,
    markAsRead,
  };
};
