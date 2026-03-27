import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Stack } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/lib/auth';
import { TextStyles } from '@/constants/typography';
import { CultureTokens, CardTokens } from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useRole } from '@/hooks/useRole';
import { LinearGradient } from 'expo-linear-gradient';

interface MenuItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: any;
  color?: string;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'profile', label: 'My Identity', icon: 'person-circle-outline', route: '/(tabs)/profile', requiresAuth: true },
  { id: 'tickets', label: 'Festival Tickets', icon: 'ticket-outline', route: '/tickets', requiresAuth: true, color: CultureTokens.gold },
  { id: 'wallet', label: 'Wallet & Rewards', icon: 'wallet-outline', route: '/payment/wallet', requiresAuth: true, color: CultureTokens.teal },
  { id: 'saved', label: 'Saved & Pinned', icon: 'bookmark-outline', route: '/saved', requiresAuth: true },
  { id: 'submit', label: 'Creator Studio', icon: 'add-circle-outline', route: '/submit', requiresAuth: true, color: CultureTokens.coral },
  { id: 'scanner', label: 'Gate Scan (Staff)', icon: 'qr-code-outline', route: '/scanner', requiresAuth: true, color: CultureTokens.indigo },
  { id: 'communities', label: 'Directory', icon: 'grid-outline', route: '/(tabs)/directory' },
  { id: 'help', label: 'Support & Help', icon: 'help-circle-outline', route: '/help' },
  { id: 'settings', label: 'App Settings', icon: 'settings-outline', route: '/settings' },
  { id: 'admin', label: 'Admin Terminal', icon: 'shield-checkmark-outline', route: '/admin/dashboard', requiresAdmin: true, color: CultureTokens.error },
];

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { isDesktop, contentWidth } = useLayout();
  const { user, isAuthenticated, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { isAdmin } = useRole();

  const styles = useMemo(() => getStyles(colors), [colors]);

  const haptic = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
  };

  const handleRoute = (route: string) => {
    haptic();
    router.push(route as any);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    haptic();
    setIsLoggingOut(true);
    await logout();
    router.replace('/(onboarding)/login');
  };

  const filteredItems = MENU_ITEMS.filter((item) => {
    if (item.requiresAuth && !isAuthenticated) return false;
    if (item.requiresAdmin && !isAdmin) return false;
    return true;
  });

  return (
    <ErrorBoundary>
      <Stack.Screen 
        options={{ 
          title: 'Menu | CulturePass',
          headerShown: false,
        }} 
      />
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={[colors.background, colors.surface]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        <View style={[styles.header, { paddingTop: insets.top, borderBottomColor: colors.borderLight }]}>
          <View style={styles.headerInner}>
            <Pressable onPress={() => { haptic(); router.back(); }} style={styles.closeBtn}>
              <Ionicons name="close-circle-outline" size={28} color={colors.text} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Menu</Text>
            <View style={{ width: 44 }} />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scroll,
            isDesktop && { width: contentWidth, alignSelf: 'center' as any },
          ]}
        >
          {isAuthenticated && user ? (
            <Pressable 
              style={[styles.profileCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
              onPress={() => handleRoute('/(tabs)/profile')}
            >
              <Image 
                source={{ uri: user.avatarUrl || 'https://via.placeholder.com/100' }} 
                style={styles.avatar} 
                contentFit="cover" 
              />
              <View style={styles.profileText}>
                <Text style={[styles.profileName, { color: colors.text }]}>{user.displayName || user.username}</Text>
                <Text style={[styles.profileHandle, { color: colors.textSecondary }]}>@{user.handle || user.username}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Pressable>
          ) : (
            <Pressable 
              style={[styles.profileCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
              onPress={() => handleRoute('/(onboarding)/login')}
            >
              <View style={[styles.avatar, { backgroundColor: colors.borderLight, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="person" size={24} color={colors.textSecondary} />
              </View>
              <View style={styles.profileText}>
                <Text style={[styles.profileName, { color: colors.text }]}>Guest User</Text>
                <Text style={[styles.profileHandle, { color: CultureTokens.indigo }]}>Tap to sign in or register</Text>
              </View>
              <Ionicons name="log-in-outline" size={24} color={colors.textSecondary} />
            </Pressable>
          )}

          <View style={styles.menuGrid}>
            {filteredItems.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => handleRoute(item.route)}
                style={({ pressed }) => [
                  styles.menuItem,
                  { backgroundColor: colors.surface, borderColor: colors.borderLight },
                  pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
                ]}
              >
                <View style={[styles.menuIconBox, { backgroundColor: (item.color || colors.text) + '15' }]}>
                  <Ionicons name={item.icon} size={22} color={item.color || colors.text} />
                </View>
                <Text style={[styles.menuItemText, { color: colors.text }]}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </Pressable>
            ))}
          </View>

          {isAuthenticated && (
            <Pressable
              onPress={handleLogout}
              style={[styles.logoutBtn, { borderColor: colors.borderLight }]}
              disabled={isLoggingOut}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
              <Text style={[styles.logoutText, { color: colors.error }]}>
                {isLoggingOut ? 'Logging out...' : 'Log Out'}
              </Text>
            </Pressable>
          )}

          <View style={styles.footer}>
            <Image source={require('@/assets/images/icon.png')} style={styles.footerLogo} />
            <Text style={[styles.footerText, { color: colors.textTertiary }]}>CulturePass v1.0.0</Text>
          </View>
          <View style={{ height: insets.bottom + 40 }} />
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  root: { flex: 1 },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerInner: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: { ...TextStyles.title2 },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { padding: 16 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: CardTokens.radius,
    borderWidth: 1,
    marginBottom: 24,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  profileText: { flex: 1, marginLeft: 16 },
  profileName: { ...TextStyles.title3, marginBottom: 2 },
  profileHandle: { ...TextStyles.callout },
  menuGrid: { gap: 12, marginBottom: 32 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: CardTokens.radius,
    borderWidth: 1,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuItemText: { flex: 1, ...TextStyles.callout, fontFamily: 'Poppins_600SemiBold' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: CardTokens.radius,
    borderWidth: 1,
    gap: 8,
    marginBottom: 32,
  },
  logoutText: { ...TextStyles.callout, fontFamily: 'Poppins_600SemiBold' },
  footer: { alignItems: 'center', gap: 8, opacity: 0.6 },
  footerLogo: { width: 32, height: 32, borderRadius: 8, filter: 'grayscale(100%)' },
  footerText: { ...TextStyles.caption },
});
