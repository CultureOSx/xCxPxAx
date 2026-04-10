import React from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { EdgeInsets } from 'react-native-safe-area-context';
import { CultureTokens, type ColorTheme } from '@/constants/theme';
import { TextStyles } from '@/constants/typography';

export const cityAmbient = StyleSheet.create({
  mesh: { ...StyleSheet.absoluteFillObject, opacity: 0.06 },
});

const statWebCursor = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : {};

export function StatPill({
  icon,
  value,
  label,
  colors,
  onPress,
  accessibilityLabel: a11yLabel,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  colors: ColorTheme;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const inner = (
    <View
      style={{
        alignItems: 'center',
        paddingVertical: 11,
        paddingHorizontal: 4,
        borderRadius: 14,
        backgroundColor: colors.backgroundSecondary,
        borderWidth: StyleSheet.hairlineWidth * 2,
        borderColor: colors.borderLight,
      }}
    >
      <Ionicons name={icon} size={17} color={CultureTokens.indigo} style={{ marginBottom: 4, opacity: 0.92 }} />
      <Text style={{ fontSize: 17, fontFamily: 'Poppins_700Bold', color: colors.text, lineHeight: 21 }}>
        {value}
      </Text>
      <Text
        style={{
          fontSize: 10,
          fontFamily: 'Poppins_600SemiBold',
          color: colors.textTertiary,
          letterSpacing: 0.2,
          marginTop: 2,
        }}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );

  if (!onPress) {
    return <View style={{ flex: 1, paddingHorizontal: 3 }}>{inner}</View>;
  }

  return (
    <Pressable
      style={({ pressed }) => [{ flex: 1, paddingHorizontal: 3, opacity: pressed ? 0.88 : 1 }, statWebCursor]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel ?? `${label}: ${value}. Tap to jump or filter.`}
    >
      {inner}
    </Pressable>
  );
}

export function getCityDestinationStyles(
  colors: ColorTheme,
  insets: EdgeInsets,
  isDesktop: boolean,
  gridGap: number,
) {
  return StyleSheet.create({
    root: { flex: 1 },
    scroll: { paddingBottom: 40 },

    hero: { height: 400, position: 'relative', overflow: 'hidden' },
    heroImage: { ...StyleSheet.absoluteFillObject },
    heroTopBar: {
      position: 'absolute',
      left: 20,
      right: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 10,
    },
    heroGlassCircleInner: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroIconHit: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroGlassChipShell: { maxWidth: '58%' },
    heroGlassChipInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 7,
    },
    chipText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },

    heroContent: {
      paddingHorizontal: 24,
      paddingBottom: 36,
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    heroBadge: {
      backgroundColor: CultureTokens.gold,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 999,
      marginBottom: 10,
    },
    heroBadgeText: { fontSize: 10, fontFamily: 'Poppins_700Bold', letterSpacing: 1 },
    heroCity: { ...TextStyles.display, fontSize: 52, lineHeight: 58, textAlign: 'center' },
    stateRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4, marginBottom: 6 },
    stateText: {
      color: colors.textOnBrandGradient,
      opacity: 0.78,
      fontSize: 13,
      fontFamily: 'Poppins_500Medium',
    },
    heroSubtitle: {
      ...TextStyles.callout,
      color: colors.textOnBrandGradient,
      opacity: 0.92,
      maxWidth: '85%',
      textAlign: 'center',
    },

    statsStrip: {
      flexDirection: 'row',
      paddingHorizontal: 10,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth * 2,
      gap: 2,
    },
    statDivider: { width: StyleSheet.hairlineWidth * 2, marginVertical: 14, alignSelf: 'stretch' },

    filterBar: {
      zIndex: 5,
    },
    filterBarGlassInner: {
      paddingBottom: 10,
    },
    filterToolbarColumn: {
      gap: 0,
    },
    /** One grouped “form” card: Area + optional Distance + Refine (Apple-style segments). */
    filterToolbarGroupWrap: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 6,
    },
    hubControlGroup: {
      borderRadius: 12,
      padding: 10,
      borderWidth: StyleSheet.hairlineWidth * 2,
      maxWidth: '100%',
    },
    hubToolbarRow: {
      marginBottom: 14,
    },
    hubToolbarRowLast: {
      marginBottom: 0,
    },
    hubSectionLabel: {
      fontSize: 11,
      fontFamily: 'Poppins_600SemiBold',
      letterSpacing: 0.35,
      textTransform: 'uppercase' as const,
      marginBottom: 8,
    },
    hubClearText: {
      flexShrink: 0,
      paddingVertical: 8,
      paddingHorizontal: 4,
      fontSize: 15,
      fontFamily: 'Poppins_600SemiBold',
    },
    hubDiscoverCaption: {
      fontSize: 12,
      fontFamily: 'Poppins_400Regular',
      lineHeight: 17,
    },
    scopeSegmentTrack: {
      flexDirection: 'row',
      borderRadius: 14,
      padding: 3,
      borderWidth: StyleSheet.hairlineWidth * 2,
      gap: 3,
      flexShrink: 0,
    },
    scopeSegBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 11,
    },
    scopeSegBtnText: {
      fontSize: 12,
      fontFamily: 'Poppins_600SemiBold',
      lineHeight: 16,
    },
    nearRadiusScrollContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingRight: 4,
    },
    modeTabs: {
      paddingHorizontal: 0,
      paddingTop: 0,
      gap: 0,
      flexDirection: 'row',
      alignItems: 'center',
    },
    modeTab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginRight: 2,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    modeTabText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
    modeBadge: {
      backgroundColor: CultureTokens.indigo,
      borderRadius: 10,
      minWidth: 18,
      height: 18,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    modeBadgeText: { color: colors.textOnBrandGradient, fontSize: 10, fontFamily: 'Poppins_700Bold' },
    clearAllTab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginLeft: 8,
    },

    sectionAccentTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 14,
    },
    sectionAccentBar: {
      width: 3,
      height: 22,
      borderRadius: 2,
      backgroundColor: CultureTokens.gold,
    },
    section: { paddingHorizontal: 20, paddingTop: 28 },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    clearBtn: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    clearBtnText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary },

    trendingCard: {
      width: 220,
      height: 160,
      borderRadius: 20,
      overflow: 'hidden',
      backgroundColor: colors.surface,
    },
    trendingImage: { ...StyleSheet.absoluteFillObject },
    trendingInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, gap: 3 },
    trendingCategoryPill: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      marginBottom: 2,
    },
    trendingCategoryText: {
      color: colors.textOnBrandGradient,
      opacity: 0.9,
      fontSize: 10,
      fontFamily: 'Poppins_600SemiBold',
    },
    trendingTitle: {
      color: colors.textOnBrandGradient,
      fontSize: 14,
      fontFamily: 'Poppins_600SemiBold',
      lineHeight: 19,
    },
    trendingDate: {
      color: colors.textOnBrandGradient,
      opacity: 0.68,
      fontSize: 11,
      fontFamily: 'Poppins_400Regular',
    },

    venueGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    venueCard: {
      width: isDesktop ? '31%' : '100%',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
      gap: 12,
    },
    venueIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: CultureTokens.indigo + '12',
      alignItems: 'center',
      justifyContent: 'center',
    },
    venueName: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.text },
    venueCategory: { fontSize: 12, color: colors.textTertiary, fontFamily: 'Poppins_400Regular' },

    mapCard: {
      marginTop: 16,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      justifyContent: 'center',
    },
    mapCardText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },

    tagCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tagPill: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
    },
    tagPillText: { fontSize: 13, fontFamily: 'Poppins_500Medium' },

    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: gridGap,
      justifyContent: isDesktop ? 'flex-start' : 'center',
    },

    skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: gridGap },
    skeletonCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 16,
      opacity: 0.6,
    },

    emptyState: {
      minHeight: 300,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
      paddingVertical: 28,
      paddingHorizontal: 20,
    },
    emptyStateCard: {
      width: '100%',
      maxWidth: 340,
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth * 2,
      paddingVertical: 28,
      paddingHorizontal: 20,
      alignItems: 'center',
      gap: 12,
      ...Platform.select({
        web: { boxShadow: '0 4px 24px rgba(0,0,0,0.07)' },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        },
        default: { elevation: 3 },
      }),
    },
    emptyTitle: { fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: colors.text },
    emptySubtitle: { fontSize: 14, color: colors.textTertiary, textAlign: 'center', maxWidth: 260 },
    retryButton: {
      marginTop: 4,
      backgroundColor: CultureTokens.indigo,
      paddingHorizontal: 28,
      paddingVertical: 12,
      borderRadius: 30,
      ...Platform.select({
        web: { boxShadow: '0 2px 12px rgba(0,102,204,0.35)' },
        ios: {
          shadowColor: CultureTokens.indigo,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.35,
          shadowRadius: 6,
        },
        default: { elevation: 3 },
      }),
    },
    retryText: { color: colors.textOnBrandGradient, fontFamily: 'Poppins_600SemiBold', fontSize: 15 },

    fab: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      backgroundColor: CultureTokens.indigo,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderRadius: 30,
      ...Platform.select({
        web: { boxShadow: '0px 4px 16px rgba(0,0,0,0.28)' },
        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
          elevation: 8,
        },
      }),
    },
    fabText: { fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  });
}
