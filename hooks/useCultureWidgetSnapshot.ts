import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { api } from '@/lib/api';
import type { CultureWidgetSnapshotPayload } from '@/lib/widgets/sync.types';

const STALE_MS = 5 * 60 * 1000;

/**
 * Single source of truth for home-screen widget data and the in-app Widget Center.
 * Backed by `api.widgets.*` (spotlight rail, geo-filtered events, next ticket).
 */
export function useCultureWidgetSnapshot() {
  const { user, userId, isAuthenticated } = useAuth();
  const { state: onboarding } = useOnboarding();

  const city = user?.city ?? onboarding.city ?? '';
  const country = user?.country ?? onboarding.country ?? '';

  const query = useQuery({
    queryKey: ['culture-widget-snapshot', userId, city, country],
    queryFn: async () => {
      const [spotlights, nearby, upcomingTicket] = await Promise.all([
        api.widgets.spotlight(1),
        api.widgets.happeningNearYou({
          city: city || undefined,
          country: country || undefined,
          limit: 5,
        }),
        userId && isAuthenticated ? api.widgets.upcomingTicket(userId) : Promise.resolve(null),
      ]);
      return {
        spotlight: spotlights[0] ?? null,
        nearby,
        upcomingTicket,
      };
    },
    staleTime: STALE_MS,
  });

  const payload: CultureWidgetSnapshotPayload | null = useMemo(() => {
    if (!query.data) return null;
    return {
      spotlight: query.data.spotlight,
      nearby: query.data.nearby,
      upcomingTicket: query.data.upcomingTicket,
      displayName: user?.displayName ?? user?.username,
      culturePassId: user?.culturePassId ?? user?.id,
      city: city || undefined,
      country: country || undefined,
    };
  }, [query.data, user?.displayName, user?.username, user?.culturePassId, user?.id, city, country]);

  return {
    ...query,
    payload,
  };
}
