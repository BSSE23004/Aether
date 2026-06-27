/**
 * useTyping - hook for managing typing indicators
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import type { TypingUser } from '../types';

const TYPING_TIMEOUT = 3000; // 3 seconds

export function useTyping(channelId: string) {
  const [typingUsers, setTypingUsers] = useState<Record<string, TypingUser>>({});

  const addUserTyping = useCallback((userId: string, username?: string) => {
    setTypingUsers(prev => ({
      ...prev,
      [userId]: {
        userId,
        username,
        channelId,
        timestamp: Date.now(),
      },
    }));

    // Auto-remove after timeout
    setTimeout(() => {
      removeUserTyping(userId);
    }, TYPING_TIMEOUT);
  }, [channelId]);

  const removeUserTyping = useCallback((userId: string) => {
    setTypingUsers(prev => {
      const updated = { ...prev };
      delete updated[userId];
      return updated;
    });
  }, []);

  const clearTypingUsers = useCallback(() => {
    setTypingUsers({});
  }, []);

  // Clean up old typing indicators periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setTypingUsers(prev => {
        const now = Date.now();
        const updated: Record<string, TypingUser> = {};
        
        Object.entries(prev).forEach(([userId, typingUser]) => {
          if (now - typingUser.timestamp < TYPING_TIMEOUT) {
            updated[userId] = typingUser;
          }
        });
        
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const currentChannelTypingUsers = Object.values(typingUsers).filter(
    user => user.channelId === channelId
  );

  return {
    typingUsers: currentChannelTypingUsers,
    addUserTyping,
    removeUserTyping,
    clearTypingUsers,
  };
}