/**
 * Storage feature types
 */

import type { StorageFile } from '@/types';

export interface UploadFileInput {
  file: File;
  communityId?: string;
}

export interface UploadFileOutput extends StorageFile {}
