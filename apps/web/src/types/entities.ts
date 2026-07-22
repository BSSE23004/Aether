/**
 * Core domain entities
 */

export interface User {
  id: string;
  address: string;
  username?: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
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
  reactions?: Record<string, number>;
  files?: StorageFile[];
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

export interface StorageFile {
  id: string;
  name: string;
  filename?: string;
  mimeType: string;
  size: number;
  ipfsHash?: string;
  cid?: string;
  url: string;
  uploadedBy?: string;
  uploaderId?: string;
  communityId?: string;
  channelId?: string;
  messageId?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'message' | 'proposal' | 'member_joined' | 'event';
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}
