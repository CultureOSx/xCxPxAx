import { View, Text, ScrollView, Pressable, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { CultureTokens, gradients } from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Skeleton } from '@/components/ui/Skeleton';
import * as Haptics from 'expo-haptics';

// ─── Metric Card ─────────────────────────────────────────────────────────────
function MetricCard({ icon, label, value, sub, accent, index = 0 }: {
  icon: string; label: string; value: string; sub?: string;
  accent: string; index?: number;
}) {
  const colors = useColors();
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).springify().damping(18)}
      style={[mc.card, { backgroundColor: colors.surface, borderColor: accent + '30' }]}
    >
      <View style={[mc.iconWrap, { backgroundColor: accent + '18' }]}>
        <Ionicons name={icon as never} size={22} color={accent} />
      </View>
      <Text style={[mc.value, { color: colors.text }]}>{value}</Text>
      <Text style={[mc.label, { color: colors.textTertiary }]}>{label}</Text>
      {sub ? <Text style={[mc.sub, { color: colors.textSecondary }]}>{sub}</Text> : null}
      <View style={[mc.bar, { backgroundColor: accent }]} />
    </Animated.View>
  );
}
const mc = StyleSheet.create({
  card:     { flex: 1, minWidth: 140, borderRadius: 16, borderWidth: 1, padding: 16, gap: 5, alignItems: 'center', overflow: 'hidden' },
  iconWrap: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  value:    { fontSize: 24, fontFamily: 'Poppins_700Bold', letterSpacing: -0.5 },
  label:    { fontSize: 11, fontFamily: 'Poppins_500Medium', textAlign: 'center' },
  sub:      { fontSize: 11, fontFamily: 'Poppins_400Regular', textAlign: 'center', marginTop: 1 },
  bar:      { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 },
});

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value, accent, index = 0 }: {
  icon: string; label: string; value: string; accent: string; index?: number;
}) {
  const colors = useColors();
  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(280)}>
      <View style={[ir.row, { borderBottomColor: colors.borderLight }]}>
        <View style={[ir.iconWrap, { backgroundColor: accent + '18' }]}>
          <Ionicons name={icon as never} size={16} color={accent} />
        </View>
        <Text style={[ir.label, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[ir.value, { color: colors.text }]}>{value}</Text>
      </View>
    </Animated.View>
  );
}
const ir = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  iconWrap:{ width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  label:   { flex: 1, fontSize: 14, fontFamily: 'Poppins_500Medium' },
  value:   { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
});

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ label }: { label: string }) {
  const colors = useColors();
  return (
    <Text style={[sh.text, { color: colors.textTertiary }]}>{label.toUpperCase()}</Text>
  );
}
const sh = StyleSheet.create({
  text: { fontSize: 11, fontFamily: 'Poppins_700Bold', letterSpacing: 1.4, marginBottom: 12 },
});

// ─── Main Content ─────────────────────────────────────────────────────────────
function FinanceContent() {
  const insets   = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const colors   = useColors();
  const { hPad } = useLayout();
  const { hasMinRole, isLoading: roleLoading } = useRole();
  const canAccess = hasMinRole('admin');

  useEffect(() => {
    if (!roleLoading && !canAccess) router.replace('/(tabs)');
  }, [canAccess, roleLoading]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-finance-summary'],
    queryFn:  () => api.admin.financeSummary(),
    staleTime: 60_000,
    enabled:  canAccess,
  });

  const activeSubscriptions = data?.activeSubscriptions ?? 0;
  const paidTickets         = data?.paidTickets ?? 0;
  const sampleRevenue       = data?.sampleRevenueCents ?? 0;
  const sampleSize          = data?.sampleSize ?? 0;

  // Estimated MRR at $9.99 monthly plan
  const estimatedMRR = (activeSubscriptions * 999) / 100;
  // Average ticket revenue
  const avgTicketCents = sampleSize > 0 ? Math.round(sampleRevenue / sampleSize) : 0;

  const fmtMoney = (cents: number) =>
    cents >= 100_000
      ? `$${(cents / 100_000).toFixed(1)}k`
      : `$${(cents / 100).toFixed(0)}`;

  return (
    <View style={[s.fill, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.midnight as unknown as [string, string]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ paddingTop: topInset }}
      >
        <Animated.View entering={FadeInUp.duration(300)} style={[s.header, { paddingHorizontal: hPad }]}>
          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.canGoBack() ? router.back() : router.replace('/admin/dashboard');
            }}
            style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.7 : 1 }]}
            accessibilityRole="button" accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Finance & Payments</Text>
            <Text style={s.headerSub}>Revenue, subscriptions & Stripe</Text>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingHorizontal: hPad, paddingBottom: insets.bottom + 48 }]}
      >
        {isLoading ? (
          <View style={{ gap: 24 }}>
            <View style={{ gap: 12 }}>
              <Skeleton width={180} height={14} borderRadius={4} />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Skeleton width="48%" height={120} borderRadius={16} />
                <Skeleton width="48%" height={120} borderRadius={16} />
              </View>
              <Skeleton width="100%" height={160} borderRadius={16} style={{ marginTop: 12 }} />
            </View>
            <View style={{ gap: 12 }}>
              <Skeleton width={120} height={14} borderRadius={4} />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Skeleton width="48%" height={120} borderRadius={16} />
                <Skeleton width="48%" height={120} borderRadius={16} />
              </View>
              <Skeleton width="100%" height={160} borderRadius={16} style={{ marginTop: 12 }} />
            </View>
          </View>
        ) : (
          <>
            {/* ── Subscription Overview ──────────────────────────────────── */}
            <View style={s.section}>
              <SectionHeader label="Subscription Overview" />
              <View style={s.metricsRow}>
                <MetricCard
                  index={0} icon="people" label="Active Members"
                  value={activeSubscriptions.toLocaleString()}
                  sub="All paid tiers"
                  accent={CultureTokens.gold}
                />
                <MetricCard
                  index={1} icon="trending-up" label="Est. MRR"
                  value={fmtMoney(estimatedMRR * 100)}
                  sub="@ $9.99/mo avg"
                  accent={CultureTokens.teal}
                />
              </View>

              <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.borderLight, marginTop: 12 }]}>
                <InfoRow index={0} icon="star-outline"       label="Active subscriptions"  value={activeSubscriptions.toLocaleString()} accent={CultureTokens.gold} />
                <InfoRow index={1} icon="trending-up-outline" label="Estimated MRR"         value={`$${estimatedMRR.toFixed(2)}`}        accent={CultureTokens.teal} />
                <InfoRow index={2} icon="wallet-outline"     label="Est. ARR"               value={`$${(estimatedMRR * 12).toFixed(0)}`}  accent='#A78BFA' />
              </View>

              <View style={[s.infoBox, { backgroundColor: CultureTokens.gold + '10', borderColor: CultureTokens.gold + '30' }]}>
                <Ionicons name="information-circle-outline" size={16} color={CultureTokens.gold} />
                <Text style={[s.infoText, { color: colors.textSecondary }]}>
                  MRR estimate assumes $9.99/month average plan. Actual revenue depends on plan mix and billing cycles. View exact figures in Stripe Dashboard.
                </Text>
              </View>
            </View>

            {/* ── Ticket Revenue ────────────────────────────────────────── */}
            <View style={s.section}>
              <SectionHeader label="Ticket Revenue" />
              <View style={s.metricsRow}>
                <MetricCard
                  index={0} icon="ticket-outline" label="Paid Tickets"
                  value={paidTickets.toLocaleString()}
                  sub="All time"
                  accent={CultureTokens.gold}
                />
                <MetricCard
                  index={1} icon="cash-outline" label="Avg Ticket"
                  value={avgTicketCents > 0 ? fmtMoney(avgTicketCents) : '—'}
                  sub={sampleSize > 0 ? `Sample: ${sampleSize}` : 'No data'}
                  accent={CultureTokens.coral}
                />
              </View>

              <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.borderLight, marginTop: 12 }]}>
                <InfoRow index={0} icon="ticket-outline"  label="Total paid tickets"    value={paidTickets.toLocaleString()}                            accent={CultureTokens.gold} />
                <InfoRow index={1} icon="cash-outline"    label="Sample revenue"         value={fmtMoney(sampleRevenue)}                                 accent={CultureTokens.teal} />
                <InfoRow index={2} icon="analytics-outline" label="Avg ticket value"     value={avgTicketCents > 0 ? `$${(avgTicketCents / 100).toFixed(2)}` : '—'} accent={CultureTokens.coral} />
                <InfoRow index={3} icon="layers-outline"  label="Sample size"            value={`${sampleSize} tickets`}                                 accent='#A78BFA' />
              </View>

              <View style={[s.infoBox, { backgroundColor: CultureTokens.gold + '10', borderColor: CultureTokens.gold + '30' }]}>
                <Ionicons name="information-circle-outline" size={16} color={CultureTokens.gold} />
                <Text style={[s.infoText, { color: colors.textSecondary }]}>
                  Revenue figures are based on a sample of up to 500 paid tickets. For full revenue reports with daily/weekly breakdowns, use Stripe Dashboard.
                </Text>
              </View>
            </View>

            {/* ── Payouts & Refunds ─────────────────────────────────────── */}
            <View style={s.section}>
              <SectionHeader label="Payouts & Refunds" />
              <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                <InfoRow index={0} icon="card-outline"         label="Payout schedule"       value="Weekly (Fridays)"      accent={CultureTokens.teal} />
                <InfoRow index={1} icon="return-down-back-outline" label="Refund window"     value="7 days post-event"     accent={CultureTokens.coral} />
                <InfoRow index={2} icon="shield-outline"       label="Dispute resolution"    value="Via Stripe Dashboard"  accent='#A78BFA' />
              </View>

              <Pressable
                style={[s.stripeBtn, { backgroundColor: CultureTokens.indigo }]}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push('/legal/terms' as never);
                }}
                accessibilityRole="button"
                accessibilityLabel="Open Stripe Dashboard"
              >
                <Ionicons name="open-outline" size={18} color="#fff" />
                <Text style={s.stripeBtnText}>Open Stripe Dashboard</Text>
              </Pressable>
            </View>

            {/* ── Revenue Reports ───────────────────────────────────────── */}
            <View style={s.section}>
              <SectionHeader label="Revenue Reports" />
              <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                <InfoRow index={0} icon="today-outline"        label="Daily report"          value="Via Stripe"            accent={CultureTokens.teal} />
                <InfoRow index={1} icon="calendar-outline"     label="Weekly summary"        value="Via Stripe"            accent={CultureTokens.indigo} />
                <InfoRow index={2} icon="bar-chart-outline"    label="Monthly breakdown"     value="Via Stripe"            accent={CultureTokens.gold} />
                <InfoRow index={3} icon="download-outline"     label="Export transactions"   value="CSV via Stripe"        accent={CultureTokens.gold} />
              </View>

              <View style={[s.infoBox, { backgroundColor: CultureTokens.indigo + '12', borderColor: CultureTokens.indigo + '30' }]}>
                <Ionicons name="bar-chart-outline" size={16} color={CultureTokens.indigo} />
                <Text style={[s.infoText, { color: colors.textSecondary }]}>
                  Detailed revenue reports are available in the Stripe Dashboard. In-app reporting is planned for a future release with daily, weekly, and monthly breakdowns.
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

export default function AdminFinanceScreen() {
  return <ErrorBoundary><FinanceContent /></ErrorBoundary>;
}

const s = StyleSheet.create({
  fill:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 16 },
  headerTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: '#fff', letterSpacing: -0.2 },
  headerSub:   { fontSize: 12, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  backBtn:     { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  scroll:      { paddingTop: 20 },
  section:     { marginBottom: 28 },
  metricsRow:  { flexDirection: 'row', gap: 10 },
  card:        { borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 4, overflow: 'hidden' },
  infoBox:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 14, borderWidth: 1, padding: 13, marginTop: 10 },
  infoText:    { flex: 1, fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 18 },
  stripeBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14, marginTop: 12 },
  stripeBtnText:{ fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#fff' },
  loadingWrap: { alignItems: 'center', gap: 12, paddingVertical: 80 },
  loadingText: { fontSize: 14, fontFamily: 'Poppins_400Regular' },
});
