'use client';

import React, { useCallback, useState, useRef } from 'react';
import { Upload, X, Check, AlertCircle } from 'lucide-react';
import { useIPFSUpload, validateFile, UploadOptions } from '../../hooks/useIPFSUpload';

interface DragDropZoneProps {
  purpose?: 'avatar' | 'community' | 'attachment' | 'metadata' | 'other';
  description?: string;
  pin?: boolean;
  metadata?: Record<string, any>;
  onUploadSuccess?: (response: any) => void;
  onUploadError?: (error: string) => void;
  token: string;
  maxFiles?: number;
  accept?: string;
  disabled?: boolean;
  className?: string;
  showPreview?: boolean;
  autoUpload?: boolean;
}

interface FileWithPreview extends File {
  preview?: string;
  id: string;
}

export const DragDropZone: React.FC<DragDropZoneProps> = ({
  purpose = 'other',
  description,
  pin = true,
  metadata,
  onUploadSuccess,
  onUploadError,
  token,
  maxFiles = 5,
  accept,
  disabled = false,
  className = '',
  showPreview = true,
  autoUpload = false
}) => {
  const {
    uploadProgress,
    errors,
    uploadFile,
    isUploading,
    clearErrors,
    clearError,
    validateFile: validate
  } = useIPFSUpload();

  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const generatePreview = useCallback((file: File): string | undefined => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return undefined;
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || isUploading) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, [disabled, isUploading]);

  const processFiles = useCallback((newFiles: File[]) => {
    const processedFiles: FileWithPreview[] = [];

    newFiles.forEach(file => {
      // Validate file
      const validation = validate(file, purpose);
      if (!validation.valid) {
        onUploadError?.(validation.error || 'Invalid file');
        return;
      }

      // Check max files limit
      if (files.length + processedFiles.length >= maxFiles) {
        onUploadError?.(`Maximum ${maxFiles} file(s) allowed`);
        return;
      }

      // Check for duplicates
      const isDuplicate = files.some(f => f.name === file.name && f.size === file.size) ||
                          processedFiles.some(f => f.name === file.name && f.size === file.size);

      if (!isDuplicate) {
        processedFiles.push({
          ...file,
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          preview: showPreview ? generatePreview(file) : undefined
        });
      }
    });

    if (processedFiles.length > 0) {
      setFiles(prev => [...prev, ...processedFiles]);

      if (autoUpload) {
        processedFiles.forEach(file => {
          const options: UploadOptions = {
            purpose,
            description,
            pin,
            metadata
          };
          uploadFile({ file, options, token });
        });
      }
    }
  }, [files, maxFiles, purpose, validate, onUploadError, showPreview, generatePreview, autoUpload, description, pin, metadata, token, uploadFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  }, [processFiles]);

  const handleRemoveFile = useCallback((fileId: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  }, []);

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;

    for (const file of files) {
      try {
        const options: UploadOptions = {
          purpose,
          description,
          pin,
          metadata
        };

        await uploadFile({ file, options, token });
        onUploadSuccess?.(file);
        handleRemoveFile(file.id);
      } catch (error) {
        onUploadError?.(error instanceof Error ? error.message : 'Upload failed');
      }
    }
  }, [files, purpose, description, pin, metadata, token, uploadFile, onUploadSuccess, onUploadError, handleRemoveFile]);

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading && inputRef.current) {
      inputRef.current.click();
    }
  }, [disabled, isUploading]);

  const isImage = (file: File) => file.type.startsWith('image/');

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drag Drop Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled || isUploading}
        />

        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />

        <p className="text-sm text-gray-600 mb-2">
          {dragActive ? 'Drop files here' : 'Drag and drop files here, or click to select'}
        </p>

        <p className="text-xs text-gray-500">
          {accept && `Accepted: ${accept}`}
          {purpose !== 'other' && ` • Purpose: ${purpose}`}
          {maxFiles > 1 && ` • Max ${maxFiles} files`}
        </p>
      </div>

      {/* File Previews */}
      {files.length > 0 && showPreview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {files.map(file => (
            <div
              key={file.id}
              className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden"
            >
              {file.preview ? (
                <img
                  src={file.preview}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Upload className="h-8 w-8 text-gray-400" />
                </div>
              )}

              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => handleRemoveFile(file.id)}
                  className="p-2 bg-white rounded-full hover:bg-gray-100"
                  disabled={isUploading}
                >
                  <X className="h-4 w-4 text-gray-700" />
                </button>
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 p-2">
                <p className="text-xs text-white truncate">{file.name}</p>
                <p className="text-xs text-gray-300">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File List (no preview) */}
      {files.length > 0 && !showPreview && (
        <div className="space-y-2">
          {files.map(file => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                {isImage(file) ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <Upload className="h-5 w-5 text-gray-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleRemoveFile(file.id)}
                className="p-1 hover:bg-gray-200 rounded"
                disabled={isUploading}
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && !autoUpload && (
        <div className="flex space-x-2">
          <button
            onClick={handleUpload}
            disabled={isUploading || files.length === 0}
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? 'Uploading...' : `Upload ${files.length} file(s)`}
          </button>
          <button
            onClick={() => setFiles([])}
            disabled={isUploading}
            className="py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Upload Progress */}
      {uploadProgress && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">Uploading...</span>
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
          <p className="text-xs text-blue-600 mt-1">
            {((uploadProgress.loaded / 1024) / 1024).toFixed(2)} MB / {((uploadProgress.total / 1024) / 1024).toFixed(2)} MB
          </p>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-red-700">
              {errors.length} error(s)
            </p>
            <button
              onClick={clearErrors}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Clear all
            </button>
          </div>

          {errors.map((error, index) => (
            <div
              key={`${error.file.name}-${index}`}
              className="flex items-start space-x-2 p-3 bg-red-50 rounded-lg"
            >
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-700">{error.file.name}</p>
                <p className="text-xs text-red-600">{error.error}</p>
              </div>
              <button
                onClick={() => clearError(error.file)}
                className="p-1 hover:bg-red-100 rounded"
              >
                <X className="h-4 w-4 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};