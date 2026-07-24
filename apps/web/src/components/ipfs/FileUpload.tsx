'use client';

import React, { useCallback, useState, useRef } from 'react';
import { Upload, X, AlertCircle, CheckCircle, FileIcon, Image as ImageIcon } from 'lucide-react';
import { useIPFSUpload, validateFile, UploadOptions } from '../../hooks/useIPFSUpload';

interface FileUploadProps {
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
}

export const FileUpload: React.FC<FileUploadProps> = ({
  purpose = 'other',
  description,
  pin = true,
  metadata,
  onUploadSuccess,
  onUploadError,
  token,
  maxFiles = 1,
  accept,
  disabled = false,
  className = ''
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

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

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [disabled, isUploading]);

  const handleFiles = useCallback((files: File[]) => {
    const newFiles = [...selectedFiles];

    files.forEach(file => {
      // Validate file
      const validation = validate(file, purpose);
      if (!validation.valid) {
        onUploadError?.(validation.error || 'Invalid file');
        return;
      }

      // Check max files limit
      if (newFiles.length >= maxFiles) {
        onUploadError?.(`Maximum ${maxFiles} file(s) allowed`);
        return;
      }

      // Check for duplicates
      if (!newFiles.some(f => f.name === file.name && f.size === file.size)) {
        newFiles.push(file);
      }
    });

    setSelectedFiles(newFiles);
  }, [selectedFiles, maxFiles, purpose, validate, onUploadError]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  }, [handleFiles]);

  const handleRemoveFile = useCallback((file: File) => {
    setSelectedFiles(prev => prev.filter(f => f !== file));
    clearError(file);
  }, [clearError]);

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    for (const file of selectedFiles) {
      try {
        const options: UploadOptions = {
          purpose,
          description,
          pin,
          metadata
        };

        await uploadFile({ file, options, token });
        onUploadSuccess?.(file);
      } catch (error) {
        onUploadError?.(error instanceof Error ? error.message : 'Upload failed');
      }
    }

    setSelectedFiles([]);
  }, [selectedFiles, purpose, description, pin, metadata, token, uploadFile, onUploadSuccess, onUploadError]);

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading && inputRef.current) {
      inputRef.current.click();
    }
  }, [disabled, isUploading]);

  const isImage = (file: File) => file.type.startsWith('image/');

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
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
        </p>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              {selectedFiles.length} file(s) selected
            </p>
            <button
              onClick={() => setSelectedFiles([])}
              className="text-sm text-red-600 hover:text-red-700"
              disabled={isUploading}
            >
              Clear all
            </button>
          </div>

          {selectedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                {isImage(file) ? (
                  <ImageIcon className="h-5 w-5 text-blue-500" />
                ) : (
                  <FileIcon className="h-5 w-5 text-gray-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleRemoveFile(file)}
                className="p-1 hover:bg-gray-200 rounded"
                disabled={isUploading}
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          ))}

          <button
            onClick={handleUpload}
            disabled={isUploading || selectedFiles.length === 0}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? 'Uploading...' : 'Upload'}
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