import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { TextStyles } from '@/constants/typography';
import { CultureTokens } from '@/constants/theme';
import { LocationPicker } from '@/components/LocationPicker';

const isWeb = Platform.OS === 'web';

interface DiscoverHeaderProps {
  currentTime: string;
  weatherSummary: string;
  city: string;
  country: string;
  isAuthenticated: boolean;
  onRefresh?: () => void;
}

function DiscoverHeaderComponent({ 
  currentTime, 
  weatherSummary, 
  city, 
  country, 
  isAuthenticated,
  onRefresh,
}: DiscoverHeaderProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { isDesktop } = useLayout();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const renderTopBar = () => (
    <View style={[styles.topBar, { paddingTop: insets.top + (isWeb ? 0 : 4) }]}>
      <LinearGradient
        colors={['rgba(11,11,20,0.95)', 'rgba(11,11,20,0)']}
        style={[StyleSheet.absoluteFillObject, styles.topBarGradient]}
      />
      <View style={styles.brandBlock}>
        <View style={styles.logoCircle}>
          <Image source={require('@/assets/images/icon.png')} style={styles.logoImg} />
        </View>
        <View style={styles.brandTextBlock}>
          <Text style={styles.brandAppName}>CulturePass</Text>
          <Text style={styles.brandTagline}>Explore Culture</Text>
        </View>
      </View>

      <View style={styles.topBarSpacer} />

      <View style={styles.topBarActions}>
        <Pressable 
          style={styles.headerIconBtn} 
          onPress={() => router.push('/search/index' as any)}
        >
          <Ionicons name="search" size={22} color="#FFFFFF" />
        </Pressable>
        {isAuthenticated && (
          <Pressable 
            style={styles.headerIconBtn} 
            onPress={() => router.push('/notifications' as any)}
          >
            <Ionicons name="notifications" size={22} color="#FFFFFF" />
            <View style={styles.notifDot} />
          </Pressable>
        )}
      </View>
    </View>
  );

  return (
    <View>
      {!isDesktop && renderTopBar()}

      {isDesktop ? (
        <View style={styles.heroSectionDesktop}>
            <View style={styles.heroDesktopLeft}>
                <Text style={[styles.heroGreetingDesktop, { color: colors.textSecondary }]}>
                  {currentTime} · {weatherSummary}
                </Text>
                <Text style={[styles.heroTitleDesktop, { color: colors.text }]}>Discover Your Culture</Text>
                <Text style={[styles.heroSubtitleDesktop, { color: colors.textSecondary }]}>
                  Explore festivals, communities, and events in {city}.
                </Text>
            </View>
            <View style={styles.desktopActionsRight}>
                <LocationPicker />
                <Pressable style={styles.desktopHeaderIconBtn} onPress={() => router.push('/search/index' as any)}>
                  <Ionicons name="search" size={24} color={colors.text} />
                </Pressable>
                {isAuthenticated && (
                  <Pressable style={styles.desktopHeaderIconBtn} onPress={() => router.push('/notifications' as any)}>
                    <Ionicons name="notifications-outline" size={24} color={colors.text} />
                  </Pressable>
                )}
            </View>
        </View>
      ) : (
        <View style={styles.mobileHeroSection}>
          <View style={styles.heroGreetingRow}>
              <View>
                <Text style={[styles.heroGreetingMain, { color: colors.text }]}>Hello Culture</Text>
                <Text style={[styles.heroGreetingMobile, { color: colors.textSecondary }]}>
                  {currentTime} · {weatherSummary}
                </Text>
              </View>
              <LocationPicker />
          </View>
        </View>
      )}
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 64,
    backgroundColor: 'transparent',
    zIndex: 100,
  },
  topBarGradient: { zIndex: -1 },
  brandBlock: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImg: { width: 28, height: 28, borderRadius: 14 },
  brandTextBlock: { gap: 0 },
  brandAppName: { ...TextStyles.headline, color: '#FFFFFF', lineHeight: 20 },
  brandTagline: { ...TextStyles.caption, color: 'rgba(255, 255, 255, 0.9)', marginTop: 1 },
  topBarSpacer: { flex: 1 },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: CultureTokens.coral,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  heroSectionDesktop: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    marginTop: 40, 
    marginBottom: 32 
  },
  heroDesktopLeft: { flex: 1 },
  heroGreetingDesktop: { ...TextStyles.headline, marginBottom: 6 },
  heroTitleDesktop: { ...TextStyles.display, letterSpacing: -1 },
  heroSubtitleDesktop: { ...TextStyles.bodyMedium },
  desktopActionsRight: { flexDirection: 'row', alignItems: 'center', gap: 12, marginLeft: 20 },
  desktopHeaderIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileHeroSection: { paddingHorizontal: 20, marginBottom: 20, marginTop: 16 },
  heroGreetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroGreetingMain: { ...TextStyles.title2, marginBottom: 4 },
  heroGreetingMobile: { ...TextStyles.callout },
});

export const DiscoverHeader = React.memo(DiscoverHeaderComponent);
