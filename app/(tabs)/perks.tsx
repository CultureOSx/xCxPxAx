// app/(tabs)/perks.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  useAnimatedScrollHandler,
  FadeInDown,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';

import { CultureTokens, shadows } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { FilterChipRow } from '@/components/FilterChip';
import { PerkCard } from '@/components/perks/PerkCard';
import { usePerks } from '@/hooks/queries/usePerks';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const { width } = Dimensions.get('window');

// ─── Animated Wrapper ─────────────────────────────────────────────────────────

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList);

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'All',        label: 'All Perks',    icon: 'gift'       },
  { id: 'tickets',    label: 'Tickets',      icon: 'ticket'     },
  { id: 'events',     label: 'Events',       icon: 'calendar'   },
  { id: 'dining',     label: 'Dining',       icon: 'restaurant' },
  { id: 'shopping',   label: 'Shopping',     icon: 'bag'        },
  { id: 'indigenous', label: 'Indigenous',   icon: 'leaf'       },
];

export default function PerksTabScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isDesktop } = useLayout();
  const { userId } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState('All');

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => { scrollY.value = event.contentOffset.y; },
  });

  const heroAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(scrollY.value, [-100, 0, 250], [1.1, 1, 0.95], 'clamp') },
    ],
    opacity: interpolate(scrollY.value, [0, 200], [1, 0.5], 'clamp'),
  }));

  const { data: perksPages, isLoading, refetch, isRefetching } = usePerks();
  const perks = perksPages?.pages.flatMap(p => p.perks) || [];

  const { data: membership } = useQuery({
    queryKey: ['/api/membership', userId],
    queryFn: () => api.membership.get(userId!).catch(() => null),
    enabled: !!userId,
  });

  const filteredPerks = useMemo(() => {
    if (selectedCategory === 'All') return perks;
    return perks.filter(p => p.category === selectedCategory);
  }, [perks, selectedCategory]);

  const isPlusMember = !!membership?.tier && membership.tier !== 'free';

  const renderHeader = () => (
    <View>
      <View style={styles.heroWrapper}>
        <Animated.View style={[styles.heroContainer, heroAnimatedStyle]}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1511733336325-3069188a183d?q=80&w=1200&auto=format&fit=crop' }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']}
            style={styles.heroOverlay}
          >
            <Text style={styles.heroTitle}>Exclusive Perks</Text>
            <Text style={styles.heroSubtitle}>Unlock the best of your city's culture</Text>
          </LinearGradient>
        </Animated.View>
      </View>

      <View style={{ backgroundColor: colors.background }}>
        {!isPlusMember && (
          <View style={styles.nudgeWrapper}>
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => router.push('/membership/upgrade' as any)}
              style={[styles.nudgeCard, { backgroundColor: colors.surface, shadowColor: colors.text }]}
            >
              <LinearGradient colors={['#6366F1', '#4F46E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.nudgeIconBox}>
                <Ionicons name="sparkles" size={20} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[styles.nudgeTitle, { color: colors.text }]}>CulturePass+</Text>
                <Text style={[styles.nudgeSubtitle, { color: colors.textSecondary }]}>Upgrade to unlock rewards</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.chipsRow, isPlusMember && { marginTop: 12 }]}>
          <FilterChipRow
            items={CATEGORIES}
            selectedId={selectedCategory}
            onSelect={(id) => {
              setSelectedCategory(id);
              if (Platform.OS !== 'web') Haptics.selectionAsync();
            }}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Available for You</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{filteredPerks.length} handpicked rewards</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ErrorBoundary>
        <AnimatedFlashList
          data={filteredPerks}
          numColumns={isDesktop ? 2 : 1}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item, index }: { item: any, index: number }) => (
            <Animated.View
              entering={FadeInDown.delay(index * 50).springify().damping(18)}
              style={styles.perkWrapper}
            >
              <PerkCard perk={item} />
            </Animated.View>
          )}
          ListHeaderComponent={renderHeader}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          estimatedItemSize={200}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 120 }]}
          onRefresh={refetch}
          refreshing={isRefetching}
        />
      </ErrorBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  heroWrapper: { height: 280, overflow: 'hidden' },
  heroContainer: { height: 280 },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', padding: 28, justifyContent: 'flex-end' },
  heroTitle: { fontSize: 38, fontFamily: 'Poppins_700Bold', color: '#fff', letterSpacing: -1 },
  heroSubtitle: { fontSize: 18, fontFamily: 'Poppins_500Medium', color: '#fff', marginTop: 4, opacity: 0.9 },
  nudgeWrapper: { marginTop: -32, paddingHorizontal: 20, zIndex: 10, paddingBottom: 8 },
  nudgeCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 24, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 8, gap: 16 },
  nudgeIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  nudgeTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold' },
  nudgeSubtitle: { fontSize: 13, fontFamily: 'Poppins_500Medium' },
  chipsRow: { paddingTop: 8 },
  sectionHeader: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  sectionTitle: { fontSize: 22, fontFamily: 'Poppins_700Bold' },
  sectionSubtitle: { fontSize: 14, fontFamily: 'Poppins_500Medium', marginTop: 2, opacity: 0.7 },
  list: { paddingHorizontal: 16 },
  perkWrapper: { paddingVertical: 8, paddingHorizontal: 4 },
});
