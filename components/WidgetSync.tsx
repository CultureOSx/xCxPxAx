import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useCultureWidgetSnapshot } from '@/hooks/useCultureWidgetSnapshot';
import { syncCultureWidgetSnapshots } from '@/lib/widgets/sync';

/**
 * Pushes widget snapshot data to native home-screen widgets (iOS / Android) when supported.
 * Uses the same payload as the Widget Center dashboard (`useCultureWidgetSnapshot`).
 */
export function WidgetSync() {
  const { payload } = useCultureWidgetSnapshot();

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!payload) return;
    syncCultureWidgetSnapshots(payload);
  }, [payload]);

  return null;
}
