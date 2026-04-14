import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { EdgeInsets } from 'react-native-safe-area-context';
import { CultureTokens, type ColorTheme } from '@/constants/theme';
import { TextStyles } from '@/constants/typography';

export const cityAmbient = StyleSheet.create({
  mesh: { ...StyleSheet.absoluteFillObject, opacity: 0.06 },
});

export function StatPill({
  icon,
  value,
  label,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  colors: ColorTheme;
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: 12 }}>
      <Ionicons name={icon} size={18} color={CultureTokens.indigo} style={{ marginBottom: 3 }} />
      <Text style={{ fontSize: 16, fontFamily: 'Poppins_700Bold', color: colors.text, lineHeight: 20 }}>
        {value}
      </Text>
      <Text style={{ fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textTertiary }}>
        {label}
      </Text>
    </View>
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
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
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
      borderBottomWidth: 1,
    },
    statDivider: { width: 1, marginVertical: 10 },

    filterBar: {
      zIndex: 5,
    },
    filterBarGlassInner: {
      paddingBottom: 8,
    },
    modeTabs: {
      paddingHorizontal: 20,
      paddingTop: 10,
      gap: 0,
      flexDirection: 'row',
    },
    modeTab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginRight: 4,
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

    emptyState: { height: 320, alignItems: 'center', justifyContent: 'center', gap: 16 },
    emptyTitle: { fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: colors.text },
    emptySubtitle: { fontSize: 14, color: colors.textTertiary, textAlign: 'center', maxWidth: 260 },
    retryButton: {
      marginTop: 12,
      backgroundColor: CultureTokens.indigo,
      paddingHorizontal: 28,
      paddingVertical: 12,
      borderRadius: 30,
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
