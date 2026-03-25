import { View, Text, ScrollView, Pressable, StyleSheet, Platform, ActivityIndicator, Alert } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { CultureTokens } from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import * as Haptics from 'expo-haptics';

const isWeb = Platform.OS === 'web';

// Rollout phases in ascending access order
const ROLLOUT_PHASES = ['internal', 'pilot', 'half', 'full'] as const;
type RolloutPhase = typeof ROLLOUT_PHASES[number];

const PHASE_META: Record<RolloutPhase, { label: string; color: string; description: string }> = {
  internal: { label: 'Internal',  color: CultureTokens.coral,   description: 'Team members only' },
  pilot:    { label: 'Pilot',     color: CultureTokens.gold, description: '~10% of users' },
  half:     { label: 'Half',      color: CultureTokens.teal,    description: '~50% of users' },
  full:     { label: 'Full',      color: '#22C55E',              description: 'All users' },
};

const FEATURE_KEYS = ['discovery', 'perks', 'council', 'calendar', 'scanner'] as const;
type FeatureKey = typeof FEATURE_KEYS[number];

const FEATURE_META: Record<FeatureKey, { label: string; icon: string; description: string }> = {
  discovery: { label: 'Discovery Feed',  icon: 'compass-outline',  description: 'Personalised event discovery rail' },
  perks:     { label: 'Member Perks',    icon: 'star-outline',     description: 'Perks & rewards for subscribers' },
  council:   { label: 'Council LGA',     icon: 'business-outline', description: 'Location-based council services' },
  calendar:  { label: 'Calendar',        icon: 'calendar-outline', description: 'Personal event calendar & RSVP' },
  scanner:   { label: 'Ticket Scanner',  icon: 'qr-code-outline',  description: 'QR code ticket validation' },
};

// ─── Feature Flag Row ─────────────────────────────────────────────────────────
function FeatureFlagRow({ featureKey, enabled, index = 0 }: {
  featureKey: FeatureKey; enabled: boolean; index?: number;
}) {
  const colors = useColors();
  const meta   = FEATURE_META[featureKey];
  const accent = enabled ? CultureTokens.teal : colors.textTertiary;
  return (
    <Animated.View entering={FadeInDown.delay(index * 35).duration(260)}>
      <View style={[ff.row, { borderBottomColor: colors.borderLight }]}>
        <View style={[ff.iconWrap, { backgroundColor: accent + '18' }]}>
          <Ionicons name={meta.icon as never} size={16} color={accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[ff.label, { color: colors.text }]}>{meta.label}</Text>
          <Text style={[ff.sub, { color: colors.textTertiary }]}>{meta.description}</Text>
        </View>
        <View style={[ff.pill, { backgroundColor: enabled ? CultureTokens.teal + '18' : colors.backgroundSecondary, borderColor: enabled ? CultureTokens.teal + '40' : colors.borderLight }]}>
          <View style={[ff.dot, { backgroundColor: enabled ? CultureTokens.teal : colors.textTertiary }]} />
          <Text style={[ff.pillText, { color: enabled ? CultureTokens.teal : colors.textSecondary }]}>
            {enabled ? 'Enabled' : 'Disabled'}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
const ff = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  iconWrap:{ width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label:   { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  sub:     { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  pill:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  dot:     { width: 6, height: 6, borderRadius: 3 },
  pillText:{ fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
});

// ─── Phase Selector ───────────────────────────────────────────────────────────
function PhaseSelector({ current }: { current: RolloutPhase }) {
  const colors = useColors();
  const handleChange = (phase: RolloutPhase) => {
    if (phase === current) return;
    Alert.alert(
      'Change Rollout Phase',
      `Switch to "${PHASE_META[phase].label}" phase (${PHASE_META[phase].description})?\n\nThis is controlled via the ROLLOUT_PHASE environment variable on Cloud Functions.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK', onPress: () => {
          if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          Alert.alert('Environment Variable', 'Set ROLLOUT_PHASE=' + phase + ' in your Cloud Functions environment config, then redeploy.');
        }},
      ],
    );
  };
  return (
    <View style={{ gap: 8 }}>
      {ROLLOUT_PHASES.map((p, i) => {
        const meta    = PHASE_META[p];
        const active  = p === current;
        return (
          <Pressable
            key={p}
            style={[ps.row, {
              backgroundColor: active ? meta.color + '15' : colors.surface,
              borderColor:     active ? meta.color + '50' : colors.borderLight,
            }]}
            onPress={() => handleChange(p)}
            accessibilityRole="button"
            accessibilityLabel={`Set rollout phase to ${meta.label}`}
          >
            <Animated.View entering={FadeInDown.delay(i * 40).duration(250)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[ps.dot, { backgroundColor: active ? meta.color : colors.textTertiary }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[ps.label, { color: active ? meta.color : colors.text }]}>{meta.label}</Text>
                  <Text style={[ps.sub, { color: colors.textTertiary }]}>{meta.description}</Text>
                </View>
                {active ? (
                  <View style={[ps.activeBadge, { backgroundColor: meta.color }]}>
                    <Text style={ps.activeBadgeText}>Current</Text>
                  </View>
                ) : null}
              </View>
            </Animated.View>
          </Pressable>
        );
      })}
    </View>
  );
}
const ps = StyleSheet.create({
  row:         { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  dot:         { width: 10, height: 10, borderRadius: 5 },
  label:       { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  sub:         { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  activeBadgeText: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: '#fff' },
});

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ label, sub }: { label: string; sub?: string }) {
  const colors = useColors();
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={[sh.text, { color: colors.textTertiary }]}>{label.toUpperCase()}</Text>
      {sub ? <Text style={[sh.sub, { color: colors.textSecondary }]}>{sub}</Text> : null}
    </View>
  );
}
const sh = StyleSheet.create({
  text: { fontSize: 11, fontFamily: 'Poppins_700Bold', letterSpacing: 1.4 },
  sub:  { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
});

// ─── Main Content ─────────────────────────────────────────────────────────────
function PlatformContent() {
  const insets   = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const colors   = useColors();
  const { hPad } = useLayout();
  const { role, isLoading: roleLoading } = useRole();
  const isSuperAdmin = role === 'platformAdmin';

  useEffect(() => {
    if (!roleLoading && !isSuperAdmin) router.replace('/admin/dashboard');
  }, [isSuperAdmin, roleLoading]);

  const rolloutQuery = useQuery({
    queryKey: ['rollout-config'],
    queryFn: async () => {
      // rollout/config is a public endpoint on the misc router
      const { apiRequest } = await import('@/lib/query-client');
      const res = await apiRequest('GET', 'api/rollout/config');
      return res.json() as Promise<{ phase: RolloutPhase; features: Record<string, boolean> }>;
    },
    staleTime: 60_000,
    enabled: isSuperAdmin,
  });

  const phase    = rolloutQuery.data?.phase ?? 'internal';
  const features = rolloutQuery.data?.features ?? {};

  if (!isSuperAdmin && !roleLoading) return null;

  return (
    <View style={[s.fill, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[CultureTokens.gold + 'cc', CultureTokens.indigo] as [string, string]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ paddingTop: topInset }}
      >
        <Animated.View entering={FadeInUp.duration(300)} style={[s.header, { paddingHorizontal: hPad }]}>
          <Pressable
            onPress={() => router.canGoBack() ? router.back() : router.replace('/admin/dashboard')}
            style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.7 : 1 }]}
            accessibilityRole="button" accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Platform Configuration</Text>
            <Text style={s.headerSub}>Feature flags, cities & system settings</Text>
          </View>
          <View style={s.superBadge}>
            <Ionicons name="star" size={11} color={CultureTokens.gold} />
            <Text style={[s.superBadgeText, { color: CultureTokens.gold }]}>Super</Text>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingHorizontal: hPad, paddingBottom: insets.bottom + 48 }]}
      >
        {(rolloutQuery.isLoading || roleLoading) ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator color={CultureTokens.gold} size="large" />
            <Text style={[s.loadingText, { color: colors.textSecondary }]}>Loading config…</Text>
          </View>
        ) : (
          <>
            {/* ── Feature Flags ─────────────────────────────────────────── */}
            <View style={s.section}>
              <SectionHeader label="Feature Flags" sub="Controlled by ROLLOUT_PHASE environment variable" />
              <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }}>
                  <Text style={[s.sectionTitle, { color: colors.text }]}>Active Rollout Phase</Text>
                </View>
                <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                  <PhaseSelector current={phase as RolloutPhase} />
                </View>
              </View>

              <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.borderLight, marginTop: 12 }]}>
                <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 }}>
                  <Text style={[s.sectionTitle, { color: colors.text }]}>Feature Status</Text>
                </View>
                <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
                  {FEATURE_KEYS.map((key, i) => (
                    <FeatureFlagRow key={key} featureKey={key} enabled={features[key] ?? false} index={i} />
                  ))}
                </View>
              </View>

              <View style={[s.infoBox, { backgroundColor: CultureTokens.gold + '12', borderColor: CultureTokens.gold + '30' }]}>
                <Ionicons name="code-slash-outline" size={16} color={CultureTokens.gold} />
                <Text style={[s.infoText, { color: colors.textSecondary }]}>
                  Feature flags are set via the <Text style={{ fontFamily: 'Poppins_600SemiBold' }}>ROLLOUT_PHASE</Text> env var on Cloud Functions. Per-user overrides use the <Text style={{ fontFamily: 'Poppins_600SemiBold' }}>isFeatureEnabledForUser()</Text> service.
                </Text>
              </View>
            </View>

            {/* ── City Management ───────────────────────────────────────── */}
            <View style={s.section}>
              <SectionHeader label="City Management" sub="Cities shown in Discover CityRail" />
              <Pressable
                style={[s.card, s.navCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                onPress={() => router.push('/admin/locations')}
                accessibilityRole="button"
                accessibilityLabel="Manage cities and countries"
              >
                <View style={[s.locationIcon, { backgroundColor: CultureTokens.teal + '18' }]}>
                  <Ionicons name="globe-outline" size={18} color={CultureTokens.teal} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.locationCountry, { color: colors.text }]}>Cities &amp; Countries</Text>
                  <Text style={[s.locationCities, { color: colors.textTertiary }]}>
                    Add, edit, reorder and upload cover images for the Discover rail
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </Pressable>
            </View>

            {/* ── API Keys & Webhooks ───────────────────────────────────── */}
            <View style={s.section}>
              <SectionHeader label="API Keys & Webhooks" sub="Managed via environment variables" />
              {([
                { label: 'Firebase API Key',     icon: 'flame-outline',         note: 'EXPO_PUBLIC_FIREBASE_API_KEY',    color: CultureTokens.gold },
                { label: 'Google Maps Key',      icon: 'map-outline',           note: 'EXPO_PUBLIC_GOOGLE_MAPS_KEY',    color: '#4285F4' },
                { label: 'Stripe Secret',        icon: 'card-outline',          note: 'STRIPE_SECRET_KEY (server only)', color: CultureTokens.teal },
                { label: 'Stripe Webhook',       icon: 'link-outline',          note: 'STRIPE_WEBHOOK_SECRET',          color: CultureTokens.gold },
                { label: 'Sentry DSN',           icon: 'bug-outline',           note: 'EXPO_PUBLIC_SENTRY_DSN',         color: CultureTokens.coral },
              ]).map((item, i) => (
                <Animated.View key={item.label} entering={FadeInDown.delay(i * 35).duration(250)}>
                  <View style={[s.keyRow, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                    <View style={[s.keyIcon, { backgroundColor: item.color + '18' }]}>
                      <Ionicons name={item.icon as never} size={16} color={item.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.keyLabel, { color: colors.text }]}>{item.label}</Text>
                      <Text style={[s.keyNote, { color: colors.textTertiary }]}>{item.note}</Text>
                    </View>
                    <View style={[s.maskedPill, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}>
                      <Text style={[s.maskedText, { color: colors.textTertiary }]}>••••••••</Text>
                    </View>
                  </View>
                </Animated.View>
              ))}

              <View style={[s.infoBox, { backgroundColor: CultureTokens.coral + '10', borderColor: CultureTokens.coral + '30', marginTop: 8 }]}>
                <Ionicons name="lock-closed-outline" size={16} color={CultureTokens.coral} />
                <Text style={[s.infoText, { color: colors.textSecondary }]}>
                  Never expose server-side secrets in client bundles. All EXPO_PUBLIC_* vars are baked into the app at build time.
                </Text>
              </View>
            </View>

            {/* ── Platform Settings ─────────────────────────────────────── */}
            <View style={s.section}>
              <SectionHeader label="Platform Settings" />
              {([
                { label: 'Rate limit (global)',    value: '90 req/min',   icon: 'speedometer-outline',    color: CultureTokens.teal },
                { label: 'Rate limit (notifs)',    value: '12 req/min',   icon: 'megaphone-outline',      color: CultureTokens.gold },
                { label: 'Cache TTL',              value: '60 seconds',   icon: 'time-outline',           color: CultureTokens.indigo },
                { label: 'Import sample size',     value: '500 tickets',  icon: 'layers-outline',         color: CultureTokens.gold },
                { label: 'Max pagination limit',   value: '100 records',  icon: 'list-outline',           color: '#A78BFA' },
              ]).map((item, i) => (
                <Animated.View key={item.label} entering={FadeInDown.delay(i * 35).duration(250)}>
                  <View style={[s.settingRow, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                    <View style={[s.keyIcon, { backgroundColor: item.color + '18' }]}>
                      <Ionicons name={item.icon as never} size={16} color={item.color} />
                    </View>
                    <Text style={[s.keyLabel, { color: colors.text, flex: 1 }]}>{item.label}</Text>
                    <View style={[s.valuePill, { backgroundColor: item.color + '18', borderColor: item.color + '40' }]}>
                      <Text style={[s.valueText, { color: item.color }]}>{item.value}</Text>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>

            {/* ── Platform Health ───────────────────────────────────────── */}
            <View style={s.section}>
              <SectionHeader label="Platform Health" />
              <Pressable
                style={[s.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                onPress={() => Alert.alert('Platform Health', 'Full health metrics are available in Firebase Console → Monitoring and Sentry Dashboard.')}
                accessibilityRole="button"
              >
                {([
                  { service: 'Cloud Functions',  status: 'Operational', color: '#22C55E', icon: 'cloud-outline' },
                  { service: 'Firestore',         status: 'Operational', color: '#22C55E', icon: 'server-outline' },
                  { service: 'Firebase Auth',     status: 'Operational', color: '#22C55E', icon: 'shield-checkmark-outline' },
                  { service: 'Firebase Storage',  status: 'Operational', color: '#22C55E', icon: 'archive-outline' },
                  { service: 'Stripe',            status: 'Operational', color: '#22C55E', icon: 'card-outline' },
                  { service: 'Sentry',            status: 'Monitoring',  color: CultureTokens.gold, icon: 'bug-outline' },
                ]).map((item, i) => (
                  <Animated.View key={item.service} entering={FadeInDown.delay(i * 30).duration(250)}>
                    <View style={[s.healthRow, { borderBottomColor: colors.borderLight }]}>
                      <View style={[s.healthIcon, { backgroundColor: item.color + '18' }]}>
                        <Ionicons name={item.icon as never} size={14} color={item.color} />
                      </View>
                      <Text style={[s.healthLabel, { color: colors.text }]}>{item.service}</Text>
                      <View style={[s.healthDot, { backgroundColor: item.color }]} />
                      <Text style={[s.healthStatus, { color: item.color }]}>{item.status}</Text>
                    </View>
                  </Animated.View>
                ))}
              </Pressable>

              <View style={[s.infoBox, { backgroundColor: CultureTokens.teal + '10', borderColor: CultureTokens.teal + '30', marginTop: 10 }]}>
                <Ionicons name="information-circle-outline" size={16} color={CultureTokens.teal} />
                <Text style={[s.infoText, { color: colors.textSecondary }]}>
                  Status shown is indicative. For live metrics, error rates, and latency charts check Firebase Console and the Sentry Dashboard.
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

export default function AdminPlatformScreen() {
  return <ErrorBoundary><PlatformContent /></ErrorBoundary>;
}

const s = StyleSheet.create({
  fill:           { flex: 1 },
  header:         { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 16 },
  headerTitle:    { fontSize: 18, fontFamily: 'Poppins_700Bold', color: '#fff', letterSpacing: -0.2 },
  headerSub:      { fontSize: 12, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  backBtn:        { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  superBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, backgroundColor: 'rgba(255,200,87,0.25)', borderColor: CultureTokens.gold },
  superBadgeText: { fontSize: 11, fontFamily: 'Poppins_700Bold' },
  scroll:         { paddingTop: 20 },
  section:        { marginBottom: 28 },
  card:           { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  sectionTitle:   { fontSize: 14, fontFamily: 'Poppins_600SemiBold', marginBottom: 8 },
  infoBox:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 14, borderWidth: 1, padding: 13, marginTop: 10 },
  infoText:       { flex: 1, fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 18 },
  loadingWrap:    { alignItems: 'center', gap: 12, paddingVertical: 80 },
  loadingText:    { fontSize: 14, fontFamily: 'Poppins_400Regular' },
  // Location
  navCard:        { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  locationRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  locationIcon:   { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  locationCountry:{ fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  locationCities: { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  cityCountBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  cityCountText:  { fontSize: 12, fontFamily: 'Poppins_700Bold' },
  statsRow:       { flexDirection: 'row', gap: 10 },
  statChip:       { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  statChipText:   { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  // API keys
  keyRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 13, marginBottom: 8 },
  keyIcon:        { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  keyLabel:       { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  keyNote:        { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  maskedPill:     { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  maskedText:     { fontSize: 13, fontFamily: 'Poppins_600SemiBold', letterSpacing: 2 },
  // Settings
  settingRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 13, marginBottom: 8 },
  valuePill:      { borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  valueText:      { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  // Health
  healthRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  healthIcon:     { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  healthLabel:    { flex: 1, fontSize: 14, fontFamily: 'Poppins_500Medium' },
  healthDot:      { width: 7, height: 7, borderRadius: 4 },
  healthStatus:   { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
});
