/**
 * Consistent bottom padding for scroll content inside the main tab group.
 * Clears the floating CustomTabBar + device home indicator.
 */

import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLayout } from '@/hooks/useLayout';

/**
 * @param extra — additional spacing below the tab bar clearance (section tail, FAB, etc.)
 */
export function useTabScrollBottomPadding(extra = 16): number {
  const insets = useSafeAreaInsets();
  const { isDesktop, tabBarHeight } = useLayout();

  // Desktop web: no floating tab bar; tail room above the thin glass AppFooter (~36px + gap)
  if (Platform.OS === 'web' && isDesktop) {
    return extra + 36;
  }

  const bottomSafe = Platform.OS === 'web' ? 12 : insets.bottom;
  return tabBarHeight + bottomSafe + extra;
}
