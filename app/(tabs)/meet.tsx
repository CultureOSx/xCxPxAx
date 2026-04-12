import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { Redirect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TabPrimaryHeader } from '@/components/tabs/TabPrimaryHeader';
import { ConnectTeaser } from '@/components/connect/ConnectTeaser';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { CultureTokens } from '@/constants/theme';

const isWeb = Platform.OS === 'web';

const MATCH_MODES = [
  {
    id: 'two-profile-match',
    title: '2 Profile Match (1:1)',
    subtitle: 'Private friendship or dating match between two compatible adults.',
    icon: 'heart-outline' as const,
    color: CultureTokens.coral,
    cta: 'Find 1:1 Match',
  },
  {
    id: 'squad-match',
    title: 'Group Match (4+)',
    subtitle: 'Build a circle with 4+ people for travel, events, and shared lifestyle goals.',
    icon: 'people-outline' as const,
    color: CultureTokens.teal,
    cta: 'Join 4+ Circle',
  },
] as const;

const VALUE_POINTS = [
  {
    id: 'discover',
    title: 'Discover People',
    desc: 'Browse profiles of travelers and locals worldwide by interests, culture, and lifestyle.',
    icon: 'search-outline' as const,
  },
  {
    id: 'connect',
    title: 'Connect & Chat',
    desc: 'Start conversations, share stories, and build meaningful friendships.',
    icon: 'chatbubbles-outline' as const,
  },
  {
    id: 'share',
    title: 'Share Lifestyle',
    desc: 'Post your adventures and experiences to inspire people across cultures.',
    icon: 'camera-outline' as const,
  },
  {
    id: 'match',
    title: 'AI-Powered Matching',
    desc: 'Smart recommendations based on interests, location, and lifestyle preferences.',
    icon: 'sparkles-outline' as const,
  },
  {
    id: 'safety',
    title: 'Safe & Secure',
    desc: 'Block/report tools and moderation systems help keep the community respectful.',
    icon: 'shield-checkmark-outline' as const,
  },
] as const;

export default function MeetTabScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { hPad, isDesktop } = useLayout();
  const { isAdmin, isSuperAdmin, isLoading: roleLoading } = useRole();

  const topInset = isWeb ? 0 : insets.top;
  const bottomInset = isWeb ? 0 : insets.bottom;

  // Meet is native-only for end users.
  // On web, only admin management remains available.
  if (isWeb) {
    if (roleLoading) return null;
    if (isAdmin || isSuperAdmin) return <Redirect href="/admin/meet" />;
    return <Redirect href="/(tabs)" />;
  }

  return (
    <ErrorBoundary>
      <View style={[s.screen, { backgroundColor: colors.background }]}>
        <TabPrimaryHeader
          title="CultraMeet"
          subtitle="Match with amazing people around the world"
          hPad={hPad}
          topInset={topInset}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            s.scroll,
            {
              paddingHorizontal: hPad,
              paddingBottom: bottomInset + 56,
            },
            isDesktop && s.scrollDesktop,
          ]}
        >
          <View style={[s.heroCard, { backgroundColor: colors.surface, borderColor: CultureTokens.coral + '44' }]}>
            <View style={s.heroTopRow}>
              <View style={[s.heroPill, { backgroundColor: CultureTokens.coral + '1A', borderColor: CultureTokens.coral + '55' }]}>
                <Text style={[s.heroPillText, { color: CultureTokens.coral }]}>ADULT COMMUNITY 18+</Text>
              </View>
            </View>
            <Text style={[s.heroTitle, { color: colors.text }]}>Meet. Match. Move together.</Text>
            <Text style={[s.heroSub, { color: colors.textSecondary }]}>
              CultraMeet helps you match 1:1 or in 4+ circles with people who align on culture, values, and lifestyle.
            </Text>
            <Text style={[s.ageNote, { color: colors.textSecondary }]}>
              Age requirement: 18 years or older. By continuing you confirm you are 18+ and agree to Terms of Service.
            </Text>
            <View style={s.heroBtnRow}>
              <Pressable
                onPress={() => router.push('/search' as any)}
                style={({ pressed }) => [
                  s.primaryBtn,
                  { backgroundColor: CultureTokens.coral, opacity: pressed ? 0.85 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Start matching"
              >
                <Text style={s.primaryBtnText}>Start Matching</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/legal/terms' as any)}
                style={({ pressed }) => [
                  s.ghostBtn,
                  { borderColor: colors.borderLight, backgroundColor: colors.surfaceElevated, opacity: pressed ? 0.85 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Read terms of service"
              >
                <Text style={[s.ghostBtnText, { color: colors.text }]}>Terms</Text>
              </Pressable>
            </View>
          </View>

          <View style={s.modeGrid}>
            {MATCH_MODES.map((mode) => (
              <View
                key={mode.id}
                style={[s.modeCard, { backgroundColor: colors.surface, borderColor: mode.color + '55' }]}
              >
                <View style={[s.modeIcon, { backgroundColor: mode.color + '20' }]}>
                  <Ionicons name={mode.icon} size={18} color={mode.color} />
                </View>
                <Text style={[s.modeTitle, { color: colors.text }]}>{mode.title}</Text>
                <Text style={[s.modeSub, { color: colors.textSecondary }]}>{mode.subtitle}</Text>
                <Pressable
                  onPress={() => router.push('/search' as any)}
                  style={({ pressed }) => [
                    s.modeBtn,
                    { backgroundColor: mode.color, opacity: pressed ? 0.86 : 1 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={mode.cta}
                >
                  <Text style={s.modeBtnText}>{mode.cta}</Text>
                </Pressable>
              </View>
            ))}
          </View>

          <View style={[s.safetyRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
            <View style={[s.safetyIcon, { backgroundColor: CultureTokens.teal + '1A' }]}>
              <Ionicons name="shield-checkmark-outline" size={16} color={CultureTokens.teal} />
            </View>
            <Text style={[s.safetyText, { color: colors.textSecondary }]}>
              Safety first: report, block, and moderation controls are active by default.
            </Text>
          </View>

          <View style={s.valueGrid}>
            {VALUE_POINTS.map((point) => (
              <View key={point.id} style={[s.valueCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                <View style={[s.valueIcon, { backgroundColor: CultureTokens.indigo + '1A' }]}>
                  <Ionicons name={point.icon} size={18} color={CultureTokens.indigo} />
                </View>
                <Text style={[s.valueTitle, { color: colors.text }]}>{point.title}</Text>
                <Text style={[s.valueDesc, { color: colors.textSecondary }]}>{point.desc}</Text>
              </View>
            ))}
          </View>

          <ConnectTeaser />

          <Pressable
            onPress={() => router.push('/(onboarding)/signup' as any)}
            style={({ pressed }) => [
              s.joinStrip,
              {
                backgroundColor: CultureTokens.indigo,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Join CultraMeet for free"
          >
            <Text style={s.joinStripText}>Join CultraMeet - It&apos;s Free</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </Pressable>
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingTop: 16, gap: 16 },
  scrollDesktop: { maxWidth: 1100, width: '100%', alignSelf: 'center' as const },

  heroCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  heroPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroPillText: { fontSize: 10, fontFamily: 'Poppins_700Bold', letterSpacing: 0.8 },
  heroTitle: { fontSize: 24, fontFamily: 'Poppins_700Bold' },
  heroSub: { fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 21 },
  ageNote: { fontSize: 12, fontFamily: 'Poppins_500Medium', lineHeight: 18 },
  heroBtnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  primaryBtn: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Poppins_700Bold' },
  ghostBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBtnText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },

  modeGrid: { flexDirection: 'row', gap: 10 },
  modeCard: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 14, gap: 8 },
  modeIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modeTitle: { fontSize: 15, fontFamily: 'Poppins_700Bold' },
  modeSub: { fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 18 },
  modeBtn: {
    height: 38,
    borderRadius: 10,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBtnText: { color: '#fff', fontSize: 12, fontFamily: 'Poppins_700Bold' },

  safetyRow: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  safetyIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetyText: { flex: 1, fontSize: 12, fontFamily: 'Poppins_500Medium', lineHeight: 18 },

  valueGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  valueCard: {
    minWidth: 170,
    flexGrow: 1,
    flexBasis: 220,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  valueIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  valueTitle: { fontSize: 14, fontFamily: 'Poppins_700Bold' },
  valueDesc: { fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 18 },

  joinStrip: {
    borderRadius: 14,
    minHeight: 50,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  joinStripText: { color: '#fff', fontSize: 14, fontFamily: 'Poppins_700Bold' },
});
