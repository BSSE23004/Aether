'use client';

import { useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/features/auth/stores/authStore';
import type { StorageFile } from '@/types';
import { env } from '@/config';

export function useUploadWithProgress() {
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | undefined>(undefined);
  const [result, setResult] = useState<StorageFile | undefined>(undefined);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const { accessToken } = useAuthStore();

  const cancel = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      setStatus('idle');
      setProgress(0);
      setError('Upload cancelled');
    }
  }, []);

  const upload = useCallback(
    async (file: File, purpose: string = 'attachment') => {
      setStatus('uploading');
      setProgress(0);
      setError(undefined);
      setResult(undefined);

      return new Promise<StorageFile>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        // Use the configured API_URL
        const baseUrl = env.API_URL || 'http://localhost:3001';
        const url = new URL('/api/ipfs/upload', baseUrl);

        xhr.open('POST', url.toString(), true);

        // Add auth header
        if (accessToken) {
          xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
        } else {
          // Fallback to cookie check if needed
          const match = document.cookie.match(new RegExp(`(^| )aether_token=([^;]+)`));
          const token = match ? match[2] : null;
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }
        }

        // Track progress
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              // Handle NestJS response interceptor wrapping if data is nested under .data
              const fileResult = data.data !== undefined ? data.data : data;
              setStatus('success');
              setProgress(100);
              setResult(fileResult);
              resolve(fileResult);
            } catch (err) {
              const errMsg = 'Failed to parse response';
              setError(errMsg);
              setStatus('error');
              reject(new Error(errMsg));
            }
          } else {
            try {
              const errData = JSON.parse(xhr.responseText);
              const errMsg = errData.message || `Upload failed with status ${xhr.status}`;
              setError(errMsg);
              setStatus('error');
              reject(new Error(errMsg));
            } catch {
              const errMsg = `Upload failed with status ${xhr.status}`;
              setError(errMsg);
              setStatus('error');
              reject(new Error(errMsg));
            }
          }
        };

        xhr.onerror = () => {
          const errMsg = 'Network error occurred during upload';
          setError(errMsg);
          setStatus('error');
          reject(new Error(errMsg));
        };

        xhr.onabort = () => {
          const errMsg = 'Upload aborted';
          setError(errMsg);
          setStatus('idle');
          reject(new Error(errMsg));
        };

        const formData = new FormData();
        formData.append('file', file);
        formData.append('purpose', purpose);

        xhr.send(formData);
      });
    },
    [accessToken]
  );

  return {
    upload,
    cancel,
    progress,
    status,
    error,
    result,
  };
}
