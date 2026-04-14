import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { usePathname, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { useRole } from '@/hooks/useRole';
import { useCouncil } from '@/hooks/useCouncil';
import { Colors, CultureTokens, gradients } from '@/constants/theme';
import { TextStyles } from '@/constants/typography';
import { useColors, useIsDark } from '@/hooks/useColors';
import { getPostcodesByPlace } from '@shared/location/australian-postcodes';
import { Image } from 'expo-image';
import Svg, { Line } from 'react-native-svg';
import { Button } from '@/components/ui/Button';
import { BrandWordmark } from '@/components/ui/BrandWordmark';
import { APP_NAME, getAuVersionLabel } from '@/lib/app-meta';
import { api } from '@/lib/api';

const LOGO_RAY_COUNT = 28;

function LogoRayBurst({
  size = 68,
  borderRadius = 18,
  imagePadding = 11,
}: {
  size?: number;
  borderRadius?: number;
  imagePadding?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const innerR = Math.max(6, size * 0.14);
  const outerR = size / 2 - 2;
  const strokeW = size >= 56 ? 0.95 : 0.7;

  const rays: React.ReactNode[] = [];
  for (let i = 0; i < LOGO_RAY_COUNT; i++) {
    const a = (i / LOGO_RAY_COUNT) * Math.PI * 2;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    rays.push(
      <Line
        key={i}
        x1={cx + cos * innerR}
        y1={cy + sin * innerR}
        x2={cx + cos * outerR}
        y2={cy + sin * outerR}
        stroke="#FFFFFF"
        strokeWidth={strokeW}
        strokeOpacity={0.88}
        strokeLinecap="round"
      />,
    );
  }

  const whiteHub = Math.max(size - imagePadding * 2 - 6, size * 0.38);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius,
        overflow: 'hidden',
        backgroundColor: '#000000',
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
      }}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {rays}
      </Svg>

      <View
        style={{
          position: 'absolute',
          left: (size - whiteHub) / 2,
          top: (size - whiteHub) / 2,
          width: whiteHub,
          height: whiteHub,
          borderRadius: whiteHub / 2,
          backgroundColor: '#FFFFFF',
        }}
      />

      <View
        style={{
          position: 'absolute',
          inset: imagePadding,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          source={require('../../assets/images/culturepass-logo.png')}
          style={{ width: '100%', height: '100%' }}
          contentFit="contain"
        />
      </View>
    </View>
  );
}

// Nav definitions
interface NavItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  route: string;
  badge?: number;
  matchPrefix?: boolean;
}

const MAIN_NAV: NavItem[] = [
  { label: 'Discover', icon: 'compass-outline', iconActive: 'compass', route: '/(tabs)' },
  { label: 'My City', icon: 'location-outline', iconActive: 'location', route: '/(tabs)/city' },
  { label: 'Calendar', icon: 'calendar-outline', iconActive: 'calendar', route: '/(tabs)/calendar' },
  { label: 'Community', icon: 'people-circle-outline', iconActive: 'people-circle', route: '/(tabs)/community' },
  { label: 'Perks', icon: 'gift-outline', iconActive: 'gift', route: '/(tabs)/perks' },
];

const LIBRARY_NAV: NavItem[] = [
  { label: 'My Tickets', icon: 'ticket-outline', iconActive: 'ticket', route: '/tickets/index' },
  { label: 'Saved', icon: 'bookmark-outline', iconActive: 'bookmark', route: '/saved' },
  { label: 'Notifications', icon: 'notifications-outline', iconActive: 'notifications', route: '/notifications' },
  { label: 'All Events', icon: 'calendar-number-outline', iconActive: 'calendar-number', route: '/events', matchPrefix: true },
  { label: 'Movies', icon: 'film-outline', iconActive: 'film', route: '/movies', matchPrefix: true },
  { label: 'Dining', icon: 'restaurant-outline', iconActive: 'restaurant', route: '/restaurants', matchPrefix: true },
  { label: 'Activities', icon: 'compass-outline', iconActive: 'compass', route: '/activities', matchPrefix: true },
  { label: 'Shopping', icon: 'bag-outline', iconActive: 'bag', route: '/shopping', matchPrefix: true },
  { label: 'Map', icon: 'map-outline', iconActive: 'map', route: '/map' },
  { label: 'Directory', icon: 'grid-outline', iconActive: 'grid', route: '/(tabs)/directory', matchPrefix: true },
  { label: 'Help', icon: 'help-circle-outline', iconActive: 'help-circle', route: '/help' },
  { label: 'Settings', icon: 'settings-outline', iconActive: 'settings', route: '/settings' },
];

const ORGANIZER_NAV: NavItem[] = [
  { label: 'Dashboard', icon: 'grid-outline', iconActive: 'grid', route: '/dashboard/organizer', matchPrefix: true },
  { label: 'Create Event', icon: 'add-circle-outline', iconActive: 'add-circle', route: '/event/create' },
  { label: 'Scanner', icon: 'qr-code-outline', iconActive: 'qr-code', route: '/scanner' },
  { label: 'Widgets', icon: 'apps-outline', iconActive: 'apps', route: '/dashboard/widgets', matchPrefix: true },
];

const VENUE_NAV: NavItem[] = [
  { label: 'Venue Hub', icon: 'storefront-outline', iconActive: 'storefront', route: '/dashboard/venue', matchPrefix: true },
];

const SPONSOR_NAV: NavItem[] = [
  { label: 'Sponsor Hub', icon: 'ribbon-outline', iconActive: 'ribbon', route: '/dashboard/sponsor', matchPrefix: true },
];

const ADMIN_NAV: NavItem[] = [
  { label: 'Admin Hub', icon: 'shield-half-outline', iconActive: 'shield-half', route: '/admin/dashboard', matchPrefix: false },
  { label: 'Events', icon: 'calendar-outline', iconActive: 'calendar', route: '/admin/events', matchPrefix: true },
  { label: 'Users', icon: 'people-outline', iconActive: 'people', route: '/admin/users', matchPrefix: true },
  { label: 'Profiles', icon: 'id-card-outline', iconActive: 'id-card', route: '/admin/profiles', matchPrefix: true },
  { label: 'Communities', icon: 'people-circle-outline', iconActive: 'people-circle', route: '/admin/communities', matchPrefix: true },
  { label: 'Meet (Beta)', icon: 'heart-circle-outline', iconActive: 'heart-circle', route: '/admin/meet', matchPrefix: true },
  { label: 'Perks', icon: 'gift-outline', iconActive: 'gift', route: '/admin/perks', matchPrefix: true },
  { label: 'Tickets', icon: 'ticket-outline', iconActive: 'ticket', route: '/admin/tickets', matchPrefix: true },
  { label: 'Moderation', icon: 'eye-outline', iconActive: 'eye', route: '/admin/moderation', matchPrefix: true },
  { label: 'Audit Logs', icon: 'list-outline', iconActive: 'list', route: '/admin/audit-logs', matchPrefix: true },
  { label: 'Notify', icon: 'megaphone-outline', iconActive: 'megaphone', route: '/admin/notifications', matchPrefix: true },
  { label: 'Import', icon: 'cloud-upload-outline', iconActive: 'cloud-upload', route: '/admin/import', matchPrefix: true },
  { label: 'Finance', icon: 'card-outline', iconActive: 'card', route: '/admin/finance', matchPrefix: true },
  { label: 'Compliance', icon: 'shield-checkmark-outline', iconActive: 'shield-checkmark', route: '/admin/data-compliance', matchPrefix: true },
  { label: 'Discover Curation', icon: 'sparkles-outline', iconActive: 'sparkles', route: '/admin/discover', matchPrefix: true },
  { label: 'Handles', icon: 'at-outline', iconActive: 'at', route: '/admin/handles', matchPrefix: true },
  { label: 'Platform', icon: 'settings-outline', iconActive: 'settings', route: '/admin/platform', matchPrefix: true },
  { label: 'Updates', icon: 'newspaper-outline', iconActive: 'newspaper', route: '/admin/updates', matchPrefix: true },
];

const SUPERADMIN_NAV: NavItem[] = [
  { label: 'Cockpit (Root)', icon: 'rocket-outline', iconActive: 'rocket', route: '/admin/cockpit', matchPrefix: true },
];


const PROFILE_ACTIONS = [
  { key: 'profile', label: 'View Profile', icon: 'person-outline' as const, route: '/profile/edit' },
  { key: 'qr', label: 'Digital ID', icon: 'qr-code-outline' as const, route: '/profile/qr' },
  { key: 'wallet', label: 'Wallet', icon: 'wallet-outline' as const, route: '/payment/wallet' },
  { key: 'notifications', label: 'Notifications', icon: 'notifications-outline' as const, route: '/notifications' },
  { key: 'settings', label: 'Settings', icon: 'settings-outline' as const, route: '/settings' },
];

export const NOTIF_UNREAD_QUERY_KEY = (userId: string | null | undefined) =>
  ['notifications', 'unread-count', userId] as const;

function AvatarWithRing({
  avatarUrl,
  initials,
  size = 40,
  ringWidth = 2,
  isGuest = false,
}: {
  avatarUrl?: string;
  initials: string;
  size?: number;
  ringWidth?: number;
  isGuest?: boolean;
}) {
  const innerSize = size - ringWidth * 2 - 2;

  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}>
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
      />
      <View
        style={{
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
          overflow: 'hidden',
          backgroundColor: '#1a1a2e',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isGuest ? (
          <LinearGradient colors={gradients.culturepassBrand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill}>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="globe-outline" size={Math.round(innerSize * 0.5)} color="#fff" />
            </View>
          </LinearGradient>
        ) : avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={{ width: innerSize, height: innerSize }} contentFit="cover" />
        ) : (
          <LinearGradient colors={gradients.culturepassBrand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill}>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: Math.round(innerSize * 0.36), fontFamily: 'Poppins_700Bold', color: '#fff' }}>
                {initials}
              </Text>
            </View>
          </LinearGradient>
        )}
      </View>
    </View>
  );
}

function NavSection({
  label,
  mutedColor,
  children,
}: {
  label: string;
  mutedColor: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <View style={s.sectionHeader}>
        <Text style={[s.sectionLabel, { color: mutedColor }]}>{label.toUpperCase()}</Text>
      </View>
      <View style={{ paddingHorizontal: 10, gap: 2 }}>{children}</View>
    </>
  );
}

function SidebarItem({
  item,
  active,
  isDark,
  onPress,
  colors,
}: {
  item: NavItem;
  active: boolean;
  isDark: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const [hovered, setHovered] = useState(false);
  const showHover = hovered && !active;

  return (
    <Pressable
      style={[
        s.item,
        active && [s.itemActive, { backgroundColor: colors.primarySoft }],
        showHover && { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,12,24,0.04)' },
      ]}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="link"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: active }}
    >
      {active && (
        <View style={s.activeBar}>
          <LinearGradient
            colors={[CultureTokens.indigo, CultureTokens.teal]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}
      <Ionicons
        name={active ? item.iconActive : item.icon}
        size={18}
        color={active ? colors.primary : (isDark ? 'rgba(232,244,255,0.60)' : 'rgba(0,22,40,0.52)')}
      />
      <Text
        style={[s.label, { color: active ? colors.primary : colors.textSecondary }, active && s.labelActive]}
        numberOfLines={1}
      >
        {item.label}
      </Text>
      {(item.badge ?? 0) > 0 && (
        <View style={s.badge}>
          <Text style={s.badgeText}>{item.badge! > 99 ? '99+' : item.badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function WebSidebar() {
  const pathname = usePathname();
  const colors = useColors();
  const isDark = useIsDark();

  const { user, logout, isAuthenticated, userId, isRestoring } = useAuth();
  const { isOrganizer, isAdmin, isSuperAdmin, role } = useRole();
  const isVenue = role === 'business';
  const isSponsor = role === 'sponsor';
  const { data: councilData } = useCouncil();

  const [collapsed, setCollapsed] = useState(false);
  const [now, setNow] = useState(new Date());
  const [weatherSummary, setWeatherSummary] = useState('');

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ['notifications', 'unread-count', userId],
    queryFn: async () => {
      const res = await api.notifications.unreadCount();
      return res.count ?? 0;
    },
    enabled: Boolean(userId) && !isRestoring,
    refetchInterval: 60_000,
  });

  const libraryNav = useMemo(() =>
    LIBRARY_NAV.map((item) =>
      item.route === '/notifications' && unreadCount > 0 ? { ...item, badge: unreadCount } : item,
    ),
    [unreadCount],
  );

  const isActive = (item: NavItem) => {
    if (item.matchPrefix) return pathname.startsWith(item.route.replace('/(tabs)', ''));
    if (item.route === '/(tabs)') return pathname === '/' || pathname === '/index' || pathname === '';
    const bare = item.route.replace('/(tabs)/', '/').replace('/(tabs)', '/');
    return pathname === bare || pathname.startsWith(bare + '/');
  };

  const navigate = (route: string) => router.navigate(route as any);

  const bg = colors.surface;
  const border = colors.borderLight;
  const mutedColor = isDark ? 'rgba(232,244,255,0.35)' : 'rgba(0,22,40,0.32)';
  const myCouncil = councilData?.council;

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const city = user?.city?.trim();
    if (!city) {
      setWeatherSummary('');
      return;
    }

    const place = getPostcodesByPlace(city)[0];
    if (!place) {
      setWeatherSummary('');
      return;
    }

    const controller = new AbortController();

    const fetchWeather = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error('weather');
        const data = (await res.json()) as {
          current?: { temperature_2m?: number; weather_code?: number };
        };
        const temp = data.current?.temperature_2m;
        const code = data.current?.weather_code;
        const label =
          code === 0
            ? 'Clear'
            : code === 1 || code === 2
              ? 'Partly Cloudy'
              : code === 3
                ? 'Cloudy'
                : '';

        setWeatherSummary(
          typeof temp === 'number'
            ? `${Math.round(temp)}°C${label ? ` · ${label}` : ''}`
            : '',
        );
      } catch {
        setWeatherSummary('');
      }
    };

    void fetchWeather();
    const intervalId = setInterval(() => {
      void fetchWeather();
    }, 10 * 60_000);

    return () => {
      controller.abort();
      clearInterval(intervalId);
    };
  }, [user?.city]);

  const dateLabel = now.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeLabel = now.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
  const appVersionLabel = getAuVersionLabel();
  const brandMetaLine = user?.city?.trim() ? `${user.city} · Diaspora marketplace` : 'Australia · Diaspora marketplace';

  if (collapsed) {
    return (
      <View style={[r.rail, { backgroundColor: bg, borderRightColor: border }]} accessibilityLabel="Site navigation (collapsed)">
        <Pressable style={r.railTop} onPress={() => navigate('/(tabs)')} accessibilityRole="link" accessibilityLabel={`${APP_NAME} home`}>
          <LogoRayBurst size={44} borderRadius={13} imagePadding={7} />
        </Pressable>

        <View style={[r.divider, { backgroundColor: border }]} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={r.railIcons}>
          {[...MAIN_NAV, ...libraryNav].map((item) => {
            const active = isActive(item);
            return (
              <Pressable
                key={item.route}
                style={[r.railItem, active && { backgroundColor: colors.primarySoft }]}
                onPress={() => navigate(item.route)}
                accessibilityRole="link"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: active }}
              >
                {active && <LinearGradient colors={[CultureTokens.indigo, CultureTokens.teal]} style={r.railActiveBar} />}
                <Ionicons name={active ? item.iconActive : item.icon} size={19} color={active ? colors.primary : mutedColor} />
                {(item.badge ?? 0) > 0 && (
                  <View style={r.railBadge}>
                    <Text style={r.railBadgeText}>{item.badge! > 9 ? '9+' : item.badge}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ flex: 1 }} />

        <View style={[r.divider, { backgroundColor: border }]} />

        {isAuthenticated && (
          <Pressable style={[r.railItem, { marginBottom: 8 }]} onPress={() => void logout()} accessibilityRole="button" accessibilityLabel="Sign out">
            <Ionicons name="log-out-outline" size={18} color={mutedColor} />
          </Pressable>
        )}

        <Pressable style={[r.railItem, r.railActionBtn]} onPress={() => setCollapsed(false)} accessibilityRole="button" accessibilityLabel="Expand sidebar">
          <Ionicons name="chevron-forward-outline" size={18} color={mutedColor} />
        </Pressable>
      </View>
    );
  }

  // Expanded Sidebar
  return (
    <View style={[s.sidebar, { backgroundColor: bg, borderRightColor: border }]} accessibilityLabel="Site navigation">
      <View style={s.brandHeader}>
        <Pressable style={s.brandBlackCard} onPress={() => navigate('/(tabs)')} accessibilityRole="link" accessibilityLabel={`${APP_NAME} home`}>
          <View style={s.brandBlackCardInner}>
            <LogoRayBurst size={68} borderRadius={18} imagePadding={11} />
            <View style={s.brandTextBlock}>
              <BrandWordmark size="sm" withTagline centered light />
            </View>
          </View>
        </Pressable>

        <View style={[s.headerMetaStrip, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(11,11,20,0.04)', borderColor: colors.borderLight }]}>
          <View style={s.headerMetaCopy}>
            <Text style={[s.headerMetaTime, { color: colors.text }]}>{timeLabel}</Text>
            <Text style={[s.headerMetaSub, { color: colors.textSecondary }]}>
              {dateLabel}
              {weatherSummary && ` · ${weatherSummary}`}
            </Text>
          </View>
          <Pressable style={s.headerCollapseChip} onPress={() => setCollapsed(true)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Collapse sidebar">
            <Ionicons name="chevron-back" size={19} color={CultureTokens.coral} />
          </Pressable>
        </View>
      </View>

      <LinearGradient colors={[CultureTokens.indigo + 'CC', CultureTokens.teal + '99', 'transparent']} style={s.gradientLine} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10, paddingTop: 6 }}>
        <NavSection label="Discover" mutedColor={mutedColor}>
          {MAIN_NAV.map((item) => (
            <SidebarItem key={item.route} item={item} active={isActive(item)} isDark={isDark} onPress={() => navigate(item.route)} colors={colors} />
          ))}
        </NavSection>

        <NavSection label="Library" mutedColor={mutedColor}>
          {libraryNav.map((item) => (
            <SidebarItem key={item.route} item={item} active={isActive(item)} isDark={isDark} onPress={() => navigate(item.route)} colors={colors} />
          ))}
        </NavSection>

        <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Poppins_500Medium', marginBottom: 2 }}>
            {brandMetaLine}
          </Text>
          <Text style={{ color: colors.textTertiary, fontSize: 12, fontFamily: 'Poppins_400Regular' }}>
            {`${appVersionLabel} · CulturePass AU`}
          </Text>
        </View>

        {isOrganizer && (
          <NavSection label="Organiser Tools" mutedColor={mutedColor}>
            {ORGANIZER_NAV.map((item) => (
              <SidebarItem key={item.route} item={item} active={isActive(item)} isDark={isDark} onPress={() => navigate(item.route)} colors={colors} />
            ))}
          </NavSection>
        )}

        {isVenue && (
          <NavSection label="Venue" mutedColor={mutedColor}>
            {VENUE_NAV.map((item) => (
              <SidebarItem key={item.route} item={item} active={isActive(item)} isDark={isDark} onPress={() => navigate(item.route)} colors={colors} />
            ))}
          </NavSection>
        )}

        {isSponsor && (
          <NavSection label="Sponsor" mutedColor={mutedColor}>
            {SPONSOR_NAV.map((item) => (
              <SidebarItem key={item.route} item={item} active={isActive(item)} isDark={isDark} onPress={() => navigate(item.route)} colors={colors} />
            ))}
          </NavSection>
        )}

        {isAdmin && (
          <NavSection label="Admin" mutedColor={mutedColor}>
            {ADMIN_NAV.map((item) => (
              <SidebarItem key={item.route} item={item} active={isActive(item)} isDark={isDark} onPress={() => navigate(item.route)} colors={colors} />
            ))}
          </NavSection>
        )}

        {isSuperAdmin && (
          <NavSection label="SuperAdmin" mutedColor={mutedColor}>
            {SUPERADMIN_NAV.map((item) => (
              <SidebarItem key={item.route} item={item} active={isActive(item)} isDark={isDark} onPress={() => navigate(item.route)} colors={colors} />
            ))}
          </NavSection>
        )}
      </ScrollView>

      {myCouncil && (
        <Pressable
          style={[s.councilCard, { backgroundColor: isDark ? 'rgba(44,42,114,0.14)' : 'rgba(44,42,114,0.06)', borderColor: colors.primary + '30' }]}
          onPress={() => navigate('/(tabs)/directory')}
          accessibilityRole="link"
          accessibilityLabel={`My Council, ${myCouncil.name}`}
        >
          <View style={[s.councilIconWrap, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '40' }]}>
            <Ionicons name="shield-checkmark" size={15} color={colors.primary} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[s.councilEyebrow, { color: colors.primary }]}>My Council</Text>
            <Text style={[s.councilName, { color: colors.text }]} numberOfLines={1}>{myCouncil.name}</Text>
            <Text style={[s.councilSub, { color: colors.textSecondary }]} numberOfLines={1}>
              {myCouncil.suburb ?? 'Local'}
              {myCouncil.state ? `, ${myCouncil.state}` : ''}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={13} color={colors.primary + 'AA'} />
        </Pressable>
      )}

      <View style={[s.thinDivider, { backgroundColor: border }]} />

      <View style={s.bottomNavSection}>
        {isAuthenticated && user ? (
          <SidebarProfileBlock user={user} colors={colors} isDark={isDark} border={border} mutedColor={mutedColor} onNavigate={navigate} onLogout={() => void logout()} />
        ) : (
          <View style={{ paddingHorizontal: 12, paddingTop: 6, paddingBottom: 10 }}>
            <Button
              variant="gradient"
              size="md"
              leftIcon="person-add"
              onPress={() => navigate('/(onboarding)/signup')}
              fullWidth
              style={{ height: 40, borderRadius: 12 }}
              textStyle={{ fontWeight: '700', letterSpacing: 0.1, color: '#0B0B14' }}
            >
              Join CulturePass
            </Button>
          </View>
        )}
      </View>
    </View>
  );
}

// SidebarProfileBlock (kept from your original, lightly cleaned)
function SidebarProfileBlock({
  user,
  colors,
  isDark,
  border,
  mutedColor,
  onNavigate,
  onLogout,
}: {
  user: any;
  colors: ReturnType<typeof useColors>;
  isDark: boolean;
  border: string;
  mutedColor: string;
  onNavigate: (route: string) => void;
  onLogout: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const displayName = user.displayName ?? user.username ?? user.id?.slice(0, 8) ?? 'You';
  const initials = displayName.split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('');
  const roleBadge = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : null;

  return (
    <View style={{ paddingHorizontal: 12, paddingBottom: 10 }}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={({ pressed, hovered }: any) => [
          s.profileBlock,
          {
            borderColor: expanded ? colors.primary + '60' : border,
            backgroundColor: expanded
              ? isDark ? 'rgba(44,42,114,0.12)' : 'rgba(44,42,114,0.06)'
              : pressed || hovered
              ? isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
              : 'transparent',
          },
        ]}
      >
        <AvatarWithRing avatarUrl={user.photoURL} initials={initials || '?'} size={32} ringWidth={1.5} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.profileBlockName} numberOfLines={1}>{displayName}</Text>
          {(user.email || roleBadge) && (
            <Text style={s.profileBlockSub} numberOfLines={1}>
              {roleBadge ?? user.email}
            </Text>
          )}
        </View>
        <Ionicons name={expanded ? 'chevron-down' : 'chevron-up'} size={14} color={mutedColor} />
      </Pressable>

      {expanded && (
        <View style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
          borderRadius: 12,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: border,
          marginTop: 6,
          overflow: 'hidden',
        }}>
          {PROFILE_ACTIONS.map((action, index) => (
            <Pressable
              key={action.key}
              style={({ pressed, hovered }: any) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingHorizontal: 12,
                paddingVertical: 11,
                borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
                borderTopColor: border,
                backgroundColor: pressed || hovered ? (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)') : 'transparent',
              })}
              onPress={() => {
                setExpanded(false);
                onNavigate(action.route);
              }}
            >
              <Ionicons name={action.icon} size={16} color={colors.textSecondary} />
              <Text style={{ fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.text, flex: 1 }} numberOfLines={1}>
                {action.label}
              </Text>
            </Pressable>
          ))}

          <Pressable
            style={({ pressed, hovered }: any) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingHorizontal: 12,
              paddingVertical: 11,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: border,
              backgroundColor: pressed || hovered ? (isDark ? 'rgba(255,80,80,0.10)' : 'rgba(255,80,80,0.07)') : 'transparent',
            })}
            onPress={() => {
              setExpanded(false);
              onLogout();
            }}
          >
            <Ionicons name="log-out-outline" size={16} color={CultureTokens.coral} />
            <Text style={{ fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: CultureTokens.coral, flex: 1 }}>
              Sign Out
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// Styles
const s = StyleSheet.create({
  sidebar: { width: 240, alignSelf: 'stretch', borderRightWidth: StyleSheet.hairlineWidth, flexShrink: 0 },

  brandHeader: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 14, overflow: 'hidden', gap: 12 },
  brandBlackCard: {
    alignSelf: 'stretch',
    backgroundColor: '#08080f',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
    paddingVertical: 16,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  brandBlackCardInner: { flexDirection: 'column', alignItems: 'center', paddingTop: 2, paddingBottom: 4 },
  brandTextBlock: { alignSelf: 'stretch', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.12)' },
  brandTitleOnDark: { fontSize: 19, fontFamily: 'Poppins_800ExtraBold', color: '#FFFFFF', letterSpacing: -0.3, lineHeight: 26, textAlign: 'center' },
  brandTitleAccent: { marginTop: 11, width: 40, height: 3, borderRadius: 2, backgroundColor: CultureTokens.coral },
  brandTaglineBlock: { marginTop: 14, fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: '#FFFFFF', lineHeight: 17, letterSpacing: 0.08, textAlign: 'center', paddingHorizontal: 6 },

  headerMetaStrip: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  headerMetaCopy: { flex: 1, minWidth: 0, gap: 2 },
  headerMetaTime: { fontSize: 13, fontFamily: 'Poppins_700Bold', letterSpacing: 0.2 },
  headerMetaSub: { fontSize: 11, fontFamily: 'Poppins_500Medium', lineHeight: 15, opacity: 0.92 },
  headerCollapseChip: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, flexShrink: 0 },

  gradientLine: { height: 2, marginTop: 6, marginBottom: 8, marginHorizontal: 14, borderRadius: 2, opacity: 0.85 },

  sectionHeader: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 6 },
  sectionLabel: { fontSize: 10, fontFamily: 'Poppins_700Bold', letterSpacing: 1.15 },

  item: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, minHeight: 46, paddingVertical: 4, paddingHorizontal: 14, position: 'relative', overflow: 'hidden' },
  itemActive: { borderRadius: 12 },
  activeBar: { position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 2, overflow: 'hidden' },
  label: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', flex: 1 },
  labelActive: { fontFamily: 'Poppins_700Bold' },
  badge: { backgroundColor: Colors.error, borderRadius: 9, minWidth: 17, height: 17, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  badgeText: { ...TextStyles.captionSemibold, color: '#fff', fontSize: 9 },

  councilCard: { marginHorizontal: 12, marginBottom: 8, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  councilIconWrap: { width: 30, height: 30, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  councilEyebrow: { fontSize: 9.5, fontFamily: 'Poppins_700Bold', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 1 },
  councilName: { fontSize: 11.5, fontFamily: 'Poppins_600SemiBold', lineHeight: 16 },
  councilSub: { fontSize: 10, fontFamily: 'Poppins_400Regular' },

  thinDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14, marginVertical: 6 },
  bottomNavSection: { paddingTop: 6, paddingBottom: 10 },

  profileBlock: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginHorizontal: 8 },
  profileBlockName: { ...TextStyles.labelSemibold },
  profileBlockSub: { ...TextStyles.caption },
});

const r = StyleSheet.create({
  rail: { width: 54, height: '100%', borderRightWidth: StyleSheet.hairlineWidth, flexShrink: 0, alignItems: 'center', paddingTop: 14, paddingBottom: 4 },
  railTop: { marginBottom: 10 },
  divider: { height: StyleSheet.hairlineWidth, width: 32, marginBottom: 6 },
  railIcons: { alignItems: 'center', gap: 2, paddingTop: 2 },
  railItem: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  railActiveBar: { position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 2 },
  railBadge: { position: 'absolute', top: 6, right: 6, minWidth: 14, height: 14, borderRadius: 7, backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  railBadgeText: { fontSize: 8, fontFamily: 'Poppins_700Bold', color: '#fff', lineHeight: 10 },
  railActionBtn: { backgroundColor: 'transparent' },
});

export default WebSidebar;
