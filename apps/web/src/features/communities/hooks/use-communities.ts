import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Community, CreateCommunityDto, UpdateCommunityDto, Member, Channel } from '../types';

export const communitiesKeys = {
  all: ['communities'] as const,
  lists: () => [...communitiesKeys.all, 'list'] as const,
  list: (filters: string) => [...communitiesKeys.lists(), { filters }] as const,
  details: () => [...communitiesKeys.all, 'detail'] as const,
  detail: (id: string) => [...communitiesKeys.details(), id] as const,
  members: (communityId: string) => [...communitiesKeys.detail(communityId), 'members'] as const,
  channels: (communityId: string) => [...communitiesKeys.detail(communityId), 'channels'] as const,
};

export const useCommunities = () => {
  return useQuery({
    queryKey: communitiesKeys.lists(),
    queryFn: async (): Promise<Community[]> => {
      const { data } = await api.get('/communities');
      return data;
    },
  });
};

export const useCommunity = (id: string) => {
  return useQuery({
    queryKey: communitiesKeys.detail(id),
    queryFn: async (): Promise<Community> => {
      const { data } = await api.get(`/communities/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCommunityMembers = (communityId: string) => {
  return useQuery({
    queryKey: communitiesKeys.members(communityId),
    queryFn: async (): Promise<Member[]> => {
      const { data } = await api.get(`/communities/${communityId}/members`);
      return data;
    },
    enabled: !!communityId,
  });
};

export const useCommunityChannels = (communityId: string) => {
  return useQuery({
    queryKey: communitiesKeys.channels(communityId),
    queryFn: async (): Promise<Channel[]> => {
      const { data } = await api.get(`/communities/${communityId}/channels`);
      return data;
    },
    enabled: !!communityId,
  });
};

export const useCreateCommunity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newCommunity: CreateCommunityDto): Promise<Community> => {
      const { data } = await api.post('/communities', newCommunity);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communitiesKeys.lists() });
    },
  });
};

export const useUpdateCommunity = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: UpdateCommunityDto): Promise<Community> => {
      const { data } = await api.patch(`/communities/${id}`, updates);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: communitiesKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: communitiesKeys.lists() });
    },
  });
};

export const useJoinCommunity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (communityId: string): Promise<Member> => {
      const { data } = await api.post(`/communities/${communityId}/join`);
      return data;
    },
    onSuccess: (_, communityId) => {
      queryClient.invalidateQueries({ queryKey: communitiesKeys.members(communityId) });
      queryClient.invalidateQueries({ queryKey: communitiesKeys.detail(communityId) });
      queryClient.invalidateQueries({ queryKey: communitiesKeys.lists() });
    },
  });
};

export const useLeaveCommunity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (communityId: string): Promise<void> => {
      await api.post(`/communities/${communityId}/leave`);
    },
    onSuccess: (_, communityId) => {
      queryClient.invalidateQueries({ queryKey: communitiesKeys.members(communityId) });
      queryClient.invalidateQueries({ queryKey: communitiesKeys.detail(communityId) });
      queryClient.invalidateQueries({ queryKey: communitiesKeys.lists() });
    },
  });
};
