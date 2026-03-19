import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { CultureWidgetSnapshotPayload } from './sync.types';

function formatEventDate(date?: string, time?: string): string {
  if (!date) return 'Date TBA';
  const parsed = new Date(`${date}T${time?.trim().length ? time.trim() : '00:00'}:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function syncCultureWidgetSnapshots(payload: CultureWidgetSnapshotPayload): void {
  if (Platform.OS === 'web') return;
  if (Constants.executionEnvironment === 'storeClient') return;

  let widgets: typeof import('@/widgets');
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    widgets = require('@/widgets') as typeof import('@/widgets');
  } catch (error) {
    // Expo Go and environments without ExpoUI should gracefully skip widget sync.
    if (__DEV__) {
      console.warn('[widgets] Snapshot sync skipped; widget module unavailable:', error);
    }
    return;
  }

  const spotlightTitle = payload.spotlight?.title ?? 'CulturePass Spotlight';

  widgets.CultureSpotlightWidget.updateSnapshot({
    title: spotlightTitle,
    subtitle: payload.spotlight?.description ?? 'Featured cultural event',
    city: payload.spotlight?.city ?? payload.city,
    startsAt: payload.nearby[0] ? formatEventDate(payload.nearby[0].date, payload.nearby[0].time) : undefined,
  });

  widgets.CultureNearYouWidget.updateSnapshot({
    locationLabel: [payload.city, payload.country].filter(Boolean).join(', ') || 'Your area',
    events: payload.nearby.slice(0, 3).map((event) => ({
      title: event.title,
      startsAt: formatEventDate(event.date, event.time),
    })),
  });

  widgets.CultureIdentityQRWidget.updateSnapshot({
    displayName: payload.displayName ?? 'CulturePass Member',
    culturePassId: payload.culturePassId ?? payload.upcomingTicket?.ticket.cpTicketId ?? payload.upcomingTicket?.ticket.id ?? 'CP-ID',
  });
}
