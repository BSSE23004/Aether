/**
 * MessageInput - main message input component with textarea and actions
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { MessageTextarea } from './message-textarea';
import { MessageActions } from './message-actions';
import { isEmptyContent } from '../../utils';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onAttachFile?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function MessageInput({
  onSendMessage,
  onAttachFile,
  disabled = false,
  placeholder = 'Type a message...',
  className,
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const canSend = !isEmptyContent(content) && !isSending;

  const handleSend = useCallback(async () => {
    if (!canSend || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(content);
      setContent('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  }, [content, canSend, isSending, onSendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) {
        handleSend();
      }
    }
  }, [canSend, handleSend]);

  const handleChange = useCallback((newContent: string) => {
    setContent(newContent);

    // Clear typing timeout and set new one
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Could emit typing event here if needed
    typingTimeoutRef.current = setTimeout(() => {
      // Stop typing event
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={cn(
        'flex items-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700',
        'bg-white dark:bg-gray-800',
        className
      )}
    >
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            'flex items-center gap-2 px-4 py-2',
            'bg-gray-100 dark:bg-gray-700 rounded-2xl',
            'focus-within:ring-2 focus-within:ring-blue-500'
          )}
        >
          <MessageTextarea
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isSending}
            className="min-h-[44px]"
          />
        </div>
      </div>

      <MessageActions
        onSend={handleSend}
        onAttach={onAttachFile}
        canSend={canSend}
        isSending={isSending}
        disabled={disabled}
      />
    </div>
  );
}