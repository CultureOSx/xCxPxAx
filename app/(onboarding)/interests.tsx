import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  type DimensionValue,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '@/contexts/OnboardingContext';
import {
  interestCategories,
  interestIcons,
  popularInterestsSydney,
  type InterestCategory,
} from '@/constants/onboardingInterests';

import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useInterestsSelection } from '@/hooks/useInterestsSelection';
import { Button } from '@/components/ui/Button';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CultureTokens,
  gradients,
  shadows,
  Spacing,
  FontFamily,
  FontSize,
  TextStyles,
  IconSize,
} from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';

const MIN_REQUIRED = 5;

const INITIALLY_OPEN = new Set(['cultural', 'arts']);

const CATEGORY_EMOJI: Record<string, string> = {
  cultural: '🎭',
  arts:     '🎨',
  food:     '🍛',
  business: '💼',
  family:   '👨‍👩‍👧',
  civic:    '🏙️',
  wellness: '🧘',
  format:   '🎟️',
};

// ---------------------------------------------------------------------------
// InterestChip
// ---------------------------------------------------------------------------
const InterestChip = React.memo(function InterestChip({
  interest, icon, isSelected, accentColor, onPress,
}: {
  interest: string;
  icon: string;
  isSelected: boolean;
  accentColor: string;
  onPress: () => void;
}) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.chip,
        isSelected
          ? { backgroundColor: accentColor, borderColor: 'transparent' }
          : {
              backgroundColor: pressed ? `${colors.text}12` : `${colors.text}0A`,
              borderColor: `${colors.text}21`,
            },
        pressed && !isSelected && { transform: [{ scale: 0.97 }] },
      ]}
      accessibilityRole="checkbox"
      accessibilityLabel={interest}
      accessibilityState={{ checked: isSelected }}
    >
      <Ionicons
        name={icon as keyof typeof Ionicons.glyphMap}
        size={FontSize.body2}
        color={isSelected ? colors.background : accentColor}
      />
      <Text style={[s.chipText, { color: isSelected ? colors.background : `${colors.text}CC` }]}>
        {interest}
      </Text>
      {isSelected && (
        <Ionicons name="checkmark" size={FontSize.micro} color={`${colors.background}A6`} />
      )}
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function InterestsScreen() {
  const colors = useColors();
  const { isDesktop } = useLayout();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const {
    selected,
    expanded,
    isSubmitting,
    selectedSet,
    categoryByInterest,
    isReady,
    remaining,
    MIN_REQUIRED,
    toggle,
    toggleAll,
    toggleSection,
    handleFinish: handleFinishHook
  } = useInterestsSelection();

  const handleFinish = async () => {
    if (!isReady) {
      Alert.alert('Select more interests', `Please select at least ${MIN_REQUIRED} interests to continue.`);
      return;
    }
    const res = await handleFinishHook();
    if (res?.success === false) {
      Alert.alert('Could not finish onboarding', 'Please try again.');
    }
  };

  const progressPct = `${Math.min(1, selected.length / MIN_REQUIRED) * 100}%` as DimensionValue;

  return (
    <View style={s.root}>
      <LinearGradient
        colors={gradients.culturepassBrand}
        style={StyleSheet.absoluteFillObject}
      />
      {Platform.OS === 'web' && (
        <>
          <View style={[s.orb, { top: -80, right: -60, backgroundColor: CultureTokens.indigo }]} />
          <View style={[s.orb, { bottom: 100, left: -80, backgroundColor: CultureTokens.gold, opacity: 0.25 }]} />
        </>
      )}

      {/* Header */}
      <View style={[s.header, { paddingTop: topInset + 14 }]}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(onboarding)/communities')}
          style={s.backBtn}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={IconSize.lg} color={colors.textSecondary} />
        </Pressable>
        <Text style={[s.stepLabel, { color: colors.textSecondary }]}>STEP 4 OF 4</Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          s.scrollContent,
          isDesktop && s.scrollContentDesktop,
          { paddingBottom: bottomInset + 130 },
        ]}
      >
        <Animated.View entering={FadeInUp.springify().damping(16).delay(100)} style={isDesktop ? s.desktopCard : undefined}>
          {Platform.OS === 'ios' && isDesktop && (
            <BlurView intensity={25} tint="dark" style={[StyleSheet.absoluteFill, { borderRadius: 28 }]} />
          )}
          {/* Title */}
          <View style={s.titleBlock}>
            <Text style={[s.title, { color: colors.text }]}>What interests{'\n'}you?</Text>
            <Text style={[s.subtitle, { color: colors.textSecondary }]}>
              Pick at least {MIN_REQUIRED} to personalise your CulturePass feed
            </Text>
          </View>

          {/* Progress bar */}
          <Animated.View entering={FadeInDown.springify().damping(15).delay(150)} style={s.progressBlock}>
            <View style={[s.progressTrack, { backgroundColor: colors.borderLight }]}>
              <View
                style={[
                  s.progressFill,
                  {
                    width: progressPct,
                    backgroundColor: isReady ? CultureTokens.teal : CultureTokens.gold,
                  },
                ]}
              />
            </View>
            <Text style={[s.progressLabel, { color: isReady ? CultureTokens.teal : colors.textSecondary }]}>
              {isReady ? `${selected.length} selected` : `${selected.length} / ${MIN_REQUIRED}`}
            </Text>
          </Animated.View>

          {/* Popular picks */}
          <Animated.View entering={FadeInDown.springify().damping(15).delay(200)} style={s.section}>
            <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>Popular near you</Text>
            <View style={s.chipWrap}>
              {popularInterestsSydney.map(interest => {
                const cat = categoryByInterest.get(interest);
                const accent = cat?.accentColor ?? CultureTokens.gold;
                const icon = interestIcons[interest] ?? 'star';
                return (
                  <InterestChip
                    key={interest}
                    interest={interest}
                    icon={icon}
                    isSelected={selectedSet.has(interest)}
                    accentColor={accent}
                    onPress={() => toggle(interest)}
                  />
                );
              })}
            </View>
          </Animated.View>

          <View style={[s.divider, { backgroundColor: colors.borderLight }]} />

          {/* Category accordions */}
          {interestCategories.map(category => {
            const isOpen = expanded[category.id] ?? false;
            const countInCat = category.interests.filter(i => selectedSet.has(i)).length;
            const allSelected = category.interests.every(i => selectedSet.has(i));
            const accent = category.accentColor;
            const emoji = CATEGORY_EMOJI[category.id] ?? '•';

            return (
              <View key={category.id} style={s.categoryBlock}>
                <View style={s.categoryHeader}>
                  <Pressable
                    style={({ pressed }) => [s.categoryHeaderPress, pressed && { opacity: 0.75 }]}
                    onPress={() => toggleSection(category.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${category.title}, ${countInCat} selected`}
                    accessibilityState={{ expanded: isOpen }}
                  >
                    <View style={[s.categoryIconWrap, { backgroundColor: `${accent}2A` }]}>
                      <Text style={s.categoryEmoji}>{emoji}</Text>
                    </View>
                    <View style={s.categoryTitleBlock}>
                      <Text style={[s.categoryTitle, { color: colors.text }]}>{category.title}</Text>
                      {countInCat > 0 && (
                        <Text style={[s.categoryCount, { color: accent }]}>
                          {countInCat} selected
                        </Text>
                      )}
                    </View>
                  </Pressable>

                  {isOpen && (
                    <Pressable
                      onPress={e => { e.stopPropagation?.(); toggleAll(category); }}
                      style={[s.selectAllBtn, { backgroundColor: `${accent}18`, borderColor: `${accent}35` }]}
                      hitSlop={Spacing.sm}
                      accessibilityRole="button"
                      accessibilityLabel={allSelected ? `Clear all ${category.title}` : `Select all ${category.title}`}
                    >
                      <Text style={[s.selectAllText, { color: accent }]}>
                        {allSelected ? 'Clear' : 'All'}
                      </Text>
                    </Pressable>
                  )}

                  <Pressable onPress={() => toggleSection(category.id)} hitSlop={10} style={s.chevronBtn}>
                    <Ionicons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={IconSize.sm}
                      color={colors.textTertiary}
                    />
                  </Pressable>
                </View>

                {isOpen && (
                  <Animated.View entering={FadeInUp.springify().damping(18)} layout={Layout.springify().damping(16)} style={s.chipWrap}>
                    {category.interests.map(interest => {
                      const icon = interestIcons[interest] ?? 'star';
                      return (
                        <InterestChip
                          key={interest}
                          interest={interest}
                          icon={icon}
                          isSelected={selectedSet.has(interest)}
                          accentColor={accent}
                          onPress={() => toggle(interest)}
                        />
                      );
                    })}
                  </Animated.View>
                )}

                <View style={[s.categoryDivider, { backgroundColor: colors.borderLight }]} />
              </View>
            );
          })}
        </Animated.View>
      </ScrollView>

      {/* Sticky bottom CTA */}
      <LinearGradient
        colors={['transparent', gradients.culturepassBrand[0]]}
        style={s.bottomFade}
        pointerEvents="none"
      />
      <Animated.View entering={FadeInDown.springify().damping(20).delay(250)} style={[s.bottomBar, { paddingBottom: bottomInset + Spacing.md }]}>
        {!isReady && (
          <Text style={[s.remainingText, { color: colors.textSecondary }]}>
            {remaining === 1 ? '1 more interest to go' : `${remaining} more interests to go`}
          </Text>
        )}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          rightIcon={isReady ? 'sparkles' : undefined}
          disabled={!isReady || isSubmitting}
          onPress={handleFinish}
          style={[
            s.ctaBtn,
            isReady && { backgroundColor: CultureTokens.gold },
            shadows.large,
          ]}
        >
          {isSubmitting ? 'Starting...' : isReady ? 'Start Exploring' : `Select ${remaining} more`}
        </Button>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles — static StyleSheet (no per-render recreation)
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  root: { flex: 1 },

  orb: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.35,
    ...Platform.select({
      web: { filter: 'blur(80px)' } as Record<string, string>,
      default: {},
    }),
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: Spacing.xs,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  stepLabel: {
    ...TextStyles.badgeCaps,
    letterSpacing: 1.8,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Spacing.sm + 4,
  },
  scrollContentDesktop: {
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
  },

  desktopCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: Spacing.xl,
    marginTop: Spacing.sm,
  },

  titleBlock: {
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  title: {
    ...TextStyles.hero,
    fontSize: 36,
    lineHeight: 44,
  },
  subtitle: {
    ...TextStyles.callout,
  },

  progressBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 28,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 5,
    borderRadius: 3,
  },
  progressLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.chip,
    minWidth: 90,
    textAlign: 'right',
  },

  section: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    ...TextStyles.badgeCaps,
    letterSpacing: 1.6,
    marginBottom: 14,
  },
  divider: {
    height: 1,
    marginBottom: Spacing.sm,
  },

  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.chip,
  },

  categoryBlock: {
    marginBottom: Spacing.xs,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 4,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xs,
  },
  categoryHeaderPress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 4,
  },
  categoryIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  categoryEmoji: {
    fontSize: FontSize.title2,
  },
  categoryTitleBlock: {
    flex: 1,
    gap: 2,
  },
  categoryTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.body,
  },
  categoryCount: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption,
  },
  selectAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Spacing.sm,
    borderWidth: 1,
  },
  selectAllText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.caption,
  },
  chevronBtn: {
    paddingLeft: Spacing.sm + 4,
  },
  categoryDivider: {
    height: 1,
    marginTop: 10,
    marginBottom: Spacing.xs,
    marginHorizontal: Spacing.xs,
  },

  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm + 4,
    gap: Spacing.sm,
  },
  remainingText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.chip,
    textAlign: 'center',
  },
  ctaBtn: {
    borderRadius: 18,
    height: 56,
  },
});
