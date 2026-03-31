import React, { useMemo, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Platform, LayoutAnimation, UIManager,
} from 'react-native';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/lib/auth';
import { useRole } from '@/hooks/useRole';
import { CultureTokens } from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const isWeb = Platform.OS === 'web';

// ── Types ──────────────────────────────────────────────────────────────────────

interface MenuEntry {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color?: string;
  badge?: string;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  requiresSuperAdmin?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuEntry[];
}

// ── Data ───────────────────────────────────────────────────────────────────────

const SECTIONS: MenuSection[] = [
  {
    title: 'My Account',
    items: [
      { id: 'profile', label: 'My Identity',       icon: 'person-circle-outline', route: '/(tabs)/profile',  requiresAuth: true },
      { id: 'tickets', label: 'Festival Tickets',  icon: 'ticket-outline',        route: '/tickets',         requiresAuth: true, color: CultureTokens.gold },
      { id: 'wallet',  label: 'Wallet & Rewards',  icon: 'wallet-outline',        route: '/payment/wallet',  requiresAuth: true, color: CultureTokens.teal },
      { id: 'saved',   label: 'Saved & Pinned',    icon: 'bookmark-outline',      route: '/saved',           requiresAuth: true },
    ],
  },
  {
    title: 'Discover',
    items: [
      { id: 'events',      label: 'Events',       icon: 'calendar-outline',    route: '/events' },
      { id: 'movies',      label: 'Movies',       icon: 'film-outline',        route: '/movies' },
      { id: 'restaurants', label: 'Dining',       icon: 'restaurant-outline', route: '/restaurants' },
      { id: 'activities',  label: 'Activities',   icon: 'compass-outline',     route: '/activities' },
      { id: 'shopping',    label: 'Shopping',     icon: 'bag-outline',         route: '/shopping' },
      { id: 'directory',   label: 'Directory',    icon: 'grid-outline',        route: '/(tabs)/directory' },
      { id: 'community',   label: 'Communities',  icon: 'people-outline',      route: '/(tabs)/community' },
      { id: 'perks',       label: 'Perks',        icon: 'gift-outline',        route: '/(tabs)/perks',    color: CultureTokens.indigo },
    ],
  },
  {
    title: 'Create & submit',
    items: [
      { id: 'studio',        label: 'Creator Studio (all types)', icon: 'add-circle-outline',       route: '/submit',                             requiresAuth: true, color: CultureTokens.coral },
      { id: 'sub-event',     label: 'Submit: Event',              icon: 'calendar-outline',       route: '/submit?type=event',                 requiresAuth: true },
      { id: 'sub-festival',  label: 'Submit: Festival',           icon: 'color-filter-outline',   route: '/submit?type=event&variant=festival', requiresAuth: true },
      { id: 'sub-concert',   label: 'Submit: Concert / show',     icon: 'musical-notes-outline',   route: '/submit?type=event&variant=concert',  requiresAuth: true },
      { id: 'sub-workshop',  label: 'Submit: Workshop / class',     icon: 'school-outline',          route: '/submit?type=event&variant=workshop', requiresAuth: true },
      { id: 'sub-movie',     label: 'Submit: Movie / cinema',     icon: 'videocam-outline',        route: '/submit?type=movie',                 requiresAuth: true },
      { id: 'sub-dining',    label: 'Submit: Dining venue',       icon: 'restaurant-outline',      route: '/submit?type=restaurant',            requiresAuth: true },
      { id: 'sub-shop',      label: 'Submit: Shop / retail',      icon: 'storefront-outline',       route: '/submit?type=shop',                 requiresAuth: true },
      { id: 'sub-activity',  label: 'Submit: Activity / tour',    icon: 'walk-outline',            route: '/submit?type=activity',              requiresAuth: true },
      { id: 'sub-pro',       label: 'Submit: Professional page', icon: 'briefcase-outline',        route: '/submit?type=professional',         requiresAuth: true },
      { id: 'sub-org',       label: 'Submit: Organisation',       icon: 'people-circle-outline',   route: '/submit?type=organisation',          requiresAuth: true },
      { id: 'sub-business',  label: 'Submit: Business profile',   icon: 'business-outline',       route: '/submit?type=business',            requiresAuth: true },
      { id: 'sub-artist',    label: 'Submit: Artist profile',     icon: 'color-palette-outline',   route: '/submit?type=artist',                requiresAuth: true },
    ],
  },
  {
    title: 'Tools',
    items: [
      { id: 'scanner', label: 'Gate Scan',        icon: 'qr-code-outline',         route: '/scanner',   requiresAuth: true, color: CultureTokens.indigo },
      { id: 'help',    label: 'Support & Help',  icon: 'help-circle-outline',     route: '/help' },
      { id: 'settings',label: 'App Settings',    icon: 'settings-outline',        route: '/settings' },
    ],
  },
  {
    title: 'Admin',
    items: [
      { id: 'admin', label: 'Admin Terminal', icon: 'shield-checkmark-outline', route: '/admin/dashboard/index', requiresAdmin: true, color: CultureTokens.coral },
    ],
  },
  {
    title: 'SuperAdmin',
    items: [
      { id: 'cockpit', label: 'Cockpit (Root)', icon: 'rocket-outline', route: '/admin/cockpit', requiresSuperAdmin: true, color: CultureTokens.purple },
    ],
  },
];

// ── Row component ──────────────────────────────────────────────────────────────

function MenuRow({ item, colors }: { item: MenuEntry; colors: ReturnType<typeof useColors> }) {
  const accent = item.color ?? colors.text;
  const handlePress = () => {
    if (!isWeb) Haptics.selectionAsync();
    router.push(item.route as any);
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.row,
        { backgroundColor: colors.surface },
        (pressed || hovered) && { backgroundColor: colors.primarySoft },
        pressed && styles.rowPressed,
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: accent + '18' }]}>
        <Ionicons name={item.icon} size={19} color={accent} />
      </View>
      <Text style={[styles.rowLabel, { color: colors.text }]}>{item.label}</Text>
      {item.badge && (
        <View style={[styles.badge, { backgroundColor: accent }]}>
          <Text style={styles.badgeText}>{item.badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
    </Pressable>
  );
}

// ── Collapsible section ─────────────────────────────────────────────────────────

function CollapsibleSection({
  section,
  colors,
  defaultCollapsed = false,
}: {
  section: MenuSection;
  colors: ReturnType<typeof useColors>;
  defaultCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsed((v) => !v);
    if (!isWeb) Haptics.selectionAsync();
  }, []);

  return (
    <View style={styles.section}>
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        style={({ pressed }: { pressed: boolean }) => [styles.sectionHeaderRow, pressed && { opacity: 0.7 }]}
      >
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
          {section.title.toUpperCase()}
        </Text>
        <Ionicons
          name={collapsed ? 'chevron-down' : 'chevron-up'}
          size={13}
          color={colors.textTertiary}
        />
      </Pressable>
      {!collapsed && (
        <View style={[styles.sectionCard, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
          {section.items.map((item, idx) => (
            <React.Fragment key={item.id}>
              <MenuRow item={item} colors={colors} />
              {idx < section.items.length - 1 && (
                <View style={[styles.divider, { backgroundColor: colors.divider }]} />
              )}
            </React.Fragment>
          ))}
        </View>
      )}
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────

export default function MenuScreen() {
  const insets      = useSafeAreaInsets();
  const colors      = useColors();
  const { isDesktop, contentWidth, hPad } = useLayout();
  const { user, isAuthenticated, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { isAdmin, isSuperAdmin } = useRole();

  const visibleSections = useMemo<MenuSection[]>(() =>
    SECTIONS
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (item.requiresAuth  && !isAuthenticated) return false;
          if (item.requiresAdmin && !isAdmin)         return false;
          if (item.requiresSuperAdmin && !isSuperAdmin) return false;
          return true;
        }),
      }))
      .filter((section) => section.items.length > 0),
    [isAuthenticated, isAdmin, isSuperAdmin],
  );

  const handleLogout = async () => {
    if (isLoggingOut) return;
    if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setIsLoggingOut(true);
    await logout();
    router.replace('/(onboarding)/login');
  };

  return (
    <ErrorBoundary>
      <Stack.Screen options={{ title: 'Menu | CulturePass', headerShown: false }} />

      <View style={[styles.root, { backgroundColor: colors.background }]}>

        {/* ── Header gradient ── */}
        <LinearGradient
          colors={[CultureTokens.indigo + 'CC', colors.background]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

        {/* ── Top bar ── */}
        <View style={[styles.topBar, { paddingTop: insets.top, paddingHorizontal: hPad, borderBottomColor: colors.borderLight }]}>
          <Text style={[styles.screenTitle, { color: colors.text }]}>Menu</Text>
          <Pressable
            onPress={() => { if (!isWeb) Haptics.selectionAsync(); router.back(); }}
            style={[styles.closeBtn, { backgroundColor: colors.surface + 'CC', borderColor: colors.borderLight }]}
            accessibilityRole="button"
            accessibilityLabel="Close menu"
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scroll,
            { paddingHorizontal: hPad, paddingBottom: insets.bottom + 48 },
            isDesktop && { width: contentWidth, alignSelf: 'center' as const },
          ]}
        >
          {/* ── Profile card ── */}
          {isAuthenticated && user ? (
            <Pressable
              onPress={() => { if (!isWeb) Haptics.selectionAsync(); router.push('/(tabs)/profile'); }}
              accessibilityRole="button"
              accessibilityLabel="View profile"
              style={({ pressed }) => [pressed && { opacity: 0.85 }]}
            >
              <LinearGradient
                colors={[CultureTokens.indigo + '40', colors.surfaceElevated]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.profileCard, { borderColor: CultureTokens.indigo + '40' }]}
              >
                <Image
                  source={{ uri: user.avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName || user.username || 'U') + '&background=2C2A72&color=fff' }}
                  style={styles.avatar}
                  contentFit="cover"
                />
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileName, { color: colors.text }]} numberOfLines={1}>
                    {user.displayName || user.username}
                  </Text>
                  <Text style={[styles.profileHandle, { color: colors.textSecondary }]} numberOfLines={1}>
                    @{user.handle || user.username}
                  </Text>
                  {user.subscriptionTier && user.subscriptionTier !== 'free' && (
                    <View style={[styles.tierBadge, { backgroundColor: CultureTokens.gold + '25', borderColor: CultureTokens.gold + '60' }]}>
                      <Ionicons name="star" size={10} color={CultureTokens.gold} />
                      <Text style={[styles.tierText, { color: CultureTokens.gold }]}>
                        {String(user.subscriptionTier).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </LinearGradient>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => { if (!isWeb) Haptics.selectionAsync(); router.push('/(onboarding)/login'); }}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
              style={({ pressed }) => [pressed && { opacity: 0.85 }]}
            >
              <LinearGradient
                colors={[CultureTokens.indigo + '30', colors.surfaceElevated]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.profileCard, { borderColor: CultureTokens.indigo + '35' }]}
              >
                <View style={[styles.avatar, styles.guestAvatar, { backgroundColor: colors.borderLight }]}>
                  <Ionicons name="person" size={24} color={colors.textSecondary} />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileName, { color: colors.text }]}>Guest</Text>
                  <Text style={[styles.profileHandle, { color: CultureTokens.indigo }]}>Sign in or create account →</Text>
                </View>
                <Ionicons name="log-in-outline" size={22} color={CultureTokens.indigo} />
              </LinearGradient>
            </Pressable>
          )}

          {/* ── Sections ── */}
          {visibleSections.map((section) => (
            <CollapsibleSection
              key={section.title}
              section={section}
              colors={colors}
              defaultCollapsed={section.title === 'Create & submit'}
            />
          ))}

          {/* ── Logout ── */}
          {isAuthenticated && (
            <Pressable
              onPress={handleLogout}
              disabled={isLoggingOut}
              accessibilityRole="button"
              accessibilityLabel="Log out"
              style={({ pressed }) => [
                styles.logoutBtn,
                { borderColor: colors.error + '40' },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons name="log-out-outline" size={18} color={colors.error} />
              <Text style={[styles.logoutText, { color: colors.error }]}>
                {isLoggingOut ? 'Signing out…' : 'Sign Out'}
              </Text>
            </Pressable>
          )}

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <Image source={require('@/assets/images/icon.png')} style={styles.footerLogo} />
            <Text style={[styles.footerText, { color: colors.textTertiary }]}>
              CulturePass · v1.0.0
            </Text>
          </View>
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  screenTitle: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { paddingTop: 20, gap: 0 },

  /* Profile card */
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
    gap: 14,
  },
  avatar: { width: 52, height: 52, borderRadius: 16 },
  guestAvatar: { alignItems: 'center', justifyContent: 'center' },
  profileInfo: { flex: 1, gap: 2 },
  profileName: { fontSize: 16, fontFamily: 'Poppins_700Bold', letterSpacing: -0.2 },
  profileHandle: { fontSize: 13, fontFamily: 'Poppins_400Regular' },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  tierText: { fontSize: 10, fontFamily: 'Poppins_700Bold', letterSpacing: 0.5 },

  /* Sections */
  section: { marginBottom: 20 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 1.2,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },

  /* Row */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  rowPressed: { opacity: 0.65 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: '#fff' },

  /* Logout */
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginBottom: 28,
  },
  logoutText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold' },

  /* Footer */
  footer: { alignItems: 'center', gap: 6, opacity: 0.5, marginBottom: 8 },
  footerLogo: { width: 28, height: 28, borderRadius: 8 },
  footerText: { fontSize: 12, fontFamily: 'Poppins_400Regular' },
});
