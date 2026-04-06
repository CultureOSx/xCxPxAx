import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useDiscoverRailInsets } from '@/components/Discover/discoverLayout';
import { TextStyles } from '@/constants/typography';
import { CultureTokens } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import SectionHeader from './SectionHeader';
import type { IndigenousOrganisation, IndigenousFestival, IndigenousBusiness } from '@/lib/api';

const isWeb = Platform.OS === 'web';

interface IndigenousSpotlightProps {
  land?: { landName: string; traditionalCustodians: string };
  organisations: IndigenousOrganisation[];
  festivals: IndigenousFestival[];
  businesses: IndigenousBusiness[];
}

function IndigenousSpotlightComponent({ land, organisations, festivals, businesses }: IndigenousSpotlightProps) {
  const colors = useColors();
  const { isDesktop, vPad } = useLayout();
  const { pad, scrollPadStyle, headerPadStyle } = useDiscoverRailInsets();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View>
      {/* Land Acknowledgement Banner */}
      {land && (
        <View
          style={[
            styles.landBanner,
            { marginHorizontal: isDesktop ? 0 : pad, marginBottom: vPad },
          ]}
        >
          {(Platform.OS === 'ios' || isWeb) && (
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          )}
          <LinearGradient 
            colors={['rgba(212,165,116,0.15)', 'rgba(212,165,116,0.05)']} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 0 }} 
            style={StyleSheet.absoluteFillObject} 
          />
          <View style={styles.landBannerContent}>
            <Ionicons name="leaf" size={16} color={CultureTokens.gold} />
            <Text style={styles.landBannerTitle}>You are on {land.landName}</Text>
          </View>
          <Text style={styles.landBannerSub}>Traditional Custodians: {land.traditionalCustodians}</Text>
        </View>
      )}

      {/* Organisations Rail */}
      {organisations.length > 0 && (
        <View
          style={[
            styles.orgSection,
            { marginHorizontal: isDesktop ? 0 : pad, marginBottom: vPad },
          ]}
        >
          <View style={styles.orgSectionHeader}>
            <View style={[styles.orgSectionIconWrap, { backgroundColor: colors.primaryGlow }]}>
              <Ionicons name="people-circle" size={26} color={CultureTokens.gold} />
            </View>
            <View>
              <Text style={styles.orgSectionTitle}>First Nations Organisations</Text>
              <Text style={styles.orgSectionSub}>Supporting community-led initiatives</Text>
            </View>
          </View>
          <FlatList
            horizontal
            data={organisations}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[scrollPadStyle, styles.orgRail]}
            renderItem={({ item }) => (
              <Card padding={16} radius={16} style={[styles.orgCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                <View style={styles.orgCardTop}>
                  <Text style={styles.orgName} numberOfLines={1}>{item.name}</Text>
                  {item.featured && (
                    <View style={styles.orgFeaturedBadge}>
                      <Text style={styles.orgFeaturedText}>FEATURED</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.orgMeta}>{item.city}, {item.country}</Text>
                {!!item.nationOrPeople && (
                  <Text style={styles.orgNation} numberOfLines={1}>
                    {item.nationOrPeople}
                  </Text>
                )}
                <View style={styles.orgFocusRow}>
                  {item.focusAreas.slice(0, 2).map((focus) => (
                    <View key={`${item.id}-${focus}`} style={[styles.orgFocusPill, { borderColor: colors.borderLight }]}>
                      <Text style={styles.orgFocusText}>{focus}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            )}
          />
        </View>
      )}

      {/* Festivals Rail */}
      {festivals.length > 0 && (
        <View style={{ marginBottom: vPad }}>
          <View style={headerPadStyle}>
            <SectionHeader
              title="Indigenous Events & Festivals"
              subtitle="Celebrate living culture and Country-led stories"
              onSeeAll={() => router.push('/(tabs)/explore')}
            />
          </View>
          <FlatList
            horizontal
            data={festivals}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[scrollPadStyle, styles.scrollRail]}
            renderItem={({ item }) => (
              <Card padding={16} radius={16} style={[styles.indigenousCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                <View style={styles.indigenousCardHeader}>
                  <View style={styles.indigenousTagPill}>
                    <Ionicons name="calendar-outline" size={12} color={CultureTokens.gold} />
                    <Text style={styles.indigenousTagText}>Festival</Text>
                  </View>
                  {!!item.monthHint && (
                    <Text style={styles.indigenousMonth}>{item.monthHint}</Text>
                  )}
                </View>
                <Text style={styles.indigenousTitle} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.indigenousMeta} numberOfLines={1}>
                  {[item.city, item.state, item.country].filter(Boolean).join(', ')}
                </Text>
                <Text style={styles.indigenousDesc} numberOfLines={3}>{item.significance}</Text>
              </Card>
            )}
          />
        </View>
      )}

      {/* Business Rail */}
      {businesses.length > 0 && (
        <View style={{ marginBottom: vPad }}>
          <View style={headerPadStyle}>
            <SectionHeader
              title="Indigenous Business"
              subtitle="Support First Nations-owned local businesses"
              onSeeAll={() => router.push('/(tabs)/directory')}
            />
          </View>
          <FlatList
            horizontal
            data={businesses}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[scrollPadStyle, styles.scrollRail]}
            renderItem={({ item }) => (
              <Card padding={16} radius={16} style={[styles.indigenousCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                <View style={styles.indigenousCardHeader}>
                  <View style={styles.indigenousTagPill}>
                    <Ionicons name="storefront-outline" size={12} color={CultureTokens.gold} />
                    <Text style={styles.indigenousTagText}>Business</Text>
                  </View>
                  <Text style={styles.indigenousMonth}>{item.category}</Text>
                </View>
                <Text style={styles.indigenousTitle} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.indigenousMeta} numberOfLines={1}>
                  {[item.city, item.state, item.country].filter(Boolean).join(', ')}
                </Text>
                <Text style={styles.indigenousDesc} numberOfLines={3}>{item.description}</Text>
              </Card>
            )}
          />
        </View>
      )}
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  landBanner: {
    padding: 20,
    borderRadius: 20, 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: 'rgba(212, 165, 116, 0.2)' 
  },
  landBannerContent: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  landBannerTitle: { ...TextStyles.headline, color: CultureTokens.gold },
  landBannerSub: { ...TextStyles.caption, color: colors.textSecondary, lineHeight: 18 },
  
  orgSection: {},
  orgSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  orgSectionIconWrap: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  orgSectionTitle: { ...TextStyles.title3, color: colors.text },
  orgSectionSub: { ...TextStyles.caption, color: colors.textSecondary, lineHeight: 18, marginTop: 2 },
  orgRail: { gap: 16 },
  orgCard: { width: 260, borderWidth: 1 },
  orgCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  orgName: { ...TextStyles.cardTitle, color: colors.text, flex: 1 },
  orgFeaturedBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: CultureTokens.gold + '20' },
  orgFeaturedText: { ...TextStyles.badgeCaps, color: CultureTokens.gold },
  orgMeta: { ...TextStyles.caption, color: colors.textSecondary, marginBottom: 4 },
  orgNation: { ...TextStyles.captionSemibold, color: CultureTokens.gold, marginBottom: 12 },
  orgFocusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  orgFocusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  orgFocusText: { ...TextStyles.badge, color: colors.textSecondary },

  scrollRail: { gap: 16 },
  indigenousCard: { width: 280, borderRadius: 20, borderWidth: 1, padding: 16 },
  indigenousCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  indigenousTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: CultureTokens.gold + '15',
  },
  indigenousTagText: { ...TextStyles.badgeCaps, color: CultureTokens.gold },
  indigenousMonth: { ...TextStyles.badge, color: colors.textTertiary },
  indigenousTitle: { ...TextStyles.title3, color: colors.text, marginBottom: 6 },
  indigenousMeta: { ...TextStyles.callout, color: colors.textSecondary, marginBottom: 8 },
  indigenousDesc: { ...TextStyles.bodyMedium, color: colors.textTertiary, lineHeight: 18 },
});

export const IndigenousSpotlight = React.memo(IndigenousSpotlightComponent);
