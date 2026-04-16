import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/Button';
import { CardSurface } from '@/components/ui/CardSurface';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { useCreateCommunity } from '@/hooks/queries/useCommunities';
import { useColors } from '@/hooks/useColors';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { CultureTokens, FontFamily } from '@/constants/theme';

const CATEGORIES = ['cultural', 'club', 'professional', 'business', 'charity'] as const;
const JOIN_MODES = ['open', 'request', 'invite'] as const;

export default function CommunityCreateScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 30 : insets.bottom;
  const { state: onboarding } = useOnboarding();
  const createCommunity = useCreateCommunity();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [communityCategory, setCommunityCategory] = useState<(typeof CATEGORIES)[number]>('cultural');
  const [joinMode, setJoinMode] = useState<(typeof JOIN_MODES)[number]>('open');
  const [city, setCity] = useState(onboarding.city || '');
  const [country, setCountry] = useState(onboarding.country || 'Australia');
  const [website, setWebsite] = useState('');

  const canSubmit = useMemo(() => name.trim().length > 1 && city.trim().length > 0 && country.trim().length > 0, [city, country, name]);

  const handleSubmit = () => {
    if (!canSubmit) {
      Alert.alert('Missing details', 'Please add a community name, city, and country.');
      return;
    }

    createCommunity.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        communityCategory,
        joinMode,
        city: city.trim(),
        country: country.trim(),
        website: website.trim() || undefined,
      },
      {
        onSuccess: (community) => {
          router.replace(`/community/${community.id}`);
        },
        onError: () => {
          Alert.alert('Could not create community', 'Please try again in a moment.');
        },
      },
    );
  };

  return (
    <ErrorBoundary>
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topInset }]}>
        <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ paddingBottom: bottomInset + 28 }}>
            <View style={styles.heroWrap}>
              <LinearGradient
                colors={[CultureTokens.indigo, '#1B0F2E', '#0D3B35']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroGradient}
              />
              <View style={styles.heroOverlay} />
              <View style={styles.topRow}>
                <LiquidGlassPanel borderRadius={22} style={styles.backGlass} contentStyle={styles.backGlassInner}>
                  <Pressable
                    onPress={() => (router.canGoBack() ? router.back() : router.replace('/community'))}
                    style={styles.backBtn}
                  >
                    <Ionicons name="chevron-back" size={20} color="#fff" />
                  </Pressable>
                </LiquidGlassPanel>
              </View>

              <View style={styles.heroContent}>
                <Text style={styles.heroKicker}>Community Hub</Text>
                <Text style={styles.heroTitle}>Create a new community</Text>
                <Text style={styles.heroSubtitle}>
                  Launch a cultural group, local chapter, or trusted organisation hub for your city.
                </Text>
                <View style={styles.heroSignals}>
                  <LiquidGlassPanel borderRadius={999} style={styles.signalPill} contentStyle={styles.signalPillInner}>
                    <Ionicons name="people-outline" size={13} color="#fff" />
                    <Text style={styles.signalText}>People-first</Text>
                  </LiquidGlassPanel>
                  <LiquidGlassPanel borderRadius={999} style={styles.signalPill} contentStyle={styles.signalPillInner}>
                    <Ionicons name="sparkles-outline" size={13} color="#fff" />
                    <Text style={styles.signalText}>Events-ready</Text>
                  </LiquidGlassPanel>
                  <LiquidGlassPanel borderRadius={999} style={styles.signalPill} contentStyle={styles.signalPillInner}>
                    <Ionicons name="shield-checkmark-outline" size={13} color="#fff" />
                    <Text style={styles.signalText}>Trust-led</Text>
                  </LiquidGlassPanel>
                </View>
              </View>
            </View>

            <View style={styles.contentShell}>
              <LiquidGlassPanel style={styles.tipCard} contentStyle={styles.tipCardContent}>
                <Text style={[styles.tipTitle, { color: colors.text }]}>Before you publish</Text>
                <Text style={[styles.tipBody, { color: colors.textSecondary }]}>
                  Set a clear name, pick the right category, and choose how members can join. You can refine visuals and culture details later.
                </Text>
              </LiquidGlassPanel>

              <LiquidGlassPanel style={styles.formGlass} contentStyle={styles.formCard}>
              <Field label="Community name">
                <StyledInput value={name} onChangeText={setName} placeholder="e.g. Sydney Malayali Circle" colors={colors} />
              </Field>

              <Field label="Description">
                <StyledInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="What makes this community special?"
                  colors={colors}
                  multiline
                />
              </Field>

              <Field label="Category">
                <View style={styles.pillRow}>
                  {CATEGORIES.map((item) => (
                    <SelectablePill
                      key={item}
                      label={item}
                      active={communityCategory === item}
                      onPress={() => setCommunityCategory(item)}
                      colors={colors}
                    />
                  ))}
                </View>
              </Field>

              <Field label="Join mode">
                <View style={styles.pillRow}>
                  {JOIN_MODES.map((item) => (
                    <SelectablePill
                      key={item}
                      label={item}
                      active={joinMode === item}
                      onPress={() => setJoinMode(item)}
                      colors={colors}
                    />
                  ))}
                </View>
              </Field>

              <Field label="City">
                <StyledInput value={city} onChangeText={setCity} placeholder="Sydney" colors={colors} />
              </Field>

              <Field label="Country">
                <StyledInput value={country} onChangeText={setCountry} placeholder="Australia" colors={colors} />
              </Field>

              <Field label="Website (optional)">
                <StyledInput value={website} onChangeText={setWebsite} placeholder="https://..." colors={colors} autoCapitalize="none" />
              </Field>

              <LiquidGlassPanel style={styles.submitWrap} contentStyle={styles.submitWrapInner}>
                <View style={styles.submitMeta}>
                  <Text style={[styles.submitMetaTitle, { color: colors.text }]}>Ready to launch?</Text>
                  <Text style={[styles.submitMetaSub, { color: colors.textSecondary }]}>
                    Your community will open as a live hub after creation.
                  </Text>
                </View>
                <Button onPress={handleSubmit} fullWidth loading={createCommunity.isPending} disabled={!canSubmit}>
                Create Community
                </Button>
              </LiquidGlassPanel>
              </LiquidGlassPanel>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ErrorBoundary>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function StyledInput({
  colors,
  multiline,
  ...props
}: React.ComponentProps<typeof TextInput> & { colors: ReturnType<typeof useColors> }) {
  return (
    <TextInput
      {...props}
      multiline={multiline}
      placeholderTextColor={colors.textTertiary}
      style={[
        styles.input,
        {
          color: colors.text,
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.borderLight,
          minHeight: multiline ? 110 : 52,
          textAlignVertical: multiline ? 'top' : 'center',
        },
      ]}
    />
  );
}

function SelectablePill({
  label,
  active,
  onPress,
  colors,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.pill,
        {
          backgroundColor: active ? CultureTokens.indigo + '16' : colors.surface,
          borderColor: active ? CultureTokens.indigo : colors.borderLight,
        },
      ]}
    >
      <Text style={[styles.pillText, { color: active ? CultureTokens.indigo : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  heroWrap: {
    minHeight: 320,
    overflow: 'hidden',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 10, 20, 0.24)',
  },
  topRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  backGlass: {
    alignSelf: 'flex-start',
  },
  backGlassInner: {
    padding: 6,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 28,
    justifyContent: 'flex-end',
    flex: 1,
  },
  heroKicker: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.82)',
  },
  heroTitle: {
    marginTop: 10,
    fontSize: 32,
    fontFamily: FontFamily.bold,
    color: '#fff',
  },
  heroSubtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.84)',
    maxWidth: 680,
  },
  heroSignals: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 18,
  },
  signalPill: {},
  signalPillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  signalText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: FontFamily.semibold,
  },
  contentShell: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 16,
    width: '100%',
    maxWidth: 980,
    alignSelf: 'center',
  },
  tipCard: {},
  tipCardContent: {
    padding: 16,
  },
  tipTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
  },
  tipBody: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: FontFamily.regular,
  },
  formGlass: {},
  formCard: { padding: 16, gap: 14 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 13, fontFamily: FontFamily.semibold, color: '#667085' },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: FontFamily.regular,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  pillText: { fontSize: 13, fontFamily: FontFamily.medium, textTransform: 'capitalize' },
  submitWrap: {
    marginTop: 2,
  },
  submitWrapInner: {
    gap: 12,
    padding: 14,
  },
  submitMeta: {
    gap: 4,
  },
  submitMetaTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
  },
  submitMetaSub: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: FontFamily.regular,
  },
});
