import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/lib/auth';
import { TextStyles } from '@/constants/typography';
import { CultureTokens } from '@/constants/theme';
import { LocationPicker } from '@/components/LocationPicker';
import { BrandWordmark } from '@/components/ui/BrandWordmark';

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
  isAuthenticated,
}: DiscoverHeaderProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { isDesktop } = useLayout();
  const { user } = useAuth();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const { timeGreeting, firstName } = useMemo(() => {
    const hour = new Date().getHours();
    const tg = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const fn = user?.displayName?.split(' ')[0] ?? user?.username ?? null;
    return { timeGreeting: tg, firstName: fn };
  }, [user?.displayName, user?.username]);

  const greeting = firstName ? `${timeGreeting}, ${firstName}` : timeGreeting;

  const renderTopBar = () => (
    <View style={[styles.topBar, { paddingTop: insets.top + (isWeb ? 0 : 4) }]}>
      <LinearGradient
        colors={['rgba(11,11,20,0.95)', 'rgba(11,11,20,0)']}
        style={[StyleSheet.absoluteFillObject, styles.topBarGradient]}
      />
      <View style={styles.brandBlock}>
        <View style={styles.logoCircle}>
          <LinearGradient
            colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0)']}
            style={StyleSheet.absoluteFillObject}
          />
          <Image source={require('@/assets/images/icon.png')} style={styles.logoImg} />
        </View>
        <BrandWordmark size="sm" withTagline light />
      </View>

      <View style={styles.topBarSpacer} />

      <View style={styles.topBarActions}>
        <Pressable
          style={styles.headerIconBtn}
          onPress={() => router.push('/search' as any)}
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
        <Pressable
          style={styles.headerIconBtn}
          onPress={() => router.push('/menu' as any)}
        >
          <Ionicons name="menu" size={26} color="#FFFFFF" />
        </Pressable>
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
                <Text style={[styles.heroTitleDesktop, { color: colors.text }]}>{greeting}</Text>
                <Text style={styles.heroTaglineDesktop}>Belong Anywhere</Text>
                <Text style={[styles.heroSubtitleDesktop, { color: colors.textSecondary }]}>
                  Explore festivals, communities, and events in {city}.
                </Text>
            </View>
            <View style={styles.desktopActionsRight}>
                <LocationPicker />
                <Pressable style={styles.desktopHeaderIconBtn} onPress={() => router.push('/search' as any)}>
                  <Ionicons name="search" size={24} color={colors.text} />
                </Pressable>
                {isAuthenticated && (
                  <Pressable style={styles.desktopHeaderIconBtn} onPress={() => router.push('/notifications' as any)}>
                    <Ionicons name="notifications-outline" size={24} color={colors.text} />
                  </Pressable>
                )}
                <Pressable style={styles.desktopHeaderIconBtn} onPress={() => router.push('/menu' as any)}>
                  <Ionicons name="menu" size={26} color={colors.text} />
                </Pressable>
            </View>
        </View>
      ) : (
        <View style={styles.mobileHeroSection}>
          <Text style={[styles.heroGreetingMain, { color: colors.text }]} numberOfLines={1}>
            {greeting}
          </Text>
          <Text style={styles.heroTagline}>Belong Anywhere</Text>
          <LocationPicker variant="text" />
          <Text style={[styles.heroTimeWeather, { color: colors.textSecondary }]}>
            {currentTime}{weatherSummary ? ` · ${weatherSummary}` : ''}
          </Text>
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
  mobileHeroSection: { paddingHorizontal: 20, marginBottom: 24, marginTop: 8, gap: 6 },
  heroGreetingRow: { flexDirection: 'column', alignItems: 'flex-start' },
  heroGreetingMain: {
    fontSize: 30,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  heroTagline: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: CultureTokens.gold,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  heroTimeWeather: { ...TextStyles.caption, opacity: 0.75 },
  heroGreetingMobile: { ...TextStyles.callout },
  heroTaglineDesktop: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: CultureTokens.gold,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 2,
    marginBottom: 8,
  },
});

export const DiscoverHeader = React.memo(DiscoverHeaderComponent);
