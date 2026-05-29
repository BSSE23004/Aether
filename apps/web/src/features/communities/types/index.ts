/**
 * Communities feature types
 */

import type { Community } from '@/types';

export interface CommunitiesFilters {
  search?: string;
  sortBy?: 'newest' | 'popular' | 'members';
  page?: number;
  limit?: number;
}

export interface CreateCommunityInput {
  name: string;
  description: string;
  logo?: string;
}
