/**
 * MessageActions - action buttons for message input (send, attach, etc.)
 */

'use client';

import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface MessageActionsProps {
  onSend?: () => void;
  onAttach?: () => void;
  canSend?: boolean;
  isSending?: boolean;
  disabled?: boolean;
}

export function MessageActions({
  onSend,
  onAttach,
  canSend = false,
  isSending = false,
  disabled = false,
}: MessageActionsProps) {
  return (
    <div className="flex items-center gap-2 px-2">
      {/* Attach Button */}
      {onAttach && (
        <button
          onClick={onAttach}
          disabled={disabled}
          className={cn(
            'p-2 rounded-lg transition-colors',
            'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
            'hover:bg-gray-100 dark:hover:bg-gray-700',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          title="Attach file"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
      )}

      {/* Send Button */}
      <button
        onClick={onSend}
        disabled={!canSend || disabled || isSending}
        className={cn(
          'p-2 rounded-lg transition-colors',
          canSend && !disabled && !isSending
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed',
          disabled && 'opacity-50'
        )}
        title="Send message"
      >
        {isSending ? (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        )}
      </button>
    </div>
  );
}