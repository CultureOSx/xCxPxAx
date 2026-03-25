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
];

const LIBRARY_NAV: NavItem[] = [
  { label: 'My Tickets', icon: 'ticket-outline', iconActive: 'ticket', route: '/tickets/index' },
  { label: 'Saved', icon: 'bookmark-outline', iconActive: 'bookmark', route: '/saved' },
  { label: 'All Events', icon: 'calendar-number-outline', iconActive: 'calendar-number', route: '/events', matchPrefix: true },
  { label: 'Map', icon: 'map-outline', iconActive: 'map', route: '/map' },
  { label: 'Directory', icon: 'storefront-outline', iconActive: 'storefront', route: '/(tabs)/directory', matchPrefix: true },
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
  { label: 'Users', icon: 'people-outline', iconActive: 'people', route: '/admin/users', matchPrefix: true },
  { label: 'Moderation', icon: 'eye-outline', iconActive: 'eye', route: '/admin/moderation', matchPrefix: true },
  { label: 'Audit Logs', icon: 'list-outline', iconActive: 'list', route: '/admin/audit-logs', matchPrefix: true },
  { label: 'Notify', icon: 'megaphone-outline', iconActive: 'megaphone', route: '/admin/notifications', matchPrefix: true },
];

const BOTTOM_NAV: NavItem[] = [
  { label: 'Settings', icon: 'settings-outline', iconActive: 'settings', route: '/settings' },
  { label: 'Help', icon: 'help-circle-outline', iconActive: 'help-circle', route: '/help' },
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

// ─── Tier badge ───────────────────────────────────────────────────────────────
function TierBadge({ tier }: { tier?: string }) {
  if (!tier || tier === 'free') return null;
  const label = tier.charAt(0).toUpperCase() + tier.slice(1);
  return (
    <View style={tierBadge.pill}>
      <Text style={tierBadge.text}>{label}</Text>
    </View>
  );
}

const tierBadge = StyleSheet.create({
  pill: {
    backgroundColor: CultureTokens.teal + '28',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: CultureTokens.teal + '55',
  },
  text: {
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
    color: CultureTokens.teal,
    letterSpacing: 0.3,
  },
});

// ─── Main component ───────────────────────────────────────────────────────────
export function WebSidebar() {
  const pathname = usePathname();
  const colors = useColors();
  const { s, r } = getSidebarStyles(colors);
  const isDark = useColorScheme() === 'dark';
  const { user, logout, isAuthenticated, userId } = useAuth();
  const { isOrganizer, isAdmin, role } = useRole();
  const isVenue = role === 'business';
  const isSponsor = role === 'sponsor';
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

  const navWithBadge: NavItem[] = MAIN_NAV;

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

  // User identity
  const displayName = user?.displayName ?? user?.username ?? user?.id?.slice(0, 8) ?? 'You';
  const handle = user?.username ? `@${user.username}` : '';
  const initials = displayName.trim().split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  const memberTier = (user as any)?.subscriptionTier ?? (user as any)?.membership?.tier;

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
          {[...MAIN_NAV, ...LIBRARY_NAV].map((item) => {
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
                    colors={[CultureTokens.indigo, CultureTokens.teal]}
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
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ flex: 1 }} />

        {/* Profile + bottom nav */}
        <View style={[r.divider, { backgroundColor: border }]} />
        {BOTTOM_NAV.map((item) => {
          const active = isActive(item);
          const navRoute = item.route;

          return (
            <Pressable
              key={item.label}
              style={[r.railItem, active && { backgroundColor: colors.primarySoft }]}
              onPress={() => navigate(navRoute)}
              accessibilityLabel={item.label}
            >
              {active && (
                <LinearGradient
                  colors={[CultureTokens.indigo, CultureTokens.teal]}
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
          <Ionicons name="chevron-forward-outline" size={18} color={mutedColor} />
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

      {/* ── Brand header: logo + wordmark ── */}
      <View style={s.brandHeader}>
        <LinearGradient
          colors={isDark ? ['rgba(44,42,114,0.45)', 'rgba(44,42,114,0.15)'] : ['rgba(44,42,114,0.12)', 'rgba(44,42,114,0.02)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Modern vibrant background overlay */}
        <View style={[StyleSheet.absoluteFill, { opacity: isDark ? 0.08 : 0.04 }]}>
          <LinearGradient
            colors={[CultureTokens.indigo, CultureTokens.teal, CultureTokens.coral]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>

        <View style={s.brandRow}>
          <Pressable
            style={s.brandLogoBtn}
            onPress={() => navigate('/(tabs)')}
            accessibilityLabel="CulturePass home"
            accessibilityRole="button"
          >
            <View style={[s.logoIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
              <Image source={require('../../assets/images/culturepass-logo.png')} style={s.logoImage} contentFit="cover" />
            </View>
            <View style={s.wordmarkWrap}>
              <View style={s.wordmarkContainer}>
                <LinearGradient
                   colors={['#0066CC', '#FFCC00', '#FF5E5B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.wordmarkGradient}
                >
                  <Text style={s.wordmarkText} numberOfLines={1}>CulturePass</Text>
                </LinearGradient>
              </View>
              <Text style={[s.wordmarkSub, { color: colors.textSecondary }]} numberOfLines={1}>Belong Anywhere</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => setCollapsed(true)}
            hitSlop={15}
            accessibilityRole="button"
            accessibilityLabel="Collapse sidebar"
            style={({ pressed }) => [s.headerCollapseBtn, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="chevron-back" size={18} color={colors.textTertiary} />
          </Pressable>
        </View>

        {/* Time + weather — compact single row */}
        <View style={s.weatherRow}>
          <Ionicons name="time-outline" size={12} color={mutedColor} />
          <Text style={[s.weatherText, { color: colors.textTertiary }]} numberOfLines={1}>
            {dateLabel} · {timeLabel}{weatherSummary ? `  ·  ${weatherSummary}` : ''}
          </Text>
        </View>
      </View>

      {/* Brand gradient divider */}
      <LinearGradient
        colors={[CultureTokens.indigo, CultureTokens.teal, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.gradientLine}
      />

      {/* ── Create CTA ── */}
      <View style={s.ctaWrap}>
        <Pressable
          onPress={() => navigate('/submit')}
          accessibilityRole="button"
          accessibilityLabel="Create new content"
          style={({ pressed }) => [s.ctaBtn, pressed && { opacity: 0.88 }]}
        >
          <LinearGradient
            colors={[CultureTokens.indigo, CultureTokens.teal]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.ctaBtnGradient}
          >
            <Text style={s.ctaBtnText}>＋ Create</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* ── Scrollable nav ── */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 6, paddingTop: 4 }}>
        <NavSection label="Discover" mutedColor={mutedColor} colors={colors}>
          {navWithBadge.map((item) => (
            <SidebarItem key={item.route} item={item} active={isActive(item)} isDark={isDark} onPress={() => navigate(item.route)} colors={colors} />
          ))}
        </NavSection>

        <NavSection label="Library" mutedColor={mutedColor} colors={colors}>
          {LIBRARY_NAV.map((item) => (
            <SidebarItem key={item.route} item={item} active={isActive(item)} isDark={isDark} onPress={() => navigate(item.route)} colors={colors} />
          ))}
        </NavSection>

        {isOrganizer && (
          <NavSection label="Organiser Tools" mutedColor={mutedColor} colors={colors}>
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

      {/* ── Council context pill (no-nav, display only) ── */}
      {myCouncil && (
        <Pressable
          style={[s.councilCard, { backgroundColor: isDark ? 'rgba(44,42,114,0.14)' : 'rgba(44,42,114,0.06)', borderColor: colors.primary + '30' }]}
          onPress={() => navigate('/(tabs)/directory')}
          accessibilityRole="button"
          accessibilityLabel="Browse local directory"
        >
          <View style={[s.councilIconWrap, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '40' }]}>
            <Ionicons name="shield-checkmark" size={13} color={colors.primary} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[s.councilName, { color: colors.text }]} numberOfLines={1}>{myCouncil.name}</Text>
            <Text style={[s.councilSub, { color: colors.textSecondary }]} numberOfLines={1}>
              {myCouncil.suburb ?? 'Local'}{myCouncil.state ? `, ${myCouncil.state}` : ''}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={13} color={colors.primary + 'AA'} />
        </Pressable>
      )}

      {/* ── Bottom section: Settings / Help / Account ── */}
      <View style={[s.thinDivider, { backgroundColor: border }]} />
      <View style={s.bottomNavSection}>

        {/* Settings + Help — always visible */}
        <View style={s.navGroup}>
          {BOTTOM_NAV.map((item) => (
            <SidebarItem
              key={item.route}
              item={item}
              active={isActive(item)}
              isDark={isDark}
              onPress={() => navigate(item.route)}
              colors={colors}
            />
          ))}
        </View>

        <View style={[s.thinDivider, { backgroundColor: border, marginVertical: 4 }]} />

        {/* Account block */}
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
          <View style={{ paddingHorizontal: 12, paddingTop: 6, paddingBottom: 10, gap: 8 }}>
            <Pressable
              style={[s.signInBtn, { borderColor: colors.borderLight }]}
              onPress={() => navigate(routeWithRedirect('/(onboarding)/login', pathname) as string)}
              accessibilityRole="button"
            >
              <Ionicons name="log-in-outline" size={16} color={colors.textSecondary} />
              <Text style={[s.signInBtnText, { color: colors.textSecondary }]}>Sign In</Text>
            </Pressable>
            <Button
              variant="gradient"
              size="md"
              leftIcon="person-add"
              onPress={() => navigate('/(onboarding)/signup')}
              fullWidth
              style={{ height: 40, borderRadius: 12 } as any}
              textStyle={[TextStyles.callout, { fontWeight: '700', letterSpacing: 0.1, color: '#0B0B14' }]}
              hoverStyle={{ opacity: 0.92 }}
            >
              Join CulturePass
            </Button>
          </View>
        )}

        {/* Version */}
        <Text style={[s.versionText, { color: colors.textTertiary }]}>v2.0 · CulturePass AU</Text>
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
        <AvatarWithRing avatarUrl={(user as any).avatarUrl} initials={initials} size={40} isGuest={false} />
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
                <AvatarWithRing avatarUrl={(user as any).avatarUrl} initials={initials} size={36} isGuest={false} />
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
        <Text style={[s.sectionLabel, { color: mutedColor }]}>{label.toUpperCase()}</Text>
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
      {/* Left accent bar */}
      {active && (
        <View style={ni.activeBar}>
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
        style={[
          ni.label,
          { color: active ? colors.primary : colors.textSecondary },
          active && ni.labelActive,
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

    // ── Brand header ──
    brandHeader: {
      paddingHorizontal: 14,
      paddingTop: 18,
      paddingBottom: 12,
      overflow: 'hidden',
      gap: 12,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    brandLogoBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
      minWidth: 0,
    },
    logoIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      backgroundColor: 'rgba(0,0,0,0.06)',
      flexShrink: 0,
    },
    logoImage: {
      width: '100%',
      height: '100%',
    },
    wordmarkWrap: {
      minWidth: 0,
      flexShrink: 1,
      gap: 1,
    },
    wordmarkContainer: {
      alignSelf: 'flex-start',
      borderRadius: 6,
      overflow: 'hidden',
    },
    wordmarkGradient: {
      paddingHorizontal: 8,
      paddingVertical: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    wordmarkText: {
      fontSize: 16,
      fontFamily: 'Poppins_700Bold',
      color: '#FFFFFF',
      letterSpacing: -0.2,
    },
    wordmarkSub: {
      fontSize: 10,
      fontFamily: 'Poppins_500Medium',
      marginLeft: 8,
      letterSpacing: 0.2,
    },
    headerCollapseBtn: {
      width: 26,
      height: 26,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },

    // ── Weather row (compact, in brand header) ──
    weatherRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    weatherText: {
      fontSize: 10.5,
      fontFamily: 'Poppins_400Regular',
      flex: 1,
    },

    gradientLine: {
      height: 1,
      marginBottom: 4,
    },

    // ── Create CTA ──
    ctaWrap: {
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 10,
    },
    ctaBtn: {
      borderRadius: 12,
      overflow: 'hidden',
    },
    ctaBtnGradient: {
      paddingVertical: 11,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
    },
    ctaBtnText: {
      fontSize: 14,
      fontFamily: 'Poppins_700Bold',
      color: '#fff',
      letterSpacing: 0.1,
    },

    // ── Nav groups ──
    navGroup: {
      paddingHorizontal: 8,
      gap: 1,
    },
    sectionHeader: {
      paddingHorizontal: 14,
      paddingTop: 16,
      paddingBottom: 5,
    },
    sectionLabel: {
      fontSize: 10,
      fontFamily: 'Poppins_700Bold',
      letterSpacing: 1.2,
    },

    // ── Council card ──
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

    // ── Bottom section ──
    thinDivider: {
      height: StyleSheet.hairlineWidth,
      marginHorizontal: 12,
      marginVertical: 4,
    },
    bottomNavSection: {
      paddingTop: 4,
      paddingBottom: 8,
    },
    signInBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 12,
      borderWidth: 1,
      paddingVertical: 9,
    },
    signInBtnText: {
      fontSize: 13,
      fontFamily: 'Poppins_600SemiBold',
    },
    versionText: {
      fontSize: 9,
      fontFamily: 'Poppins_400Regular',
      letterSpacing: 0.3,
      paddingHorizontal: 20,
      paddingBottom: 12,
      paddingTop: 4,
    },

    // ── Profile block / modal ──
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

    // legacy (kept for compatibility in profile block sub-usage)
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
      backgroundColor: CultureTokens.gold,
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

    // legacy header used in old profile header
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
      overflow: 'hidden',
    },
    headerBtn: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    sectionDot: {
      width: 3,
      height: 3,
      borderRadius: 2,
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
      width: 44,
      height: 44,
      borderRadius: 12,
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
      top: 8,
      bottom: 8,
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
      gap: 12,
      borderRadius: 12,
      height: 44,
      paddingHorizontal: 12,
      position: 'relative',
      overflow: 'hidden',
    },
    itemActive: {
      borderRadius: 12,
    },
    activeBar: {
      position: 'absolute',
      left: 0,
      top: 8,
      bottom: 8,
      width: 3,
      borderRadius: 2,
      overflow: 'hidden',
    },
    label: {
      fontSize: 14,
      fontFamily: 'Poppins_600SemiBold',
      flex: 1,
    },
    labelActive: {
      fontFamily: 'Poppins_700Bold',
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
