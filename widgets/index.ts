/**
 * Home-screen widget controllers (expo-widgets).
 *
 * - Expo Go (`storeClient`): no-op snapshots so the JS bundle never loads Swift UI widget sources.
 * - Production / dev client: load real `createWidget` instances so `updateSnapshot` reaches WidgetKit.
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

type SnapshotUpdater<TPayload> = {
  updateSnapshot: (payload: TPayload) => void;
};

const noopWidget = <TPayload>(): SnapshotUpdater<TPayload> => ({
  updateSnapshot: () => {},
});

function isNativeWidgetsSupported(): boolean {
  if (Platform.OS === 'web') return false;
  // Expo Go cannot load @expo/ui swift-ui widget layouts.
  if (Constants.executionEnvironment === 'storeClient') return false;
  return true;
}

function loadNativeWidgetModules():
  | {
      CultureSpotlightWidget: SnapshotUpdater<import('./CultureSpotlightWidget').CultureSpotlightWidgetProps>;
      CultureNearYouWidget: SnapshotUpdater<import('./CultureNearYouWidget').CultureNearYouWidgetProps>;
      CultureIdentityQRWidget: SnapshotUpdater<import('./CultureIdentityQRWidget').CultureIdentityQRWidgetProps>;
      CultureUpcomingTicketWidget: SnapshotUpdater<
        import('./CultureUpcomingTicketWidget').CultureUpcomingTicketWidgetProps
      >;
    }
  | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const CultureSpotlightWidget = require('./CultureSpotlightWidget').default as SnapshotUpdater<
      import('./CultureSpotlightWidget').CultureSpotlightWidgetProps
    >;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const CultureNearYouWidget = require('./CultureNearYouWidget').default as SnapshotUpdater<
      import('./CultureNearYouWidget').CultureNearYouWidgetProps
    >;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const CultureIdentityQRWidget = require('./CultureIdentityQRWidget').default as SnapshotUpdater<
      import('./CultureIdentityQRWidget').CultureIdentityQRWidgetProps
    >;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const CultureUpcomingTicketWidget = require('./CultureUpcomingTicketWidget').default as SnapshotUpdater<
      import('./CultureUpcomingTicketWidget').CultureUpcomingTicketWidgetProps
    >;
    return {
      CultureSpotlightWidget,
      CultureNearYouWidget,
      CultureIdentityQRWidget,
      CultureUpcomingTicketWidget,
    };
  } catch (error) {
    if (__DEV__) {
      console.warn('[widgets] Native widget modules failed to load; using no-op snapshots:', error);
    }
    return null;
  }
}

const bundle = isNativeWidgetsSupported() ? loadNativeWidgetModules() : null;

const fallback = {
  CultureSpotlightWidget: noopWidget<import('./CultureSpotlightWidget').CultureSpotlightWidgetProps>(),
  CultureNearYouWidget: noopWidget<import('./CultureNearYouWidget').CultureNearYouWidgetProps>(),
  CultureIdentityQRWidget: noopWidget<import('./CultureIdentityQRWidget').CultureIdentityQRWidgetProps>(),
  CultureUpcomingTicketWidget: noopWidget<
    import('./CultureUpcomingTicketWidget').CultureUpcomingTicketWidgetProps
  >(),
};

const active = bundle ?? fallback;

export const CultureSpotlightWidget = active.CultureSpotlightWidget;
export const CultureNearYouWidget = active.CultureNearYouWidget;
export const CultureIdentityQRWidget = active.CultureIdentityQRWidget;
export const CultureUpcomingTicketWidget = active.CultureUpcomingTicketWidget;

type LiveActivityController<TPayload> = {
  start: (
    payload: TPayload,
    deepLinkUrl?: string
  ) => Promise<{
    update: (nextPayload: TPayload) => Promise<void>;
    end: (dismissalPolicy?: 'default' | 'immediate') => Promise<void>;
  }>;
};

const noopLiveActivity = <TPayload>(): LiveActivityController<TPayload> => ({
  start: async () => ({
    update: async () => {},
    end: async () => {},
  }),
});

/** @deprecated Use `CultureLiveEventTracker` from `./CultureLiveEventTracker` in native code paths. */
export const CultureLiveEventTracker = noopLiveActivity<{
  eventTitle: string;
  venue?: string;
  startsAt?: string;
  status: 'upcoming' | 'doors_open' | 'checked_in' | 'finished';
}>();
