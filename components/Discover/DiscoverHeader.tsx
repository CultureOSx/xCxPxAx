import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/lib/auth';
import { CultureTokens } from '@/constants/theme';
import { LocationPicker } from '@/components/LocationPicker';
import { BrandWordmark } from '@/components/ui/BrandWordmark';
import * as Haptics from 'expo-haptics';

const isWeb = Platform.OS === 'web';
const isIOS = Platform.OS === 'ios';

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
  const { isDesktop, hPad } = useLayout();
  const { user } = useAuth();

  const { timeGreeting, firstName } = useMemo(() => {
    const hour = new Date().getHours();
    const tg = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const fn = user?.displayName?.split(' ')[0] ?? user?.username ?? null;
    return { timeGreeting: tg, firstName: fn };
  }, [user?.displayName, user?.username]);

  const greeting = firstName ? `${timeGreeting}, ${firstName}` : timeGreeting;

  const haptic = () => { if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };

  const TopBarContent = (
    <View style={[styles.topBarInner, { paddingHorizontal: hPad }]}>
      {/* Brand */}
      <Pressable
        style={styles.brandBlock}
        onPress={() => { haptic(); router.push('/(tabs)' as any); }}
        accessibilityRole="button"
        accessibilityLabel="CulturePass home"
      >
        <View style={styles.logoCircle}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logoImg}
            contentFit="contain"
          />
        </View>
        <BrandWordmark size="sm" withTagline={false} light />
      </Pressable>

      <View style={styles.flex1} />

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={styles.iconBtn}
          onPress={() => { haptic(); router.push('/search' as any); }}
          accessibilityRole="button"
          accessibilityLabel="Search"
        >
          <Ionicons name="search" size={20} color="#fff" />
        </Pressable>

        {isAuthenticated && (
          <Pressable
            style={styles.iconBtn}
            onPress={() => { haptic(); router.push('/notifications' as any); }}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications" size={20} color="#fff" />
            <View style={styles.notifDot} />
          </Pressable>
        )}

        <Pressable
          style={[styles.iconBtn, styles.menuBtn]}
          onPress={() => { haptic(); router.push('/menu' as any); }}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
        >
          <Ionicons name="menu" size={22} color="#fff" />
        </Pressable>
      </View>
    </View>
  );

  const renderTopBar = () => {
    if (isIOS) {
      return (
        <BlurView
          intensity={80}
          tint="dark"
          style={[styles.topBar, { paddingTop: insets.top }]}
        >
          {TopBarContent}
        </BlurView>
      );
    }
    return (
      <View style={[styles.topBar, styles.topBarAndroid, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['rgba(11,11,20,0.98)', 'rgba(11,11,20,0.85)']}
          style={StyleSheet.absoluteFillObject}
        />
        {TopBarContent}
      </View>
    );
  };

  return (
    <View>
      {!isDesktop && renderTopBar()}

      {isDesktop ? (
        <View style={[styles.heroDesktop, { paddingHorizontal: hPad }]}>
          <View style={styles.heroDesktopLeft}>
            <Text style={[styles.desktopMeta, { color: colors.textSecondary }]}>
              {currentTime}{weatherSummary ? ` · ${weatherSummary}` : ''}
            </Text>
            <Text style={[styles.desktopGreeting, { color: colors.text }]}>{greeting}</Text>
            <Text style={styles.desktopTagline}>Belong Anywhere</Text>
            <Text style={[styles.desktopSub, { color: colors.textSecondary }]}>
              {`Explore festivals, communities, and events in ${city}.`}
            </Text>
          </View>
          <View style={styles.desktopActions}>
            <LocationPicker />
            <Pressable style={[styles.iconBtn, styles.desktopIconBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]} onPress={() => router.push('/search' as any)}>
              <Ionicons name="search" size={20} color={colors.text} />
            </Pressable>
            {isAuthenticated && (
              <Pressable style={[styles.iconBtn, styles.desktopIconBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]} onPress={() => router.push('/notifications' as any)}>
                <Ionicons name="notifications-outline" size={20} color={colors.text} />
              </Pressable>
            )}
            <Pressable style={[styles.iconBtn, styles.desktopIconBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]} onPress={() => router.push('/menu' as any)}>
              <Ionicons name="menu" size={22} color={colors.text} />
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={[styles.mobileHero, { paddingHorizontal: hPad }]}>
          <Text style={[styles.mobileGreeting, { color: colors.text }]} numberOfLines={1}>
            {greeting}
          </Text>
          <Text style={styles.mobileTagline}>Belong Anywhere</Text>
          <View style={styles.mobileMetaRow}>
            <LocationPicker variant="text" />
            {(currentTime || weatherSummary) && (
              <Text style={[styles.mobileMeta, { color: colors.textSecondary }]}>
                {currentTime}{weatherSummary ? ` · ${weatherSummary}` : ''}
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },

  /* ── Top Bar ── */
  topBar: {
    zIndex: 100,
    overflow: 'hidden',
  },
  topBarAndroid: {
    backgroundColor: 'transparent',
  },
  topBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    minHeight: 56,
  },
  brandBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  logoImg: { width: 36, height: 36 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  notifDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: CultureTokens.coral,
    borderWidth: 1.5,
    borderColor: '#0B0B14',
  },

  /* ── Mobile Hero ── */
  mobileHero: {
    marginTop: 16,
    marginBottom: 20,
    gap: 4,
  },
  mobileGreeting: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  mobileTagline: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    color: CultureTokens.gold,
    textTransform: 'uppercase',
    letterSpacing: 2.5,
  },
  mobileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  mobileMeta: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    opacity: 0.7,
  },

  /* ── Desktop Hero ── */
  heroDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 40,
    marginBottom: 32,
  },
  heroDesktopLeft: { flex: 1 },
  desktopMeta: { fontSize: 13, fontFamily: 'Poppins_400Regular', marginBottom: 4 },
  desktopGreeting: { fontSize: 36, fontFamily: 'Poppins_700Bold', letterSpacing: -1, lineHeight: 42 },
  desktopTagline: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    color: CultureTokens.gold,
    textTransform: 'uppercase',
    letterSpacing: 2.5,
    marginTop: 4,
    marginBottom: 10,
  },
  desktopSub: { fontSize: 15, fontFamily: 'Poppins_400Regular', lineHeight: 22 },
  desktopActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 24 },
  desktopIconBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
});

export const DiscoverHeader = React.memo(DiscoverHeaderComponent);
