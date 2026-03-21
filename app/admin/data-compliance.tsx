import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Alert, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { CultureTokens, gradients } from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const isWeb = Platform.OS === 'web';

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

// ─── Export Button ────────────────────────────────────────────────────────────
function ExportButton({ label, icon, accent, onPress, loading }: {
  label: string; icon: string; accent: string;
  onPress: () => void; loading?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      style={({ pressed }) => [eb.btn, {
        backgroundColor: colors.surface,
        borderColor: accent + '40',
        opacity: pressed || loading ? 0.75 : 1,
      }]}
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[eb.icon, { backgroundColor: accent + '18' }]}>
        {loading
          ? <ActivityIndicator size="small" color={accent} />
          : <Ionicons name={icon as never} size={18} color={accent} />
        }
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[eb.label, { color: colors.text }]}>{label}</Text>
      </View>
      <Ionicons name="download-outline" size={16} color={accent} />
    </Pressable>
  );
}
const eb = StyleSheet.create({
  btn:  { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8 },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label:{ fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
});

// ─── Policy Link Row ──────────────────────────────────────────────────────────
function PolicyRow({ label, sub, icon, route, accent, index = 0 }: {
  label: string; sub: string; icon: string; route: string;
  accent: string; index?: number;
}) {
  const colors = useColors();
  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(260)}>
      <Pressable
        style={({ pressed }) => [pr.row, {
          backgroundColor: pressed ? colors.backgroundSecondary : 'transparent',
          borderBottomColor: colors.borderLight,
        }]}
        onPress={() => router.push(route as never)}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <View style={[pr.iconWrap, { backgroundColor: accent + '18' }]}>
          <Ionicons name={icon as never} size={16} color={accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[pr.label, { color: colors.text }]}>{label}</Text>
          <Text style={[pr.sub, { color: colors.textTertiary }]}>{sub}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </Pressable>
    </Animated.View>
  );
}
const pr = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 0, borderBottomWidth: StyleSheet.hairlineWidth },
  iconWrap:{ width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label:  { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  sub:    { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 1 },
});

// ─── GDPR Step ────────────────────────────────────────────────────────────────
function GdprStep({ step, title, body, accent }: {
  step: number; title: string; body: string; accent: string;
}) {
  const colors = useColors();
  return (
    <View style={gs.row}>
      <View style={[gs.stepNum, { backgroundColor: accent + '18', borderColor: accent + '40' }]}>
        <Text style={[gs.stepText, { color: accent }]}>{step}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[gs.title, { color: colors.text }]}>{title}</Text>
        <Text style={[gs.body, { color: colors.textSecondary }]}>{body}</Text>
      </View>
    </View>
  );
}
const gs = StyleSheet.create({
  row:      { flexDirection: 'row', gap: 12, marginBottom: 16 },
  stepNum:  { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0, marginTop: 2 },
  stepText: { fontSize: 13, fontFamily: 'Poppins_700Bold' },
  title:    { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  body:     { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 3, lineHeight: 18 },
});

// ─── Main Content ─────────────────────────────────────────────────────────────
function DataComplianceContent() {
  const insets   = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const colors   = useColors();
  const { hPad } = useLayout();
  const { hasMinRole, isLoading: roleLoading } = useRole();
  const canAccess = hasMinRole('admin');

  const [exportingAudit, setExportingAudit] = useState(false);

  useEffect(() => {
    if (!roleLoading && !canAccess) router.replace('/(tabs)');
  }, [canAccess, roleLoading]);

  const handleAuditLogExport = async () => {
    if (!isWeb) {
      Alert.alert('Export Audit Logs', 'CSV download is available on web. On mobile, open the admin panel in a browser.', [{ text: 'OK' }]);
      return;
    }
    setExportingAudit(true);
    try {
      const csv = await api.admin.auditLogsCsv({ limit: 1000 });
      const blob   = new Blob([csv], { type: 'text/csv' });
      const url    = URL.createObjectURL(blob);
      const a      = document.createElement('a');
      a.href       = url;
      a.download   = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      Alert.alert('Export Failed', 'Could not generate audit log CSV. Try again.');
    } finally {
      setExportingAudit(false);
    }
  };

  const handleUserDataExport = () => {
    Alert.alert(
      'User Data Export',
      'Full user data exports are not yet available in-app. This requires a GDPR data access request workflow.\n\nUse Firebase Console → Firestore → Export for bulk data.',
      [{ text: 'OK' }],
    );
  };

  const handleDeletionRequest = () => {
    Alert.alert(
      'Handle Deletion Request',
      'To process a deletion request:\n\n1. Identify the user in Admin → Users\n2. Remove all PII from their Firestore user document\n3. Delete their Firebase Auth account via Firebase Console\n4. Document the action in the audit log\n\nAutomatic deletion workflow is planned for a future release.',
      [{ text: 'OK' }],
    );
  };

  return (
    <View style={[s.fill, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.midnight as unknown as [string, string]}
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
            <Text style={s.headerTitle}>Data & Compliance</Text>
            <Text style={s.headerSub}>Export, GDPR & privacy policy management</Text>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingHorizontal: hPad, paddingBottom: insets.bottom + 48 }]}
      >
        {/* ── Data Export ───────────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionHeader label="Data Export" sub="Download platform data as CSV or JSON" />

          <ExportButton
            label="Audit Logs (CSV)"
            icon="list-outline"
            accent={CultureTokens.indigo}
            onPress={handleAuditLogExport}
            loading={exportingAudit}
          />
          <ExportButton
            label="User Data Export"
            icon="people-outline"
            accent={CultureTokens.teal}
            onPress={handleUserDataExport}
          />
          <ExportButton
            label="Event Data Export"
            icon="calendar-outline"
            accent={CultureTokens.saffron}
            onPress={() => Alert.alert('Event Export', 'Event data export is not yet available in-app. Use Firebase Console → Firestore → Export for bulk event data.')}
          />
          <ExportButton
            label="Transaction Data Export"
            icon="card-outline"
            accent={CultureTokens.gold}
            onPress={() => Alert.alert('Transaction Export', 'Transaction data is available via Stripe Dashboard → Reports → Export.')}
          />

          <View style={[s.infoBox, { backgroundColor: CultureTokens.indigo + '12', borderColor: CultureTokens.indigo + '30' }]}>
            <Ionicons name="information-circle-outline" size={16} color={CultureTokens.indigo} />
            <Text style={[s.infoText, { color: colors.textSecondary }]}>
              Audit log CSV exports last 1,000 records. For full bulk exports, use Firebase Console → Firestore → Export to Cloud Storage.
              {isWeb ? '' : '\n\nCSV downloads are only available on web.'}
            </Text>
          </View>
        </View>

        {/* ── Privacy & GDPR ────────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionHeader label="Privacy & GDPR" sub="Handling user rights and data requests" />

          <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.borderLight, padding: 16 }]}>
            <GdprStep
              step={1}
              title="Receive deletion request"
              body="User submits request via Settings → Privacy → Delete Account, or via email to privacy@culturepass.app."
              accent={CultureTokens.coral}
            />
            <GdprStep
              step={2}
              title="Verify identity"
              body="Confirm the requester's identity matches the account via their email or Firebase UID."
              accent={CultureTokens.saffron}
            />
            <GdprStep
              step={3}
              title="Remove PII from Firestore"
              body="Anonymise or delete: displayName, email, phone, avatarUrl, city, country from the user document."
              accent={CultureTokens.teal}
            />
            <GdprStep
              step={4}
              title="Delete Firebase Auth account"
              body="Use Firebase Console → Authentication → Delete user, or Admin SDK deleteUser(uid)."
              accent={CultureTokens.indigo}
            />
            <GdprStep
              step={5}
              title="Confirm and document"
              body="Record the deletion action, timestamp, and operator in your compliance log."
              accent='#22C55E'
            />
          </View>

          <Pressable
            style={[s.actionBtn, { backgroundColor: CultureTokens.coral + '14', borderColor: CultureTokens.coral + '40' }]}
            onPress={handleDeletionRequest}
            accessibilityRole="button"
            accessibilityLabel="Process deletion request"
          >
            <Ionicons name="trash-outline" size={18} color={CultureTokens.coral} />
            <Text style={[s.actionBtnText, { color: CultureTokens.coral }]}>Process Deletion Request</Text>
          </Pressable>

          <Pressable
            style={[s.actionBtn, { backgroundColor: CultureTokens.teal + '14', borderColor: CultureTokens.teal + '40', marginTop: 8 }]}
            onPress={() => Alert.alert('Consent Logs', 'Consent records are stored per user in Firestore users/{uid}.consents[]. View via Firebase Console → Firestore.')}
            accessibilityRole="button"
            accessibilityLabel="View consent logs"
          >
            <Ionicons name="document-text-outline" size={18} color={CultureTokens.teal} />
            <Text style={[s.actionBtnText, { color: CultureTokens.teal }]}>View Consent Logs</Text>
          </Pressable>

          <View style={[s.infoBox, { backgroundColor: CultureTokens.coral + '10', borderColor: CultureTokens.coral + '30', marginTop: 10 }]}>
            <Ionicons name="shield-outline" size={16} color={CultureTokens.coral} />
            <Text style={[s.infoText, { color: colors.textSecondary }]}>
              Under GDPR / Australian Privacy Act, users may request access to, correction of, or deletion of their personal data. Requests must be actioned within 30 days.
            </Text>
          </View>
        </View>

        {/* ── Terms & Policies ──────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionHeader label="Terms & Policies" sub="Platform legal documents" />
          <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.borderLight, paddingHorizontal: 16 }]}>
            <PolicyRow
              index={0}
              label="Terms of Service"
              sub="Platform usage terms and conditions"
              icon="document-text-outline"
              route="/legal/terms"
              accent={CultureTokens.indigo}
            />
            <PolicyRow
              index={1}
              label="Privacy Policy"
              sub="Data collection and usage policy"
              icon="lock-closed-outline"
              route="/legal/privacy"
              accent={CultureTokens.teal}
            />
            <PolicyRow
              index={2}
              label="Cookie Policy"
              sub="Cookie and tracking disclosures"
              icon="ellipsis-horizontal-outline"
              route="/legal/cookies"
              accent={CultureTokens.saffron}
            />
            <PolicyRow
              index={3}
              label="Community Guidelines"
              sub="Acceptable use and content standards"
              icon="people-outline"
              route="/legal/guidelines"
              accent={CultureTokens.gold}
            />
          </View>

          <View style={[s.infoBox, { backgroundColor: '#A78BFA14', borderColor: '#A78BFA40', marginTop: 10 }]}>
            <Ionicons name="pencil-outline" size={16} color="#A78BFA" />
            <Text style={[s.infoText, { color: colors.textSecondary }]}>
              To update legal documents, edit the corresponding files in <Text style={{ fontFamily: 'Poppins_600SemiBold' }}>app/legal/</Text> and redeploy. For material changes to Terms or Privacy Policy, notify users via push notification.
            </Text>
          </View>
        </View>

        {/* ── Data Retention ────────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionHeader label="Data Retention" />
          <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.borderLight, paddingHorizontal: 16, paddingVertical: 4 }]}>
            {([
              { label: 'User profiles',      value: 'Until deletion request', icon: 'person-outline',    color: CultureTokens.indigo },
              { label: 'Tickets',             value: 'Permanent (financial record)', icon: 'ticket-outline',   color: CultureTokens.teal },
              { label: 'Audit logs',          value: '90 days (Firestore)',   icon: 'list-outline',     color: '#A78BFA' },
              { label: 'Event data',          value: '2 years post-event',    icon: 'calendar-outline', color: CultureTokens.saffron },
              { label: 'Payment records',     value: '7 years (legal requirement)', icon: 'card-outline', color: CultureTokens.gold },
            ]).map((item, i) => (
              <Animated.View key={item.label} entering={FadeInDown.delay(i * 40).duration(260)}>
                <View style={[s.retentionRow, { borderBottomColor: colors.borderLight }]}>
                  <View style={[s.retentionIcon, { backgroundColor: item.color + '18' }]}>
                    <Ionicons name={item.icon as never} size={15} color={item.color} />
                  </View>
                  <Text style={[s.retentionLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                  <Text style={[s.retentionValue, { color: colors.text }]}>{item.value}</Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default function AdminDataComplianceScreen() {
  return <ErrorBoundary><DataComplianceContent /></ErrorBoundary>;
}

const s = StyleSheet.create({
  fill:           { flex: 1 },
  header:         { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 16 },
  headerTitle:    { fontSize: 18, fontFamily: 'Poppins_700Bold', color: '#fff', letterSpacing: -0.2 },
  headerSub:      { fontSize: 12, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  backBtn:        { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  scroll:         { paddingTop: 20 },
  section:        { marginBottom: 28 },
  card:           { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  infoBox:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 14, borderWidth: 1, padding: 13 },
  infoText:       { flex: 1, fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 18 },
  actionBtn:      { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, padding: 14 },
  actionBtnText:  { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  // Retention
  retentionRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  retentionIcon:  { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  retentionLabel: { flex: 1, fontSize: 13, fontFamily: 'Poppins_500Medium' },
  retentionValue: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', textAlign: 'right', flexShrink: 1, maxWidth: '45%' },
});
