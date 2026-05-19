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
