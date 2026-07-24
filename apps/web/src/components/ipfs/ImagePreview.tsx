'use client';

import React, { useState, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Download, Share2, Maximize2, RotateCw } from 'lucide-react';

export interface ImagePreviewProps {
  src: string;
  alt: string;
  filename?: string;
  size?: number;
  mimeType?: string;
  onClose?: () => void;
  showControls?: boolean;
  className?: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  src,
  alt,
  filename,
  size,
  mimeType,
  onClose,
  showControls = true,
  className = ''
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setRotation(0);
  }, []);

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = src;
    link.download = filename || 'image';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [src, filename]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: filename || 'Image',
          url: src
        });
      } catch (error) {
        console.error('Failed to share:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(src);
    }
  }, [src, filename]);

  const handleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* Image Container */}
      <div
        className={`
          relative flex items-center justify-center overflow-hidden
          ${isFullscreen ? 'h-screen' : 'h-96'}
        `}
      >
        <img
          src={src}
          alt={alt}
          className={`
            transition-transform duration-200
            ${isFullscreen ? 'max-h-screen' : 'max-h-96'}
          `}
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transformOrigin: 'center'
          }}
        />

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        )}
      </div>

      {/* Controls */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-4">
          <div className="flex items-center justify-between">
            {/* Zoom Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 disabled:opacity-50 transition-colors"
              >
                <ZoomOut className="h-4 w-4 text-white" />
              </button>
              <span className="text-white text-sm font-medium">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 disabled:opacity-50 transition-colors"
              >
                <ZoomIn className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Rotation & Reset */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRotate}
                className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
              >
                <RotateCw className="h-4 w-4 text-white" />
              </button>
              <button
                onClick={handleReset}
                className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
              >
                <span className="text-white text-xs">Reset</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleFullscreen}
                className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
              >
                <Maximize2 className="h-4 w-4 text-white" />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
              >
                <Download className="h-4 w-4 text-white" />
              </button>
              <button
                onClick={handleShare}
                className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
              >
                <Share2 className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>

          {/* File Info */}
          {(filename || size || mimeType) && (
            <div className="mt-3 pt-3 border-t border-white border-opacity-20">
              <div className="flex items-center justify-between text-xs text-gray-300">
                {filename && (
                  <span className="truncate max-w-[200px]">{filename}</span>
                )}
                <div className="flex items-center space-x-2">
                  {mimeType && <span>{mimeType}</span>}
                  {size && <span>•</span>}
                  {size && <span>{formatFileSize(size)}</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Simple thumbnail component
interface ThumbnailProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export const Thumbnail: React.FC<ThumbnailProps> = ({
  src,
  alt,
  size = 'md',
  className = '',
  onClick
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  return (
    <div
      className={`
        relative rounded-lg overflow-hidden bg-gray-100 cursor-pointer
        ${sizeClasses[size]} ${className}
      `}
      onClick={onClick}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
      />
    </div>
  );
};

// Image gallery component
interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    filename?: string;
    size?: number;
    mimeType?: string;
  }>;
  onImageClick?: (index: number) => void;
  className?: string;
  maxDisplay?: number;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  onImageClick,
  className = '',
  maxDisplay = 6
}) => {
  const displayImages = maxDisplay > 0 ? images.slice(0, maxDisplay) : images;
  const hasMore = maxDisplay > 0 && images.length > maxDisplay;

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 ${className}`}>
      {displayImages.map((image, index) => (
        <Thumbnail
          key={`${image.src}-${index}`}
          src={image.src}
          alt={image.alt}
          size="lg"
          onClick={() => onImageClick?.(index)}
        />
      ))}

      {hasMore && (
        <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-500">
              +{images.length - maxDisplay}
            </p>
            <p className="text-sm text-gray-400">more</p>
          </div>
        </div>
      )}
    </div>
  );
};