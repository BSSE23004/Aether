'use client';

import React, { useEffect, useState } from 'react';
import { X, FileText, Image as ImageIcon, Video, File, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FileQueueItem {
  id: string;
  file: File;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
  cancel?: () => void;
  result?: any;
}

interface FilePreviewProps {
  items: FileQueueItem[];
  onRemove: (id: string) => void;
  className?: string;
}

export function FilePreview({ items, onRemove, className }: FilePreviewProps) {
  if (items.length === 0) return null;

  return (
    <div className={cn('flex flex-col gap-2 p-2 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl', className)}>
      <div className="flex flex-wrap gap-3 max-h-[220px] overflow-y-auto p-1">
        {items.map((item) => (
          <PreviewItem key={item.id} item={item} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
}

function PreviewItem({ item, onRemove }: { item: FileQueueItem; onRemove: (id: string) => void }) {
  const { file, progress, status, error, id } = item;
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  const isImage = file.type.startsWith('image/');

  useEffect(() => {
    if (!isImage) return;
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file, isImage]);

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const getFileIcon = () => {
    if (isImage) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    if (file.type.startsWith('video/')) return <Video className="w-5 h-5 text-purple-500" />;
    if (file.type.startsWith('text/') || file.name.endsWith('.pdf') || file.name.endsWith('.md')) {
      return <FileText className="w-5 h-5 text-green-500" />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div
      className={cn(
        'relative flex items-center gap-3 p-2 bg-white dark:bg-gray-800 border rounded-xl w-60 shadow-sm transition-all duration-200 hover:shadow-md',
        status === 'error' ? 'border-red-300 dark:border-red-900/50' : 'border-gray-200 dark:border-gray-700/55'
      )}
    >
      {/* Thumbnail or Icon */}
      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700/50 overflow-hidden flex items-center justify-center border border-gray-250/50 dark:border-gray-700/30">
        {isImage && objectUrl ? (
          <img src={objectUrl} alt={file.name} className="w-full h-full object-cover" />
        ) : (
          getFileIcon()
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 pr-6">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate" title={file.name}>
          {file.name}
        </p>
        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
          {formatSize(file.size)}
        </p>

        {/* Progress or status */}
        {status === 'uploading' && (
          <div className="mt-1.5 w-full">
            <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-1 text-[9px] text-gray-500 dark:text-gray-400">
              <span>Uploading to IPFS...</span>
              <span className="font-mono">{progress}%</span>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="flex items-center gap-1 mt-1 text-[10px] text-green-600 dark:text-green-400">
            <CheckCircle className="w-3 h-3 animate-pulse" />
            <span>Uploaded to IPFS</span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-1 mt-1 text-[10px] text-red-600 dark:text-red-400" title={error}>
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{error || 'Upload failed'}</span>
          </div>
        )}
      </div>

      {/* Remove / Cancel Button */}
      <button
        onClick={() => {
          if (item.cancel) {
            item.cancel();
          }
          onRemove(id);
        }}
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-750 dark:hover:text-gray-200 hover:bg-gray-150 dark:hover:bg-gray-700 rounded-full transition-colors"
        title="Remove file"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
