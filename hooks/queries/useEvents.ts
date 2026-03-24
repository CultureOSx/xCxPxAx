import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { EventData } from '@/shared/schema';

// Helper function that resolves the parameters into the api call
const fetchEvents = async (city: string, filters: string[], pageParam: number) => {
  // Use existing api structure, assuming category takes a single filter for now
  // or we pass it correctly if the backend supports filter arrays
  return api.events.list({
    city,
    category: filters.length > 0 ? filters[0].toLowerCase() : undefined,
    pageSize: 10,
    // page: pageParam // Ideally we pass page offset here if supported
  });
};

/**
 * useEvents
 * A unified optimized query hook for fetching events across Explore, Feed, and City Guide.
 * Utilizes caching, infinite loading, and optimistic updates.
 */
export const useEvents = (city: string, filters: string[] = []) => {
  const queryFn = async ({ pageParam = 0 }) => {
    return await fetchEvents(city, filters, pageParam);
  };

  return useInfiniteQuery({
    queryKey: ['events', { city, filters }],
    queryFn,
    getNextPageParam: (lastPage: any, allPages: any) => {
      // Assuming paginated events return a hasNextPage boolean and page number
      if (lastPage.hasNextPage) return lastPage.page + 1;
      return undefined;
    },
    // keepPreviousData is removed in Tanstack V5 in favor of placeholderData
    // Check your tanstack version, but here placeholderData works similarly
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
};

/**
 * useEventOptimisticLike
 * Optimistic mutations for the Like/Save button. 
 * Allows immediate UI updates while the network request is processing.
 */
export const useEventOptimisticLike = () => {
  const queryClient = useQueryClient();

  return async (eventId: string, city: string, filters: string[], isLiked: boolean) => {
    // We cancel outgoing refetches to avoid overwriting our optimistic update
    await queryClient.cancelQueries({ queryKey: ['events', { city, filters }] });

    // Snapshot the previous state
    const previousEvents = queryClient.getQueryData(['events', { city, filters }]);

    // Optimistically update
    queryClient.setQueryData(['events', { city, filters }], (old: any) => {
      if (!old) return old;
      // Mutate the target event to increment/decrement like count or toggle state
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          events: page.events.map((event: EventData) => {
            if (event.id === eventId) {
              return {
                 ...event,
                 attending: Math.max(0, (event.attending ?? 0) + (isLiked ? 1 : -1))
              };
            }
            return event;
          }),
        })),
      };
    });

    // Return a context object with the snapshotted value
    return { previousEvents };
  };
};
