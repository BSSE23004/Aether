'use client';

import React from 'react';
import { FileIcon, Download, Trash2, Eye, FileText, Image as ImageIcon, FileArchive, FileCode } from 'lucide-react';
import { useDeleteAttachment } from '../../hooks/useIPFSUpload';

export interface Attachment {
  id: string;
  cid: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

interface AttachmentRendererProps {
  attachments: Attachment[];
  token: string;
  onDelete?: (attachmentId: string) => void;
  showActions?: boolean;
  className?: string;
  maxPreview?: number;
}

export const AttachmentRenderer: React.FC<AttachmentRendererProps> = ({
  attachments,
  token,
  onDelete,
  showActions = true,
  className = '',
  maxPreview = 5
}) => {
  const deleteMutation = useDeleteAttachment();

  const handleDelete = async (attachmentId: string) => {
    try {
      await deleteMutation.mutateAsync({ attachmentId, token });
      onDelete?.(attachmentId);
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    }
  };

  const handleDownload = (attachment: Attachment) => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = (attachment: Attachment) => {
    if (attachment.mimeType.startsWith('image/')) {
      window.open(attachment.url, '_blank');
    } else {
      handleDownload(attachment);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    }
    if (mimeType.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) {
      return <FileArchive className="h-5 w-5 text-yellow-500" />;
    }
    if (mimeType.includes('json') || mimeType.includes('javascript') || mimeType.includes('text')) {
      return <FileCode className="h-5 w-5 text-green-500" />;
    }
    return <FileIcon className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const displayAttachments = maxPreview > 0 ? attachments.slice(0, maxPreview) : attachments;
  const hasMore = maxPreview > 0 && attachments.length > maxPreview;

  if (attachments.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <FileIcon className="mx-auto h-12 w-12 mb-2 opacity-50" />
        <p className="text-sm">No attachments</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {displayAttachments.map(attachment => (
        <div
          key={attachment.id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {getFileIcon(attachment.mimeType)}

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">
                {attachment.filename}
              </p>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>{formatFileSize(attachment.size)}</span>
                <span>•</span>
                <span>{formatDate(attachment.createdAt)}</span>
              </div>
            </div>
          </div>

          {showActions && (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handlePreview(attachment)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title="Preview"
              >
                <Eye className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={() => handleDownload(attachment)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title="Download"
              >
                <Download className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={() => handleDelete(attachment.id)}
                disabled={deleteMutation.isPending}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </button>
            </div>
          )}
        </div>
      ))}

      {hasMore && (
        <div className="text-center py-2">
          <p className="text-sm text-gray-500">
            +{attachments.length - maxPreview} more attachment(s)
          </p>
        </div>
      )}
    </div>
  );
};

// Compact version for inline attachment display
interface CompactAttachmentProps {
  attachment: Attachment;
  onClick?: () => void;
  className?: string;
}

export const CompactAttachment: React.FC<CompactAttachmentProps> = ({
  attachment,
  onClick,
  className = ''
}) => {
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4 text-blue-500" />;
    }
    return <FileIcon className="h-4 w-4 text-gray-500" />;
  };

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center space-x-2 px-3 py-1.5 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors ${className}`}
    >
      {getFileIcon(attachment.mimeType)}
      <span className="text-sm text-gray-700 truncate max-w-[150px]">
        {attachment.filename}
      </span>
    </button>
  );
};

// Grid version for image-heavy attachments
interface AttachmentGridProps {
  attachments: Attachment[];
  onPreview?: (attachment: Attachment) => void;
  onDelete?: (attachmentId: string) => void;
  token: string;
  className?: string;
}

export const AttachmentGrid: React.FC<AttachmentGridProps> = ({
  attachments,
  onPreview,
  onDelete,
  token,
  className = ''
}) => {
  const deleteMutation = useDeleteAttachment();

  const handleDelete = async (attachmentId: string) => {
    try {
      await deleteMutation.mutateAsync({ attachmentId, token });
      onDelete?.(attachmentId);
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    }
  };

  const imageAttachments = attachments.filter(a => a.mimeType.startsWith('image/'));
  const otherAttachments = attachments.filter(a => !a.mimeType.startsWith('image/'));

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Image Grid */}
      {imageAttachments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {imageAttachments.map(attachment => (
            <div
              key={attachment.id}
              className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
              onClick={() => onPreview?.(attachment)}
            >
              <img
                src={attachment.url}
                alt={attachment.filename}
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(attachment.id);
                  }}
                  className="p-2 bg-white rounded-full hover:bg-gray-100"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-gray-700" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Other Attachments */}
      {otherAttachments.length > 0 && (
        <AttachmentRenderer
          attachments={otherAttachments}
          token={token}
          onDelete={onDelete}
          showActions
        />
      )}
    </div>
  );
};