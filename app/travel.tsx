import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { TabPrimaryHeader } from '@/components/tabs/TabPrimaryHeader';
import { Button } from '@/components/ui/Button';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/lib/auth';
import { CultureTokens, gradients } from '@/constants/theme';
import { getLayoverPlannerPreferences, getTravelModeEnabled, type LayoverPlannerPreferences } from '@/lib/storage';

const QUICK_DESTINATIONS = [
  { label: 'Sydney, AU', query: 'Sydney events', icon: 'business-outline' as const },
  { label: 'Melbourne, AU', query: 'Melbourne events', icon: 'train-outline' as const },
  { label: 'Auckland, NZ', query: 'Auckland events', icon: 'compass-outline' as const },
  { label: 'Dubai, UAE', query: 'Dubai events', icon: 'airplane-outline' as const },
  { label: 'London, UK', query: 'London events', icon: 'globe-outline' as const },
  { label: 'Toronto, CA', query: 'Toronto events', icon: 'map-outline' as const },
];

const WINDOW_LABEL: Record<LayoverPlannerPreferences['layoverWindowId'], string> = {
  '2_4': '2-4h',
  '4_8': '4-8h',
  '8_16': '8-16h',
};

const ROUTE_LABEL: Record<LayoverPlannerPreferences['routeProfileId'], string> = {
  fast: 'Fast',
  balanced: 'Balanced',
  safe: 'Safe',
};

const ANCHOR_LABEL: Record<LayoverPlannerPreferences['anchorId'], string> = {
  city: 'City',
  airport: 'Airport',
  port: 'Port',
};

export default function TravelScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, userId } = useAuth();
  const [travelModeEnabled, setTravelModeEnabled] = useState(false);
  const [planner, setPlanner] = useState<LayoverPlannerPreferences | null>(null);

  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 28 : insets.bottom;
  const summary = useMemo(() => {
    if (!planner) return null;
    return `${WINDOW_LABEL[planner.layoverWindowId]} window · ${ANCHOR_LABEL[planner.anchorId]} anchor · ${ROUTE_LABEL[planner.routeProfileId]} route`;
  }, [planner]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [modeEnabled, prefs] = await Promise.all([
        getTravelModeEnabled(userId),
        getLayoverPlannerPreferences(userId),
      ]);
      if (cancelled) return;
      setTravelModeEnabled(modeEnabled);
      setPlanner(prefs);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ambient}
        pointerEvents="none"
      />

      <TabPrimaryHeader
        title="Travel"
        subtitle="Plan outside your home city"
        hPad={16}
        topInset={topInset}
        showShellBorder={false}
        showBrandStrip={false}
      />

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: bottomInset + 26 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <View style={[styles.heroIcon, { backgroundColor: CultureTokens.indigo + '1A' }]}>
            <Ionicons name="airplane-outline" size={22} color={CultureTokens.indigo} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Travel planner</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Find and organize events in other cities, states, and countries.
          </Text>
          {travelModeEnabled && summary ? (
            <View style={[styles.pill, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
              <Ionicons name="checkmark-circle-outline" size={14} color={CultureTokens.teal} />
              <Text style={[styles.pillText, { color: colors.textSecondary }]}>{summary}</Text>
            </View>
          ) : (
            <View style={[styles.pill, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
              <Ionicons name="information-circle-outline" size={14} color={CultureTokens.gold} />
              <Text style={[styles.pillText, { color: colors.textSecondary }]}>
                Travel Mode is off. Use defaults from Travel preferences.
              </Text>
            </View>
          )}

          <Button
            variant="gradient"
            size="md"
            onPress={() => router.push('/finder')}
            leftIcon="search-outline"
          >
            Explore destinations
          </Button>

          <Button
            variant="outline"
            size="md"
            onPress={() => router.push('/settings/travel-mode')}
            leftIcon="settings-outline"
          >
            Configure travel defaults
          </Button>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick destinations</Text>
          <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
            Start with a city and open Finder with destination-focused search.
          </Text>
          <View style={styles.grid}>
            {QUICK_DESTINATIONS.map((item) => (
              <Pressable
                key={item.label}
                style={({ pressed }) => [
                  styles.destinationChip,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.borderLight,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
                onPress={() => router.push(`/finder?q=${encodeURIComponent(item.query)}`)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${item.label} destination search`}
              >
                <Ionicons name={item.icon} size={14} color={CultureTokens.indigo} />
                <Text style={[styles.destinationLabel, { color: colors.text }]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Organize trip</Text>
          <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
            Save your travel profile, then explore by culture hubs or global search.
          </Text>
          <View style={styles.buttonRow}>
            <Button
              variant="outline"
              size="sm"
              onPress={() => router.push('/culture')}
              leftIcon="earth-outline"
              style={styles.splitButton}
            >
              Culture hubs
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() => router.push('/search')}
              leftIcon="search-outline"
              style={styles.splitButton}
            >
              Global search
            </Button>
          </View>
        </View>

        {!isAuthenticated ? (
          <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
            <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              Sign in to save Travel Mode defaults and organize travel plans across devices.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  ambient: { ...StyleSheet.absoluteFillObject, opacity: 0.06 },
  body: { paddingHorizontal: 16, paddingTop: 16, gap: 14 },
  hero: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins_400Regular',
  },
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'Poppins_400Regular',
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontFamily: 'Poppins_700Bold',
  },
  sectionSub: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Poppins_400Regular',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  destinationChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  destinationLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  splitButton: {
    flex: 1,
  },
  note: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Poppins_400Regular',
  },
});
