/**
 * MessageReactions - displays and manages message reactions
 */

'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { MessageReaction } from '../../types';

interface MessageReactionsProps {
  reactions: MessageReaction[];
  onAddReaction?: (emoji: string) => void;
  onRemoveReaction?: (emoji: string) => void;
  canReact?: boolean;
}

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👀'];

export function MessageReactions({
  reactions,
  onAddReaction,
  onRemoveReaction,
  canReact = true,
}: MessageReactionsProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleReactionClick = useCallback((reaction: MessageReaction) => {
    if (!canReact) return;
    
    if (reaction.hasReacted) {
      onRemoveReaction?.(reaction.emoji);
    } else {
      onAddReaction?.(reaction.emoji);
    }
  }, [canReact, onAddReaction, onRemoveReaction]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    onAddReaction?.(emoji);
    setShowEmojiPicker(false);
  }, [onAddReaction]);

  if (reactions.length === 0 && !canReact) {
    return null;
  }

  return (
    <div className="relative mt-1">
      {/* Reactions */}
      <div className="flex flex-wrap gap-1">
        {reactions.map((reaction) => (
          <button
            key={reaction.emoji}
            onClick={() => handleReactionClick(reaction)}
            disabled={!canReact}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-sm border transition-colors',
              reaction.hasReacted
                ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700'
                : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700',
              !canReact && 'cursor-not-allowed opacity-70'
            )}
          >
            <span>{reaction.emoji}</span>
            <span className="text-xs">{reaction.count}</span>
          </button>
        ))}

        {/* Add Reaction Button */}
        {canReact && (
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="text-lg">+</span>
          </button>
        )}
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
          <div className="grid grid-cols-4 gap-1">
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiSelect(emoji)}
                className="w-8 h-8 flex items-center justify-center text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}