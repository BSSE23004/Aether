import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

// Types for IPFS upload
export interface IPFSUploadResponse {
  id: string;
  cid: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
  gatewayUrls: string[];
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface FileValidationError {
  file: File;
  error: string;
}

export interface UploadOptions {
  purpose?: 'avatar' | 'community' | 'attachment' | 'metadata' | 'other';
  description?: string;
  pin?: boolean;
  metadata?: Record<string, any>;
}

// File validation rules
const FILE_VALIDATION_RULES = {
  avatar: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxFilenameLength: 100
  },
  community: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    maxFilenameLength: 100
  },
  attachment: {
    maxSize: 25 * 1024 * 1024, // 25MB
    allowedTypes: [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/json', 'text/plain',
      'text/markdown', 'text/csv'
    ],
    maxFilenameLength: 255
  },
  metadata: {
    maxSize: 1 * 1024 * 1024, // 1MB
    allowedTypes: ['application/json'],
    maxFilenameLength: 100
  },
  other: {
    maxSize: 25 * 1024 * 1024, // 25MB
    allowedTypes: ['*'],
    maxFilenameLength: 255
  }
};

// Validate file before upload
export const validateFile = (
  file: File,
  purpose: keyof typeof FILE_VALIDATION_RULES = 'other'
): { valid: boolean; error?: string } => {
  const rules = FILE_VALIDATION_RULES[purpose];

  // Check file size
  if (file.size > rules.maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${rules.maxSize / (1024 * 1024)}MB limit`
    };
  }

  // Check file type
  if (rules.allowedTypes[0] !== '*' && !rules.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed for ${purpose}`
    };
  }

  // Check filename length
  if (file.name.length > rules.maxFilenameLength) {
    return {
      valid: false,
      error: `Filename exceeds ${rules.maxFilenameLength} characters`
    };
  }

  return { valid: true };
};

// Upload file to IPFS
const uploadFile = async (
  file: File,
  options: UploadOptions,
  token: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<IPFSUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('purpose', options.purpose || 'other');

  if (options.description) {
    formData.append('description', options.description);
  }

  if (options.pin !== undefined) {
    formData.append('pin', options.pin.toString());
  }

  if (options.metadata) {
    formData.append('metadata', JSON.stringify(options.metadata));
  }

  const response = await fetch('/api/ipfs/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Upload failed');
  }

  return response.json();
};

// Upload attachment
const uploadAttachment = async (
  entityId: string,
  entityType: 'message' | 'channel' | 'community',
  file: File,
  token: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<IPFSUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`/api/attachments/${entityType}/${entityId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Attachment upload failed');
  }

  return response.json();
};

// Main upload hook
export const useIPFSUpload = () => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [errors, setErrors] = useState<FileValidationError[]>([]);

  const uploadMutation = useMutation({
    mutationFn: async ({
      file,
      options,
      token
    }: {
      file: File;
      options: UploadOptions;
      token: string;
    }) => {
      setUploadProgress({ loaded: 0, total: file.size, percentage: 0 });
      return uploadFile(file, options, token, setUploadProgress);
    },
    onSuccess: () => {
      setUploadProgress(null);
    },
    onError: (error: Error, variables) => {
      setErrors(prev => [...prev, { file: variables.file, error: error.message }]);
      setUploadProgress(null);
    }
  });

  const attachmentMutation = useMutation({
    mutationFn: async ({
      entityId,
      entityType,
      file,
      token
    }: {
      entityId: string;
      entityType: 'message' | 'channel' | 'community';
      file: File;
      token: string;
    }) => {
      setUploadProgress({ loaded: 0, total: file.size, percentage: 0 });
      return uploadAttachment(entityId, entityType, file, token, setUploadProgress);
    },
    onSuccess: () => {
      setUploadProgress(null);
    },
    onError: (error: Error, variables) => {
      setErrors(prev => [...prev, { file: variables.file, error: error.message }]);
      setUploadProgress(null);
    }
  });

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const clearError = useCallback((file: File) => {
    setErrors(prev => prev.filter(e => e.file !== file));
  }, []);

  return {
    uploadProgress,
    errors,
    uploadFile: uploadMutation.mutate,
    uploadAttachment: attachmentMutation.mutate,
    isUploading: uploadMutation.isPending || attachmentMutation.isPending,
    clearErrors,
    clearError,
    validateFile
  };
};

// Hook for fetching attachments
export const useAttachments = (entityId: string, entityType: 'message' | 'channel', token: string) => {
  return useQuery({
    queryKey: ['attachments', entityType, entityId],
    queryFn: async () => {
      const response = await fetch(`/api/attachments/${entityType}/${entityId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch attachments');
      }

      return response.json();
    },
    enabled: !!entityId && !!token
  });
};

// Hook for deleting attachment
export const useDeleteAttachment = () => {
  return useMutation({
    mutationFn: async ({ attachmentId, token }: { attachmentId: string; token: string }) => {
      const response = await fetch(`/api/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete attachment');
      }

      return response.json();
    }
  });
};