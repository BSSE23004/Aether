/**
 * MessageInput - main message input component with textarea and actions
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { MessageTextarea } from './message-textarea';
import { MessageActions } from './message-actions';
import { isEmptyContent } from '../../utils';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { FileUploadZone, FilePreview } from '@/features/storage';
import type { FileQueueItem } from '@/features/storage/components/FilePreview';
import { env } from '@/config';

interface MessageInputProps {
  onSendMessage: (content: string, metadata?: { fileIds?: string[] }) => void | Promise<void>;
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
  const [fileQueue, setFileQueue] = useState<FileQueueItem[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { accessToken } = useAuthStore();

  const hasSuccessFiles = fileQueue.some(item => item.status === 'success');
  const hasUploadingFiles = fileQueue.some(item => item.status === 'uploading');
  const canSend = (!isEmptyContent(content) || hasSuccessFiles) && !hasUploadingFiles && !isSending;

  const handleSend = useCallback(async () => {
    if (!canSend || isSending) return;

    setIsSending(true);
    try {
      const fileIds = fileQueue
        .filter(item => item.status === 'success' && item.result?.id)
        .map(item => item.result!.id);

      const metadata = fileIds.length > 0 ? { fileIds } : undefined;

      await onSendMessage(content, metadata);
      setContent('');
      setFileQueue([]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  }, [content, fileQueue, canSend, isSending, onSendMessage]);

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

    typingTimeoutRef.current = setTimeout(() => {
      // Stop typing event
    }, 1000);
  }, []);

  const handleUploadFile = useCallback((file: File) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    // Create connection abort controller (simulated with xhr)
    const xhr = new XMLHttpRequest();
    
    const newItem: FileQueueItem = {
      id,
      file,
      progress: 0,
      status: 'uploading',
      cancel: () => {
        xhr.abort();
      }
    };

    setFileQueue(prev => [...prev, newItem]);

    const baseUrl = env.API_URL || 'http://localhost:3001';
    const url = new URL('/api/ipfs/upload', baseUrl);

    xhr.open('POST', url.toString(), true);

    if (accessToken) {
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    } else {
      const match = document.cookie.match(new RegExp(`(^| )aether_token=([^;]+)`));
      const token = match ? match[2] : null;
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setFileQueue(prev => 
          prev.map(item => item.id === id ? { ...item, progress: percent } : item)
        );
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          const fileResult = data.data !== undefined ? data.data : data;
          setFileQueue(prev => 
            prev.map(item => 
              item.id === id 
                ? { ...item, status: 'success', progress: 100, result: fileResult } 
                : item
            )
          );
        } catch {
          setFileQueue(prev => 
            prev.map(item => 
              item.id === id 
                ? { ...item, status: 'error', error: 'Response parsing failed' } 
                : item
            )
          );
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          const errMsg = errData.message || `Status ${xhr.status}`;
          setFileQueue(prev => 
            prev.map(item => 
              item.id === id 
                ? { ...item, status: 'error', error: errMsg } 
                : item
            )
          );
        } catch {
          setFileQueue(prev => 
            prev.map(item => 
              item.id === id 
                ? { ...item, status: 'error', error: `Status ${xhr.status}` } 
                : item
            )
          );
        }
      }
    };

    xhr.onerror = () => {
      setFileQueue(prev => 
        prev.map(item => 
          item.id === id 
            ? { ...item, status: 'error', error: 'Network error occurred' } 
            : item
        )
      );
    };

    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', 'attachment');
    xhr.send(formData);
  }, [accessToken]);

  const handleRemoveFile = useCallback((id: string) => {
    setFileQueue(prev => prev.filter(item => item.id !== id));
  }, []);

  const triggerFileSelect = useCallback(() => {
    if (onAttachFile) {
      onAttachFile();
    } else {
      fileInputRef.current?.click();
    }
  }, [onAttachFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      filesArray.forEach(file => handleUploadFile(file));
      e.target.value = ''; // Reset input
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <FileUploadZone
      onFilesSelected={(files) => files.forEach(file => handleUploadFile(file))}
      disabled={disabled}
      className="flex-shrink-0"
    >
      <div
        className={cn(
          'flex flex-col border-t border-gray-200 dark:border-gray-700',
          'bg-white dark:bg-gray-800',
          className
        )}
      >
        {/* File preview queue */}
        {fileQueue.length > 0 && (
          <FilePreview
            items={fileQueue}
            onRemove={handleRemoveFile}
            className="border-b border-gray-150 dark:border-gray-700"
          />
        )}

        <div className="flex items-end gap-2 p-4">
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
            onAttach={triggerFileSelect}
            canSend={canSend}
            isSending={isSending}
            disabled={disabled}
          />

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
          />
        </div>
      </div>
    </FileUploadZone>
  );
}