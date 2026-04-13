import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useOnboarding } from '@/contexts/OnboardingContext';
import { communityGroups, communityFlags } from '@/constants/onboardingCommunities';

import { Button } from '@/components/ui/Button';
import { LinearGradient } from 'expo-linear-gradient';
<<<<<<< HEAD
import { CultureTokens, gradients, CardTokens, glass, shadows, TextStyles } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { routeWithRedirect, sanitizeInternalRedirect } from '@/lib/routes';

// All text inside the dark glass card uses white-based values
// glass.dark.backgroundColor = "#1C1C1E" — always dark regardless of theme
const ON_DARK = {
  text: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.65)',
  textDim: 'rgba(255,255,255,0.45)',
  chipText: 'rgba(255,255,255,0.90)',
  chipBg: 'rgba(255,255,255,0.06)',
  chipBorder: 'rgba(255,255,255,0.13)',
  cardBorder: 'rgba(255,255,255,0.15)',
  sectionLine: 'rgba(255,255,255,0.08)',
};

export default function CommunitiesScreen() {
  const insets = useSafeAreaInsets();
  const searchParams = useLocalSearchParams();
  const redirectTo = sanitizeInternalRedirect(searchParams.redirectTo ?? searchParams.redirect);

  const { state, setCommunities } = useOnboarding();
  const [selected, setSelected] = useState<string[]>(state.communities || []);
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 1024;

  const toggle = useCallback((community: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected((prev) =>
      prev.includes(community) ? prev.filter((c) => c !== community) : [...prev, community]
    );
  }, []);

  const handleNext = useCallback(() => {
    if (selected.length === 0) {
      Alert.alert('Select at least one community', 'Choose one or more communities to continue.');
      return;
    }
    setCommunities(selected);
    router.replace(routeWithRedirect('/(onboarding)/culture-match', redirectTo));
  }, [selected, setCommunities, redirectTo]);

  const enter = (delay: number) =>
    FadeInDown.delay(delay).springify().damping(22).stiffness(130);

  const goBack = () =>
    router.canGoBack()
      ? router.back()
      : router.replace(routeWithRedirect('/(onboarding)/location', redirectTo));

  return (
    <View style={s.container}>
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.gradientBg}
      />

      {/* Decorative orbs — web only */}
      {Platform.OS === 'web' && (
        <>
          <View style={[s.orb, { top: -100, right: -50, backgroundColor: CultureTokens.indigo, opacity: 0.5 }]} />
          <View style={[s.orb, { bottom: -50, left: -50, backgroundColor: CultureTokens.gold, opacity: 0.3 }]} />
        </>
      )}

      {/* Desktop Back */}
      {isDesktop && (
        <View style={s.desktopBackRow}>
          <Pressable
            onPress={goBack}
            style={[s.desktopBackBtn, { backgroundColor: glass.overlay.backgroundColor, borderColor: 'rgba(255,255,255,0.20)' }]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={18} color="#FFFFFF" />
            <Text style={[s.desktopBackText, { color: '#FFFFFF' }]}>Back</Text>
          </Pressable>
        </View>
      )}

      {/* Mobile Header */}
      {!isDesktop && (
        <View style={[s.mobileHeader, { paddingTop: insets.top + 12 }]}>
          <Pressable
            onPress={goBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={s.mobileBackBtn}
          >
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </Pressable>

          <View style={s.stepIndicatorWrap}>
            <Text style={s.stepText}>Step 2 of 4</Text>
            {/* Step 2/4 = 50% progress */}
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: '50%' }]} />
            </View>
          </View>
        </View>
      )}

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={[s.scrollContent, isDesktop && s.scrollContentDesktop]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={enter(50)} style={[s.formContainer, isDesktop && s.formContainerDesktop]}>
          {/* Glass card */}
          <View
            style={[
              StyleSheet.absoluteFill,
              s.formBlur,
              { borderRadius: CardTokens.radiusLarge },
            ]}
          />

          <View style={s.formContent}>
            {/* Header */}
            <View style={s.headerBlock}>
              <View style={s.iconWrapper}>
                <Ionicons name="earth" size={32} color={CultureTokens.teal} />
              </View>
              <Text style={s.title}>Your Communities</Text>
              <Text style={s.subtitle}>
                Pick the diaspora and cultural groups you&apos;d like to connect with.
              </Text>
            </View>

            {/* Community Groups */}
            {communityGroups.map((group, index) => (
              <Animated.View entering={enter(80 + index * 40)} key={group.label} style={s.section}>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionEmoji}>{group.emoji}</Text>
                  <Text style={s.sectionLabel}>{group.label}</Text>
                  <View style={[s.sectionLine, { backgroundColor: ON_DARK.sectionLine }]} />
                </View>

                <View style={s.chipRow}>
                  {group.members.map((community) => {
                    const isSelected = selected.includes(community);
                    const flag = communityFlags[community] ?? '🌐';

                    return (
                      <Pressable
                        key={community}
                        style={({ pressed }) => [
                          s.chip,
                          {
                            backgroundColor: isSelected
                              ? group.color
                              : pressed
                                ? `${group.color}22`
                                : ON_DARK.chipBg,
                            borderColor: isSelected
                              ? group.color
                              : pressed
                                ? `${group.color}60`
                                : ON_DARK.chipBorder,
                          },
                        ]}
                        onPress={() => toggle(community)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isSelected }}
                        accessibilityLabel={community}
                      >
                        <Text style={s.chipFlag}>{flag}</Text>
                        <Text style={[s.chipText, isSelected && s.chipTextSelected]} numberOfLines={1}>
                          {community}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={15} color="rgba(255,255,255,0.90)" />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </Animated.View>
            ))}

            <View style={s.spacer} />

            {/* Selection summary */}
            <View
              style={[
                s.selectedPill,
                selected.length > 0
                  ? { backgroundColor: `${CultureTokens.indigo}30`, borderColor: `${CultureTokens.indigo}60` }
                  : { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.10)' },
              ]}
            >
              <Ionicons
                name={selected.length > 0 ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={selected.length > 0 ? CultureTokens.indigo : ON_DARK.textDim}
              />
              <Text style={[s.selectedCount, selected.length === 0 && { color: ON_DARK.textDim }]}>
                {selected.length === 0
                  ? 'No communities selected'
                  : `${selected.length} ${selected.length === 1 ? 'community' : 'communities'} selected`}
              </Text>
            </View>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              rightIcon="arrow-forward"
              disabled={selected.length === 0}
              onPress={handleNext}
              style={[s.submitBtn, shadows.medium, { backgroundColor: CultureTokens.gold }]}
            >
              Continue
            </Button>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  gradientBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.85 },
<<<<<<< HEAD
  orb: { position: 'absolute', width: 300, height: 300, borderRadius: 150 },
  keyboardAvoid: { flex: 1 },
  mobileHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 },
  stepText: { ...TextStyles.captionSemibold, letterSpacing: 1, textTransform: 'uppercase' },
||||||| 7dc71c1
  orb: { position: 'absolute', width: 300, height: 300, borderRadius: 150 },
  keyboardAvoid: { flex: 1 },
  mobileHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 },
  stepText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', letterSpacing: 1, textTransform: 'uppercase' },
=======

  orb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    ...Platform.select({ web: { filter: 'blur(50px)' } as any }),
  },

  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 80, justifyContent: 'center' },
  scrollContentDesktop: { paddingVertical: 80 },

  // Desktop back
>>>>>>> cursor/onboarding-brand-lint-fixes
  desktopBackRow: { position: 'absolute', top: 32, left: 40, zIndex: 10 },
<<<<<<< HEAD
  desktopBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1 },
  desktopBackText: { ...TextStyles.label },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 60, justifyContent: 'center' },
  scrollContentDesktop: { paddingVertical: 60 },
  formContainer: { width: '100%', maxWidth: 600, alignSelf: 'center', overflow: 'hidden' },
||||||| 7dc71c1
  desktopBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1 },
  desktopBackText: { fontSize: 14, fontFamily: 'Poppins_500Medium' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 60, justifyContent: 'center' },
  scrollContentDesktop: { paddingVertical: 60 },
  formContainer: { width: '100%', maxWidth: 600, alignSelf: 'center', overflow: 'hidden' },
=======
  desktopBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
  },
  desktopBackText: { fontSize: FontSize.body2, fontFamily: FontFamily.medium },

  // Mobile header
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  mobileBackBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  stepIndicatorWrap: { flex: 1, alignItems: 'flex-end', gap: 6 },
  stepText: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.chip,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.60)',
  },
  progressTrack: {
    width: 80,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: CultureTokens.gold },

  // Form card
  formContainer: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: CardTokens.radiusLarge,
  },
>>>>>>> cursor/onboarding-brand-lint-fixes
  formContainerDesktop: { maxWidth: 660 },
  formBlur: {
    backgroundColor: glass.dark.backgroundColor,
    borderWidth: 1,
    borderColor: ON_DARK.cardBorder,
  },
  formContent: { padding: 28 },

  // Header
  headerBlock: { alignItems: 'center', marginBottom: 28 },
<<<<<<< HEAD
  iconWrapper: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1.5 },
  headerEmoji: { fontSize: 32 },
  title: { fontSize: 30, fontFamily: 'Poppins_700Bold', textAlign: 'center', marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { ...TextStyles.cardBody, textAlign: 'center', lineHeight: 21, color: colors.textSecondary },
||||||| 7dc71c1
  iconWrapper: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1.5 },
  headerEmoji: { fontSize: 32 },
  title: { fontSize: 30, fontFamily: 'Poppins_700Bold', textAlign: 'center', marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 21, color: 'rgba(255,255,255,0.75)' },
=======
  iconWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    backgroundColor: `${CultureTokens.teal}18`,
    borderColor: CultureTokens.teal,
  },
  title: {
    fontSize: 28,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
    color: ON_DARK.text,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    lineHeight: 21,
    color: 'rgba(255,255,255,0.65)',
    maxWidth: 320,
  },
>>>>>>> cursor/onboarding-brand-lint-fixes

  // Community group sections
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionEmoji: { fontSize: 15 },
<<<<<<< HEAD
  sectionLabel: { ...TextStyles.captionSemibold, letterSpacing: 0.8, textTransform: 'uppercase' },
||||||| 7dc71c1
  sectionLabel: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.8, textTransform: 'uppercase' },
=======
  sectionLabel: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: ON_DARK.textMuted,
  },
>>>>>>> cursor/onboarding-brand-lint-fixes
  sectionLine: { flex: 1, height: 1 },

  // Chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 44,
  },
  chipFlag: { fontSize: 15 },
<<<<<<< HEAD
  chipText: { ...TextStyles.chip, flexShrink: 1 },
||||||| 7dc71c1
  chipText: { fontSize: 13, fontFamily: 'Poppins_500Medium', flexShrink: 1 },
=======
  chipText: {
    fontSize: FontSize.chip,
    fontFamily: FontFamily.medium,
    flexShrink: 1,
    color: ON_DARK.chipText,
  },
  chipTextSelected: { color: '#FFFFFF', fontFamily: FontFamily.semibold },
>>>>>>> cursor/onboarding-brand-lint-fixes

  spacer: { height: 24 },

  // Selection summary
  selectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    minHeight: 44,
  },
<<<<<<< HEAD
  selectedCount: { ...TextStyles.label },
||||||| 7dc71c1
  selectedCount: { fontSize: 14, fontFamily: 'Poppins_500Medium' },
=======
  selectedCount: {
    fontSize: FontSize.body2,
    fontFamily: FontFamily.medium,
    color: ON_DARK.text,
  },

>>>>>>> cursor/onboarding-brand-lint-fixes
  submitBtn: { height: 56, borderRadius: 16 },
});
