/**
 * API request/response types
 */

import type { User, Community, Message, Proposal, StorageFile, ApiResponse, PaginatedResponse } from '@/types';

export type GetUserResponse = ApiResponse<User>;
export type ListUsersResponse = ApiResponse<PaginatedResponse<User>>;

export type GetCommunityResponse = ApiResponse<Community>;
export type ListCommunitiesResponse = ApiResponse<PaginatedResponse<Community>>;
export type GetCommunityMembersResponse = ApiResponse<PaginatedResponse<User>>;

export type GetMessagesResponse = ApiResponse<PaginatedResponse<Message>>;
export type SendMessageRequest = { content: string };
export type SendMessageResponse = ApiResponse<Message>;

export type GetProposalsResponse = ApiResponse<PaginatedResponse<Proposal>>;
export type GetProposalResponse = ApiResponse<Proposal>;
export type CreateProposalRequest = {
  title: string;
  description: string;
};
export type CreateProposalResponse = ApiResponse<Proposal>;
export type VoteRequest = { vote: 'for' | 'against' };
export type VoteResponse = ApiResponse<{ success: boolean }>;

export type GetFilesResponse = ApiResponse<PaginatedResponse<StorageFile>>;
export type UploadFileResponse = ApiResponse<StorageFile>;
