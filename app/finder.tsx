import React, { useMemo, useState } from 'react';
import Head from 'expo-router/head';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, Radius, Spacing, gradients } from '@/constants/theme';
import { GLOBAL_REGIONS } from '@/constants/locations';
import { COMMON_LANGUAGES, getLanguage } from '@/constants/languages';

const AU_STATES = GLOBAL_REGIONS.filter((item) => item.country === 'Australia');
const QUICK_LANGUAGES = COMMON_LANGUAGES.slice(0, 20);

const STEP_META = [
  { step: 1, label: 'State', icon: 'location-outline' as const, hint: 'Where your community hub is anchored' },
  { step: 2, label: 'Language', icon: 'language-outline' as const, hint: 'Heritage or primary language tag' },
  { step: 3, label: 'Open', icon: 'open-outline' as const, hint: 'Preview and launch the hub page' },
];

export default function FinderScreen() {
  const colors = useColors();
  const { isDesktop, hPad } = useLayout();
  const insets = useSafeAreaInsets();
  const [stateCode, setStateCode] = useState('NSW');
  const [languageId, setLanguageId] = useState('mal');

  const selectedState = useMemo(
    () => AU_STATES.find((state) => state.value === stateCode),
    [stateCode],
  );
  const selectedLanguage = useMemo(() => getLanguage(languageId), [languageId]);

  const previewUrl = `/hub/australia/${stateCode.toLowerCase()}?lang=${languageId}`;
  const activeStep = 3;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <Head>
        <title>Hub Finder - CulturePass</title>
        <meta
          name="description"
          content="Build a state and language hub page for communities, events, and announcements on CulturePass."
        />
        <link rel="canonical" href="https://culturepass.app/finder" />
      </Head>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            backgroundColor: colors.background,
            paddingHorizontal: isDesktop ? Math.max(hPad, Spacing.xl) : Spacing.md,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.wrap, isDesktop && styles.wrapDesktop]}>
          {/* Hero */}
          <View style={[styles.heroShell, { borderColor: colors.borderLight }]}>
            <LinearGradient
              colors={[...gradients.culturepassBrand]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <View style={styles.heroInner}>
                <View style={styles.heroBadgeRow}>
                  <View style={[styles.heroBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Ionicons name="compass-outline" size={18} color="#FFFFFF" accessible={false} />
                    <Text style={styles.heroBadgeText}>Hub Finder</Text>
                  </View>
                </View>
                <Text style={styles.heroTitle}>Build a cultural hub in three steps</Text>
                <Text style={styles.heroSubtitle}>
                  Choose an Australian state and a language tag. We generate a focused page with communities, events, and
                  announcements.
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Step indicator */}
          <View style={[styles.stepTrack, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            {STEP_META.map((item) => {
              const done = item.step < activeStep;
              const current = item.step === activeStep;
              return (
                <View key={item.step} style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepIconCircle,
                      {
                        backgroundColor: done || current ? CultureTokens.indigo : colors.surfaceElevated,
                        borderColor: done || current ? CultureTokens.indigo : colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={done || current ? '#FFFFFF' : colors.textSecondary}
                      accessibilityLabel={`Step ${item.step}: ${item.label}`}
                    />
                  </View>
                  <Text style={[styles.stepLabel, { color: colors.text }]}>{item.label}</Text>
                  <Text style={[styles.stepHint, { color: colors.textSecondary }]} numberOfLines={2}>
                    {item.hint}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Step 1: State */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: colors.primaryGlow }]}>
                <Ionicons name="map-outline" size={20} color={CultureTokens.indigo} accessible={false} />
              </View>
              <View style={styles.sectionHeaderText}>
                <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>
                  Choose state
                </Text>
                <Text style={[styles.sectionCaption, { color: colors.textSecondary }]}>
                  Australian regions only for this release
                </Text>
              </View>
            </View>
            <View style={styles.grid}>
              {AU_STATES.map((state) => {
                const active = state.value === stateCode;
                return (
                  <Pressable
                    key={state.value}
                    onPress={() => setStateCode(state.value)}
                    style={({ pressed }) => [
                      styles.stateCard,
                      {
                        borderColor: active ? CultureTokens.indigo : colors.borderLight,
                        backgroundColor: active ? colors.primaryGlow : colors.surfaceElevated,
                        opacity: pressed ? 0.88 : 1,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Select state ${state.label}`}
                    hitSlop={4}
                  >
                    <Text style={[styles.stateCode, { color: colors.text }]}>{state.value}</Text>
                    <Text style={[styles.stateName, { color: colors.textSecondary }]} numberOfLines={2}>
                      {state.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Step 2: Language */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: colors.primaryGlow }]}>
                <Ionicons name="chatbubbles-outline" size={20} color={CultureTokens.indigo} accessible={false} />
              </View>
              <View style={styles.sectionHeaderText}>
                <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>
                  Choose language
                </Text>
                <Text style={[styles.sectionCaption, { color: colors.textSecondary }]}>
                  Quick picks for diaspora communities
                </Text>
              </View>
            </View>
            <View style={styles.chips}>
              {QUICK_LANGUAGES.map((language) => {
                const active = language.id === languageId;
                return (
                  <Pressable
                    key={language.id}
                    onPress={() => setLanguageId(language.id)}
                    style={({ pressed }) => [
                      styles.chip,
                      {
                        borderColor: active ? CultureTokens.indigo : colors.borderLight,
                        backgroundColor: active ? colors.primaryGlow : colors.surfaceElevated,
                        minHeight: 44,
                        opacity: pressed ? 0.88 : 1,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Select language ${language.name}`}
                  >
                    <Text style={[styles.chipText, { color: colors.text }]}>{language.name}</Text>
                    {language.nativeName && language.nativeName !== language.name ? (
                      <Text style={[styles.chipNative, { color: colors.textSecondary }]} numberOfLines={1}>
                        {language.nativeName}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Step 3: Preview */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: colors.primaryGlow }]}>
                <Ionicons name="rocket-outline" size={20} color={CultureTokens.indigo} accessible={false} />
              </View>
              <View style={styles.sectionHeaderText}>
                <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>
                  Open your hub
                </Text>
                <Text style={[styles.sectionCaption, { color: colors.textSecondary }]}>
                  Share this path or open it in the app
                </Text>
              </View>
            </View>
            <View style={[styles.previewCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
              <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>Preview</Text>
              <Text style={[styles.previewTitle, { color: colors.text }]}>
                {selectedState?.label ?? stateCode} · {selectedLanguage?.name ?? languageId.toUpperCase()}
              </Text>
              <Text
                style={[styles.previewUrl, { color: CultureTokens.indigo }]}
                selectable={Platform.OS === 'web'}
                accessibilityLabel={`Hub path ${previewUrl}`}
              >
                {previewUrl}
              </Text>
            </View>
            <View style={styles.actions}>
              <Button
                variant="gradient"
                size="sm"
                style={styles.actionButton}
                onPress={() => router.push(previewUrl)}
                leftIcon="arrow-forward-outline"
              >
                Open hub page
              </Button>
              <Button
                variant="outline"
                size="sm"
                style={styles.actionButton}
                onPress={() => router.push('/(tabs)/index')}
                leftIcon="compass-outline"
              >
                Discovery home
              </Button>
              <Button variant="ghost" size="sm" style={styles.actionButton} onPress={() => router.push('/kerala')} leftIcon="heart-outline">
                Kerala hub
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    paddingTop: Spacing.md,
    gap: Spacing.lg,
  },
  wrap: {
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.lg,
  },
  wrapDesktop: {
    maxWidth: 720,
  },
  heroShell: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  heroGradient: {
    borderRadius: Radius.lg,
  },
  heroInner: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    lineHeight: 32,
    fontFamily: 'Poppins_800ExtraBold',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Poppins_400Regular',
    maxWidth: 560,
  },
  stepTrack: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  stepIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
  },
  stepHint: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  section: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  sectionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderText: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: 'Poppins_700Bold',
  },
  sectionCaption: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Poppins_400Regular',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  stateCard: {
    minWidth: 148,
    minHeight: 72,
    flexGrow: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    justifyContent: 'center',
    gap: 2,
  },
  stateCode: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Poppins_700Bold',
  },
  stateName: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'Poppins_400Regular',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minWidth: 100,
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Poppins_600SemiBold',
  },
  chipNative: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  previewCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: 4,
  },
  previewLabel: {
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontFamily: 'Poppins_600SemiBold',
  },
  previewTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontFamily: 'Poppins_700Bold',
  },
  previewUrl: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins_500Medium',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  actionButton: {
    flexGrow: 1,
  },
});
