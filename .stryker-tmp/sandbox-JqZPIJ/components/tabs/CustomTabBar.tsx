/**
 * CustomTabBar — clean floating tab bar for CulturePass.
 *
 * Features:
 * - Floating pill with rounded corners + shadow
 * - Active state: indigo icon + label + small dot indicator below icon
 * - Spring scale animation on press
 * - Haptic feedback (iOS/Android)
 * - Profile tab shows user avatar when authenticated
 * - Solid elevated panel shell (tokenized surface + border + shadow)
 * - Hidden on desktop web (sidebar takes over)
 */
// @ts-nocheck


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
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useColors, useIsDark } from '@/hooks/useColors';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { useAuth } from '@/lib/auth';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, LiquidGlassTokens } from '@/constants/theme';
import { MAIN_TAB_UI } from '@/components/tabs/mainTabTokens';

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  {
    name: 'index',
    label: 'Discover',
    icon: 'compass-outline' as const,
    iconActive: 'compass' as const,
  },
  {
    name: 'calendar',
    label: 'Events',
    icon: 'calendar-outline' as const,
    iconActive: 'calendar' as const,
  },
  {
    name: 'community',
    label: 'Community',
    icon: 'people-outline' as const,
    iconActive: 'people' as const,
  },
  {
    name: 'city',
    label: 'My City',
    icon: 'location-outline' as const,
    iconActive: 'location' as const,
  },
  {
    name: 'perks',
    label: 'Perks',
    icon: 'gift-outline' as const,
    iconActive: 'gift' as const,
  },
  {
    name: 'profile',
    label: 'Profile',
    icon: 'person-circle-outline' as const,
    iconActive: 'person-circle' as const,
  },
] as const;

type TabConfig = (typeof TABS)[number];

// ─── Individual tab item ──────────────────────────────────────────────────────

const TAB_HINTS: Partial<Record<TabConfig['name'], string>> = {
  index: 'Discover curated events and culture near you',
  calendar: 'Browse events and your personal calendar',
  community: 'Find communities and cultural circles',
  city: 'See everything happening in your city',
  perks: 'Open perks, offers, and rewards',
  profile: 'View your profile, settings, and account',
};

interface TabItemProps {
  tab: TabConfig;
  isActive: boolean;
  onPress: () => void;
  isDark: boolean;
  colors: ReturnType<typeof useColors>;
  reduceMotion: boolean;
  /** Avatar URL — shown on the Profile tab when user is authenticated */
  avatarUrl?: string | null;
}

function TabItem({
  tab,
  isActive,
  onPress,
  isDark,
  colors,
  reduceMotion,
  avatarUrl,
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
  const isProfileTab = tab.name === 'profile';

  return (
    <Pressable
      onPress={handlePress}
      style={tabItem.wrap}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={tab.label}
      accessibilityHint={hint ? `${hint}. Double tap to open.` : 'Double tap to open tab'}
      hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
      android_ripple={Platform.OS === 'android' ? { color: CultureTokens.indigo + '22', borderless: false } : undefined}
    >
      <Animated.View
        style={[
          tabItem.inner,
          isActive && {
            backgroundColor: isDark ? 'rgba(0,102,204,0.18)' : 'rgba(0,102,204,0.08)',
            borderColor: isDark ? 'rgba(0,102,204,0.38)' : 'rgba(0,102,204,0.22)',
          },
          { transform: [{ scale }] },
        ]}
      >
        {/* Icon / Avatar */}
        <View style={tabItem.iconWrap}>
          {isProfileTab && avatarUrl ? (
            <View style={[tabItem.avatarRing, isActive && { borderColor: CultureTokens.indigo }]}>
              <Image
                source={{ uri: avatarUrl }}
                style={tabItem.avatarImg}
                contentFit="cover"
              />
            </View>
          ) : (
            <Ionicons name={isActive ? tab.iconActive : tab.icon} size={MAIN_TAB_UI.iconSize.md} color={iconColor} />
          )}
        </View>

        {/* Label */}
        <Text
          style={[tabItem.label, { color: labelColor, opacity: isActive ? 1 : 0.88 }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
          maxFontSizeMultiplier={1.35}
        >
          {tab.label}
        </Text>

        {/* Active indicator */}
        {isActive ? <View style={tabItem.activeLine} /> : <View style={tabItem.linePlaceholder} />}
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
    paddingVertical: 7,
    paddingHorizontal: 6,
    gap: 3,
    minWidth: 0,
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
  avatarRing: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 21,
    height: 21,
    borderRadius: 6,
  },
  label: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.15,
    textAlign: 'center',
  },
  activeLine: {
    width: 14,
    height: 2.5,
    borderRadius: 99,
    backgroundColor: CultureTokens.indigo,
    marginTop: 1.5,
  },
  linePlaceholder: {
    width: 14,
    height: 2.5,
    marginTop: 1.5,
    opacity: 0,
  },
});

// ─── Main tab bar ─────────────────────────────────────────────────────────────

export function CustomTabBar({ state, navigation, insets }: BottomTabBarProps) {
  const colors = useColors();
  const isDark = useIsDark();
  const { isDesktop } = useLayout();
  const { user } = useAuth();
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

  // Hidden on desktop web — sidebar handles navigation there
  if (Platform.OS === 'web' && isDesktop) return null;

  const bottomPad = Math.max(insets.bottom, 10);
  const avatarUrl = user?.avatarUrl ?? null;

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
            overflow: 'hidden',
            width: '100%',
            maxWidth: MAIN_TAB_UI.chromeMaxWidth,
            alignSelf: 'center',
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
          return (
            <TabItem
              key={route.key}
              tab={tab}
              isActive={isActive}
              isDark={isDark}
              colors={colors}
              reduceMotion={reduceMotion}
              avatarUrl={tab.name === 'profile' ? avatarUrl : null}
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
    paddingHorizontal: 12,
    paddingTop: 4,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  pill: {
    minHeight: MAIN_TAB_UI.tabBarOuterHeight,
  },
  pillInner: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MAIN_TAB_UI.tabBarInnerHeight,
    paddingHorizontal: 6,
    paddingVertical: 2,
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
