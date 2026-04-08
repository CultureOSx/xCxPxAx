import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/lib/auth';
import { CultureTokens, FontFamily, FontSize, LineHeight, LetterSpacing } from '@/constants/theme';
import { LocationPicker } from '@/components/LocationPicker';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { BRAND_TAGLINE_SHORT, TabPageChromeRow } from '@/components/tabs/TabHeaderChrome';
import { TabHeaderNativeShell } from '@/components/tabs/TabHeaderNativeShell';

const HEADER_TAGLINE = BRAND_TAGLINE_SHORT;

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

  // Scale greeting font down for longer names so it never wraps
  const greetingFontSize = useMemo(() => {
    const len = greeting.length;
    if (len <= 20) return FontSize.hero;       // ≤ "Good morning, Alex" → full size
    if (len <= 26) return FontSize.hero - 2;   // medium names
    if (len <= 32) return FontSize.hero - 4;   // longer names
    return FontSize.hero - 6;                  // very long names
  }, [greeting]);
  const mobileMetaLabel = [currentTime, weatherSummary].filter(Boolean).join(' · ');

  const TopBarContent = (
    <View style={[styles.topBarInner, Platform.OS === 'web' && { paddingHorizontal: hPad }]}>
      <TabPageChromeRow title="Discover" subtitle={HEADER_TAGLINE} showHairline={false} />
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
            <Text style={[styles.desktopGreeting, { color: colors.text, fontSize: Math.min(36, greetingFontSize + 8) }]}>{greeting}</Text>
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
          <Text style={[styles.mobileGreeting, { color: colors.text, fontSize: greetingFontSize }]} numberOfLines={1}>
            {greeting}
          </Text>
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
    paddingVertical: 8,
    minHeight: 56,
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
  desktopSub: {
    fontSize: FontSize.callout,
    fontFamily: FontFamily.regular,
    lineHeight: LineHeight.callout,
    marginTop: 8,
  },
  desktopActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 24 },
});

export const DiscoverHeader = React.memo(DiscoverHeaderComponent);
