import React, { useMemo, type ComponentProps } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Linking,
} from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useCultureToday } from '@/contexts/CultureTodayContext';
import { useDiscoverVitrine } from '@/components/Discover/DiscoverVitrineContext';
import { useDiscoverRailInsets } from '@/components/Discover/discoverLayout';
import { getRepresentativeDayKeyForMoment } from '@/features/cultureToday';
import {
  CultureTokens,
  FontFamily,
  FontSize,
  LineHeight,
  LetterSpacing,
  Vitrine,
  vitrineGhostBorder,
  CardTokens,
} from '@/constants/theme';
const PILL_ICON_SIZE = 18;
const PILL_GLYPH_SIZE = 16;

function PillIcon({
  name,
  color,
}: {
  name: ComponentProps<typeof Ionicons>['name'];
  color: string;
}) {
  return (
    <View style={styles.pillIconSlot} accessibilityElementsHidden importantForAccessibility="no">
      <Ionicons name={name} size={PILL_GLYPH_SIZE} color={color} />
    </View>
  );
}

/**
 * Discover-only Culture Today — editorial “moment” card below the greeting.
 * Vitrine-aware (Gallery White + plum) or default night-festival surfaces.
 */
export function DiscoverCultureTodayCard() {
  const colors = useColors();
  const vitrine = useDiscoverVitrine();
  const { active, dismiss } = useCultureToday();
  const { headerPadStyle } = useDiscoverRailInsets();

  const dayKey = useMemo(() => (active ? getRepresentativeDayKeyForMoment(active) : null), [active]);

  if (!active) return null;

  const onDismiss = () => {
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
    dismiss();
  };

  const openLearnMore = () => {
    if (!active.learnMoreUrl) return;
    void Linking.openURL(active.learnMoreUrl).catch(() => {});
  };

  const borderColor = vitrine ? vitrineGhostBorder() : colors.borderLight;
  const cardBg = vitrine ? Vitrine.surfaceContainerHigh : colors.surfaceElevated;
  const kickerColor = vitrine ? Vitrine.primaryContainer : CultureTokens.indigo;
  const headlineColor = vitrine ? Vitrine.primary : colors.text;
  const bodyColor = vitrine ? Vitrine.onSurfaceVariant : colors.textSecondary;
  const accentBar = vitrine ? Vitrine.tertiary : CultureTokens.teal;
  const pillBorder = vitrine ? `${Vitrine.primary}35` : `${CultureTokens.indigo}40`;
  const pillText = vitrine ? Vitrine.primary : CultureTokens.indigo;
  const glowColors = vitrine
    ? ([`${Vitrine.primary}22`, `${Vitrine.secondaryContainer}18`, 'transparent'] as const)
    : ([`${CultureTokens.indigo}18`, `${CultureTokens.teal}12`, 'transparent'] as const);

  return (
    <View style={[styles.wrap, headerPadStyle]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: cardBg,
            borderColor,
            ...(Platform.OS === 'web'
              ? { boxShadow: vitrine ? '0 10px 36px rgba(46, 0, 82, 0.06)' : '0 8px 28px rgba(0,0,0,0.06)' }
              : vitrine
                ? {
                    shadowColor: Vitrine.primary,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.08,
                    shadowRadius: 20,
                    elevation: 3,
                  }
                : {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.07,
                    shadowRadius: 14,
                    elevation: 2,
                  }),
          },
        ]}
        accessibilityRole="summary"
        accessibilityLabel={`Culture Today: ${active.headline}`}
      >
        <LinearGradient
          colors={[...glowColors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.glow}
          pointerEvents="none"
        />

        <Pressable
          onPress={onDismiss}
          hitSlop={14}
          style={({ pressed }) => [styles.dismissFab, pressed && { opacity: 0.65 }]}
          accessibilityRole="button"
          accessibilityLabel="Dismiss Culture Today"
        >
          <Ionicons name="close" size={18} color={bodyColor} />
        </Pressable>

        <View style={styles.row}>
          <View style={styles.leftRail}>
            <View style={[styles.accentBar, { backgroundColor: accentBar }]} />
            <View style={[styles.dateBadge, { borderColor: pillBorder, backgroundColor: vitrine ? Vitrine.surfaceContainerLowest : colors.background }]}>
              <Ionicons name="calendar-clear-outline" size={20} color={kickerColor} />
            </View>
          </View>

          <View style={styles.copy}>
            <Text style={[styles.series, { color: bodyColor }]}>Reimagine</Text>
            <View style={styles.kickerRow}>
              <Text style={[styles.kickerDot, { backgroundColor: CultureTokens.gold }]} />
              <Text style={[styles.kicker, { color: kickerColor }]}>Today we celebrate</Text>
            </View>
            <Text style={[styles.headline, { color: headlineColor }]} maxFontSizeMultiplier={1.3}>
              {active.headline}
            </Text>
            <Text style={[styles.body, { color: bodyColor }]} numberOfLines={4} maxFontSizeMultiplier={1.25}>
              {active.message}
            </Text>

            <View style={styles.pills}>
              {active.learnMoreUrl ? (
                <Pressable
                  onPress={openLearnMore}
                  style={({ pressed }) => [
                    styles.pill,
                    { borderColor: pillBorder, backgroundColor: vitrine ? Vitrine.surfaceContainerLow : colors.background },
                    pressed && { opacity: 0.85 },
                    Platform.OS === 'web' && { cursor: 'pointer' as const },
                  ]}
                  accessibilityRole="link"
                  accessibilityLabel="Open story and sources"
                >
                  <PillIcon name="document-text-outline" color={pillText} />
                  <Text style={[styles.pillLabel, { color: pillText }]}>Story & sources</Text>
                </Pressable>
              ) : null}

              {dayKey ? (
                <Link href={`/culture-today/${dayKey}`} asChild>
                  <Pressable
                    style={({ pressed }) => [
                      styles.pill,
                      { borderColor: pillBorder, backgroundColor: vitrine ? Vitrine.surfaceContainerLow : colors.background },
                      pressed && { opacity: 0.85 },
                      Platform.OS === 'web' && { cursor: 'pointer' as const },
                    ]}
                    accessibilityRole="link"
                    accessibilityLabel="Open this calendar day"
                  >
                    <PillIcon name="calendar-outline" color={pillText} />
                    <Text style={[styles.pillLabel, { color: pillText }]}>This day</Text>
                  </Pressable>
                </Link>
              ) : null}

              <Link href="/culture-today" asChild>
                <Pressable
                  style={({ pressed }) => [
                    styles.pill,
                    { borderColor: pillBorder, backgroundColor: vitrine ? Vitrine.surfaceContainerLow : colors.background },
                    pressed && { opacity: 0.85 },
                    Platform.OS === 'web' && { cursor: 'pointer' as const },
                  ]}
                  accessibilityRole="link"
                  accessibilityLabel="Open full Culture Today calendar"
                >
                  <PillIcon name="grid-outline" color={pillText} />
                  <Text style={[styles.pillLabel, { color: pillText }]}>365 calendar</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 6,
  },
  card: {
    borderRadius: CardTokens.radius + 4,
    borderWidth: 1,
    overflow: 'hidden',
    paddingVertical: 16,
    paddingHorizontal: 14,
    paddingRight: 36,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 1,
  },
  dismissFab: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 14,
    zIndex: 1,
  },
  leftRail: {
    alignItems: 'center',
    gap: 10,
  },
  accentBar: {
    width: 3,
    height: 72,
    borderRadius: 2,
  },
  dateBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  series: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.caption,
    letterSpacing: LetterSpacing.cap,
    textTransform: 'uppercase',
    opacity: 0.92,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kickerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  kicker: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.caption,
    letterSpacing: LetterSpacing.wider,
    textTransform: 'uppercase',
  },
  headline: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.title2,
    lineHeight: LineHeight.title2,
    letterSpacing: -0.35,
    marginTop: 2,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.callout,
    lineHeight: LineHeight.callout,
    marginTop: 4,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillIconSlot: {
    width: PILL_ICON_SIZE,
    height: PILL_ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.caption,
    lineHeight: PILL_ICON_SIZE,
    ...Platform.select({
      android: { includeFontPadding: false, textAlignVertical: 'center' as const },
      default: {},
    }),
  },
});
