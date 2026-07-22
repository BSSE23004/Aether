'use client';

import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  maxSize?: number; // bytes
  allowedTypes?: string[];
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FileUploadZone({
  onFilesSelected,
  maxSize = 25 * 1024 * 1024, // 25MB default
  allowedTypes,
  disabled = false,
  className,
  children,
}: FileUploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragActive(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragActive(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      
      // Filter out files that don't match criteria
      const validFiles = filesArray.filter(file => {
        if (file.size > maxSize) {
          alert(`File "${file.name}" exceeds the maximum size of ${maxSize / (1024 * 1024)}MB.`);
          return false;
        }
        if (allowedTypes && allowedTypes.length > 0) {
          const fileType = file.type;
          const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
          const isTypeAllowed = allowedTypes.some(type => {
            if (type.startsWith('.')) {
              return type.toLowerCase() === extension;
            }
            if (type.endsWith('/*')) {
              const category = type.split('/')[0];
              return fileType.startsWith(category + '/');
            }
            return type === fileType;
          });
          if (!isTypeAllowed) {
            alert(`File type for "${file.name}" is not supported.`);
            return false;
          }
        }
        return true;
      });

      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn('relative w-full h-full', className)}
    >
      {isDragActive && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-blue-50/90 dark:bg-gray-900/90 backdrop-blur-sm border-2 border-dashed border-blue-500 rounded-xl transition-all duration-200 animate-in fade-in zoom-in-95">
          <div className="p-4 bg-blue-100 dark:bg-blue-900/50 rounded-full text-blue-600 dark:text-blue-400 mb-4 animate-bounce">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
            Drop your files here
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Max file size: {maxSize / (1024 * 1024)}MB
          </p>
        </div>
      )}
      {children}
    </div>
  );
}
