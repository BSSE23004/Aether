// @aether/types - Shared TypeScript types and interfaces

export interface User {
  id: string;
  address: string;
  createdAt: Date;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  owner: string;
  tokenAddress?: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  communityId: string;
  author: string;
  content: string;
  createdAt: Date;
}

export interface Proposal {
  id: string;
  communityId: string;
  title: string;
  description: string;
  creator: string;
  status: 'pending' | 'active' | 'passed' | 'failed';
  createdAt: Date;
  votingEndsAt: Date;
}

export class AetherError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'AetherError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface StorageFile {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  createdAt: Date;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
}

