import { Platform, type ViewStyle } from 'react-native';
import {
  LiquidGlassTokens,
  HeaderTokens,
  SectionTokens,
  Spacing,
  ZIndex,
  webShadow,
} from '@/constants/theme';

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

/** Shared sizing/spacing tokens for tab header chrome across web + native. */
export const HEADER_CHROME_TOKENS = {
  logo: {
    compactSize: HeaderTokens.height - 14, // 34
    compactRing: HeaderTokens.height - 8, // 40
    defaultSize: HeaderTokens.height - 8, // 40
    defaultRing: HeaderTokens.height - 4, // 44
    compactRadius: 8,
    defaultRadius: 10,
  },
  actionButton: {
    size: MAIN_TAB_UI.minTouchTarget,
    radius: 12,
    borderWidth: 1,
    avatarBorderWidth: 1.5,
    avatarImageSize: 28,
    avatarImageRadius: 8,
    badgeSize: 16,
    badgeRadius: 8,
    badgeFontSize: 8,
  },
  title: {
    webFontSize: SectionTokens.titleFontSize, // 20
    nativeFontSize: 22,
    webLineHeight: SectionTokens.titleLineHeight, // 28
    nativeLineHeight: 28,
    letterSpacing: -0.4,
  },
  location: {
    iconSize: MAIN_TAB_UI.iconSize.sm,
    fontSize: 11,
    lineHeight: 15,
    gap: Spacing.xs,
    marginTop: 4,
  },
  row: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  stripHeight: 1.5,
  zIndex: ZIndex.sticky,
  shadow: {
    iosColor: '#000',
    iosOpacity: 0.06,
    iosRadius: 3,
    iosHeight: 1,
    androidElevation: 2,
  },
  webChromeShadow: '0px 2px 12px rgba(0,0,0,0.07)',
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
