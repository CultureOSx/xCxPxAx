import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { api, type WidgetUpcomingTicketItem } from '@/lib/api';
import { syncCultureWidgetSnapshots } from '@/lib/widgets/sync';
import type { EventData } from '@/shared/schema';

export function WidgetSync() {
  const { user, isAuthenticated } = useAuth();
  const { state: onboarding } = useOnboarding();

  const today = new Date().toLocaleDateString('en-CA');

  // Discover Events (for Nearby & Spotlight)
  // Must supply queryFn — default client queryFn joins queryKey with "/" which would call a non-existent path like /api/events/AU/Sydney/2026-04-01.
  const { data: events } = useQuery<EventData[]>({
    queryKey: ['widget-sync', 'events', onboarding.country, onboarding.city, today],
    queryFn: async () => {
      const result = await api.events.list({
        country: onboarding.country || undefined,
        city: onboarding.city || undefined,
        pageSize: 50,
        dateFrom: today,
      });
      return Array.isArray(result.events) ? result.events : [];
    },
    enabled: !!onboarding.city,
    staleTime: 5 * 60 * 1000,
  });

  const { data: upcomingTicket } = useQuery<WidgetUpcomingTicketItem | null>({
    queryKey: ['widget-sync', 'upcoming-ticket', user?.id],
    queryFn: () => api.widgets.upcomingTicket(user!.id),
    enabled: !!user?.id && isAuthenticated,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (!onboarding.city) return;

    const nearbyEvents = (events || []).slice(0, 5).map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      time: e.time,
      venue: e.venue,
    }));

    const spotlightEvent = events?.find((e) => e.isFeatured) || events?.[0];

    syncCultureWidgetSnapshots({
      spotlight: spotlightEvent
        ? {
            id: spotlightEvent.id,
            title: spotlightEvent.title,
            description: spotlightEvent.description || spotlightEvent.venue || '',
            imageUrl: spotlightEvent.imageUrl,
            city: spotlightEvent.city,
            country: spotlightEvent.country,
          }
        : null,
      nearby: nearbyEvents,
      upcomingTicket: upcomingTicket ?? null,
      displayName: user?.displayName || user?.username,
      culturePassId: user?.culturePassId ?? user?.id,
      city: onboarding.city,
      country: onboarding.country,
    });
  }, [events, upcomingTicket, user, onboarding.city, onboarding.country]);

  return null;
}
