import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { api } from '@/lib/api';
import { syncCultureWidgetSnapshots } from '@/lib/widgets/sync';
import type { EventData } from '@/shared/schema';

export function WidgetSync() {
  const { user, isAuthenticated } = useAuth();
  const { state: onboarding } = useOnboarding();
  
  const today = new Date().toLocaleDateString('en-CA');

  // Discover Events (for Nearby & Spotlight)
  const { data: events } = useQuery<EventData[]>({
    queryKey: ['/api/events', onboarding.country, onboarding.city, today],
    enabled: !!onboarding.city,
  });

  // Tickets (for Upcoming Ticket)
  // The API returns flattened ticket + event fields in app/tickets/index.tsx
  const { data: tickets } = useQuery<any[]>({
    queryKey: ['/api/tickets', user?.id],
    enabled: !!user?.id && isAuthenticated,
  });

  useEffect(() => {
    if (!onboarding.city) return;

    const nearbyEvents = (events || []).slice(0, 5).map(e => ({
      id: e.id,
      title: e.title,
      date: e.date,
      time: e.time,
      venue: e.venue,
    }));

    const spotlightEvent = events?.find(e => e.isFeatured) || events?.[0];

    // Find the next upcoming confirmed ticket
    const confirmedTickets = (tickets || []).filter(t => t.status === 'confirmed');
    // Sort by date/time to get the next one
    const sortedTickets = [...confirmedTickets].sort((a, b) => {
      const dateA = new Date(`${a.eventDate}T${a.eventTime || '00:00'}`);
      const dateB = new Date(`${b.eventDate}T${b.eventTime || '00:00'}`);
      return dateA.getTime() - dateB.getTime();
    });
    
    const nextTicket = sortedTickets[0];

    syncCultureWidgetSnapshots({
      spotlight: spotlightEvent ? {
        id: spotlightEvent.id,
        title: spotlightEvent.title,
        description: spotlightEvent.description || spotlightEvent.venue || '',
        imageUrl: spotlightEvent.imageUrl,
        city: spotlightEvent.city,
        country: spotlightEvent.country,
      } : null,
      nearby: nearbyEvents,
      upcomingTicket: nextTicket ? {
        ticket: {
          id: nextTicket.id,
          userId: nextTicket.userId,
          eventId: nextTicket.eventId,
          status: nextTicket.status,
          ticketCode: nextTicket.ticketCode,
          history: [],
          createdAt: nextTicket.createdAt,
          // We can't easily map everything here without more work, 
          // but we can pass what we have and cast.
        } as any,
        event: {
          id: nextTicket.eventId,
          title: nextTicket.eventTitle,
          date: nextTicket.eventDate,
          time: nextTicket.eventTime,
          venue: nextTicket.eventVenue,
        } as any,
        startsAt: `${nextTicket.eventDate} ${nextTicket.eventTime || ''}`.trim(),
      } : null,
      displayName: user?.displayName || user?.username,
      culturePassId: (user as any)?.culturePassId || user?.id,
      city: onboarding.city,
      country: onboarding.country,
    });
  }, [events, tickets, user, onboarding.city, onboarding.country]);

  return null;
}
