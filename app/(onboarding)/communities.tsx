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

import { useColors } from '@/hooks/useColors';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { communityGroups, communityFlags } from '@/constants/onboardingCommunities';

import { Button } from '@/components/ui/Button';
import { LinearGradient } from 'expo-linear-gradient';

import {
  CultureTokens,
  gradients,
  CardTokens,
  glass,
  shadows,
} from '@/constants/theme';

import * as Haptics from 'expo-haptics';
import { routeWithRedirect, sanitizeInternalRedirect } from '@/lib/routes';

export default function CommunitiesScreen() {
  const colors = useColors();
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

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.gradientBg}
      />

      {/* Decorative Orbs (Web) */}
      {Platform.OS === 'web' && (
        <>
          <View style={[s.orb, { top: -100, right: -50, backgroundColor: CultureTokens.indigo, opacity: 0.5 }]} />
          <View style={[s.orb, { bottom: -50, left: -50, backgroundColor: CultureTokens.gold, opacity: 0.3 }]} />
        </>
      )}

      {/* Desktop Back Button */}
      {isDesktop && (
        <View style={s.desktopBackRow}>
          <Pressable
            onPress={() =>
              router.canGoBack()
                ? router.back()
                : router.replace(routeWithRedirect('/(onboarding)/location', redirectTo))
            }
            style={[s.desktopBackBtn, { backgroundColor: glass.overlay.backgroundColor, borderColor: colors.border }]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={18} color={colors.textInverse} />
            <Text style={[s.desktopBackText, { color: colors.textInverse }]}>Back</Text>
          </Pressable>
        </View>
      )}

      {/* Mobile Header */}
      {!isDesktop && (
        <View style={[s.mobileHeader, { paddingTop: insets.top + 12 }]}>
          <Pressable
            onPress={() =>
              router.canGoBack()
                ? router.back()
                : router.replace(routeWithRedirect('/(onboarding)/location', redirectTo))
            }
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={28} color={colors.textInverse} />
          </Pressable>
          <Text style={[s.stepText, { color: colors.textSecondary }]}>2 of 4</Text>
        </View>
      )}

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={[
          s.scrollContent,
          isDesktop && s.scrollContentDesktop,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={enter(50)} style={[s.formContainer, isDesktop && s.formContainerDesktop]}>
          {/* Glass Card Background */}
          <View
            style={[
              StyleSheet.absoluteFill,
              s.formBlur,
              {
                backgroundColor: glass.dark.backgroundColor,
                borderRadius: CardTokens.radiusLarge,
                borderColor: colors.borderLight,
              },
            ]}
          />

          <View style={s.formContent}>
            {/* Header */}
            <View style={s.headerBlock}>
              <View style={[s.iconWrapper, { backgroundColor: `${CultureTokens.indigo}20`, borderColor: `${CultureTokens.indigo}60` }]}>
                <Text style={s.headerEmoji}>🌏</Text>
              </View>
              <Text style={[s.title, { color: colors.textInverse }]}>Your Communities</Text>
              <Text style={s.subtitle}>
                Pick the diaspora and cultural groups you&apos;d like to connect with.
              </Text>
            </View>

            {/* Community Groups */}
            {communityGroups.map((group, index) => (
              <Animated.View entering={enter(80 + index * 40)} key={group.label} style={s.section}>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionEmoji}>{group.emoji}</Text>
                  <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>{group.label}</Text>
                  <View style={[s.sectionLine, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
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
                                : 'rgba(255,255,255,0.06)',
                            borderColor: isSelected
                              ? group.color
                              : pressed
                                ? `${group.color}60`
                                : 'rgba(255,255,255,0.13)',
                          },
                        ]}
                        onPress={() => toggle(community)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isSelected }}
                        accessibilityLabel={community}
                      >
                        <Text style={s.chipFlag}>{flag}</Text>
                        <Text
                          style={[
                            s.chipText,
                            { color: isSelected ? '#fff' : colors.textInverse },
                          ]}
                          numberOfLines={1}
                        >
                          {community}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={15} color="rgba(255,255,255,0.9)" />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </Animated.View>
            ))}

            <View style={s.spacer} />

            {/* Selection Summary */}
            <View
              style={[
                s.selectedPill,
                {
                  backgroundColor: selected.length > 0 ? `${CultureTokens.indigo}30` : 'rgba(255,255,255,0.06)',
                  borderColor: selected.length > 0 ? `${CultureTokens.indigo}60` : 'rgba(255,255,255,0.1)',
                },
              ]}
            >
              <Ionicons
                name={selected.length > 0 ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={selected.length > 0 ? CultureTokens.indigo : colors.textSecondary}
              />
              <Text
                style={[
                  s.selectedCount,
                  { color: selected.length > 0 ? colors.textInverse : colors.textSecondary },
                ]}
              >
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

  orb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    ...Platform.select({ web: { filter: 'blur(50px)' } as any }),
  },

  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 80,
    justifyContent: 'center',
  },
  scrollContentDesktop: { paddingVertical: 80 },

  desktopBackRow: { position: 'absolute', top: 32, left: 40, zIndex: 10 },
  desktopBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
  },
  desktopBackText: { fontSize: 14, fontFamily: 'Poppins_500Medium' },

  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  stepText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  formContainer: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: CardTokens.radiusLarge,
  },
  formContainerDesktop: { maxWidth: 660 },

  formBlur: { borderWidth: 1 },

  formContent: { padding: CardTokens.paddingLarge * 2 },

  headerBlock: { alignItems: 'center', marginBottom: 28 },
  iconWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
  },
  headerEmoji: { fontSize: 32 },
  title: {
    fontSize: 30,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    lineHeight: 21,
    color: 'rgba(255,255,255,0.75)',
  },

  section: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionEmoji: { fontSize: 15 },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionLine: { flex: 1, height: 1 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipFlag: { fontSize: 15 },
  chipText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    flexShrink: 1,
  },

  spacer: { height: 32 },

  selectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  selectedCount: { fontSize: 14, fontFamily: 'Poppins_500Medium' },

  submitBtn: { height: 56, borderRadius: 16 },
});
