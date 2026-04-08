/**
 * CustomTabBar — clean floating tab bar for CulturePass.
 *
 * Features:
 * - Floating pill with rounded corners + shadow
 * - Active state: indigo icon + label + small dot indicator below icon
 * - Spring scale animation on press
 * - Haptic feedback (iOS/Android)
 * - Notification badge on Feed tab
 * - LiquidGlassPanel (iOS glass / blur fallback / web backdrop-filter)
 * - Hidden on desktop web (sidebar takes over)
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
  AccessibilityInfo,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useColors, useIsDark } from '@/hooks/useColors';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { useAuth } from '@/lib/auth';
import { useLayout } from '@/hooks/useLayout';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CultureTokens, LiquidGlassTokens } from '@/constants/theme';
import { MAIN_TAB_UI } from '@/components/tabs/mainTabTokens';

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  {
    name: 'index',
    label: 'Discover',
    icon: 'compass-outline' as const,
    iconActive: 'compass' as const,
    sfSymbol: 'map' as const,
    sfSymbolActive: 'map.fill' as const,
  },
  {
    name: 'calendar',
    label: 'Events',
    icon: 'calendar-outline' as const,
    iconActive: 'calendar' as const,
    sfSymbol: 'calendar' as const,
    sfSymbolActive: 'calendar' as const,
  },
  {
    name: 'community',
    label: 'Community',
    icon: 'people-outline' as const,
    iconActive: 'people' as const,
    sfSymbol: 'person.3' as const,
    sfSymbolActive: 'person.3.fill' as const,
  },
  {
    name: 'city',
    label: 'My City',
    icon: 'location-outline' as const,
    iconActive: 'location' as const,
    sfSymbol: 'mappin.and.ellipse' as const,
    sfSymbolActive: 'mappin.and.ellipse' as const,
  },
  {
    name: 'perks',
    label: 'Perks',
    icon: 'gift-outline' as const,
    iconActive: 'gift' as const,
    sfSymbol: 'gift' as const,
    sfSymbolActive: 'gift.fill' as const,
  },
] as const;

type TabConfig = (typeof TABS)[number];

// ─── Badge ────────────────────────────────────────────────────────────────────

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View style={badge.wrap}>
      <Text style={badge.txt}>{count > 9 ? '9+' : String(count)}</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: -1,
    right: -3,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: CultureTokens.coral,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    zIndex: 10,
  },
  txt: { fontSize: 8, fontFamily: 'Poppins_700Bold', color: '#FFFFFF' },
});

// ─── Individual tab item ──────────────────────────────────────────────────────

const TAB_HINTS: Partial<Record<TabConfig['name'], string>> = {
  index: 'Discover curated events and culture near you',
  calendar: 'Browse events and your personal calendar',
  community: 'Find communities and cultural circles',
  city: 'See everything happening in your city',
  perks: 'Open perks, offers, and rewards',
};

interface TabItemProps {
  tab: TabConfig;
  isActive: boolean;
  onPress: () => void;
  badgeCount?: number;
  isDark: boolean;
  colors: ReturnType<typeof useColors>;
  reduceMotion: boolean;
}

function TabItem({
  tab,
  isActive,
  onPress,
  badgeCount,
  isDark,
  colors,
  reduceMotion,
}: TabItemProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (!reduceMotion) {
      Animated.sequence([
        Animated.timing(scale, { toValue: 0.92, duration: 90, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 6, tension: 320, useNativeDriver: true }),
      ]).start();
    }
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
    onPress();
  };

  const iconColor = isActive ? CultureTokens.indigo : colors.textTertiary;
  const labelColor = isActive ? CultureTokens.indigo : colors.textTertiary;

  const hint = TAB_HINTS[tab.name];

  return (
    <Pressable
      onPress={handlePress}
      style={tabItem.wrap}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={tab.label}
      accessibilityHint={hint}
      hitSlop={{ top: 10, bottom: 10, left: 2, right: 2 }}
      android_ripple={Platform.OS === 'android' ? { color: CultureTokens.indigo + '22', borderless: false } : undefined}
    >
      <Animated.View
        style={[
          tabItem.inner,
          isActive && {
            backgroundColor: isDark ? 'rgba(44,42,114,0.22)' : 'rgba(44,42,114,0.09)',
            borderColor: isDark ? 'rgba(44,42,114,0.36)' : 'rgba(44,42,114,0.22)',
          },
          { transform: [{ scale }] },
        ]}
      >
        {/* Icon */}
        <View style={tabItem.iconWrap}>
          {Platform.OS === 'ios' ? (
            <SymbolView
              name={(isActive ? tab.sfSymbolActive : tab.sfSymbol) as any}
              size={MAIN_TAB_UI.iconSize.lg}
              tintColor={iconColor}
              fallback={
                <Ionicons name={isActive ? tab.iconActive : tab.icon} size={MAIN_TAB_UI.iconSize.lg} color={iconColor} />
              }
            />
          ) : (
            <Ionicons name={isActive ? tab.iconActive : tab.icon} size={MAIN_TAB_UI.iconSize.lg} color={iconColor} />
          )}
          {badgeCount ? <Badge count={badgeCount} /> : null}
        </View>

        {/* Label — min ~10px; allow scaling for Dynamic Type / accessibility */}
        <Text
          style={[tabItem.label, { color: labelColor }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
          maxFontSizeMultiplier={1.35}
        >
          {tab.label}
        </Text>

        {/* Active indicator dot */}
        {isActive && (
          <View style={tabItem.dot} />
        )}
      </Animated.View>
    </Pressable>
  );
}

const tabItem = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 4,
    minWidth: 56,
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },

  label: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.15,
    textAlign: 'center',
  },

  dot: {
    width: 6,
    height: 4,
    borderRadius: 3,
    backgroundColor: CultureTokens.indigo,
    marginTop: 1,
  },
});

// ─── Main tab bar ─────────────────────────────────────────────────────────────

export function CustomTabBar({ state, navigation, insets }: BottomTabBarProps) {
  const colors = useColors();
  const isDark = useIsDark();
  const { isDesktop } = useLayout();
  const { userId } = useAuth();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let subscription: { remove?: () => void } | undefined;

    void (async () => {
      try {
        const v = await AccessibilityInfo.isReduceMotionEnabled();
        if (!cancelled) setReduceMotion(Boolean(v));
      } catch {
        /* unsupported platform */
      }
    })();

    try {
      subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
        setReduceMotion(enabled);
      });
    } catch {
      /* older RN / web */
    }

    return () => {
      cancelled = true;
      subscription?.remove?.();
    };
  }, []);

  const { data: notifCount = 0 } = useQuery<number>({
    queryKey: ['notifications', 'unread-count', userId],
    queryFn: async () => {
      const res = await api.notifications.unreadCount();
      return res.count ?? 0;
    },
    enabled: !!userId,
    refetchInterval: 60_000,
  });

  // Hidden on desktop web — sidebar handles navigation there
  if (Platform.OS === 'web' && isDesktop) return null;

  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 8);

  // Only render tabs that match our TABS config
  const visibleRoutes = state.routes.filter((r) => TABS.some((t) => t.name === r.name));

  const pillShadow = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.45 : 0.14,
      shadowRadius: 16,
    },
    android: { elevation: 14 },
    web: {
      boxShadow: isDark
        ? '0px 6px 20px rgba(0,0,0,0.6)'
        : '0px 6px 20px rgba(44,42,114,0.18)',
    },
    default: {},
  });

  return (
    <View style={[bar.root, { paddingBottom: bottomPad }]}>
      <LiquidGlassPanel
        borderRadius={LiquidGlassTokens.corner.mainCard}
        bordered
        style={[
          bar.pill,
          pillShadow,
          {
            borderColor: colors.borderLight,
            overflow: 'visible',
          },
        ]}
        contentStyle={bar.pillInner}
      >
        {/* Brand gradient top edge */}
        <LinearGradient
          colors={[CultureTokens.indigo, CultureTokens.teal, 'rgba(46,196,182,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={bar.topLine}
        />

        {/* All tabs — evenly distributed */}
        {visibleRoutes.map((route) => {
          const tab = TABS.find((t) => t.name === route.name);
          if (!tab) return null;
          const routeIndex = state.routes.findIndex((r) => r.key === route.key);
          const isActive = state.index === routeIndex;
          const isFeedTab = tab.name === 'city';
          return (
            <TabItem
              key={route.key}
              tab={tab}
              isActive={isActive}
              isDark={isDark}
              colors={colors}
              reduceMotion={reduceMotion}
              badgeCount={isFeedTab ? notifCount : undefined}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isActive && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
            />
          );
        })}
      </LiquidGlassPanel>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const bar = StyleSheet.create({
  root: {
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'android' ? 4 : 6,
    backgroundColor: 'transparent',
  },
  pill: {
    minHeight: Platform.OS === 'android' ? 68 : 66,
  },
  pillInner: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Platform.OS === 'android' ? 64 : 60,
    paddingHorizontal: 6,
    paddingVertical: Platform.OS === 'android' ? 3 : 2,
  },
  topLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
});
