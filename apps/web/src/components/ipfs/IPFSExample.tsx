'use client';

import React, { useState } from 'react';
import { DragDropZone, AttachmentRenderer, ImageGallery } from './index';
import { useIPFSUpload } from '../../hooks/useIPFSUpload';

/**
 * Example component demonstrating IPFS upload functionality
 * This shows how to use the IPFS components in your application
 */
export const IPFSExample: React.FC = () => {
  const [token] = useState('your-auth-token'); // In real app, get from auth context
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const { uploadProgress, isUploading } = useIPFSUpload();

  const handleUploadSuccess = (response: any) => {
    setUploadedFiles(prev => [...prev, response]);
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
  };

  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">IPFS Upload Example</h1>

      {/* Example 1: Basic Drag & Drop Upload */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Example 1: Basic Drag & Drop Upload
        </h2>
        <DragDropZone
          purpose="attachment"
          token={token}
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
          maxFiles={5}
          accept="image/*,.pdf,.doc,.docx"
          showPreview
          autoUpload={false}
        />
      </section>

      {/* Example 2: Avatar Upload */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Example 2: Avatar Upload (Single File)
        </h2>
        <DragDropZone
          purpose="avatar"
          token={token}
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
          maxFiles={1}
          accept="image/*"
          showPreview
          autoUpload={false}
        />
      </section>

      {/* Example 3: Community Upload */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Example 3: Community Cover Image
        </h2>
        <DragDropZone
          purpose="community"
          token={token}
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
          maxFiles={1}
          accept="image/*"
          showPreview
          autoUpload={false}
        />
      </section>

      {/* Example 4: Display Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Uploaded Files
          </h2>
          <AttachmentRenderer
            attachments={uploadedFiles}
            token={token}
            onDelete={(id) => {
              setUploadedFiles(prev => prev.filter(f => f.id !== id));
            }}
            showActions
          />
        </section>
      )}

      {/* Example 5: Image Gallery */}
      {uploadedFiles.filter(f => f.mimeType?.startsWith('image/')).length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Image Gallery
          </h2>
          <ImageGallery
            images={uploadedFiles
              .filter(f => f.mimeType?.startsWith('image/'))
              .map(f => ({
                src: f.url,
                alt: f.filename,
                filename: f.filename,
                size: f.size,
                mimeType: f.mimeType
              }))}
            onImageClick={(index) => console.log('Clicked image:', index)}
          />
        </section>
      )}

      {/* Upload Progress */}
      {uploadProgress && (
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Upload Progress
          </h2>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">
                Uploading...
              </span>
              <span className="text-sm text-blue-700">
                {uploadProgress.percentage.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress.percentage}%` }}
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

/**
 * Example component for message attachments
 */
export const MessageAttachmentExample: React.FC = () => {
  const [token] = useState('your-auth-token');
  const [messageId] = useState('message-123');

  const { uploadAttachment, isUploading } = useIPFSUpload();

  const handleAttachmentUpload = async (file: File) => {
    try {
      await uploadAttachment({
        entityId: messageId,
        entityType: 'message',
        file,
        token
      });
    } catch (error) {
      console.error('Attachment upload failed:', error);
    }
  };

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-lg font-semibold">Message Attachments</h2>
      <DragDropZone
        purpose="attachment"
        token={token}
        onUploadSuccess={handleAttachmentUpload}
        maxFiles={5}
        accept="image/*,.pdf,.doc,.docx"
        showPreview
        autoUpload={true}
      />
    </div>
  );
};

/**
 * Example component for channel attachments
 */
export const ChannelAttachmentExample: React.FC = () => {
  const [token] = useState('your-auth-token');
  const [channelId] = useState('channel-456');

  const { uploadAttachment, isUploading } = useIPFSUpload();

  const handleAttachmentUpload = async (file: File) => {
    try {
      await uploadAttachment({
        entityId: channelId,
        entityType: 'channel',
        file,
        token
      });
    } catch (error) {
      console.error('Attachment upload failed:', error);
    }
  };

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-lg font-semibold">Channel Attachments</h2>
      <DragDropZone
        purpose="attachment"
        token={token}
        onUploadSuccess={handleAttachmentUpload}
        maxFiles={10}
        accept="image/*,.pdf,.doc,.docx"
        showPreview
        autoUpload={true}
      />
    </div>
  );
};