/**
 * CustomTabBar — clean floating tab bar for CulturePass.
 *
 * Features:
 * - Floating pill with rounded corners + shadow
 * - Active state: indigo icon + label + small dot indicator below icon
 * - Spring scale animation on press
 * - Haptic feedback (iOS/Android)
 * - User avatar in Profile tab
 * - Notification badge on Profile tab
 * - BlurView on iOS, solid on Android/Web
 * - Hidden on desktop web (sidebar takes over)
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
  useColorScheme,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/lib/auth';
import { useLayout } from '@/hooks/useLayout';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CultureTokens } from '@/constants/theme';

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  {
    name: 'index',
    label: 'Discover',
    icon: 'compass-outline' as const,
    iconActive: 'compass' as const,
  },
  {
    name: 'feed',
    label: 'Feed',
    icon: 'newspaper-outline' as const,
    iconActive: 'newspaper' as const,
  },
  {
    name: 'community',
    label: 'Community',
    icon: 'people-circle-outline' as const,
    iconActive: 'people-circle' as const,
  },
  {
    name: 'calendar',
    label: 'Calendar',
    icon: 'calendar-outline' as const,
    iconActive: 'calendar' as const,
  },
  {
    name: 'profile',
    label: 'Profile',
    icon: 'person-circle-outline' as const,
    iconActive: 'person-circle' as const,
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
  txt: { fontSize: 8, fontFamily: 'Poppins_700Bold', color: '#fff' },
});

// ─── Individual tab item ──────────────────────────────────────────────────────

interface TabItemProps {
  tab: TabConfig;
  isActive: boolean;
  onPress: () => void;
  badgeCount?: number;
  avatarUrl?: string;
  initials?: string;
  isDark: boolean;
  colors: ReturnType<typeof useColors>;
}

function TabItem({ tab, isActive, onPress, badgeCount, avatarUrl, initials, isDark, colors }: TabItemProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.84, duration: 65, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 300, useNativeDriver: true }),
    ]).start();
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
    onPress();
  };

  const iconColor = isActive ? CultureTokens.indigo : colors.textTertiary;
  const labelColor = isActive ? CultureTokens.indigo : colors.textTertiary;

  return (
    <Pressable
      onPress={handlePress}
      style={tabItem.wrap}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={tab.label}
    >
      <Animated.View style={[tabItem.inner, { transform: [{ scale }] }]}>
        {/* Icon */}
        <View style={tabItem.iconWrap}>
          {tab.name === 'profile' ? (
            <View
              style={[
                tabItem.avatarOuter,
                isActive && { borderColor: CultureTokens.indigo + '80', borderWidth: 1.5 },
              ]}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={tabItem.avatarImg} />
              ) : (
                <View
                  style={[
                    tabItem.avatarInner,
                    { backgroundColor: isDark ? 'rgba(44,42,114,0.25)' : 'rgba(44,42,114,0.08)' },
                  ]}
                >
                  <Text style={[tabItem.avatarInitials, { color: iconColor }]}>
                    {initials ?? '?'}
                  </Text>
                </View>
              )}
              {badgeCount ? <Badge count={badgeCount} /> : null}
            </View>
          ) : (
            <Ionicons name={isActive ? tab.iconActive : tab.icon} size={22} color={iconColor} />
          )}
        </View>

        {/* Label */}
        <Text style={[tabItem.label, { color: labelColor }]} numberOfLines={1}>
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
    paddingHorizontal: 6,
    gap: 3,
    minWidth: 44,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },

  // Avatar (profile tab)
  avatarOuter: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  avatarInner: {
    width: 26,
    height: 26,
    borderRadius: 13,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: 26, height: 26, borderRadius: 13 },
  avatarInitials: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
  },

  label: {
    fontSize: 9.5,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.1,
    textAlign: 'center',
  },

  dot: {
    width: 4,
    height: 3,
    borderRadius: 2,
    backgroundColor: CultureTokens.indigo,
    marginTop: 1,
  },
});

// ─── Main tab bar ─────────────────────────────────────────────────────────────

export function CustomTabBar({ state, navigation, insets }: BottomTabBarProps) {
  const colors = useColors();
  const isDark = useColorScheme() === 'dark';
  const { isDesktop } = useLayout();
  const { user, userId } = useAuth();

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

  const displayName = user?.displayName ?? user?.username ?? '';
  const initials = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w: string) => (w[0] || ''))
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  const bottomPad = Math.max(insets.bottom, 8);

  // Only render tabs that match our TABS config
  const visibleRoutes = state.routes.filter((r) => TABS.some((t) => t.name === r.name));

  return (
    <View style={[bar.root, { paddingBottom: bottomPad }]}>
      <View
        style={[
          bar.pill,
          {
            borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
            shadowColor: isDark ? '#000' : CultureTokens.indigo,
          },
        ]}
      >
        {/* Background */}
        {Platform.OS === 'ios' ? (
          <BlurView
            intensity={90}
            tint={isDark ? 'dark' : 'extraLight'}
            style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark ? 'rgba(11, 11, 24, 0.97)' : 'rgba(255, 255, 255, 0.97)',
                borderRadius: 28,
              },
            ]}
          />
        )}

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
          const isProfileTab = tab.name === 'profile';
          return (
            <TabItem
              key={route.key}
              tab={tab}
              isActive={isActive}
              isDark={isDark}
              colors={colors}
              badgeCount={isProfileTab ? notifCount : undefined}
              avatarUrl={isProfileTab ? (user as any)?.avatarUrl : undefined}
              initials={isProfileTab ? initials : undefined}
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
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const bar = StyleSheet.create({
  root: {
    paddingHorizontal: 16,
    paddingTop: 6,
    backgroundColor: 'transparent',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'visible',
    paddingHorizontal: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 14,
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
