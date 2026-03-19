/**
 * CustomTabBar — floating glassmorphic tab bar for CulturePass.
 *
 * Features:
 * - Floating pill with rounded corners + shadow
 * - Brand gradient (Indigo → Saffron) active pill
 * - Spring scale animation on press
 * - Haptic feedback (iOS/Android)
 * - User avatar in Profile tab
 * - Notification badge on Profile tab
 * - BlurView background on iOS, solid semi-transparent on Android/Web
 * - Gradient top-border accent line
 * - Hidden automatically on desktop web (sidebar takes over)
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
import { CultureTokens, gradients } from '@/constants/theme';

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  {
    name: 'index',
    label: 'Discover',
    icon: 'compass-outline' as const,
    iconActive: 'compass' as const,
    accent: CultureTokens.indigo,
  },
  {
    name: 'feed',
    label: 'Feed',
    icon: 'newspaper-outline' as const,
    iconActive: 'newspaper' as const,
    accent: CultureTokens.teal,
  },
  {
    name: 'calendar',
    label: 'Calendar',
    icon: 'calendar-outline' as const,
    iconActive: 'calendar' as const,
    accent: CultureTokens.saffron,
  },
  {
    name: 'community',
    label: 'Community',
    icon: 'people-circle-outline' as const,
    iconActive: 'people-circle' as const,
    accent: CultureTokens.coral,
  },
  {
    name: 'perks',
    label: 'Perks',
    icon: 'gift-outline' as const,
    iconActive: 'gift' as const,
    accent: CultureTokens.gold,
  },
  {
    name: 'profile',
    label: 'Profile',
    icon: 'person-circle-outline' as const,
    iconActive: 'person-circle' as const,
    accent: CultureTokens.indigo,
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
    top: 0,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: CultureTokens.coral,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    zIndex: 10,
  },
  txt: { fontSize: 8.5, fontFamily: 'Poppins_700Bold', color: '#fff' },
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
}

function TabItem({ tab, isActive, onPress, badgeCount, avatarUrl, initials, isDark }: TabItemProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const isProfile = tab.name === 'profile';
  const showAvatar = isProfile && (!!avatarUrl || !!initials);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.82, duration: 70, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 280, useNativeDriver: true }),
    ]).start();
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
    onPress();
  };

  const inactiveIconColor = isDark ? 'rgba(232,244,255,0.42)' : 'rgba(0,22,40,0.40)';
  const inactiveLabelColor = isDark ? 'rgba(232,244,255,0.38)' : 'rgba(0,22,40,0.36)';

  return (
    <Pressable
      onPress={handlePress}
      style={item.wrap}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={tab.label}
    >
      <Animated.View style={[item.inner, { transform: [{ scale }] }]}>
        {/* Active gradient pill */}
        {isActive && (
          <LinearGradient
            colors={gradients.culturepassBrand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={item.activePill}
          />
        )}

        {/* Icon area */}
        <View style={item.iconWrap}>
          {showAvatar ? (
            // Profile tab — user avatar with gradient ring when active
            <View style={[item.avatarOuter, isActive && item.avatarOuterActive]}>
              {isActive && (
                <LinearGradient
                  colors={gradients.culturepassBrand}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <View style={[item.avatarInner, { backgroundColor: isDark ? '#141428' : '#f5f5f5' }]}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={item.avatarImg} />
                ) : (
                  <LinearGradient
                    colors={gradients.culturepassBrand}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  >
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={item.avatarInitials}>{initials}</Text>
                    </View>
                  </LinearGradient>
                )}
              </View>
            </View>
          ) : (
            <Ionicons
              name={isActive ? tab.iconActive : tab.icon}
              size={22}
              color={isActive ? '#ffffff' : inactiveIconColor}
            />
          )}
          <Badge count={badgeCount ?? 0} />
        </View>

        {/* Label */}
        <Text
          style={[
            item.label,
            isActive ? item.labelActive : { color: inactiveLabelColor },
          ]}
          numberOfLines={1}
        >
          {tab.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const item = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 58,
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 16,
    gap: 3,
    overflow: 'hidden',
  },
  activePill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
    height: 26,
  },

  // Avatar (profile tab)
  avatarOuter: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarOuterActive: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarInner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: 22, height: 22 },
  avatarInitials: {
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },

  label: {
    fontSize: 9,
    fontFamily: 'Poppins_500Medium',
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  labelActive: {
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
    fontSize: 9,
  },
});

// ─── Main tab bar ─────────────────────────────────────────────────────────────

export function CustomTabBar({ state, navigation, insets }: BottomTabBarProps) {
  useColors();
  const isDark = useColorScheme() === 'dark';
  const { isDesktop } = useLayout();
  const { user, userId, isAuthenticated } = useAuth();

  // Always call hooks first
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
  const initials = displayName.trim().split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  const bottomPad = Math.max(insets.bottom, 8);

  // Only render TABS that are in the current route list (skip hidden screens)
  const visibleRoutes = state.routes.filter((r) => TABS.some((t) => t.name === r.name));

  return (
    <View style={[bar.root, { paddingBottom: bottomPad }]}>
      <View
        style={[
          bar.pill,
          {
            borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
            shadowColor: isDark ? '#000' : '#0066CC',
          },
        ]}
      >
        {/* Background: BlurView (iOS) or solid (Android/Web) */}
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

        {/* Brand gradient top edge line */}
        <LinearGradient
          colors={[CultureTokens.indigo, CultureTokens.saffron, 'rgba(255,140,66,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={bar.topLine}
        />

        {/* Tab items */}
        {visibleRoutes.map((route) => {
          const tab = TABS.find((t) => t.name === route.name);
          if (!tab) return null;
          const routeIndex = state.routes.findIndex((r) => r.key === route.key);
          const isActive = state.index === routeIndex;
          const isProfile = tab.name === 'profile';

          return (
            <TabItem
              key={route.key}
              tab={tab}
              isActive={isActive}
              isDark={isDark}
              badgeCount={isProfile ? notifCount : 0}
              avatarUrl={isProfile && isAuthenticated ? user?.avatarUrl : undefined}
              initials={isProfile && isAuthenticated ? initials : undefined}
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

// ─── Container styles ─────────────────────────────────────────────────────────

const bar = StyleSheet.create({
  root: {
    paddingHorizontal: 12,
    paddingTop: 6,
    backgroundColor: 'transparent',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    paddingHorizontal: 4,
    // Shadow
    shadowOffset: { width: 0, height: 8 },
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
  },
});
