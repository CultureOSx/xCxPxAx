import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { api } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens } from '@/constants/theme';
import type { OfferingKind, UnifiedOffering } from '@/shared/schema';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { BackButton } from '@/components/ui/BackButton';

function kindLabel(k: OfferingKind): string {
  switch (k) {
    case 'restaurant_deal':
      return 'Dining deal';
    case 'restaurant_menu_highlight':
      return 'Menu';
    case 'shopping_deal':
      return 'Shop deal';
    case 'activity_listing':
      return 'Activity';
    case 'movie_showtime':
      return 'Cinema';
    default:
      return k;
  }
}

export default function OfferingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { hPad } = useLayout();
  const { state } = useOnboarding();
  const topPad = Platform.OS === 'web' ? 0 : insets.top;

  const { data, isLoading, isRefetching, refetch, error } = useQuery({
    queryKey: ['/api/offerings', state.country, state.city],
    queryFn: () =>
      api.offerings.list({
        country: state.country || undefined,
        city: state.city || undefined,
        limit: 100,
      }),
  });

  const rows = data?.offerings ?? [];

  const onPress = useCallback((item: UnifiedOffering) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(item.href as Href);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: UnifiedOffering }) => (
      <Pressable
        onPress={() => onPress(item)}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderLight,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${kindLabel(item.kind)}: ${item.title}`}
      >
        <View style={styles.cardRow}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.thumb} contentFit="cover" />
          ) : (
            <View style={[styles.thumb, styles.thumbPlaceholder, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="pricetag-outline" size={22} color={colors.textTertiary} />
            </View>
          )}
          <View style={styles.cardBody}>
            <View style={styles.badgeRow}>
              <View style={[styles.kindPill, { backgroundColor: CultureTokens.indigo + '18' }]}>
                <Text style={[styles.kindPillText, { color: CultureTokens.indigo }]}>
                  {kindLabel(item.kind)}
                </Text>
              </View>
              {item.isPromoted ? (
                <View style={[styles.kindPill, { backgroundColor: CultureTokens.gold + '22' }]}>
                  <Text style={[styles.kindPillText, { color: CultureTokens.gold }]}>Promoted</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={[styles.parent, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.parentTitle}
            </Text>
            {item.subtitle ? (
              <Text style={[styles.sub, { color: colors.textTertiary }]} numberOfLines={2}>
                {item.subtitle}
              </Text>
            ) : null}
            <View style={styles.metaRow}>
              {item.priceLabel ? (
                <Text style={[styles.price, { color: colors.text }]}>{item.priceLabel}</Text>
              ) : null}
              <Text style={[styles.loc, { color: colors.textTertiary }]}>
                {item.city}
                {item.country ? ` · ${item.country}` : ''}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} style={styles.chevron} />
        </View>
      </Pressable>
    ),
    [colors, onPress],
  );

  const header = useMemo(
    () => (
      <View style={{ paddingHorizontal: hPad, marginBottom: 12 }}>
        <Text style={[styles.lead, { color: colors.textSecondary }]}>
          Deals, menu picks, activities, and movie showtimes in one feed — powered by your city selection.
        </Text>
      </View>
    ),
    [colors.textSecondary, hPad],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: topPad }}>
        <LiquidGlassPanel
          borderRadius={0}
          bordered={false}
          style={{
            borderBottomWidth: StyleSheet.hairlineWidth * 2,
            borderBottomColor: colors.borderLight,
          }}
          contentStyle={{ paddingHorizontal: hPad, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}
        >
          <BackButton fallback="/(tabs)" />
          <Text style={[styles.screenTitle, { color: colors.text }]}>Offers</Text>
        </LiquidGlassPanel>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={CultureTokens.indigo} />
        </View>
      ) : error ? (
        <View style={[styles.centered, { paddingHorizontal: hPad }]}>
          <Text style={{ color: CultureTokens.coral, textAlign: 'center' }}>Could not load offers.</Text>
          <Pressable onPress={() => refetch()} style={styles.retry} accessibilityRole="button" accessibilityLabel="Retry loading offers">
            <Text style={{ color: CultureTokens.indigo, fontFamily: 'Poppins_600SemiBold' }}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={header}
          contentContainerStyle={{ paddingHorizontal: hPad, paddingBottom: 32, paddingTop: 16, gap: 12 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={CultureTokens.indigo} />
          }
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textTertiary }]}>
              No offers in this area yet. Try another city or check back soon.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold', flex: 1 },
  lead: { fontSize: 13, fontFamily: 'Poppins_500Medium', lineHeight: 19 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  retry: { marginTop: 12, paddingVertical: 8, paddingHorizontal: 16 },
  empty: { textAlign: 'center', marginTop: 24, fontFamily: 'Poppins_500Medium', fontSize: 14 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    ...Platform.select({
      web: { boxShadow: '0px 2px 10px rgba(0,0,0,0.08)' },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 72, height: 72, borderRadius: 12 },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, minWidth: 0 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  kindPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  kindPillText: { fontSize: 10, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase', letterSpacing: 0.3 },
  title: { fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  parent: { fontSize: 12, fontFamily: 'Poppins_500Medium', marginTop: 2 },
  sub: { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 4, lineHeight: 17 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 8 },
  price: { fontSize: 14, fontFamily: 'Poppins_700Bold' },
  loc: { fontSize: 11, fontFamily: 'Poppins_500Medium' },
  chevron: { alignSelf: 'center' },
});
