import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Community } from '@/shared/schema';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const communityKeys = {
  all: ['/api/communities'] as const,
  list: (params?: CommunitiesListParams) => ['/api/communities', 'list', params] as const,
  detail: (id: string) => ['/api/communities', id] as const,
  joined: () => ['/api/communities', 'joined'] as const,
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CommunitiesListParams {
  city?: string;
  country?: string;
  nationalityId?: string;
  cultureId?: string;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useCommunities(params?: CommunitiesListParams) {
  return useQuery<Community[]>({
    queryKey: communityKeys.list(params),
    queryFn: () => api.communities.list(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCommunity(id: string) {
  return useQuery<Community>({
    queryKey: communityKeys.detail(id),
    queryFn: () => api.communities.get(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useJoinedCommunities() {
  return useQuery<{ communityIds: string[] }>({
    queryKey: communityKeys.joined(),
    queryFn: () => api.communities.joined(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useJoinCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.communities.join(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
  });
}

export function useLeaveCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.communities.leave(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
  });
}

export function useCreateCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.communities.create>[0]) =>
      api.communities.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
  });
}
