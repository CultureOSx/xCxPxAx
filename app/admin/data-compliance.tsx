import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, useReducedMotion } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import {
  CardTokens,
  CultureTokens,
  FontFamily,
  FontSize,
  Spacing,
  TextStyles,
  gradients,
} from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const isWeb = Platform.OS === 'web';

const CONTENT_MAX_WIDTH = 720;

// ─── Section header ─────────────────────────────────────────────────────────
function SectionHeader({ label, sub }: { label: string; sub?: string }) {
  const colors = useColors();
  return (
    <View style={sh.wrap} accessibilityRole="header">
      <Text style={[TextStyles.badgeCaps, { color: colors.primary }]}>{label}</Text>
      {sub ? (
        <Text style={[TextStyles.callout, { color: colors.textSecondary, marginTop: Spacing.xs }]}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

const sh = StyleSheet.create({
  wrap: { marginBottom: Spacing.md },
});

// ─── Info callout ─────────────────────────────────────────────────────────────
function InfoCallout({
  icon,
  children,
  accent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  children: ReactNode;
  accent: string;
}) {
  return (
    <View
      style={[ic.box, { backgroundColor: accent + '12', borderColor: accent + '35' }]}
      accessibilityRole="text"
    >
      <Ionicons name={icon} size={18} color={accent} style={ic.icon} />
      <View style={ic.textWrap}>{children}</View>
    </View>
  );
}

const ic = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm + 2,
    borderRadius: CardTokens.radius,
    borderWidth: 1,
    padding: Spacing.md,
  },
  icon: { marginTop: 2 },
  textWrap: { flex: 1 },
});

// ─── Export card ──────────────────────────────────────────────────────────────
function ExportCard({
  title,
  description,
  icon,
  accent,
  actionLabel,
  onPress,
  loading,
  disabledHint,
}: {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  actionLabel: string;
  onPress: () => void;
  loading?: boolean;
  disabledHint?: string;
}) {
  const colors = useColors();
  const hint = disabledHint ? `${actionLabel}. ${disabledHint}` : actionLabel;
  return (
    <Card padding={Spacing.md} style={{ marginBottom: Spacing.sm + 4, borderColor: colors.borderLight }}>
      <View style={ec.top}>
        <View style={[ec.iconWrap, { backgroundColor: accent + '18' }]}>
          <Ionicons name={icon} size={20} color={accent} />
        </View>
        <View style={ec.copy}>
          <Text style={[ec.title, { color: colors.text }]}>{title}</Text>
          <Text style={[ec.desc, { color: colors.textSecondary }]}>{description}</Text>
        </View>
      </View>
      <Button
        variant="outline"
        size="md"
        fullWidth
        leftIcon={icon}
        rightIcon="download-outline"
        onPress={onPress}
        loading={loading}
        accessibilityLabel={title}
        accessibilityHint={hint}
        style={{ marginTop: Spacing.md, borderColor: accent + '40' }}
      >
        {actionLabel}
      </Button>
    </Card>
  );
}

const ec = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0 },
  title: { fontSize: FontSize.title3, fontFamily: FontFamily.semibold, lineHeight: 24 },
  desc: { fontSize: FontSize.body2, fontFamily: FontFamily.regular, marginTop: 4, lineHeight: 20 },
});

// ─── Policy row ───────────────────────────────────────────────────────────────
function PolicyRow({
  label,
  sub,
  icon,
  route,
  accent,
  index,
  total,
  reduceMotion,
}: {
  label: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  accent: string;
  index: number;
  total: number;
  reduceMotion: boolean;
}) {
  const colors = useColors();
  const isLast = index === total - 1;
  const entering = reduceMotion ? FadeIn : FadeInDown.delay(index * 45).duration(240);
  return (
    <Animated.View entering={entering}>
      <Pressable
        style={({ pressed }) => [
          pr.row,
          {
            backgroundColor: pressed ? colors.backgroundSecondary : 'transparent',
            borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
            borderBottomColor: colors.borderLight,
          },
        ]}
        onPress={() => router.push(route)}
        accessibilityRole="link"
        accessibilityLabel={label}
        accessibilityHint={`Opens ${label}`}
        {...(isWeb ? ({ cursor: 'pointer' } as const) : {})}
      >
        <View style={[pr.iconWrap, { backgroundColor: accent + '18' }]}>
          <Ionicons name={icon} size={18} color={accent} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[pr.label, { color: colors.text }]}>{label}</Text>
          <Text style={[pr.sub, { color: colors.textTertiary }]}>{sub}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </Pressable>
    </Animated.View>
  );
}

const pr = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.xs,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: FontSize.callout, fontFamily: FontFamily.semibold },
  sub: { fontSize: FontSize.caption, fontFamily: FontFamily.regular, marginTop: 2, lineHeight: 18 },
});

// ─── GDPR step ─────────────────────────────────────────────────────────────────
function GdprStep({
  step,
  title,
  body,
  accent,
  showDivider,
}: {
  step: number;
  title: string;
  body: string;
  accent: string;
  showDivider: boolean;
}) {
  const colors = useColors();
  return (
    <View>
      <View style={gs.row}>
        <View style={[gs.stepNum, { backgroundColor: accent + '18', borderColor: accent + '40' }]}>
          <Text style={[gs.stepText, { color: accent }]}>{step}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[gs.title, { color: colors.text }]}>{title}</Text>
          <Text style={[gs.body, { color: colors.textSecondary }]}>{body}</Text>
        </View>
      </View>
      {showDivider ? <View style={[gs.divider, { backgroundColor: colors.borderLight }]} /> : null}
    </View>
  );
}

const gs = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.md, paddingVertical: Spacing.md },
  stepNum: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
    marginTop: 2,
  },
  stepText: { fontSize: FontSize.chip, fontFamily: FontFamily.bold },
  title: { fontSize: FontSize.callout, fontFamily: FontFamily.semibold, lineHeight: 22 },
  body: { fontSize: FontSize.body2, fontFamily: FontFamily.regular, marginTop: 4, lineHeight: 20 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 52 },
});

// ─── Main ─────────────────────────────────────────────────────────────────────
function DataComplianceContent() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const colors = useColors();
  const { hPad, isDesktop, isMobile } = useLayout();
  const { hasMinRole, isLoading: roleLoading } = useRole();
  const canAccess = hasMinRole('admin');
  const reduceMotion = useReducedMotion();

  const [exportingAudit, setExportingAudit] = useState(false);

  useEffect(() => {
    if (!roleLoading && !canAccess) router.replace('/(tabs)');
  }, [canAccess, roleLoading]);

  const handleAuditLogExport = async () => {
    if (!isWeb) {
      Alert.alert(
        'CSV on web only',
        'Audit log CSV download works in a desktop browser. Open the admin panel at culturepass.app (or your dev URL) to export.',
        [{ text: 'OK' }],
      );
      return;
    }
    setExportingAudit(true);
    try {
      const csv = await api.admin.auditLogsCsv({ limit: 1000 });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      Alert.alert('Download started', 'Check your downloads folder for the CSV file.');
    } catch {
      Alert.alert('Export failed', 'Could not generate the audit log CSV. Try again or use the Audit Logs screen filters.');
    } finally {
      setExportingAudit(false);
    }
  };

  const handleUserDataExport = () => {
    Alert.alert(
      'User data export',
      'Full user data exports use your GDPR / privacy process. For bulk datastore exports, use Firebase Console → Firestore → Export.',
      [{ text: 'OK' }],
    );
  };

  const handleDeletionRequest = () => {
    Alert.alert(
      'Deletion checklist',
      '1. Identify the user in Admin → Users\n2. Remove PII from their Firestore user document\n3. Delete their Firebase Auth account (Console or Admin SDK)\n4. Record the action in the audit log\n\nAn automated deletion flow may ship in a future release.',
      [{ text: 'OK' }],
    );
  };

  const policyRows = [
    {
      label: 'Terms of Service',
      sub: 'Platform usage terms and conditions',
      icon: 'document-text-outline' as const,
      route: '/legal/terms',
      accent: CultureTokens.indigo,
    },
    {
      label: 'Privacy Policy',
      sub: 'Data collection and usage',
      icon: 'lock-closed-outline' as const,
      route: '/legal/privacy',
      accent: CultureTokens.teal,
    },
    {
      label: 'Cookie Policy',
      sub: 'Cookies and tracking',
      icon: 'ellipsis-horizontal-outline' as const,
      route: '/legal/cookies',
      accent: CultureTokens.gold,
    },
    {
      label: 'Community Guidelines',
      sub: 'Acceptable use and content standards',
      icon: 'people-outline' as const,
      route: '/legal/guidelines',
      accent: CultureTokens.coral,
    },
  ];

  const retentionItems = [
    {
      label: 'User profiles',
      value: 'Until deletion request',
      icon: 'person-outline' as const,
      color: CultureTokens.indigo,
    },
    {
      label: 'Tickets',
      value: 'Retained (financial record)',
      icon: 'ticket-outline' as const,
      color: CultureTokens.teal,
    },
    {
      label: 'Audit logs',
      value: '90 days (Firestore)',
      icon: 'list-outline' as const,
      color: CultureTokens.purple,
    },
    {
      label: 'Event data',
      value: '2 years post-event',
      icon: 'calendar-outline' as const,
      color: CultureTokens.gold,
    },
    {
      label: 'Payment records',
      value: '7 years (legal)',
      icon: 'card-outline' as const,
      color: CultureTokens.gold,
    },
  ];

  const gdprSteps = [
    { title: 'Receive deletion request', body: 'Via Settings → Privacy, or email to privacy@culturepass.app.', accent: CultureTokens.coral },
    { title: 'Verify identity', body: 'Match requester to the account (email or Firebase UID).', accent: CultureTokens.gold },
    { title: 'Remove PII from Firestore', body: 'Anonymise or delete displayName, email, phone, avatar, location fields.', accent: CultureTokens.teal },
    { title: 'Delete Firebase Auth user', body: 'Console → Authentication, or Admin SDK deleteUser(uid).', accent: CultureTokens.indigo },
    { title: 'Confirm and document', body: 'Log action, timestamp, and operator in your compliance record.', accent: CultureTokens.success },
  ];

  if (roleLoading) {
    return (
      <View style={[s.fill, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={CultureTokens.indigo} accessibilityLabel="Loading" />
      </View>
    );
  }

  const enteringHeader = reduceMotion ? FadeIn : FadeInUp.duration(280);

  return (
    <View style={[s.fill, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.midnight as unknown as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: topInset }}
      >
        <Animated.View
          entering={enteringHeader}
          style={[s.header, { paddingHorizontal: hPad, maxWidth: isDesktop ? CONTENT_MAX_WIDTH + hPad * 2 : undefined, alignSelf: 'center', width: '100%' }]}
        >
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/admin/dashboard'))}
            style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.72 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            {...(isWeb ? ({ cursor: 'pointer' } as const) : {})}
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </Pressable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.headerTitle}>Data & compliance</Text>
            <Text style={s.headerSub}>Exports, GDPR workflow, and legal links</Text>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.scroll,
          {
            paddingHorizontal: hPad,
            paddingBottom: insets.bottom + Spacing.xxxl,
            maxWidth: isDesktop ? CONTENT_MAX_WIDTH : undefined,
            alignSelf: isDesktop ? 'center' : undefined,
            width: isDesktop ? '100%' : undefined,
          },
        ]}
      >
        <View style={s.section}>
          <SectionHeader
            label="Data export"
            sub="Download operational data. Prefer the Audit Logs screen for filtered CSV."
          />
          <ExportCard
            title="Audit logs"
            description="Up to 1,000 recent rows as CSV. For full history or filters, use Admin → Audit Logs."
            icon="list-outline"
            accent={CultureTokens.indigo}
            actionLabel={isWeb ? 'Download CSV' : 'Available on web'}
            onPress={handleAuditLogExport}
            loading={exportingAudit}
            disabledHint={!isWeb ? 'Use a browser to download the file.' : undefined}
          />
          <ExportCard
            title="User data"
            description="Subject access requests and bulk user exports follow your privacy process."
            icon="people-outline"
            accent={CultureTokens.teal}
            actionLabel="How it works"
            onPress={handleUserDataExport}
          />
          <ExportCard
            title="Events"
            description="Bulk event datastore export is owned by Firebase / ops tooling."
            icon="calendar-outline"
            accent={CultureTokens.gold}
            actionLabel="Open guidance"
            onPress={() =>
              Alert.alert(
                'Event export',
                'Use Firebase Console → Firestore → Export to Cloud Storage for full event collections.',
              )
            }
          />
          <ExportCard
            title="Transactions"
            description="Card and Connect activity lives in Stripe."
            icon="card-outline"
            accent={CultureTokens.gold}
            actionLabel="Stripe reports"
            onPress={() =>
              Alert.alert('Transactions', 'Open Stripe Dashboard → Reports → Export for settlement and payment exports.')
            }
          />
          <InfoCallout icon="information-circle-outline" accent={CultureTokens.indigo}>
            <Text style={[s.infoParagraph, { color: colors.textSecondary }]}>
              Audit CSV here is capped at 1,000 rows. For full Firestore backups, use Google Cloud export to Cloud Storage.
            </Text>
          </InfoCallout>
        </View>

        <View style={s.section}>
          <SectionHeader label="Privacy & GDPR" sub="User rights and deletion workflow" />
          <Card padding={0} style={{ borderColor: colors.borderLight, overflow: 'hidden' }}>
            <View style={{ paddingHorizontal: Spacing.md }}>
              {gdprSteps.map((step, i) => (
                <GdprStep
                  key={step.title}
                  step={i + 1}
                  title={step.title}
                  body={step.body}
                  accent={step.accent}
                  showDivider={i < gdprSteps.length - 1}
                />
              ))}
            </View>
          </Card>

          <Button
            variant="outline"
            size="lg"
            fullWidth
            leftIcon="trash-outline"
            onPress={handleDeletionRequest}
            accessibilityLabel="Deletion request checklist"
            accessibilityHint="Shows steps to process a user deletion"
            style={{
              marginTop: Spacing.md,
              borderColor: CultureTokens.coral + '50',
              backgroundColor: CultureTokens.coral + '0D',
            }}
            textStyle={{ color: CultureTokens.coral }}
            iconColor={CultureTokens.coral}
          >
            Deletion checklist
          </Button>

          <Button
            variant="outline"
            size="lg"
            fullWidth
            leftIcon="document-text-outline"
            onPress={() =>
              Alert.alert(
                'Consent records',
                'Per-user consent may live under users/{uid} in Firestore. Inspect documents in Firebase Console as needed.',
              )
            }
            accessibilityLabel="Consent records"
            accessibilityHint="Explains where consent data may be stored"
            style={{
              marginTop: Spacing.sm + 4,
              borderColor: CultureTokens.teal + '45',
              backgroundColor: CultureTokens.teal + '0D',
            }}
            textStyle={{ color: CultureTokens.teal }}
            iconColor={CultureTokens.teal}
          >
            Where to find consents
          </Button>

          <InfoCallout icon="shield-checkmark-outline" accent={CultureTokens.coral}>
            <Text style={[s.infoParagraph, { color: colors.textSecondary }]}>
              Under GDPR and the Australian Privacy Act, users may request access, correction, or deletion. Aim to respond
              within 30 days and keep an internal record of requests handled.
            </Text>
          </InfoCallout>
        </View>

        <View style={s.section}>
          <SectionHeader label="Terms & policies" sub="In-app legal documents" />
          <Card padding={Spacing.sm} style={{ borderColor: colors.borderLight }}>
            {policyRows.map((row, i) => (
              <PolicyRow
                key={row.route}
                {...row}
                index={i}
                total={policyRows.length}
                reduceMotion={!!reduceMotion}
              />
            ))}
          </Card>
          <InfoCallout icon="create-outline" accent={CultureTokens.purple}>
            <Text style={[s.infoParagraph, { color: colors.textSecondary }]}>
              Update copy in{' '}
              <Text style={{ fontFamily: FontFamily.semibold }}>app/legal/</Text>
              and redeploy. For material Terms or Privacy changes, notify members (e.g. in-app or push).
            </Text>
          </InfoCallout>
        </View>

        <View style={[s.section, { marginBottom: Spacing.lg }]}>
          <SectionHeader label="Data retention" sub="Reference schedule — confirm with legal for your jurisdiction" />
          <Card padding={0} style={{ borderColor: colors.borderLight }}>
            {retentionItems.map((item, i) => (
              <Animated.View
                key={item.label}
                entering={reduceMotion ? FadeIn : FadeInDown.delay(i * 35).duration(220)}
              >
                <View
                  style={[
                    s.retentionRow,
                    {
                      borderBottomColor: colors.borderLight,
                      borderBottomWidth: i === retentionItems.length - 1 ? 0 : StyleSheet.hairlineWidth,
                      flexDirection: isMobile ? 'column' : 'row',
                      alignItems: isMobile ? 'flex-start' : 'center',
                      gap: isMobile ? Spacing.xs : Spacing.md,
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: isMobile ? undefined : 1 }}>
                    <View style={[s.retentionIcon, { backgroundColor: item.color + '18' }]}>
                      <Ionicons name={item.icon} size={16} color={item.color} />
                    </View>
                    <Text style={[s.retentionLabel, { color: colors.text }]}>{item.label}</Text>
                  </View>
                  <Text
                    style={[
                      s.retentionValue,
                      { color: colors.textSecondary },
                      isMobile ? { textAlign: 'left', paddingLeft: 56 } : { textAlign: 'right', flex: 1, maxWidth: '48%' },
                    ]}
                  >
                    {item.value}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

export default function AdminDataComplianceScreen() {
  return (
    <ErrorBoundary>
      <DataComplianceContent />
    </ErrorBoundary>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 4,
  },
  headerTitle: {
    fontSize: FontSize.title2,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: FontSize.caption,
    fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 4,
    lineHeight: 18,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  scroll: { paddingTop: Spacing.lg },
  section: { marginBottom: Spacing.xl + 8 },
  infoParagraph: {
    fontSize: FontSize.body2,
    fontFamily: FontFamily.regular,
    lineHeight: 20,
  },
  retentionRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md + 2,
  },
  retentionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retentionLabel: { fontSize: FontSize.callout, fontFamily: FontFamily.semibold },
  retentionValue: { fontSize: FontSize.body2, fontFamily: FontFamily.medium, lineHeight: 20 },
});
