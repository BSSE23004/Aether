export interface User {
  id: string;
  address: string;
  username?: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  logo?: string;
  banner?: string;
  members: number;
  isTokenGated: boolean;
  tokenAddress?: string;
  tokenSymbol?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  content: string;
  author: User;
  communityId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  communityId: string;
  creator: User;
  status: 'pending' | 'active' | 'passed' | 'failed';
  votesFor: number;
  votesAgainst: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
