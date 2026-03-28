import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Modal, ScrollView, Platform } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, usePathname } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { CultureTokens } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { LocationPicker } from "@/components/LocationPicker";
import { useLayout } from "@/hooks/useLayout";
import { routeWithRedirect } from "@/lib/routes";

export function WebTopBar() {
  const colors = useColors();
  const { isAuthenticated, user, logout } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const { isDesktop } = useLayout();
  const pathname = usePathname();

  const displayName = user?.displayName ?? user?.username ?? user?.id?.slice(0, 8) ?? 'You';
  const initials = displayName.trim().split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  // Tab route mapping (Profile removed — access via sidebar avatar / profile page quick menu)
  const tabRoutes = {
    Discover: '/(tabs)',
    Calendar: '/(tabs)/calendar',
    Community: '/(tabs)/communities',
    Perks: '/(tabs)/perks',
  };
  return (
    <View style={styles.container}>
      {/* Left: Burger + Logo + Tagline + LocationPicker */}
      <View style={styles.left}>
        <Pressable
          style={[styles.iconBtn, { padding: 0, marginRight: 12 }]}
          accessibilityLabel="Menu"
          onPress={() => setMenuVisible(true)}
        >
          {isAuthenticated ? (
            user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.headerAvatarImg} />
            ) : (
              <View style={styles.headerAvatarFallback}>
                <LinearGradient colors={['#0066CC', '#FFCC00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                <Text style={styles.headerAvatarText}>{initials}</Text>
              </View>
            )
          ) : (
            <Ionicons name="menu" size={32} color="#fff" />
          )}
        </Pressable>
        <Pressable style={styles.logoBlock} onPress={() => router.push('/(tabs)')} accessibilityLabel="Home">
          <LinearGradient
            colors={[CultureTokens.indigo, CultureTokens.coral]}
            style={styles.logoBg}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
          >
            <Ionicons name="globe-outline" size={22} color="#fff" />
          </LinearGradient>
          <View>
            <Text style={styles.appName}>CulturePass</Text>
            <Text style={styles.tagLine}>We Belong Anywhere.</Text>
          </View>
        </Pressable>

        {isDesktop && (
          <View style={{ marginLeft: 24 }}>
            <LocationPicker />
          </View>
        )}
      </View>
      
      {/* Center: Navigation Tabs */}
      <View style={styles.center}>
        {Object.entries(tabRoutes).map(([tab, route]) => {
          // Detect active state logically
          const normalizedPath = pathname === '/' ? '/(tabs)' : pathname;
          const isActive = normalizedPath === route || (route !== '/(tabs)' && normalizedPath.startsWith(route));

          return (
            <Pressable
              key={tab}
              style={styles.tab}
              onPress={() => router.push(route as any)}
              accessibilityLabel={tab}
            >
              <Text style={[styles.tabText, isActive && { color: '#FFC857', fontFamily: 'Poppins_700Bold' }]}>{tab}</Text>
              {isActive && <View style={styles.activeIndicator} />}
            </Pressable>
          );
        })}
      </View>
      
      {/* Right: Search, Notification, Map, Sign Up */}
      <View style={styles.right}>
        <Pressable
          style={styles.iconBtn}
          accessibilityLabel="Search"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/search');
          }}
        >
          <Ionicons name="search" size={20} color={CultureTokens.indigo} />
        </Pressable>
        <Pressable
          style={styles.iconBtn}
          accessibilityLabel="Notifications"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/notifications');
          }}
        >
          <Ionicons name="notifications-outline" size={20} color={CultureTokens.indigo} />
        </Pressable>
        <Pressable
          style={styles.iconBtn}
          accessibilityLabel="Map"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/map');
          }}
        >
          <Ionicons name="map-outline" size={20} color={CultureTokens.teal} />
        </Pressable>
        {!isAuthenticated && (
          <Pressable
            style={styles.signUpBtn}
            accessibilityLabel="Sign In"
            onPress={() => router.push(routeWithRedirect('/(onboarding)/login', pathname) as any)}
          >
            <Text style={styles.signUpText}>Sign In</Text>
          </Pressable>
        )}
      </View>

      {/* Side Menu Modal */}
      <Modal transparent visible={menuVisible} onRequestClose={() => setMenuVisible(false)} animationType="fade">
        <View style={[styles.menuOverlay, { backgroundColor: 'transparent' }]}>
          <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} onPress={() => setMenuVisible(false)} />
          <View style={[styles.menuContent, { backgroundColor: colors.surface }]}>
            <View style={styles.menuHeader}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>CulturePass</Text>
              <Pressable onPress={() => setMenuVisible(false)} hitSlop={12}>
                <Ionicons name="close" size={26} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

            {isAuthenticated ? (
              <View style={[styles.menuUserSection, { borderBottomColor: colors.borderLight }]}>
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.menuAvatarImg} />
                ) : (
                  <View style={styles.menuAvatarFallback}>
                    <LinearGradient colors={['#0066CC', '#FFCC00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                    <Text style={styles.menuAvatarText}>{initials}</Text>
                  </View>
                )}
                <Text style={[styles.menuUserName, { color: colors.text }]} numberOfLines={1}>{displayName}</Text>
                <Text style={[styles.menuUserEmail, { color: colors.textSecondary }]} numberOfLines={1}>{user?.email}</Text>
              </View>
            ) : (
              <View style={[styles.menuUserSection, { borderBottomColor: colors.borderLight }]}>
                <Pressable
                  style={styles.signInBtn}
                  onPress={() => {
                    setMenuVisible(false);
                    router.push(routeWithRedirect('/(onboarding)/login', pathname) as any);
                  }}
                >
                  <LinearGradient colors={['#0066CC', '#FFCC00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                  <Ionicons name="person-outline" size={18} color="#fff" />
                  <Text style={styles.signInText}>Sign In / Profile</Text>
                </Pressable>
              </View>
            )}

            <View style={styles.menuNavGroup}>
              {!isDesktop && (
                <View style={{ marginBottom: 16 }}>
                  <LocationPicker />
                </View>
              )}

              {/* Top links */}
              {[
                { label: 'Discover', icon: 'compass-outline', route: '/(tabs)' },
                { label: 'Explore', icon: 'search-outline', route: '/(tabs)/explore' },
                { label: 'Calendar', icon: 'calendar-outline', route: '/(tabs)/calendar' },
                { label: 'Communities', icon: 'people-outline', route: '/(tabs)/communities' },
                { label: 'Perks', icon: 'gift-outline', route: '/(tabs)/perks' },
                { label: 'Council', icon: 'business-outline', route: '/(tabs)/council' },
                { label: 'Map', icon: 'map-outline', route: '/map' },
                { label: 'Saved', icon: 'bookmark-outline', route: '/saved' },
                { label: 'Notifications', icon: 'notifications-outline', route: '/notifications' },
                { label: 'Profile', icon: 'person-outline', route: '/(tabs)/profile' },
                { label: 'Settings', icon: 'settings-outline', route: '/settings' },
              ].map((item, idx) => (
                <Pressable
                  key={idx}
                  style={[styles.menuNavItem]}
                  onPress={() => {
                    setMenuVisible(false);
                    router.push(item.route as any);
                  }}
                >
                  <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.textSecondary} />
                  <Text style={[styles.menuNavItemText, { color: colors.text }]}>{item.label}</Text>
                </Pressable>
              ))}

              <View style={[styles.menuDivider, { backgroundColor: colors.borderLight }]} />

              {[
                { label: 'Help & Support', icon: 'help-buoy-outline', route: '/help' },
                { label: 'Help Centre', icon: 'help-circle-outline', route: '/help' },
                { label: 'Terms & Privacy', icon: 'document-text-outline', route: '/legal/terms' },
                { label: 'Community Guidelines', icon: 'shield-checkmark-outline', route: '/legal/guidelines' },
                { label: 'About CulturePass', icon: 'information-circle-outline', route: '/about' },
              ].map((item, idx) => (
                <Pressable
                  key={`bottom-${idx}`}
                  style={[styles.menuNavItem]}
                  onPress={() => {
                    setMenuVisible(false);
                    router.push(item.route as any);
                  }}
                >
                  <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.textSecondary} />
                  <Text style={[styles.menuNavItemText, { color: colors.text }]}>{item.label}</Text>
                </Pressable>
              ))}

              {isAuthenticated && (
                <>
                  <View style={[styles.menuDivider, { backgroundColor: colors.borderLight }]} />
                  <Pressable
                    style={[styles.menuNavItem, { backgroundColor: CultureTokens.error + '10' }]}
                    onPress={() => {
                      setMenuVisible(false);
                      logout();
                    }}
                  >
                    <Ionicons name="log-out-outline" size={20} color={CultureTokens.error} />
                    <Text style={[styles.menuNavItemText, { color: CultureTokens.error }]}>Sign Out</Text>
                  </Pressable>
                </>
              )}
            </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0066CC',
    borderBottomWidth: 2,
    borderBottomColor: '#FFCC00',
    paddingVertical: 12,
    paddingHorizontal: 40,
    minHeight: 72,
    gap: 12,
    ...Platform.select({
      web: { boxShadow: '0px 2px 12px rgba(0,0,0,0.12)' },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 8,
      },
    }),
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  appName: {
    color: CultureTokens.indigo,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 32,
  },
  tagLine: {
    color: CultureTokens.gold,
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
    letterSpacing: 0.7,
  },
  logoBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    flex: 1,
    justifyContent: 'center',
  },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: 'relative',
  },
  tabText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 1,
    ...Platform.select({
      web: { textShadow: '0px 1px 2px #000' },
      default: {
        textShadowColor: '#000',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      },
    }),
  },
  activeIndicator: {
    height: 3,
    backgroundColor: '#FFC857',
    borderRadius: 2,
    position: 'absolute',
    bottom: -4,
    left: 10,
    right: 10,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  signUpBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFCC00',
  },
  signUpText: {
    color: '#FFC857',
    fontWeight: '700',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 1,
    ...Platform.select({
      web: { textShadow: '0px 1px 2px #22203A' },
      default: {
        textShadowColor: '#22203A',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      },
    }),
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  menuContent: {
    width: 320,
    height: '100%',
    padding: 32,
    ...Platform.select({
      web: { boxShadow: '5px 0px 30px rgba(0,0,0,0.15)' },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 20,
        shadowOffset: { width: 5, height: 0 },
        elevation: 10,
      },
    }),
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  menuTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
  },
  menuUserSection: {
    alignItems: 'center',
    marginBottom: 32,
    borderBottomWidth: 1,
    paddingBottom: 32,
  },
  menuAvatarImg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 16,
  },
  menuAvatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  menuAvatarText: {
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },
  menuUserName: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 4,
  },
  menuUserEmail: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    gap: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  signInText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
  menuNavGroup: {
    gap: 4,
  },
  menuNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  menuNavItemText: {
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
  },
  menuDivider: {
    height: 1,
    marginVertical: 8,
  },
  headerAvatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },
});
