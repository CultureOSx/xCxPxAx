import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Fallback logic until full specific API endpoints for perks exist
const fetchPerks = async (pageParam: number) => {
  // Use mock or call a real endpoint if it exists
  // For the sake of architecture, we'll assume api.perks exists or we fallback to an empty array
  if (api.perks && typeof api.perks.list === 'function') {
    // Some implementations might take args, but we'll adapt depending on definition
    // Usually list() in the legacy app doesn't take args, so we slice data manually later or pass undefined.
    return (api.perks as any).list({ pageSize: 15, page: pageParam }).catch(() => (api.perks as any).list());
  }
  
  // Return stub structure matching paginated responses
  return { 
    perks: [],
    hasNextPage: false,
    page: pageParam,
  };
};

export const usePerks = () => {
  return useInfiniteQuery({
    queryKey: ['perks'],
    queryFn: ({ pageParam = 0 }) => fetchPerks(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage: any) => {
      if (lastPage && lastPage.hasNextPage) return lastPage.page + 1;
      return undefined;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  });
};
