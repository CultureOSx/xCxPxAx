type SnapshotUpdater<TPayload> = {
  updateSnapshot: (payload: TPayload) => void;
};

type LiveActivityController<TPayload> = {
  start: (
    payload: TPayload,
    deepLinkUrl?: string
  ) => Promise<{
    update: (nextPayload: TPayload) => Promise<void>;
    end: (dismissalPolicy?: 'default' | 'immediate') => Promise<void>;
  }>;
};

const noopWidget = <TPayload>(): SnapshotUpdater<TPayload> => ({
  updateSnapshot: () => {},
});

const noopLiveActivity = <TPayload>(): LiveActivityController<TPayload> => ({
  start: async () => ({
    update: async () => {},
    end: async () => {},
  }),
});

// NOTE:
// These exports are intentionally no-op in the app runtime so Expo Go can boot
// without parsing `@expo/ui/swift-ui` widget files. Native widget targets are
// still generated and consumed from their own build pipeline.
export const CultureSpotlightWidget = noopWidget<{
  title: string;
  subtitle?: string;
  city?: string;
  startsAt?: string;
}>();

export const CultureNearYouWidget = noopWidget<{
  locationLabel: string;
  events: { title: string; startsAt: string }[];
}>();

export const CultureIdentityQRWidget = noopWidget<{
  displayName: string;
  culturePassId: string;
}>();

export const CultureUpcomingTicketWidget = noopWidget<{
  eventTitle: string;
  eventDate: string;
  eventTime?: string;
  venue?: string;
  ticketCode?: string;
  status: string;
}>();

export const CultureLiveEventTracker = noopLiveActivity<{
  eventTitle: string;
  venue?: string;
  startsAt?: string;
  status: 'upcoming' | 'doors_open' | 'checked_in' | 'finished';
}>();
