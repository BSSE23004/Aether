'use client';

import React from 'react';
import { Download, FileText, Image as ImageIcon, Video, Music, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StorageFile } from '@/types';

interface AttachmentDisplayProps {
  files: StorageFile[];
  className?: string;
}

export function AttachmentDisplay({ files, className }: AttachmentDisplayProps) {
  if (!files || files.length === 0) return null;

  // Group files by type
  const images = files.filter((f) => f.mimeType?.startsWith('image/'));
  const videos = files.filter((f) => f.mimeType?.startsWith('video/'));
  const audios = files.filter((f) => f.mimeType?.startsWith('audio/'));
  const docs = files.filter(
    (f) =>
      !f.mimeType?.startsWith('image/') &&
      !f.mimeType?.startsWith('video/') &&
      !f.mimeType?.startsWith('audio/')
  );

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  return (
    <div className={cn('flex flex-col gap-2 mt-2 w-full max-w-full', className)}>
      {/* Images Grid */}
      {images.length > 0 && (
        <div
          className={cn(
            'grid gap-2',
            images.length === 1
              ? 'grid-cols-1 max-w-[400px]'
              : images.length === 2
              ? 'grid-cols-2 max-w-[500px]'
              : 'grid-cols-3 max-w-[600px]'
          )}
        >
          {images.map((img) => (
            <a
              key={img.id}
              href={img.url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative rounded-lg overflow-hidden border border-gray-200/50 dark:border-gray-700/50 group bg-gray-100 dark:bg-gray-800 flex items-center justify-center aspect-video shadow-sm hover:shadow transition-shadow"
            >
              <img
                src={img.url}
                alt={img.name || img.filename || 'Attached Image'}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ExternalLink className="w-5 h-5 text-white" />
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Videos */}
      {videos.length > 0 && (
        <div className="flex flex-col gap-2 max-w-[450px]">
          {videos.map((vid) => (
            <div
              key={vid.id}
              className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-black"
            >
              <video
                src={vid.url}
                controls
                className="w-full aspect-video"
                preload="metadata"
              />
              <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-850 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-xs">
                <span className="text-gray-700 dark:text-gray-300 truncate font-semibold pr-2">
                  {vid.name || vid.filename}
                </span>
                <span className="text-gray-550 dark:text-gray-400 font-mono flex-shrink-0">
                  {formatSize(vid.size)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audios */}
      {audios.length > 0 && (
        <div className="flex flex-col gap-2 max-w-[400px]">
          {audios.map((aud) => (
            <div
              key={aud.id}
              className="flex flex-col gap-1 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
            >
              <div className="flex items-center gap-2 px-1 text-xs">
                <Music className="w-4 h-4 text-pink-500" />
                <span className="text-gray-700 dark:text-gray-300 truncate font-semibold flex-1">
                  {aud.name || aud.filename}
                </span>
                <span className="text-gray-500 dark:text-gray-450 font-mono">
                  {formatSize(aud.size)}
                </span>
              </div>
              <audio
                src={aud.url}
                controls
                className="w-full h-8 mt-1"
                preload="none"
              />
            </div>
          ))}
        </div>
      )}

      {/* Documents and General Files */}
      {docs.length > 0 && (
        <div className="flex flex-col gap-2 max-w-[400px]">
          {docs.map((doc) => {
            const name = doc.name || doc.filename || '';
            const extension = name.split('.').pop()?.toUpperCase() || 'FILE';
            return (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-105 dark:bg-gray-800/80 dark:hover:bg-gray-850 border border-gray-200 dark:border-gray-700/85 hover:border-gray-350 dark:hover:border-gray-650 rounded-xl transition-all duration-200 group"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center font-bold text-xs uppercase font-sans">
                  {extension}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-750 dark:text-gray-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {name}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                    {formatSize(doc.size)}
                  </p>
                </div>
                <div className="flex-shrink-0 p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <Download className="w-4 h-4" />
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
