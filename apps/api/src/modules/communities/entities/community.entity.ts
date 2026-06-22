import { MemberRole } from '@prisma/client';

export class CommunityEntity {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  logo?: string | null;
  banner?: string | null;
  members: number;
  isTokenGated: boolean;
  tokenAddress?: string | null;
  tokenSymbol?: string | null;
  creatorId?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export class CommunityMemberEntity {
  id: string;
  userId: string;
  role: MemberRole;
  joinedAt: string;
  user: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export class PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
