import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { router, Stack } from 'expo-router';
import Head from 'expo-router/head';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { TextStyles } from '@/constants/typography';
import { CultureTokens } from '@/constants/theme';
import { CULTURE_DESTINATIONS } from '@/constants/cultureDestinations';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { getStateForCity, GLOBAL_REGIONS } from '@/constants/locations';
import { cultureHubIndexLinkPath } from '@/lib/cultureHubDeepLink';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { APP_NAME } from '@/lib/app-meta';

export default function CultureHubIndexScreen() {
  const colors = useColors();
  const { hPad, isDesktop, contentWidth } = useLayout();
  const insets = useSafeAreaInsets();
  const { state: onboarding } = useOnboarding();

  const prefs = useMemo(() => {
    const country = onboarding.country?.trim() || 'Australia';
    const city = onboarding.city?.trim();
    let stateCode: string | undefined;
    if (city) {
      const st = getStateForCity(city);
      const row = st ? GLOBAL_REGIONS.find((r) => r.value === st) : undefined;
      if (row?.country === country) stateCode = st;
    }
    return { country, stateCode };
  }, [onboarding.country, onboarding.city]);

  const hubs = useMemo(
    () =>
      Object.values(CULTURE_DESTINATIONS).sort((a, b) =>
        a.heroTitle.localeCompare(b.heroTitle, undefined, { sensitivity: 'base' }),
      ),
    [],
  );

  const topPad = Platform.OS === 'web' ? 16 : insets.top + 8;

  const openHub = (publicPath: string) => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const href = cultureHubIndexLinkPath(publicPath, prefs);
    router.push(href as never);
  };

  return (
    <ErrorBoundary>
      {Platform.OS === 'web' && (
        <Head>
          <title>{`Culture & language hubs · ${APP_NAME}`}</title>
          <meta
            name="description"
            content="Browse diaspora culture hubs — Kerala, Gujarati, Tamil, Filipino, and more. Open in your country or worldwide."
          />
        </Head>
      )}
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Culture hubs', headerShown: false }} />
        <ScrollView
          contentContainerStyle={{
            paddingTop: topPad,
            paddingBottom: insets.bottom + 32,
            paddingHorizontal: hPad,
            maxWidth: isDesktop ? 720 : undefined,
            width: isDesktop ? contentWidth : undefined,
            alignSelf: isDesktop ? 'center' : undefined,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={() => router.back()}
            style={styles.backRow}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color={CultureTokens.indigo} />
            <Text style={[TextStyles.callout, { color: CultureTokens.indigo, fontFamily: 'Poppins_600SemiBold' }]}>
              Back
            </Text>
          </Pressable>

          <Text style={[TextStyles.title2, { color: colors.text, marginTop: 4, fontSize: 28 }]}>Culture hubs</Text>
          <Text style={[TextStyles.body, { color: colors.textSecondary, marginTop: 8, marginBottom: 20 }]}>
            Language, ethnicity, and community pages. Each hub opens in your country (
            {prefs.country}) with a worldwide option — shareable links like{' '}
            <Text style={{ fontFamily: 'Poppins_600SemiBold', color: colors.text }}>
              ?country=Australia&scope=single&state=NSW
            </Text>
            .
          </Text>

          <View style={{ gap: 12 }}>
            {hubs.map((def) => (
              <Pressable
                key={def.slug}
                onPress={() => openHub(def.publicPath)}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderLight,
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Open ${def.heroTitle} hub`}
              >
                <Image source={{ uri: def.heroImage }} style={styles.thumb} contentFit="cover" />
                <View style={styles.cardBody}>
                  <Text style={[TextStyles.title3, { color: colors.text }]}>{def.heroTitle}</Text>
                  <Text style={[TextStyles.caption, { color: colors.textTertiary, marginTop: 4 }]} numberOfLines={2}>
                    {def.tagline}
                  </Text>
                  <View style={styles.badgeRow}>
                    <View style={[styles.badge, { backgroundColor: CultureTokens.indigo + '18' }]}>
                      <Text style={[TextStyles.caption, { color: CultureTokens.indigo, fontSize: 11 }]}>
                        {def.heroBadge}
                      </Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    paddingRight: 12,
    gap: 12,
  },
  thumb: { width: 96, height: 96 },
  cardBody: { flex: 1, paddingVertical: 12 },
  badgeRow: { marginTop: 8 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
});
