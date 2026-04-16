import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/lib/auth';
import { FontFamily, FontSize, LineHeight, LetterSpacing, Vitrine } from '@/constants/theme';
import { useDiscoverVitrine } from '@/components/Discover/DiscoverVitrineContext';
import { LocationPicker } from '@/components/LocationPicker';
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
  const vitrine = useDiscoverVitrine();
  const { isDesktop, hPad } = useLayout();
  const { user } = useAuth();
  const greetingColor = vitrine ? Vitrine.primary : colors.text;
  const metaColor = vitrine ? Vitrine.onSurfaceVariant : colors.textSecondary;

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
        <View
          style={{
            zIndex: 100,
            backgroundColor: colors.surface,
            borderBottomWidth: StyleSheet.hairlineWidth * 2,
            borderBottomColor: colors.borderLight,
          }}
        >
          {TopBarContent}
        </View>
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
          <View style={styles.heroDesktopRow}>
            {vitrine ? (
              <View style={[styles.heritageBar, { backgroundColor: Vitrine.tertiary }]} accessibilityElementsHidden />
            ) : null}
            <View style={styles.heroDesktopLeft}>
              <Text style={[styles.desktopMeta, { color: metaColor }]}>
                {currentTime}
                {weatherSummary ? ` · ${weatherSummary}` : ''}
              </Text>
              <Text
                style={[styles.desktopGreeting, { color: greetingColor, fontSize: Math.min(36, greetingFontSize + 8) }]}
              >
                {greeting}
              </Text>
              <Text style={[styles.desktopSub, { color: metaColor }]}>
                {`Explore festivals, communities, and events in ${city}.`}
              </Text>
            </View>
          </View>
          <View style={styles.desktopActions}>
            <LocationPicker />
          </View>
        </View>
      ) : (
        <View style={[styles.mobileHero, { paddingHorizontal: hPad }]}>
          <Text style={[styles.mobileGreeting, { color: greetingColor, fontSize: greetingFontSize }]} numberOfLines={1}>
            {greeting}
          </Text>
          <View style={styles.mobileMetaRow}>
            <View style={styles.mobileMetaLocationWrap}>
              <LocationPicker variant="text" />
            </View>
            {mobileMetaLabel ? (
              <Text style={[styles.mobileMeta, { color: metaColor }]} numberOfLines={1}>
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
  heroDesktopRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  heritageBar: {
    width: 4,
    borderRadius: 3,
    marginTop: 6,
    minHeight: 56,
    alignSelf: 'flex-start',
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
