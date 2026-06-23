export type CommunityRole = 'ADMIN' | 'MODERATOR' | 'MEMBER';

export interface User {
  id: string;
  walletAddress: string;
  username?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Member {
  id: string;
  userId: string;
  communityId: string;
  role: CommunityRole;
  joinedAt: string;
  user: User;
}

export interface Channel {
  id: string;
  communityId: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Community {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  contractAddress?: string;
  creatorId: string;
  isTokenGated: boolean;
  createdAt: string;
  updatedAt: string;
  members?: Member[];
  channels?: Channel[];
  _count?: {
    members: number;
    channels: number;
  };
}

export interface CreateCommunityDto {
  name: string;
  description?: string;
  isTokenGated?: boolean;
}

export interface UpdateCommunityDto {
  name?: string;
  description?: string;
  avatarUrl?: string;
  bannerUrl?: string;
}
