// @ts-nocheck
import { Platform, type ViewStyle } from 'react-native';
import { LiquidGlassTokens, webShadow } from '@/constants/theme';

/** Breathing room below the status bar / notch on main tab headers (native only). */
export const TAB_HEADER_NATIVE_INSET_GAP = Platform.select({
  ios: 6,
  android: 8,
  default: 8,
});

export const MAIN_TAB_UI = {
  /** Shared content max width for top/bottom app bars on large screens. */
  chromeMaxWidth: 1200,
  cardRadius: LiquidGlassTokens.corner.mainCard,
  headerBorderWidth: 1,
  headerVerticalPadding: 14,
  /** Consistent minimum interactive target size for navigation controls. */
  minTouchTarget: 44,
  /** Standardized bottom navigation shell heights. */
  tabBarOuterHeight: Platform.OS === 'android' ? 68 : 66,
  tabBarInnerHeight: Platform.OS === 'android' ? 64 : 60,
  sectionGap: 20,
  sectionGapLarge: 24,
  sectionGapSmall: 12,
  ctaMinHeight: 44,
  /** Standard bottom padding for scrollable tab content — clears the tab bar + safe area. */
  scrollBottomPad: 120,
  iconSize: {
    xs: 10,
    sm: 14,
    md: 18,
    lg: 22,
  },
} as const;

export const MAIN_TAB_CARD_SHADOW = Platform.select<ViewStyle>({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  android: {
    elevation: 2,
  },
  web: webShadow('0 2px 10px rgba(0,0,0,0.06)'),
  default: {},
});

export const MAIN_TAB_CARD_SHADOW_STRONG = Platform.select<ViewStyle>({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  android: {
    elevation: 4,
  },
  web: webShadow('0 4px 18px rgba(0,0,0,0.1)'),
  default: {},
});
