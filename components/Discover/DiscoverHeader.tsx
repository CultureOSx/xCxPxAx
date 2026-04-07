import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/lib/auth';
import { CultureTokens, FontFamily, FontSize, LineHeight, LetterSpacing } from '@/constants/theme';
import { LocationPicker } from '@/components/LocationPicker';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { TabBrandHeader } from '@/components/tabs/TabBrandHeader';

const HEADER_TAGLINE = 'Discover ❤️ Enjoy Culture.';

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
  const mobileMetaLabel = [currentTime, weatherSummary].filter(Boolean).join(' · ');

  const TopBarContent = (
    <View style={[styles.topBarInner, { paddingHorizontal: hPad }]}>
      <TabBrandHeader />
    </View>
  );

  const renderTopBar = () => (
    <LiquidGlassPanel
      borderRadius={0}
      bordered={false}
      style={{
        zIndex: 100,
        borderBottomWidth: StyleSheet.hairlineWidth * 2,
        borderBottomColor: colors.borderLight,
      }}
      contentStyle={{ paddingTop: Platform.OS === 'web' ? 0 : insets.top }}
    >
      {TopBarContent}
    </LiquidGlassPanel>
  );

  return (
    <View>
      {renderTopBar()}

      {isDesktop ? (
        <View style={[styles.heroDesktop, { paddingHorizontal: hPad }]}>
          <View style={styles.heroDesktopLeft}>
            <Text style={[styles.desktopMeta, { color: colors.textSecondary }]}>
              {currentTime}
              {weatherSummary ? ` · ${weatherSummary}` : ''}
            </Text>
            <Text style={[styles.desktopGreeting, { color: colors.text }]}>{greeting}</Text>
            <Text style={[styles.desktopTagline, { color: CultureTokens.gold }]}>{HEADER_TAGLINE}</Text>
            <Text style={[styles.desktopSub, { color: colors.textSecondary }]}>
              {`Explore festivals, communities, and events in ${city}.`}
            </Text>
          </View>
          <View style={styles.desktopActions}>
            <LocationPicker />
          </View>
        </View>
      ) : (
        <View style={[styles.mobileHero, { paddingHorizontal: hPad }]}>
          <Text style={[styles.mobileGreeting, { color: colors.text }]} numberOfLines={1}>
            {greeting}
          </Text>
          <Text style={[styles.mobileTagline, { color: CultureTokens.gold }]}>{HEADER_TAGLINE}</Text>
          <View style={styles.mobileMetaRow}>
            <View style={styles.mobileMetaLocationWrap}>
              <LocationPicker variant="text" />
            </View>
            {mobileMetaLabel ? (
              <Text style={[styles.mobileMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                {mobileMetaLabel}
              </Text>
            ) : null}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    minHeight: 64,
  },

  mobileHero: {
    marginTop: 16,
    marginBottom: 20,
    gap: 4,
  },
  mobileGreeting: {
    fontSize: FontSize.hero,
    fontFamily: FontFamily.bold,
    letterSpacing: LetterSpacing.tight,
    lineHeight: LineHeight.hero,
  },
  mobileTagline: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.2,
  },
  mobileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  mobileMetaLocationWrap: {
    flexShrink: 1,
  },
  mobileMeta: {
    fontSize: FontSize.caption,
    fontFamily: FontFamily.regular,
    opacity: 0.85,
  },

  heroDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 40,
    marginBottom: 32,
  },
  heroDesktopLeft: { flex: 1 },
  desktopMeta: { fontSize: FontSize.chip, fontFamily: FontFamily.regular, marginBottom: 4 },
  desktopGreeting: {
    fontSize: 36,
    fontFamily: FontFamily.bold,
    letterSpacing: -1,
    lineHeight: 42,
  },
  desktopTagline: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.2,
    marginTop: 4,
    marginBottom: 12,
  },
  desktopSub: { fontSize: FontSize.callout, fontFamily: FontFamily.regular, lineHeight: LineHeight.callout },
  desktopActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 24 },
});

export const DiscoverHeader = React.memo(DiscoverHeaderComponent);
