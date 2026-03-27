import {
  View, Text, Pressable, StyleSheet, ScrollView, Platform,
  KeyboardAvoidingView, Alert, ActivityIndicator, Share,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { CultureTokens } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { useColors } from '@/hooks/useColors';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { api, ApiError } from '@/lib/api';
import { TextStyles } from '@/constants/typography';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useAuth } from '@/lib/auth';
import { Community } from '@/shared/schema';

import { getStyles } from '@/components/community-create/styles';
import {
  CommunityFormData, CommunityStep,
  defaultCommunityForm, ALL_COMMUNITY_STEPS, STEP_TITLES, STEP_ICONS, getStepSub,
} from '@/components/community-create/types';

import { StepBasics } from '@/components/community-create/StepBasics';
import { StepImage } from '@/components/community-create/StepImage';
import { StepLocation } from '@/components/community-create/StepLocation';
import { StepCulture } from '@/components/community-create/StepCulture';
import { StepMembership } from '@/components/community-create/StepMembership';
import { StepSocial } from '@/components/community-create/StepSocial';
import { StepReview } from '@/components/community-create/StepReview';

// ---------------------------------------------------------------------------
// Success Screen
// ---------------------------------------------------------------------------
function SuccessScreen({
  community,
  onCreateAnother,
  colors,
}: {
  community: Community;
  onCreateAnother: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const s = getStyles(colors);
  const handleShare = async () => {
    try {
      await Share.share({ message: `Join the ${community.name} community on CulturePass!` });
    } catch {
      // user cancelled
    }
  };

  return (
    <View style={[s.successRoot, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[CultureTokens.indigo + 'CC', colors.background]}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.5 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <Animated.View entering={FadeInUp.delay(0).springify().damping(18)} style={s.successIconWrap}>
        <Ionicons name="people-circle" size={80} color={CultureTokens.indigo} />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(120).springify().damping(18)} style={s.successContent}>
        <Text style={[s.successTitle, { color: colors.text }]}>Community Created!</Text>
        <Text style={[s.successSub, { color: colors.textSecondary }]}>
          {community.name} is now live. Invite your friends to join!
        </Text>
        {community.imageUrl ? (
          <Image
            source={{ uri: community.imageUrl }}
            style={s.successImage}
            contentFit="cover"
            accessibilityLabel="Community hero image"
          />
        ) : null}
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(240).springify().damping(18)} style={s.successActions}>
        <Button
          variant="primary" size="lg" fullWidth leftIcon="eye-outline"
          onPress={() => router.replace({ pathname: '/community/[id]', params: { id: community.id } })}
        >
          View Community
        </Button>
        <Button 
          variant="outline" 
          size="lg" 
          fullWidth 
          leftIcon="share-social-outline" 
          onPress={handleShare}
          style={{ borderColor: colors.borderLight }}
        >
          Share Community
        </Button>
        <Button variant="ghost" size="md" fullWidth onPress={onCreateAnother}>
          Create Another Community
        </Button>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function CreateCommunityScreen() {
  const colors = useColors();
  const s = getStyles(colors);
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const { state: onboardingState } = useOnboarding();

  const isDesktop = Platform.OS === 'web' && typeof window !== 'undefined' && window.innerWidth >= 1024;
  const topInset = Platform.OS === 'web' ? 0 : insets.top;

  const [form, setForm] = useState<CommunityFormData>({
    ...defaultCommunityForm,
    city: onboardingState.city || '',
    country: onboardingState.country || 'Australia',
    nationalityId: onboardingState.nationalityId || '',
    cultureIds: onboardingState.cultureIds?.slice(0, 3) ?? [],
    languageIds: onboardingState.languageIds?.slice(0, 2) ?? [],
  });

  const [stepIndex, setStepIndex] = useState(0);
  const { uploadImage, deleteImage, uploading: imageUploading } = useImageUpload();
  const [logoUploading, setLogoUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [publishedCommunity, setPublishedCommunity] = useState<Community | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const step = ALL_COMMUNITY_STEPS[stepIndex];

  // ── Mutation ──────────────────────────────────────────────────────────────
  const { mutate: createCommunity, isPending } = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name: form.name.trim(),
        description: form.description.trim(),
        communityCategory: form.category,
        city: form.city.trim(),
        country: form.country.trim(),
        imageUrl: form.imageUrl || undefined,
        logoUrl: form.logoUrl || undefined,
        avatarUrl: form.logoUrl || undefined, // sync avatar for profile
        nationalityId: form.nationalityId || undefined,
        cultureIds: form.cultureIds,
        languageIds: form.languageIds,
        diasporaGroupIds: form.diasporaGroupIds,
        website: form.website.trim() || undefined,
        instagram: form.instagram.trim() || undefined,
        facebook: form.facebook.trim() || undefined,
        twitter: form.twitter.trim() || undefined,
        telegram: form.telegram.trim() || undefined,
        joinMode: form.joinMode,
      };
      return api.communities.create(payload);
    },
    onSuccess: (community) => {
      queryClient.invalidateQueries({ queryKey: ['/api/communities'] });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPublishedCommunity(community);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.isUnauthorized) {
        router.push('/(onboarding)/login');
        return;
      }
      const message = err instanceof Error ? err.message : 'Please try again.';
      setPublishError(message);
      if (Platform.OS !== 'web') Alert.alert('Could not create community', message);
    },
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  const haptic = () => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };

  const setField = useCallback(<K extends keyof CommunityFormData>(key: K, value: CommunityFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const pickImage = useCallback(async (type: 'hero' | 'logo') => {
    haptic();
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'hero' ? [16, 9] : [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    
    setImageUploadError(null);
    if (type === 'logo') setLogoUploading(true);
    
    try {
      const field = type === 'hero' ? 'imageUrl' : 'logoUrl';
      const existingUrl = form[field];
      if (existingUrl) {
        await deleteImage('communities', 'temp', existingUrl, field);
      }
      const uploadId = userId ?? `anon-${Date.now()}`;
      const { downloadURL } = await uploadImage(result, 'communities', uploadId, field, true);
      setField(field, downloadURL);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not upload image. Please try again.';
      setImageUploadError(message);
    } finally {
      if (type === 'logo') setLogoUploading(false);
    }
  }, [userId, setField, form, deleteImage, uploadImage]);

  const validateStep = useCallback((): string | null => {
    if (step === 'basics') {
      if (!form.name.trim()) return 'Community name is required.';
      if (form.name.trim().length < 3) return 'Name must be at least 3 characters.';
      if (!form.description.trim()) return 'Please describe your community.';
    }
    if (step === 'location' && !form.city.trim()) return 'City is required.';
    return null;
  }, [step, form]);

  const goNext = useCallback(() => {
    const err = validateStep();
    if (err) { setStepError(err); return; }
    setStepError(null);
    setPublishError(null);
    if (step === 'review') { createCommunity(); return; }
    haptic();
    setStepIndex((i) => Math.min(i + 1, ALL_COMMUNITY_STEPS.length - 1));
  }, [step, validateStep, createCommunity]);

  const goBack = useCallback(() => {
    setStepError(null);
    setPublishError(null);
    if (stepIndex === 0) {
      if (router.canGoBack()) { router.back(); } else { router.replace('/(tabs)/community'); }
      return;
    }
    haptic();
    setStepIndex((i) => i - 1);
  }, [stepIndex]);

  // ── Rendering ─────────────────────────────────────────────────────────────
  if (publishedCommunity) {
    return (
      <SuccessScreen
        community={publishedCommunity}
        onCreateAnother={() => {
          setPublishedCommunity(null);
          setForm({ ...defaultCommunityForm, city: form.city, country: form.country });
          setStepIndex(0);
        }}
        colors={colors}
      />
    );
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[CultureTokens.indigo + 'CC', colors.background]}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.5 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Top bar */}
      <View style={[s.topBar, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={goBack} hitSlop={12} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <View style={s.topCenter}>
          <Text style={[TextStyles.title3, { color: colors.text }]}>Create Community</Text>
          <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>
            Step {stepIndex + 1} of {ALL_COMMUNITY_STEPS.length}
          </Text>
        </View>
        <View style={s.backBtn} />
      </View>

      {/* Progress bar */}
      <View style={s.progressTrack}>
        <View style={[s.progressFill, {
          width: `${((stepIndex + 1) / ALL_COMMUNITY_STEPS.length) * 100}%` as `${number}%`,
          backgroundColor: CultureTokens.indigo,
        }]} />
      </View>

      {/* Step dot indicator */}
      <View style={s.stepDots}>
        {ALL_COMMUNITY_STEPS.map((vs, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          return (
            <View key={vs} style={s.stepDotWrap}>
              <View style={[
                s.stepDot,
                active && { backgroundColor: CultureTokens.indigo, width: 24, borderRadius: 6 },
                done && { backgroundColor: CultureTokens.indigo },
                !active && !done && { backgroundColor: colors.borderLight },
              ]}>
                {done && <Ionicons name="checkmark" size={10} color="#fff" />}
              </View>
              {i < ALL_COMMUNITY_STEPS.length - 1 && (
                <View style={[s.stepDotLine, { backgroundColor: i < stepIndex ? CultureTokens.indigo : colors.borderLight }]} />
              )}
            </View>
          );
        })}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[s.scroll, isDesktop && s.scrollDesktop]}
        >
          <Animated.View
            key={step}
            entering={FadeInDown.duration(220).springify().damping(22)}
            style={[s.card, isDesktop && s.cardDesktop, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            {/* Step header */}
            <View style={s.stepHeader}>
              <View style={[s.stepIconWrap, { backgroundColor: CultureTokens.indigo + '20', borderColor: CultureTokens.indigo + '30' }]}>
                <Ionicons name={STEP_ICONS[step] as any} size={24} color={CultureTokens.indigo} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[TextStyles.title2, { color: colors.text }]}>{STEP_TITLES[step]}</Text>
                <Text style={[TextStyles.callout, { color: colors.textSecondary }]}>{getStepSub(step)}</Text>
              </View>
            </View>

            {/* Step content */}
            {step === 'basics' && (
              <StepBasics form={form} setField={setField} colors={colors} s={s} haptic={haptic} />
            )}
            {step === 'image' && (
              <StepImage 
                form={form} setField={setField} colors={colors} s={s} 
                imageUploading={imageUploading} logoUploading={logoUploading} 
                imageUploadError={imageUploadError} pickImage={pickImage} 
              />
            )}
            {step === 'location' && (
              <StepLocation form={form} setField={setField} colors={colors} s={s} />
            )}
            {step === 'culture' && (
              <StepCulture form={form} setField={setField} colors={colors} s={s} haptic={haptic} />
            )}
            {step === 'membership' && (
              <StepMembership form={form} setField={setField} colors={colors} s={s} haptic={haptic} />
            )}
            {step === 'social' && (
              <StepSocial form={form} setField={setField} colors={colors} s={s} />
            )}
            {step === 'review' && (
              <StepReview form={form} colors={colors} s={s} publishError={publishError} />
            )}

            {/* Inline step error */}
            {stepError ? (
              <View style={[s.errorBanner, { backgroundColor: colors.error + '18', borderColor: colors.error + '50' }]}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
                <Text style={[s.errorBannerText, { color: colors.error }]}>{stepError}</Text>
              </View>
            ) : null}

            {/* Navigation */}
            <View style={s.navRow}>
              {stepIndex > 0 && (
                <Button variant="outline" size="lg" onPress={goBack} style={s.navBack}>Back</Button>
              )}
              <Button
                variant="primary" size="lg"
                fullWidth={stepIndex === 0}
                rightIcon={step === 'review' ? undefined : 'arrow-forward'}
                onPress={goNext}
                disabled={isPending || imageUploading || logoUploading}
                style={[s.navNext, { flex: stepIndex > 0 ? 1 : undefined }]}
              >
                {isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : step === 'review' ? (
                  'Launch Community'
                ) : (
                  'Continue'
                )}
              </Button>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
