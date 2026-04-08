import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { communityGroups, communityFlags } from '@/constants/onboardingCommunities';
import { Button } from '@/components/ui/Button';
import { LinearGradient } from 'expo-linear-gradient';
import { CultureTokens, gradients, CardTokens, glass, shadows } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { routeWithRedirect, sanitizeInternalRedirect } from '@/lib/routes';

export default function CommunitiesScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 1024;
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const searchParams = useLocalSearchParams();
  const redirectTo = sanitizeInternalRedirect(searchParams.redirectTo ?? searchParams.redirect);

  const { state, setCommunities } = useOnboarding();
  const [selected, setSelected] = useState<string[]>(state.communities || []);

  const toggle = useCallback((community: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(prev =>
      prev.includes(community) ? prev.filter(c => c !== community) : [...prev, community]
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBg}
      />

      {Platform.OS === 'web' ? (
        <>
          <View style={[styles.orb, { top: -100, right: -50, backgroundColor: CultureTokens.indigo, opacity: 0.5, filter: 'blur(50px)' } as any]} />
          <View style={[styles.orb, { bottom: -50, left: -50, backgroundColor: CultureTokens.gold, opacity: 0.3, filter: 'blur(50px)' } as any]} />
        </>
      ) : null}

      {isDesktop && (
        <View style={styles.desktopBackRow}>
          <Pressable
            onPress={() => router.canGoBack() ? router.back() : router.replace(routeWithRedirect('/(onboarding)/location', redirectTo))}
            hitSlop={8}
            style={[styles.desktopBackBtn, { backgroundColor: glass.overlay.backgroundColor, borderColor: colors.border }]}
          >
            <Ionicons name="chevron-back" size={18} color={colors.textInverse} />
            <Text style={[styles.desktopBackText, { color: colors.textInverse }]}>Back</Text>
          </Pressable>
        </View>
      )}

      {!isDesktop && (
        <View style={[styles.mobileHeader, { paddingTop: topInset + 12 }]}>
          <Pressable
            onPress={() => router.canGoBack() ? router.back() : router.replace(routeWithRedirect('/(onboarding)/location', redirectTo))}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={28} color={colors.textInverse} />
          </Pressable>
          <Text style={[styles.stepText, { color: colors.textSecondary }]}>2 of 4</Text>
        </View>
      )}

      <KeyboardAvoidingView style={styles.keyboardAvoid} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop && styles.scrollContentDesktop,
            !isDesktop && { paddingTop: 20 },
          ]}
        >
          <View style={[styles.formContainer, isDesktop && styles.formContainerDesktop, { borderRadius: CardTokens.radiusLarge }]}>
            {Platform.OS === 'ios' || Platform.OS === 'web' ? (
              <BlurView
                intensity={isDesktop ? 60 : 40}
                tint="dark"
                style={[StyleSheet.absoluteFill, styles.formBlur, { borderRadius: CardTokens.radiusLarge, borderColor: colors.borderLight }]}
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.formBlur, { backgroundColor: glass.dark.backgroundColor, borderRadius: CardTokens.radiusLarge, borderColor: colors.borderLight }]} />
            )}

            <View style={[styles.formContent, { padding: CardTokens.paddingLarge * 2 }]}>
              {/* Header */}
              <View style={styles.headerBlock}>
                <View style={[styles.iconWrapper, { backgroundColor: `${CultureTokens.indigo}20`, borderColor: `${CultureTokens.indigo}60` }]}>
                  <Text style={styles.headerEmoji}>🌏</Text>
                </View>
                <Text style={[styles.title, { color: colors.textInverse }]}>Your Communities</Text>
                <Text style={styles.subtitle}>
                  Pick the diaspora and cultural groups you'd like to connect with.
                </Text>
              </View>

              {/* Grouped sections */}
              {communityGroups.map((group) => (
                <View key={group.label} style={styles.section}>
                  {/* Section header */}
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionEmoji}>{group.emoji}</Text>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{group.label}</Text>
                    <View style={[styles.sectionLine, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
                  </View>

                  {/* Chips */}
                  <View style={styles.chipRow}>
                    {group.members.map((community) => {
                      const isSelected = selected.includes(community);
                      const flag = communityFlags[community] ?? '🌐';
                      return (
                        <Pressable
                          key={community}
                          style={({ pressed }) => [
                            styles.chip,
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
                          <Text style={styles.chipFlag}>{flag}</Text>
                          <Text
                            style={[
                              styles.chipText,
                              { color: isSelected ? '#fff' : colors.textInverse, opacity: isSelected ? 1 : 0.85 },
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
                </View>
              ))}

              <View style={styles.spacer} />

              {/* Selected count + Continue */}
              <View style={[styles.selectedPill, { backgroundColor: selected.length > 0 ? `${CultureTokens.indigo}30` : 'rgba(255,255,255,0.06)', borderColor: selected.length > 0 ? `${CultureTokens.indigo}60` : 'rgba(255,255,255,0.1)' }]}>
                <Ionicons
                  name={selected.length > 0 ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={selected.length > 0 ? CultureTokens.indigo : colors.textSecondary}
                />
                <Text style={[styles.selectedCount, { color: selected.length > 0 ? colors.textInverse : colors.textSecondary }]}>
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
                style={[styles.submitBtn, shadows.medium, { backgroundColor: CultureTokens.gold }]}
              >
                Continue
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1 },
  gradientBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.85 },
  orb: { position: 'absolute', width: 300, height: 300, borderRadius: 150 },
  keyboardAvoid: { flex: 1 },
  mobileHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 },
  stepText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', letterSpacing: 1, textTransform: 'uppercase' },
  desktopBackRow: { position: 'absolute', top: 32, left: 40, zIndex: 10 },
  desktopBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1 },
  desktopBackText: { fontSize: 14, fontFamily: 'Poppins_500Medium' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 60, justifyContent: 'center' },
  scrollContentDesktop: { paddingVertical: 60 },
  formContainer: { width: '100%', maxWidth: 600, alignSelf: 'center', overflow: 'hidden' },
  formContainerDesktop: { maxWidth: 660 },
  formBlur: { borderWidth: 1 },
  formContent: { paddingTop: 40 },

  headerBlock: { alignItems: 'center', marginBottom: 28 },
  iconWrapper: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1.5 },
  headerEmoji: { fontSize: 32 },
  title: { fontSize: 30, fontFamily: 'Poppins_700Bold', textAlign: 'center', marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 21, color: 'rgba(255,255,255,0.75)' },

  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionEmoji: { fontSize: 15 },
  sectionLabel: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.8, textTransform: 'uppercase' },
  sectionLine: { flex: 1, height: 1 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipFlag: { fontSize: 15 },
  chipText: { fontSize: 13, fontFamily: 'Poppins_500Medium', flexShrink: 1 },

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
    marginBottom: 14,
  },
  selectedCount: { fontSize: 14, fontFamily: 'Poppins_500Medium' },
  submitBtn: { height: 56, borderRadius: 16 },
});
