/**
 * MessageTextarea - auto-resizing textarea for message input
 */

'use client';

import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface MessageTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  className?: string;
}

export function MessageTextarea({
  value,
  onChange,
  placeholder = 'Type a message...',
  disabled = false,
  onKeyDown,
  className,
}: MessageTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      onKeyDown={onKeyDown}
      className={cn(
        'w-full resize-none overflow-y-auto',
        'bg-transparent border-none outline-none',
        'text-gray-900 dark:text-gray-100 placeholder-gray-500',
        'min-h-[44px] max-h-[200px]',
        'py-3 px-4',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      rows={1}
    />
  );
}