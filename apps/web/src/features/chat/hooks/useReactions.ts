/**
 * useReactions - hook for managing message reactions
 */

'use client';

import { useState, useCallback } from 'react';
import type { MessageReaction } from '../types';

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👀'];

export function useReactions() {
  const [reactions, setReactions] = useState<Record<string, MessageReaction[]>>({});

  const addReaction = useCallback((messageId: string, emoji: string, userId: string) => {
    setReactions(prev => {
      const messageReactions = prev[messageId] || [];
      const existingReaction = messageReactions.find(r => r.emoji === emoji);

      if (existingReaction) {
        if (!existingReaction.hasReacted) {
          // User hasn't reacted with this emoji yet
          return {
            ...prev,
            [messageId]: messageReactions.map(r =>
              r.emoji === emoji
                ? { ...r, count: r.count + 1, users: [...r.users, userId], hasReacted: true }
                : r
            ),
          };
        }
        // User already reacted with this emoji, remove it (toggle)
        return {
          ...prev,
          [messageId]: messageReactions.map(r =>
            r.emoji === emoji
              ? { ...r, count: r.count - 1, users: r.users.filter(u => u !== userId), hasReacted: false }
              : r
          ),
        };
      }

      // Add new reaction
      return {
        ...prev,
        [messageId]: [
          ...messageReactions,
          { emoji, count: 1, users: [userId], hasReacted: true },
        ],
      };
    });
  }, []);

  const removeReaction = useCallback((messageId: string, emoji: string, userId: string) => {
    setReactions(prev => {
      const messageReactions = prev[messageId] || [];
      return {
        ...prev,
        [messageId]: messageReactions
          .map(r =>
            r.emoji === emoji
              ? { ...r, count: r.count - 1, users: r.users.filter(u => u !== userId), hasReacted: false }
              : r
          )
          .filter(r => r.count > 0),
      };
    });
  }, []);

  const getMessageReactions = useCallback((messageId: string): MessageReaction[] => {
    return reactions[messageId] || [];
  }, [reactions]);

  const clearReactions = useCallback((messageId: string) => {
    setReactions(prev => {
      const updated = { ...prev };
      delete updated[messageId];
      return updated;
    });
  }, []);

  return {
    reactions,
    addReaction,
    removeReaction,
    getMessageReactions,
    clearReactions,
    commonEmojis: COMMON_EMOJIS,
  };
}