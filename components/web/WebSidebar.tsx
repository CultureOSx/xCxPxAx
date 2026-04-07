import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import { usePathname, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/lib/auth';
import { useRole } from '@/hooks/useRole';
import { useCouncil } from '@/hooks/useCouncil';
import { Colors, CultureTokens, gradients, type ColorTheme } from '@/constants/theme';
import { TextStyles } from '@/constants/typography';
import { useColors, useIsDark } from '@/hooks/useColors';
import { routeWithRedirect } from '@/lib/routes';
import { getPostcodesByPlace } from '@shared/location/australian-postcodes';
import { Image } from 'expo-image';
import Constants from 'expo-constants';
import { Button } from '@/components/ui/Button';
import { BrandWordmark } from '@/components/ui/BrandWordmark';

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
  { label: 'Movies', icon: 'film-outline', iconActive: 'film', route: '/movies', matchPrefix: true },
  { label: 'Dining', icon: 'restaurant-outline', iconActive: 'restaurant', route: '/restaurants', matchPrefix: true },
  { label: 'Activities', icon: 'compass-outline', iconActive: 'compass', route: '/activities', matchPrefix: true },
  { label: 'Shopping', icon: 'bag-outline', iconActive: 'bag', route: '/shopping', matchPrefix: true },
  { label: 'Map', icon: 'map-outline', iconActive: 'map', route: '/map' },
  { label: 'Directory', icon: 'grid-outline', iconActive: 'grid', route: '/(tabs)/directory', matchPrefix: true },
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

// ─── Main WebSidebar Component ───────────────────────────────────────────────
export function WebSidebar() {
  const pathname = usePathname();
  const colors = useColors();
  const { s, r } = getSidebarStyles(colors);
  const isDark = useIsDark();
  const { user, logout, isAuthenticated } = useAuth();
  const { isOrganizer, isAdmin, isSuperAdmin, role } = useRole();
  const isVenue = role === 'business';
  const isSponsor = role === 'sponsor';
  const { data: councilData } = useCouncil();

  const [collapsed, setCollapsed] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());
  const [weatherSummary, setWeatherSummary] = useState<string>('');

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
        const label = code === 0 ? 'Clear' : code === 1 || code === 2 ? 'Partly Cloudy' : code === 3 ? 'Cloudy' : '';
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
  const appVersionLabel = useMemo(() => {
    const rawVersion = Constants.expoConfig?.version ?? Constants.nativeApplicationVersion ?? 'dev';
    return `v${rawVersion} · CulturePass AU`;
  }, []);
  const brandMetaLine = useMemo(() => {
    const city = user?.city?.trim();
    if (city) return `${city} · Diaspora marketplace`;
    return 'Australia · Diaspora marketplace';
  }, [user?.city]);

  // Collapsed rail (unchanged)
  if (collapsed) {
    return (
      <View style={[r.rail, { backgroundColor: bg, borderRightColor: border }]}>
        <Pressable style={r.railTop} onPress={() => navigate('/(tabs)')} hitSlop={4}>
          <View style={r.railLogo}>
            <Image source={require('../../assets/images/culturepass-logo.png')} style={r.railLogoImage} contentFit="cover" />
          </View>
        </Pressable>
        <View style={[r.divider, { backgroundColor: border }]} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={r.railIcons}>
          {[...MAIN_NAV, ...LIBRARY_NAV].map((item) => {
            const active = isActive(item);
            return (
              <Pressable
                key={item.route}
                style={[r.railItem, active && { backgroundColor: colors.primarySoft }]}
                onPress={() => navigate(item.route)}
              >
                {active && (
                  <LinearGradient colors={[CultureTokens.indigo, CultureTokens.teal]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={r.railActiveBar} />
                )}
                <Ionicons name={active ? item.iconActive : item.icon} size={19} color={active ? colors.primary : mutedColor} />
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={{ flex: 1 }} />
        <View style={[r.divider, { backgroundColor: border }]} />
        {BOTTOM_NAV.map((item) => {
          const active = isActive(item);
          return (
            <Pressable
              key={item.label}
              style={[r.railItem, active && { backgroundColor: colors.primarySoft }]}
              onPress={() => navigate(item.route)}
            >
              {active && (
                <LinearGradient colors={[CultureTokens.indigo, CultureTokens.teal]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={r.railActiveBar} />
              )}
              <Ionicons name={(active ? item.iconActive : item.icon) as keyof typeof Ionicons.glyphMap} size={19} color={active ? colors.primary : mutedColor} />
            </Pressable>
          );
        })}
        <Pressable style={[r.railItem, r.railActionBtn]} onPress={() => setCollapsed(false)}>
          <Ionicons name="chevron-forward-outline" size={18} color={mutedColor} />
        </Pressable>
        {isAuthenticated && (
          <Pressable style={[r.railItem, { marginBottom: 8 }]} onPress={() => logout()}>
            <Ionicons name="log-out-outline" size={18} color={mutedColor} />
          </Pressable>
        )}
      </View>
    );
  }

  // Expanded sidebar
  return (
    <View style={[s.sidebar, { backgroundColor: bg, borderRightColor: border }]}>
      <View style={s.brandHeader}>
        <View style={[StyleSheet.absoluteFill, s.brandHeaderGlow]} pointerEvents="none" />

        <Pressable
          style={({ pressed, hovered }: { pressed?: boolean; hovered?: boolean }) => [
            s.brandBlackCard,
            hovered && { opacity: 0.94 },
            pressed && { opacity: 0.88 },
          ]}
          onPress={() => navigate('/(tabs)')}
          accessibilityLabel="CulturePass home"
          accessibilityRole="button"
        >
          <View style={s.brandBlackCardInner}>
            <View style={s.logoIconRound}>
              <Image
                source={require('../../assets/images/culturepass-logo.png')}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            </View>
            <View style={s.brandTextCol}>
              <View style={s.brandNameGradientWrap}>
                <BrandWordmark size="sm" maxWidth={132} />
              </View>
              <Text
                style={s.brandTaglineOnDark}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.78}
              >
                BELONG ANYWHERE
              </Text>
              <Text
                style={s.brandSubTaglineOnDark}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                Discover. Connect. Belong.
              </Text>
            </View>
          </View>
        </Pressable>

        <View
          style={[
            s.headerMetaStrip,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(11,11,20,0.04)',
              borderColor: colors.borderLight,
            },
          ]}
        >
          <View style={s.headerMetaMain}>
            <View style={[s.headerMetaIconWrap, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
            </View>
            <View style={s.headerMetaCopy}>
              <Text style={[s.headerMetaTime, { color: colors.text }]} numberOfLines={1}>
                {timeLabel}
              </Text>
              <Text style={[s.headerMetaSub, { color: colors.textSecondary }]} numberOfLines={2}>
                {dateLabel}
                {weatherSummary ? ` · ${weatherSummary}` : ''}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => setCollapsed(true)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Collapse sidebar"
            style={({ pressed, hovered }: { pressed?: boolean; hovered?: boolean }) => [
              s.headerCollapseChip,
              { borderColor: colors.borderLight },
              hovered && { backgroundColor: colors.primarySoft },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons name="chevron-back" size={19} color={CultureTokens.coral} />
          </Pressable>
        </View>

        <View
          style={[
            s.brandInfoStrip,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,12,24,0.035)',
              borderColor: colors.borderLight,
            },
          ]}
        >
          <View style={[s.brandInfoPill, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="sparkles-outline" size={11} color={colors.primary} />
            <Text style={[s.brandInfoPillText, { color: colors.primary }]}>Brand</Text>
          </View>
          <Text style={[s.brandInfoText, { color: colors.textSecondary }]} numberOfLines={1}>
            {brandMetaLine}
          </Text>
        </View>
      </View>

      <LinearGradient
        colors={[CultureTokens.indigo, CultureTokens.teal, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.gradientLine}
      />

      {/* Create CTA */}
      <View style={s.ctaWrap}>
        <Pressable onPress={() => navigate('/submit')} style={({ pressed }) => [s.ctaBtn, pressed && { opacity: 0.88 }]}>
          <LinearGradient colors={[CultureTokens.indigo, CultureTokens.teal]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.ctaBtnGradient}>
            <Text style={s.ctaBtnText}>＋ Create</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Navigation Sections - rest unchanged */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 6, paddingTop: 4 }}>
        {/* ... your NavSection calls ... */}
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

        {isOrganizer && <NavSection label="Organiser Tools" mutedColor={mutedColor} colors={colors}>{ORGANIZER_NAV.map(item => <SidebarItem key={item.route} item={item} active={isActive(item)} isDark={isDark} onPress={() => navigate(item.route)} colors={colors} />)}</NavSection>}
        {isVenue && <NavSection label="Venue" mutedColor={mutedColor} colors={colors}>{VENUE_NAV.map(item => <SidebarItem key={item.route} item={item} active={isActive(item)} isDark={isDark} onPress={() => navigate(item.route)} colors={colors} />)}</NavSection>}
        {isSponsor && <NavSection label="Sponsor" mutedColor={mutedColor} colors={colors}>{SPONSOR_NAV.map(item => <SidebarItem key={item.route} item={item} active={isActive(item)} isDark={isDark} onPress={() => navigate(item.route)} colors={colors} />)}</NavSection>}
        {isAdmin && <NavSection label="Admin" mutedColor={mutedColor} colors={colors}>{ADMIN_NAV.map(item => <SidebarItem key={item.route} item={item} active={isActive(item)} isDark={isDark} onPress={() => navigate(item.route)} colors={colors} />)}</NavSection>}
        {isSuperAdmin && <NavSection label="SuperAdmin" mutedColor={mutedColor} colors={colors}>{SUPERADMIN_NAV.map(item => <SidebarItem key={item.route} item={item} active={isActive(item)} isDark={isDark} onPress={() => navigate(item.route)} colors={colors} />)}</NavSection>}
      </ScrollView>

      {/* Council + Bottom Section (unchanged) */}
      {myCouncil && (
        <Pressable style={[s.councilCard, { backgroundColor: isDark ? 'rgba(44,42,114,0.14)' : 'rgba(44,42,114,0.06)', borderColor: colors.primary + '30' }]} onPress={() => navigate('/(tabs)/directory')}>
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

      <View style={[s.thinDivider, { backgroundColor: border }]} />
      <View style={s.bottomNavSection}>
        <View style={s.navGroup}>
          {BOTTOM_NAV.map((item) => (
            <SidebarItem key={item.route} item={item} active={isActive(item)} isDark={isDark} onPress={() => navigate(item.route)} colors={colors} />
          ))}
        </View>

        <View style={[s.thinDivider, { backgroundColor: border, marginVertical: 4 }]} />

        {isAuthenticated && user ? (
          <SidebarProfileBlock user={user} colors={colors} isDark={isDark} border={border} mutedColor={mutedColor} onNavigate={navigate} onLogout={logout} />
        ) : (
          <View style={{ paddingHorizontal: 12, paddingTop: 6, paddingBottom: 10, gap: 8 }}>
            <Pressable style={[s.signInBtn, { borderColor: colors.borderLight }]} onPress={() => navigate(routeWithRedirect('/(onboarding)/login', pathname) as string)}>
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
            >
              Join CulturePass
            </Button>
          </View>
        )}

        <Text style={[s.versionText, { color: colors.textTertiary }]}>{appVersionLabel}</Text>
      </View>
    </View>
  );
}

// Sub-components (NavSection, SidebarItem, SidebarProfileBlock) remain as in your original
// ... (you can keep your original implementations for these)

function NavSection({ label, mutedColor, children, colors }: any) {
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

function SidebarItem({ item, active, isDark, onPress, colors }: any) {
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
    >
      {active && (
        <View style={ni.activeBar}>
          <LinearGradient colors={[CultureTokens.indigo, CultureTokens.teal]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
        </View>
      )}
      <Ionicons name={active ? item.iconActive : item.icon} size={18} color={active ? colors.primary : (isDark ? 'rgba(232,244,255,0.60)' : 'rgba(0,22,40,0.52)')} />
      <Text style={[ni.label, { color: active ? colors.primary : colors.textSecondary }, active && ni.labelActive]} numberOfLines={1}>
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

function SidebarProfileBlock({
  user,
  colors,
  isDark,
  border,
  mutedColor,
  onNavigate,
  onLogout,
}: {
  user: { id?: string; displayName?: string; username?: string; email?: string; photoURL?: string; role?: string };
  colors: ReturnType<typeof useColors>;
  isDark: boolean;
  border: string;
  mutedColor: string;
  onNavigate: (route: string) => void;
  onLogout: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const displayName = user.displayName ?? user.username ?? user.id?.slice(0, 8) ?? 'You';
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? '')
    .join('');
  const roleBadge = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : null;

  const PROFILE_ACTIONS = [
    { key: 'profile', label: 'View Profile', icon: 'person-outline' as const, route: '/profile/edit' },
    { key: 'qr', label: 'Digital ID', icon: 'qr-code-outline' as const, route: '/profile/qr' },
    { key: 'wallet', label: 'Wallet', icon: 'wallet-outline' as const, route: '/payment/wallet' },
    { key: 'notifications', label: 'Notifications', icon: 'notifications-outline' as const, route: '/notifications' },
    { key: 'settings', label: 'Settings', icon: 'settings-outline' as const, route: '/settings' },
  ];

  return (
    <View style={{ paddingHorizontal: 8, paddingBottom: 4 }}>
      {/* Expanded quick links */}
      {expanded && (
        <View
          style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            borderRadius: 12,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: border,
            marginBottom: 6,
            overflow: 'hidden',
          }}
        >
          {PROFILE_ACTIONS.map((action, index) => (
            <Pressable
              key={action.key}
              style={({ pressed, hovered }: { pressed?: boolean; hovered?: boolean }) => [
                {
                  flexDirection: 'row' as const,
                  alignItems: 'center' as const,
                  gap: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
                  borderTopColor: border,
                  backgroundColor: pressed || hovered
                    ? (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)')
                    : 'transparent',
                },
              ]}
              onPress={() => { setExpanded(false); onNavigate(action.route); }}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              <Ionicons name={action.icon} size={16} color={colors.textSecondary} />
              <Text style={{ fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.text, flex: 1 }} numberOfLines={1}>
                {action.label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            style={({ pressed, hovered }: { pressed?: boolean; hovered?: boolean }) => [
              {
                flexDirection: 'row' as const,
                alignItems: 'center' as const,
                gap: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: border,
                backgroundColor: pressed || hovered
                  ? (isDark ? 'rgba(255,80,80,0.10)' : 'rgba(255,80,80,0.07)')
                  : 'transparent',
              },
            ]}
            onPress={() => { setExpanded(false); onLogout(); }}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Ionicons name="log-out-outline" size={16} color="#FF5E5B" />
            <Text style={{ fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#FF5E5B', flex: 1 }}>
              Sign Out
            </Text>
          </Pressable>
        </View>
      )}

      {/* Profile row button */}
      <Pressable
        style={({ pressed, hovered }: { pressed?: boolean; hovered?: boolean }) => [
          {
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
            gap: 10,
            paddingHorizontal: 10,
            paddingVertical: 8,
            borderRadius: 12,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: expanded ? colors.primary + '60' : border,
            backgroundColor: expanded
              ? (isDark ? 'rgba(44,42,114,0.12)' : 'rgba(44,42,114,0.06)')
              : pressed || hovered
              ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)')
              : 'transparent',
          },
        ]}
        onPress={() => setExpanded((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel="Account and profile"
      >
        <AvatarWithRing
          avatarUrl={user.photoURL}
          initials={initials || '?'}
          size={32}
          ringWidth={1.5}
        />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.text, lineHeight: 17 }} numberOfLines={1}>
            {displayName}
          </Text>
          {(user.email || roleBadge) ? (
            <Text style={{ fontSize: 10.5, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, lineHeight: 14 }} numberOfLines={1}>
              {roleBadge ?? user.email}
            </Text>
          ) : null}
        </View>
        <Ionicons
          name={expanded ? 'chevron-down' : 'chevron-up'}
          size={14}
          color={mutedColor}
        />
      </Pressable>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const getSidebarStyles = (colors: ColorTheme) => {
  const s = StyleSheet.create({
    sidebar: { width: 240, alignSelf: 'stretch', borderRightWidth: StyleSheet.hairlineWidth, flexShrink: 0 },

    brandHeader: {
      paddingHorizontal: 12,
      paddingTop: 14,
      paddingBottom: 12,
      overflow: 'hidden',
      gap: 10,
    },
    brandHeaderGlow: { opacity: 0.07, backgroundColor: CultureTokens.indigo, borderBottomRightRadius: 120, top: -20, left: -20, right: '60%', bottom: '40%' },
    brandBlackCard: {
      alignSelf: 'stretch',
      backgroundColor: '#050508',
      borderRadius: 60,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.18)',
      paddingVertical: 14,
      paddingHorizontal: 16,
      overflow: 'hidden',
      ...Platform.select({
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.45, shadowRadius: 20 },
        android: { elevation: 15 },
        web: { boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.03)' },
      }),
    },
    brandBlackCardInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    logoIconRound: { width: 52, height: 52, borderRadius: 26, overflow: 'hidden', backgroundColor: '#050508', flexShrink: 0 },
    brandTextCol: { flex: 1, minWidth: 0, gap: 2, justifyContent: 'center' },
    brandNameGradientWrap: { alignSelf: 'flex-start', maxWidth: '100%', marginBottom: -2 },
    brandTaglineOnDark: {
      fontSize: 10,
      fontFamily: 'Poppins_700Bold',
      color: 'rgba(255,255,255,0.85)',
      letterSpacing: 1.4,
      lineHeight: 12,
      flexShrink: 1,
      textTransform: 'uppercase',
      opacity: 0.9,
    },
    brandSubTaglineOnDark: {
      fontSize: 10.5,
      fontFamily: 'Poppins_500Medium',
      color: 'rgba(255,255,255,0.72)',
      lineHeight: 13.5,
      flexShrink: 1,
      marginTop: 1,
    },
    headerMetaStrip: {
      alignSelf: 'stretch',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 10,
      paddingLeft: 10,
      paddingRight: 8,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
    },
    headerMetaMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 0 },
    headerMetaIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    headerMetaCopy: { flex: 1, minWidth: 0, gap: 2 },
    headerMetaTime: {
      fontSize: 13,
      fontFamily: 'Poppins_700Bold',
      letterSpacing: 0.2,
    },
    headerMetaSub: {
      fontSize: 11,
      fontFamily: 'Poppins_500Medium',
      lineHeight: 15,
      opacity: 0.92,
    },
    headerCollapseChip: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      flexShrink: 0,
    },
    gradientLine: { height: 1, marginTop: 4, marginBottom: 6 },
    brandInfoStrip: {
      alignSelf: 'stretch',
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: 10,
      paddingVertical: 8,
      gap: 6,
    },
    brandInfoPill: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    brandInfoPillText: {
      fontSize: 10,
      fontFamily: 'Poppins_700Bold',
      letterSpacing: 0.3,
    },
    brandInfoText: {
      fontSize: 11,
      fontFamily: 'Poppins_500Medium',
      lineHeight: 14,
    },

    ctaWrap: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10 },
    ctaBtn: { borderRadius: 12, overflow: 'hidden' },
    ctaBtnGradient: { paddingVertical: 11, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
    ctaBtnText: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: '#fff', letterSpacing: 0.1 },

    navGroup: { paddingHorizontal: 8, gap: 1 },
    sectionHeader: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 5 },
    sectionLabel: { fontSize: 10, fontFamily: 'Poppins_700Bold', letterSpacing: 1.2 },

    councilCard: { marginHorizontal: 10, marginBottom: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 9 },
    councilIconWrap: { width: 26, height: 26, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    councilName: { fontSize: 11.5, fontFamily: 'Poppins_600SemiBold', lineHeight: 16 },
    councilSub: { fontSize: 10, fontFamily: 'Poppins_400Regular' },

    thinDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 12, marginVertical: 4 },
    bottomNavSection: { paddingTop: 4, paddingBottom: 8 },

    signInBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingVertical: 9 },
    signInBtnText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
    versionText: { fontSize: 9, fontFamily: 'Poppins_400Regular', letterSpacing: 0.3, paddingHorizontal: 20, paddingBottom: 12, paddingTop: 4 },

    profileBlock: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginHorizontal: 8 },
    profileBlockName: { ...TextStyles.labelSemibold },
    profileBlockSub: { ...TextStyles.caption },
  });

  const r = StyleSheet.create({
    rail: { width: 54, height: '100%', borderRightWidth: StyleSheet.hairlineWidth, flexShrink: 0, alignItems: 'center', paddingTop: 14, paddingBottom: 4 },
    railTop: { marginBottom: 10 },
    railLogo: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#050508' },
    railLogoImage: { ...StyleSheet.absoluteFillObject },
    divider: { height: StyleSheet.hairlineWidth, width: 32, marginBottom: 6 },
    railIcons: { alignItems: 'center', gap: 2, paddingTop: 2 },
    railItem: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    railActionBtn: { backgroundColor: 'transparent' },
    railActiveBar: { position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 2 },
  });

  const ni = StyleSheet.create({
    item: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, height: 44, paddingHorizontal: 12, position: 'relative', overflow: 'hidden' },
    itemActive: { borderRadius: 12 },
    activeBar: { position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 2, overflow: 'hidden' },
    label: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', flex: 1 },
    labelActive: { fontFamily: 'Poppins_700Bold' },
    badge: { backgroundColor: Colors.error, borderRadius: 9, minWidth: 17, height: 17, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
    badgeText: { ...TextStyles.captionSemibold, color: '#fff', fontSize: 9 },
  });

  return { s, r, ni };
};
