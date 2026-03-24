import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, useColorScheme, Modal } from 'react-native';
import { usePathname, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/lib/auth';
import { useRole } from '@/hooks/useRole';
import { useCouncil } from '@/hooks/useCouncil';
import { Colors, CultureTokens, gradients } from '@/constants/theme';
import { TextStyles } from '@/constants/typography';
import { useColors } from '@/hooks/useColors';
import { routeWithRedirect } from '@/lib/routes';
import { getPostcodesByPlace } from '@shared/location/australian-postcodes';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { QUICK_MENU_ITEMS } from '@/components/ProfileQuickMenu';

// ─── Nav definitions ─────────────────────────────────────────────────────────
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
  { label: 'Feed', icon: 'newspaper-outline', iconActive: 'newspaper', route: '/(tabs)/feed' },
  { label: 'Calendar', icon: 'calendar-outline', iconActive: 'calendar', route: '/(tabs)/calendar' },
  { label: 'Community', icon: 'people-circle-outline', iconActive: 'people-circle', route: '/(tabs)/community' },
  { label: 'Perks', icon: 'gift-outline', iconActive: 'gift', route: '/(tabs)/perks' },
  { label: 'Tickets', icon: 'ticket-outline', iconActive: 'ticket', route: '/tickets/index' },
];

const EXPLORE_NAV: NavItem[] = [
  { label: 'Events List', icon: 'calendar-number-outline', iconActive: 'calendar-number', route: '/events', matchPrefix: true },
  { label: 'Map Discovery', icon: 'map-outline', iconActive: 'map', route: '/map' },
  { label: 'Venues Directory', icon: 'storefront-outline', iconActive: 'storefront', route: '/(tabs)/directory', matchPrefix: true },
  { label: 'Saved Items', icon: 'bookmark-outline', iconActive: 'bookmark', route: '/saved' },
];

const CITIES_NAV: NavItem[] = [
  { label: 'Sydney', icon: 'navigate-outline', iconActive: 'navigate', route: '/city/Sydney?country=Australia' },
  { label: 'Melbourne', icon: 'navigate-outline', iconActive: 'navigate', route: '/city/Melbourne?country=Australia' },
  { label: 'London', icon: 'planet-outline', iconActive: 'planet', route: '/city/London?country=UK' },
];

const ORGANIZER_NAV: NavItem[] = [
  { label: 'Dashboard', icon: 'grid-outline', iconActive: 'grid', route: '/dashboard/organizer', matchPrefix: true },
  { label: 'Council Ops', icon: 'shield-checkmark-outline', iconActive: 'shield-checkmark', route: '/dashboard/council', matchPrefix: true },
  { label: 'Widgets', icon: 'apps-outline', iconActive: 'apps', route: '/dashboard/widgets', matchPrefix: true },
  { label: 'Create Event', icon: 'add-circle-outline', iconActive: 'add-circle', route: '/event/create' },
  { label: 'Scanner', icon: 'qr-code-outline', iconActive: 'qr-code', route: '/scanner' },
];

const ADMIN_NAV: NavItem[] = [
  { label: 'Admin Hub', icon: 'shield-half-outline', iconActive: 'shield-half', route: '/admin/dashboard', matchPrefix: false },
  { label: 'Council Mgmt', icon: 'business-outline', iconActive: 'business', route: '/admin/council-management', matchPrefix: true },
  { label: 'Users', icon: 'people-outline', iconActive: 'people', route: '/admin/users', matchPrefix: true },
  { label: 'Audit Logs', icon: 'list-outline', iconActive: 'list', route: '/admin/audit-logs', matchPrefix: true },
  { label: 'Notify', icon: 'megaphone-outline', iconActive: 'megaphone', route: '/admin/notifications', matchPrefix: true },
];

const VENUE_NAV: NavItem[] = [{ label: 'Venue Hub', icon: 'storefront-outline', iconActive: 'storefront', route: '/dashboard/venue', matchPrefix: true }];
const SPONSOR_NAV: NavItem[] = [{ label: 'Sponsor Hub', icon: 'ribbon-outline', iconActive: 'ribbon', route: '/dashboard/sponsor', matchPrefix: true }];

const BOTTOM_NAV: NavItem[] = [
  { label: 'Settings', icon: 'settings-outline', iconActive: 'settings', route: '/settings' },
  { label: 'Help & FAQ', icon: 'help-circle-outline', iconActive: 'help-circle', route: '/help' },
];

// ─── Avatar helper ────────────────────────────────────────────────────────────
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
          <Image source={{ uri: avatarUrl }} style={{ width: innerSize, height: innerSize }} />
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

// ─── Main component ───────────────────────────────────────────────────────────
export function WebSidebar() {
  const pathname = usePathname();
  const colors = useColors();
  const { s, r } = getSidebarStyles(colors);
  const isDark = useColorScheme() === 'dark';
  const { user, logout, isAuthenticated, userId } = useAuth();
  const { isOrganizer, isAdmin, role } = useRole();
  const isVenue = role === 'business' || role === 'organizer' || isAdmin;
  const isSponsor = role === 'sponsor' || role === 'business' || isAdmin;
  const { data: councilData } = useCouncil();
  const [collapsed, setCollapsed] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());
  const [weatherSummary, setWeatherSummary] = useState<string>('');
  const { data: notifCount = 0 } = useQuery<number>({
    queryKey: ['notifications', 'unread-count', userId],
    queryFn: async () => {
      const res = await api.notifications.unreadCount();
      return res.count ?? 0;
    },
    enabled: !!userId,
    refetchInterval: 60_000,
  });

  const navWithBadge: NavItem[] = MAIN_NAV.map((item) =>
    item.label === 'Profile' && notifCount > 0 ? { ...item, badge: notifCount } : item,
  );

  const isActive = (item: NavItem) => {
    if (item.matchPrefix) return pathname.startsWith(item.route.replace('/(tabs)', ''));
    if (item.route === '/(tabs)') return pathname === '/' || pathname === '/index' || pathname === '';
    const bare = item.route.replace('/(tabs)/', '/').replace('/(tabs)', '/');
    return pathname === bare || pathname.startsWith(bare + '/');
  };

  const navigate = (route: string) => router.navigate(route as Parameters<typeof router.navigate>[0]);



  const bg = colors.surface;
  const border = colors.borderLight;
  const mutedColor = isDark ? 'rgba(232,244,255,0.35)' : 'rgba(0,22,40,0.32)';
  const myCouncil = councilData?.council;
  const locationLabel = user?.city ?? user?.country ?? 'Australia';

  // Clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Weather
  useEffect(() => {
    const city = user?.city?.trim();
    if (!city) { setWeatherSummary(''); return; }
    const place = getPostcodesByPlace(city)[0];
    if (!place) { setWeatherSummary(''); return; }

    const controller = new AbortController();
    const fetchWeather = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error('weather');
        const data = await res.json() as { current?: { temperature_2m?: number; weather_code?: number } };
        const temp = data.current?.temperature_2m;
        const code = data.current?.weather_code;
        const label =
          code === 0 ? 'Clear'
            : code === 1 || code === 2 ? 'Partly Cloudy'
              : code === 3 ? 'Cloudy'
                : code === 45 || code === 48 ? 'Fog'
                  : code === 51 || code === 53 || code === 55 ? 'Drizzle'
                    : code === 61 || code === 63 || code === 65 ? 'Rain'
                      : code === 71 || code === 73 || code === 75 ? 'Snow'
                        : code === 95 || code === 96 || code === 99 ? 'Storm'
                          : '';
        setWeatherSummary(typeof temp === 'number' ? `${Math.round(temp)}°C${label ? ` · ${label}` : ''}` : '');
      } catch { setWeatherSummary(''); }
    };

    fetchWeather();
    const rid = setInterval(fetchWeather, 10 * 60_000);
    return () => { controller.abort(); clearInterval(rid); };
  }, [user?.city]);

  const dateLabel = useMemo(() =>
    now.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }), [now]);
  const timeLabel = useMemo(() =>
    now.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }), [now]);

  // ─── Collapsed rail ────────────────────────────────────────────────────────
  if (collapsed) {
    return (
      <View style={[r.rail, { backgroundColor: bg, borderRightColor: border }]}>
        {/* Logo at top */}
        <Pressable
          style={r.railTop}
          onPress={() => navigate('/(tabs)')}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel="CulturePass home"
        >
          <View style={r.railLogo}>
            <Image source={require('../../assets/images/culturepass-logo.png')} style={r.railLogoImage} contentFit="cover" />
          </View>
        </Pressable>
        <View style={[r.divider, { backgroundColor: border }]} />

        {/* Main nav icons */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={r.railIcons}>
          {navWithBadge.map((item) => {
            const active = isActive(item);
            return (
              <Pressable
                key={item.route}
                style={[r.railItem, active && { backgroundColor: colors.primarySoft }]}
                onPress={() => navigate(item.route)}
                accessibilityLabel={item.label}
              >
                {active && (
                  <LinearGradient
                    colors={gradients.culturepassBrand}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={r.railActiveBar}
                  />
                )}
                <Ionicons
                  name={active ? item.iconActive : item.icon}
                  size={19}
                  color={active ? colors.primary : mutedColor}
                />
                {(item.badge ?? 0) > 0 && (
                  <View style={r.badgeDot}>
                    <Text style={r.badgeDotTxt}>{item.badge}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ flex: 1 }} />

        {/* Profile + bottom nav */}
        <View style={[r.divider, { backgroundColor: border }]} />
        {BOTTOM_NAV.map((item) => {
          const active = isActive(item);
          const navRoute = item.label === 'Profile' && !isAuthenticated
            ? routeWithRedirect('/(onboarding)/login', pathname) as string
            : item.route;

          return (
            <Pressable
              key={item.label}
              style={[r.railItem, active && { backgroundColor: colors.primarySoft }]}
              onPress={() => navigate(navRoute)}
              accessibilityLabel={item.label}
            >
              {active && (
                <LinearGradient
                  colors={gradients.culturepassBrand}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={r.railActiveBar}
                />
              )}
              <Ionicons
                name={(active ? item.iconActive : item.icon) as keyof typeof Ionicons.glyphMap}
                size={19}
                color={active ? colors.primary : mutedColor}
              />
            </Pressable>
          );
        })}

        {/* Expand */}
        <Pressable style={[r.railItem, r.railActionBtn]} onPress={() => setCollapsed(false)} accessibilityLabel="Expand sidebar">
          <Ionicons name="chevron-forward-outline" size={18} color="#000000" />
        </Pressable>

        {/* Logout */}
        {isAuthenticated && (
          <Pressable
            style={[r.railItem, { marginBottom: 8 }]}
            onPress={() => logout()}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Ionicons name="log-out-outline" size={18} color={mutedColor} />
          </Pressable>
        )}
      </View>
    );
  }

  // ─── Expanded sidebar ─────────────────────────────────────────────────────
  return (
    <View style={[s.sidebar, { backgroundColor: bg, borderRightColor: border }]}>
      {/* ── Logo + collapse at top ── */}
      <View style={s.profileHeader}>
        <LinearGradient
          colors={isDark ? ['rgba(44,42,114,0.22)', 'transparent'] : ['rgba(44,42,114,0.07)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', minWidth: 0, flex: 1, position: 'relative' }}>
          <Pressable
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}
            onPress={() => navigate('/(tabs)')}
            accessibilityLabel="CulturePass home"
            accessibilityRole="button"
          >
            <View style={s.logoIcon}>
              <Image source={require('../../assets/images/culturepass-logo.png')} style={s.logoImage} contentFit="cover" />
            </View>
            <View style={{ minWidth: 0, flexShrink: 1, flexDirection: 'column' }}>
              <LinearGradient
                colors={[CultureTokens.indigo, CultureTokens.saffron, CultureTokens.coral]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 6, paddingHorizontal: 4, alignSelf: 'flex-start' }}
              >
                <Text style={[TextStyles.title2, { lineHeight: 30, letterSpacing: -0.7, backgroundColor: 'transparent', color: '#FFFFFF', textShadow: '0px 1px 2px rgba(44,42,114,0.12)', flexShrink: 1 } as any]} numberOfLines={1}>
                  CulturePass
                </Text>
              </LinearGradient>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 1 }}>
                <Text style={[TextStyles.labelSemibold, { color: colors.textSecondary, letterSpacing: 0.1, flexShrink: 1, fontSize: 12 }]} numberOfLines={1}>
                  Belong Anywhere
                </Text>
              </View>
            </View>
          </Pressable>
          <Pressable 
            onPress={() => setCollapsed(true)} 
            hitSlop={15} 
            accessibilityRole="button" 
            accessibilityLabel="Collapse" 
            style={({ pressed }) => [s.headerBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="chevron-back" size={20} color={colors.textTertiary} style={{ marginRight: -2 }} />
          </Pressable>
        </View>
      </View>

      {/* ── Action Buttons (Post Event only if auth) ── */}
      {isAuthenticated && (
        <View style={s.actionButtons}>
          <View style={s.actionBtnRow}>
            {/* Primary – Post Event */}
            <Pressable
              style={({ pressed }) => [
                s.actionBtn,
                s.actionBtnPrimary,
                { backgroundColor: CultureTokens.saffron },
                pressed && s.actionBtnPressed,
              ]}
              onPress={() => navigate('/event/create')}
              accessibilityRole="button"
              accessibilityLabel="Create a new event"
              accessibilityHint="Opens the event creation screen"
            >
              <Ionicons name="add-circle" size={20} color="#0B0B14" />
              <Text style={[s.actionBtnPrimaryText, { color: '#0B0B14' }]} numberOfLines={1}>
                Post Event
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Brand gradient divider */}
      <View style={s.gradientDivider}>
        <LinearGradient
          colors={[CultureTokens.indigo, CultureTokens.saffron, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: 1, flex: 1 }}
        />
      </View>

      {/* ── Scrollable nav ── */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 6, paddingTop: 4 }}>
        <View style={s.navGroup}>
          {navWithBadge.map((item) => (
            <SidebarItem key={item.route} item={item} active={isActive(item)} isDark={isDark} onPress={() => navigate(item.route)} colors={colors} />
          ))}
        </View>

        <NavSection label="Explore" mutedColor={mutedColor} colors={colors}>
          {EXPLORE_NAV.map((item) => (
            <SidebarItem key={item.route} item={item} active={isActive(item)} isDark={isDark} onPress={() => navigate(item.route)} colors={colors} />
          ))}
        </NavSection>

        <NavSection label="Top Cities" mutedColor={mutedColor} colors={colors}>
          {CITIES_NAV.map((item) => (
            <SidebarItem key={item.route} item={item} active={isActive(item)} isDark={isDark} onPress={() => navigate(item.route)} colors={colors} />
          ))}
        </NavSection>

        {isOrganizer && (
          <NavSection label="Organizer" mutedColor={mutedColor} colors={colors}>
            {ORGANIZER_NAV.map((item) => (
              <SidebarItem key={item.route} item={item} active={isActive(item)} isDark={isDark} onPress={() => navigate(item.route)} colors={colors} />
            ))}
          </NavSection>
        )}

        {isVenue && (
          <NavSection label="Venue" mutedColor={mutedColor} colors={colors}>
            {VENUE_NAV.map((item) => (
              <SidebarItem key={item.route} item={item} active={isActive(item)} isDark={isDark} onPress={() => navigate(item.route)} colors={colors} />
            ))}
          </NavSection>
        )}

        {isSponsor && (
          <NavSection label="Sponsor" mutedColor={mutedColor} colors={colors}>
            {SPONSOR_NAV.map((item) => (
              <SidebarItem key={item.route} item={item} active={isActive(item)} isDark={isDark} onPress={() => navigate(item.route)} colors={colors} />
            ))}
          </NavSection>
        )}

        {isAdmin && (
          <NavSection label="Admin" mutedColor={mutedColor} colors={colors}>
            {ADMIN_NAV.map((item) => (
              <SidebarItem key={item.route} item={item} active={isActive(item)} isDark={isDark} onPress={() => navigate(item.route)} colors={colors} />
            ))}
          </NavSection>
        )}
      </ScrollView>

      {/* ── Context strip: date / weather ── */}
      <View style={[s.contextCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: border }]}>
        <View style={s.contextRow}>
          <Ionicons name="time-outline" size={11} color={mutedColor} />
          <Text style={[s.contextText, { color: colors.textSecondary }]} numberOfLines={1}>
            {dateLabel} · {timeLabel}
          </Text>
        </View>
        <View style={s.contextRow}>
          <Ionicons name="location-outline" size={11} color={mutedColor} />
          <Text style={[s.contextText, { color: colors.textSecondary }]} numberOfLines={1}>
            {locationLabel}{weatherSummary ? ` · ${weatherSummary}` : ''}
          </Text>
        </View>
      </View>

      {/* ── Council card ── */}
      <Pressable
        style={[s.councilCard, { backgroundColor: isDark ? 'rgba(44,42,114,0.14)' : 'rgba(44,42,114,0.06)', borderColor: colors.primary + '30' }]}
        onPress={() => navigate(isAuthenticated ? '/(tabs)/council' : '/council/select')}
        accessibilityRole="button"
        accessibilityLabel={isAuthenticated ? 'Open council' : 'Choose council'}
      >
        <View style={[s.councilIconWrap, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '40' }]}>
          <Ionicons name="shield-checkmark" size={13} color={colors.primary} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[s.councilName, { color: colors.text }]} numberOfLines={1}>
            {myCouncil?.name ?? 'Choose a council'}
          </Text>
          <Text style={[s.councilSub, { color: colors.textSecondary }]} numberOfLines={1}>
            {myCouncil
              ? `${myCouncil.suburb ?? 'Local'}${myCouncil.state ? `, ${myCouncil.state}` : ''}`
              : 'Connect to your community'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={13} color={colors.primary + 'AA'} />
      </Pressable>

      {/* ── Profile block + Quick menu at bottom ── */}
      <View style={[s.thinDivider, { backgroundColor: border }]} />
      <View style={s.bottomNavSection}>
        {isAuthenticated && user ? (
          <SidebarProfileBlock
            user={user}
            colors={colors}
            isDark={isDark}
            border={border}
            mutedColor={mutedColor}
            onNavigate={navigate}
            onLogout={logout}
          />
        ) : (
          <>
            <View style={s.sectionHeader}>
              <View style={[s.sectionDot, { backgroundColor: mutedColor }]} />
              <Text style={[s.sectionLabel, { color: mutedColor }]}>Account</Text>
            </View>
            <View style={s.navGroup}>
              {BOTTOM_NAV.map((item) => {
                const isProfile = item.label === 'Profile';
                const label = isProfile ? 'Sign In' : item.label;
                const icon = isProfile ? 'log-in-outline' : item.icon;
                const iconActive = isProfile ? 'log-in' : item.iconActive;
                const navRoute = isProfile ? '/(onboarding)/login' : item.route;
                
                return (
                  <SidebarItem
                    key={item.route}
                    item={{ ...item, label, icon, iconActive, route: navRoute }}
                    active={pathname === navRoute}
                    isDark={isDark}
                    onPress={() => navigate(navRoute)}
                    colors={colors}
                  />
                );
              })}
            </View>
            <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}>
              <Button
                variant="gradient"
                size="md"
                leftIcon="person-add"
                onPress={() => navigate('/(onboarding)/signup')}
                fullWidth
                style={{ height: 44, borderRadius: 14, boxShadow: '0px 2px 8px rgba(255,140,66,0.18)' } as any}
                textStyle={[TextStyles.callout, { fontWeight: '700', letterSpacing: 0.1, color: '#0B0B14' }]}
                hoverStyle={{ opacity: 0.92 }}
              >
                Join CulturePass
              </Button>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
type AuthUser = NonNullable<ReturnType<typeof useAuth>['user']>;

function SidebarProfileBlock({
  user,
  colors,
  isDark,
  border,
  mutedColor,
  onNavigate,
  onLogout,
}: {
  user: AuthUser;
  colors: ReturnType<typeof useColors>;
  isDark: boolean;
  border: string;
  mutedColor: string;
  onNavigate: (route: string) => void;
  onLogout: (redirect?: string) => Promise<void>;
}) {
  const { s } = getSidebarStyles(colors);
  const [menuVisible, setMenuVisible] = useState(false);
  const displayName = user.displayName ?? user.username ?? user.id?.slice(0, 8) ?? 'You';
  const initials = displayName.trim().split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  const handleSelect = (route: string) => {
    setMenuVisible(false);
    if (route === 'signout') {
      onLogout('/(tabs)');
      return;
    }
    onNavigate(route);
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          s.profileBlock,
          {
            backgroundColor: pressed ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
            borderColor: border,
          },
        ]}
        onPress={() => setMenuVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Open profile menu"
      >
        <AvatarWithRing avatarUrl={user.avatarUrl} initials={initials} size={40} isGuest={false} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[s.profileBlockName, { color: colors.text }]} numberOfLines={1}>{displayName}</Text>
          <Text style={[s.profileBlockSub, { color: colors.textSecondary }]}>Quick menu</Text>
        </View>
        <Ionicons name="chevron-down" size={14} color={mutedColor} />
      </Pressable>

      <Modal transparent visible={menuVisible} onRequestClose={() => setMenuVisible(false)} animationType="fade">
        <View style={s.profileModalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuVisible(false)} />
          <View style={[s.profileModalCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <View style={[s.profileModalHeader, { borderBottomColor: colors.borderLight }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <AvatarWithRing avatarUrl={user.avatarUrl} initials={initials} size={36} isGuest={false} />
                <Text style={[s.profileModalName, { color: colors.text }]} numberOfLines={1}>{displayName}</Text>
              </View>
              <Pressable onPress={() => setMenuVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={s.profileModalScroll} showsVerticalScrollIndicator={false}>
              {QUICK_MENU_ITEMS.map((item) => (
                <Pressable
                  key={item.key}
                  style={({ pressed }) => [s.profileModalItem, { backgroundColor: pressed ? colors.surfaceElevated : 'transparent' }]}
                  onPress={() => handleSelect(item.route)}
                  accessibilityLabel={item.label}
                  accessibilityRole="button"
                >
                  <Ionicons name={item.icon as never} size={18} color={colors.textSecondary} />
                  <Text style={[s.profileModalLabel, { color: colors.text }]}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
                </Pressable>
              ))}
            </ScrollView>

            <View style={[s.profileModalFooter, { borderTopColor: colors.borderLight }]}>
              <Pressable
                style={({ pressed }) => [s.profileModalSignOut, pressed && { opacity: 0.8 }]}
                onPress={() => handleSelect('signout')}
              >
                <Ionicons name="log-out-outline" size={18} color={CultureTokens.error} />
                <Text style={[s.profileModalSignOutText, { color: CultureTokens.error }]}>Sign Out</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function NavSection({ label, mutedColor, children, colors }: { label: string; mutedColor: string; children: React.ReactNode; colors: ReturnType<typeof useColors> }) {
  const { s } = getSidebarStyles(colors);
  return (
    <>
      <View style={s.sectionHeader}>
        <View style={[s.sectionDot, { backgroundColor: mutedColor }]} />
        <Text style={[s.sectionLabel, { color: mutedColor }]}>{label}</Text>
      </View>
      <View style={s.navGroup}>{children}</View>
    </>
  );
}

type ColorsType = ReturnType<typeof useColors>;

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
  colors: ColorsType;
}) {
  const { ni } = getSidebarStyles(colors);
  const [hovered, setHovered] = useState(false);
  const showHover = hovered && !active;

  return (
    <Pressable
      style={[
        ni.item,
        active && [ni.itemActive, { backgroundColor: colors.primarySoft }],
        showHover && { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,12,24,0.04)' },
      ]}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="menuitem"
      accessibilityState={{ selected: active }}
    >
      {/* Left gradient accent bar */}
      {active && (
        <LinearGradient
          colors={gradients.culturepassBrand}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={ni.activeBar}
        />
      )}
      <Ionicons
        name={active ? item.iconActive : item.icon}
        size={20}
        color={active ? colors.primary : (isDark ? 'rgba(232,244,255,0.60)' : 'rgba(0,22,40,0.52)')}
      />
      <Text
        style={[
          ni.label,
          { color: active ? colors.primary : colors.text },
          active && ni.labelActive,
          active && { fontFamily: 'Poppins_700Bold' },
        ]}
        numberOfLines={1}
      >
        {item.label}
      </Text>
      {(item.badge ?? 0) > 0 && (
        <View style={ni.badge}>
          <Text style={ni.badgeText}>{item.badge! > 99 ? '99+' : item.badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const getSidebarStyles = (colors: ReturnType<typeof useColors>) => {
  const s = StyleSheet.create({
    sidebar: {
      width: 240,
      alignSelf: 'stretch',
      borderRightWidth: StyleSheet.hairlineWidth,
      flexShrink: 0,
      paddingTop: 0,
      paddingBottom: 0,
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
      overflow: 'hidden',
    },
    logoIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      backgroundColor: 'rgba(0,0,0,0.06)',
    },
    logoImage: {
      width: '100%',
      height: '100%',
    },
    headerBtn: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    actionButtons: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 16,
    },
    actionBtnRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 46,
      borderRadius: 12,
      paddingHorizontal: 12,
    },
    actionBtnPrimary: {
      backgroundColor: CultureTokens.saffron,
      borderWidth: 0,
    },
    actionBtnPrimaryText: {
      ...TextStyles.labelSemibold,
      color: '#0B0B14',
      letterSpacing: -0.1,
    },
    actionBtnPressed: {
      opacity: 0.88,
    },
    gradientDivider: {
      paddingHorizontal: 0,
      marginBottom: 4,
    },
    thinDivider: {
      height: StyleSheet.hairlineWidth,
      marginHorizontal: 12,
      marginVertical: 4,
    },
    bottomNavSection: {
      paddingTop: 8,
      paddingBottom: 12,
    },
    profileBlock: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      marginHorizontal: 8,
    },
    profileBlockName: {
      ...TextStyles.labelSemibold,
      color: colors.text,
    },
    profileBlockSub: {
      ...TextStyles.caption,
      color: colors.textSecondary,
    },
    profileModalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    profileModalCard: {
      width: '90%',
      maxWidth: 320,
      borderRadius: 16,
      borderWidth: 1,
      overflow: 'hidden',
    },
    profileModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    profileModalName: {
      fontSize: 15,
      fontFamily: 'Poppins_600SemiBold',
      flex: 1,
    },
    profileModalScroll: {
      maxHeight: 280,
      paddingVertical: 8,
    },
    profileModalItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    profileModalLabel: {
      flex: 1,
      fontSize: 14,
      fontFamily: 'Poppins_500Medium',
    },
    profileModalFooter: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    profileModalSignOut: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 8,
    },
    profileModalSignOutText: {
      fontSize: 14,
      fontFamily: 'Poppins_600SemiBold',
    },
    navGroup: {
      paddingHorizontal: 8,
      gap: 1,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 4,
    },
    sectionDot: {
      width: 3,
      height: 3,
      borderRadius: 2,
    },
    sectionLabel: {
      fontSize: 9,
      fontFamily: 'Poppins_600SemiBold',
      letterSpacing: 1.1,
      textTransform: 'uppercase',
    },
    contextCard: {
      marginHorizontal: 10,
      marginBottom: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      gap: 4,
    },
    contextRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    contextText: {
      fontSize: 10.5,
      fontFamily: 'Poppins_400Regular',
      flex: 1,
    },
    councilCard: {
      marginHorizontal: 10,
      marginBottom: 6,
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 9,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
    },
    councilIconWrap: {
      width: 26,
      height: 26,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    councilName: {
      fontSize: 11.5,
      fontFamily: 'Poppins_600SemiBold',
      lineHeight: 16,
    },
    councilSub: {
      fontSize: 10,
      fontFamily: 'Poppins_400Regular',
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    footerName: {
      ...TextStyles.labelSemibold,
      lineHeight: 17,
    },
    footerSub: {
      ...TextStyles.caption,
    },
    rolePill: {
      alignSelf: 'flex-start',
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 1,
      marginTop: 2,
      backgroundColor: 'rgba(44,42,114,0.12)',
    },
    rolePillText: {
      fontSize: 9,
      fontFamily: 'Poppins_600SemiBold',
    },
  });

  const r = StyleSheet.create({
    rail: {
      width: 54,
      height: '100%',
      borderRightWidth: StyleSheet.hairlineWidth,
      flexShrink: 0,
      alignItems: 'center',
      paddingTop: 14,
      paddingBottom: 4,
    },
    railTop: {
      marginBottom: 10,
    },
    railLogo: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      backgroundColor: 'rgba(0,0,0,0.06)',
    },
    railLogoImage: {
      width: '100%',
      height: '100%',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      width: 32,
      marginBottom: 6,
    },
    railIcons: {
      alignItems: 'center',
      gap: 2,
      paddingTop: 2,
    },
    railItem: {
      width: 38,
      height: 38,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    railActionBtn: {
      backgroundColor: 'transparent',
    },
    railActiveBar: {
      position: 'absolute',
      left: 0,
      top: 7,
      bottom: 7,
      width: 3,
      borderRadius: 2,
    },
    badgeDot: {
      position: 'absolute',
      top: 5,
      right: 5,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: Colors.error,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeDotTxt: {
      fontSize: 5,
      fontFamily: 'Poppins_700Bold',
      color: '#fff',
    },
  });

  const ni = StyleSheet.create({
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      borderRadius: 9,
      paddingVertical: 8,
      paddingHorizontal: 10,
      position: 'relative',
    },
    itemActive: {
      borderRadius: 9,
    },
    activeBar: {
      position: 'absolute',
      left: 0,
      top: 7,
      bottom: 7,
      width: 3,
      borderRadius: 2,
    },
    label: {
      ...TextStyles.caption,
      fontWeight: '500',
      flex: 1,
    },
    labelActive: {
      fontWeight: '600',
    },
    badge: {
      backgroundColor: Colors.error,
      borderRadius: 9,
      minWidth: 17,
      height: 17,
      paddingHorizontal: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      ...TextStyles.captionSemibold,
      color: '#fff',
      fontSize: 9,
    },
  });

  return { s, r, ni };
};