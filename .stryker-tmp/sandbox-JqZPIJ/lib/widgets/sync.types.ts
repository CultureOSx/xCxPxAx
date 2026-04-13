// @ts-nocheck
import type {
  WidgetNearbyEventItem,
  WidgetSpotlightItem,
  WidgetUpcomingTicketItem,
} from '@/lib/api';

export type CultureWidgetSnapshotPayload = {
  spotlight: WidgetSpotlightItem | null;
  nearby: WidgetNearbyEventItem[];
  upcomingTicket: WidgetUpcomingTicketItem | null;
  displayName?: string;
  culturePassId?: string;
  city?: string;
  country?: string;
};
