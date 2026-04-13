// @ts-nocheck
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/lib/auth';
import { FontFamily, FontSize, LineHeight, LetterSpacing } from '@/constants/theme';
import { LocationPicker } from '@/components/LocationPicker';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { BRAND_TAGLINE_SHORT, TabPageChromeRow } from '@/components/tabs/TabHeaderChrome';
import { TabHeaderNativeShell } from '@/components/tabs/TabHeaderNativeShell';

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
    <View style={[styles.topBarInner, Platform.OS === 'web' && { paddingHorizontal: hPad }]}>
      <TabPageChromeRow title="Discover" subtitle={BRAND_TAGLINE_SHORT} showHairline={false} />
    </View>
  );

  const renderTopBar = () => {
    if (Platform.OS === 'web') {
      return (
        <LiquidGlassPanel
          borderRadius={0}
          bordered={false}
          style={{
            zIndex: 100,
            borderBottomWidth: StyleSheet.hairlineWidth * 2,
            borderBottomColor: colors.borderLight,
          }}
          contentStyle={{ paddingTop: 0 }}
        >
          {TopBarContent}
        </LiquidGlassPanel>
      );
    }
    return (
      <TabHeaderNativeShell hPad={hPad}>
        {TopBarContent}
      </TabHeaderNativeShell>
    );
  };

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
          <View style={styles.mobileRow}>
            <View style={styles.mobileLeft}>
              <Text
                style={[styles.mobileGreeting, { color: colors.text }]}
                numberOfLines={1}
              >
                {greeting}
              </Text>
              <View style={styles.mobileMetaRow}>
                <LocationPicker variant="text" />
                {mobileMetaLabel ? (
                  <Text style={[styles.mobileMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                    {mobileMetaLabel}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topBarInner: {
    paddingVertical: 8,
    minHeight: 56,
  },

  mobileHero: {
    marginTop: 12,
    marginBottom: 14,
  },
  mobileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mobileLeft: {
    flex: 1,
    gap: 4,
  },
  mobileGreeting: {
    fontSize: FontSize.title2,
    fontFamily: FontFamily.bold,
    letterSpacing: LetterSpacing.tight,
    lineHeight: LineHeight.title2,
  },
  mobileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
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
    marginTop: 32,
    marginBottom: 24,
  },
  heroDesktopLeft: { flex: 1 },
  desktopMeta: { fontSize: FontSize.chip, fontFamily: FontFamily.regular, marginBottom: 4 },
  desktopGreeting: {
    fontSize: 32,
    fontFamily: FontFamily.bold,
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  desktopSub: {
    fontSize: FontSize.callout,
    fontFamily: FontFamily.regular,
    lineHeight: LineHeight.callout,
    marginTop: 6,
  },
  desktopActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 24 },
});

export const DiscoverHeader = React.memo(DiscoverHeaderComponent);
