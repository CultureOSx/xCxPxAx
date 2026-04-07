import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/lib/auth';
import { routeWithRedirect } from '@/lib/routes';
import { useColors } from '@/hooks/useColors';
import { CultureTokens } from '@/constants/theme';
import { MAIN_TAB_UI } from '@/components/tabs/mainTabTokens';

const isWeb = Platform.OS === 'web';
const HEADER_TAGLINE = 'Discover Culture.';

interface TabBrandHeaderProps {
  showMenu?: boolean;
  compact?: boolean;
}

export function TabBrandHeader({ showMenu = true, compact = false }: TabBrandHeaderProps) {
  const colors = useColors();
  const { isAuthenticated } = useAuth();

  const haptic = () => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  return (
    <View style={styles.wrapper}>
      {/* Glass base */}
      <BlurView
        intensity={colors.isDark ? 55 : 70}
        tint={colors.isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle brand ambient wash */}
      <LinearGradient
        colors={
          colors.isDark
            ? ['rgba(44,42,114,0.18)', 'transparent']
            : ['rgba(44,42,114,0.06)', 'transparent']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.inner}>
        {/* ── Brand lockup ── */}
        <Pressable
          style={styles.brandPress}
          onPress={() => { haptic(); router.push('/(tabs)' as const); }}
          accessibilityRole="button"
          accessibilityLabel="CulturePass home"
        >
          {/* Logo with gradient ring */}
          <View style={styles.logoRingOuter}>
            <LinearGradient
              colors={[CultureTokens.indigo, CultureTokens.teal]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoRingGradient}
            >
              <View style={[styles.logoRingInner, { backgroundColor: colors.background }]}>
                <Image
                  source={require('@/assets/images/culturepass-logo.png')}
                  style={styles.logo}
                  contentFit="cover"
                />
              </View>
            </LinearGradient>
          </View>

          {/* Text */}
          <View style={styles.brandTextWrap}>
            <Text
              style={[
                styles.brandName,
                compact && styles.brandNameCompact,
                { color: colors.text },
              ]}
              numberOfLines={1}
            >
              CulturePass
            </Text>
            {!compact && (
              <Text
                style={[styles.brandTagline, { color: CultureTokens.gold }]}
                numberOfLines={1}
              >
                {HEADER_TAGLINE}
              </Text>
            )}
          </View>
        </Pressable>

        {/* ── Action row ── */}
        <View style={styles.actions}>
          {/* Search */}
          <Pressable
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: colors.isDark
                  ? 'rgba(255,255,255,0.09)'
                  : 'rgba(0,0,0,0.055)',
                borderColor: colors.isDark
                  ? 'rgba(255,255,255,0.13)'
                  : 'rgba(0,0,0,0.08)',
              },
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => { haptic(); router.push('/search' as const); }}
            accessibilityRole="button"
            accessibilityLabel="Search"
          >
            <Ionicons name="search" size={MAIN_TAB_UI.iconSize.md} color={colors.text} />
          </Pressable>

          {/* Notifications */}
          <Pressable
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: colors.isDark
                  ? 'rgba(255,255,255,0.09)'
                  : 'rgba(0,0,0,0.055)',
                borderColor: colors.isDark
                  ? 'rgba(255,255,255,0.13)'
                  : 'rgba(0,0,0,0.08)',
              },
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => {
              haptic();
              if (isAuthenticated) {
                router.push('/notifications' as const);
                return;
              }
              router.push(routeWithRedirect('/(onboarding)/login', '/notifications'));
            }}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Ionicons
              name={isAuthenticated ? 'notifications' : 'notifications-outline'}
              size={MAIN_TAB_UI.iconSize.md}
              color={colors.text}
            />
            {isAuthenticated && (
              <View style={[styles.notifDot, { borderColor: colors.background }]} />
            )}
          </Pressable>

          {/* Menu */}
          {showMenu && (
            <Pressable
              style={({ pressed }) => [
                styles.iconBtn,
                styles.menuBtn,
                {
                  backgroundColor: colors.isDark
                    ? 'rgba(255,255,255,0.09)'
                    : 'rgba(0,0,0,0.055)',
                  borderColor: colors.isDark
                    ? 'rgba(255,255,255,0.16)'
                    : 'rgba(0,0,0,0.1)',
                },
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => { haptic(); router.push('/menu' as const); }}
              accessibilityRole="button"
              accessibilityLabel="Open menu"
            >
              <Ionicons name="menu" size={MAIN_TAB_UI.iconSize.lg} color={colors.text} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Gradient divider */}
      <LinearGradient
        colors={[CultureTokens.indigo, CultureTokens.teal, CultureTokens.gold]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.divider}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    paddingBottom: 10,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  brandPress: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  // Gradient ring around logo
  logoRingOuter: {
    width: 42,
    height: 42,
    borderRadius: 13,
    flexShrink: 0,
  },
  logoRingGradient: {
    flex: 1,
    borderRadius: 13,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRingInner: {
    flex: 1,
    width: '100%',
    borderRadius: 11,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 38,
    height: 38,
  },
  brandTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  brandName: {
    fontSize: Platform.OS === 'web' ? 20 : 22,
    lineHeight: Platform.OS === 'web' ? 24 : 26,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.4,
  },
  brandNameCompact: {
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  brandTagline: {
    marginTop: 1,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.3,
    opacity: 0.9,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtn: {},
  notifDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: CultureTokens.coral,
    borderWidth: 1.5,
  },
  divider: {
    height: 1.5,
    width: '100%',
    marginTop: 10,
    opacity: 0.55,
  },
});
