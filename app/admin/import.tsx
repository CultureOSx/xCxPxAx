import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Platform,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { CultureTokens, gradients } from '@/constants/theme';
import { queryClient } from '@/lib/query-client';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import * as Haptics from 'expo-haptics';

const isWeb = Platform.OS === 'web';

// ─── Preset Sources ───────────────────────────────────────────────────────────
const PRESETS = [
  {
    name: 'City of Sydney',
    url: 'https://whatson.cityofsydney.nsw.gov.au/events',
    city: 'Sydney',
    country: 'Australia',
    icon: 'business-outline',
    color: CultureTokens.teal,
    description: 'Official events from City of Sydney — uses Drupal JSON:API',
  },
  {
    name: 'Sydney Events',
    url: 'https://whatson.cityofsydney.nsw.gov.au/events?category=music',
    city: 'Sydney',
    country: 'Australia',
    icon: 'musical-notes-outline',
    color: CultureTokens.gold,
    description: 'Music & cultural events from What\'s On Sydney',
  },
  {
    name: 'Melbourne Events',
    url: 'https://whatson.melbourne.vic.gov.au/events',
    city: 'Melbourne',
    country: 'Australia',
    icon: 'location-outline',
    color: CultureTokens.indigo,
    description: 'What\'s On in Melbourne — auto-detects JSON-LD',
  },
];

// ─── Result Banner ────────────────────────────────────────────────────────────
function ResultBanner({ result }: {
  result: { imported: number; updated: number; skipped: number; errors: string[]; source: string } | null;
}) {
  const colors = useColors();
  if (!result) return null;
  const hasErrors = result.errors.length > 0;
  const color = hasErrors ? CultureTokens.coral : CultureTokens.teal;
  return (
    <Animated.View
      entering={FadeInDown.springify()}
      style={[res.wrap, { backgroundColor: color + '12', borderColor: color + '30' }]}
    >
      <Ionicons name={hasErrors ? 'warning-outline' : 'checkmark-circle'} size={20} color={color} />
      <View style={{ flex: 1 }}>
        <Text style={[res.title, { color }]}>
          {hasErrors ? 'Import completed with errors' : 'Import successful'}
        </Text>
        <Text style={[res.detail, { color: colors.textSecondary }]}>
          {result.imported} imported · {result.updated} updated · {result.skipped} skipped
          {result.source ? ` · source: ${result.source}` : ''}
        </Text>
        {result.errors.length > 0 ? (
          <Text style={[res.errors, { color: CultureTokens.coral }]} numberOfLines={3}>
            {result.errors.slice(0, 3).join('\n')}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
}
const res = StyleSheet.create({
  wrap:   { flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderRadius: 14, borderWidth: 1, padding: 14 },
  title:  { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  detail: { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  errors: { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 4 },
});

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ label }: { label: string }) {
  const colors = useColors();
  return <Text style={[sh.text, { color: colors.textTertiary }]}>{label.toUpperCase()}</Text>;
}
const sh = StyleSheet.create({
  text: { fontSize: 11, fontFamily: 'Poppins_700Bold', letterSpacing: 1.4, marginBottom: 10 },
});

// ─── Import Screen ────────────────────────────────────────────────────────────
function ImportContent() {
  const insets   = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const colors   = useColors();
  const { hPad, isDesktop } = useLayout();
  const { isAdmin } = useRole();

  const [urlInput,   setUrlInput]   = useState('');
  const [city,       setCity]       = useState('Sydney');
  const [country,    setCountry]    = useState('Australia');
  const [lastResult, setLastResult] = useState<{ imported: number; updated: number; skipped: number; errors: string[]; source: string } | null>(null);

  const { data: sources, refetch: refetchSources, isLoading: sourcesLoading } = useQuery({
    queryKey: ['admin-import-sources'],
    queryFn:  () => api.admin.importSources(),
    staleTime: 20_000,
    enabled:  isAdmin,
  });

  const urlMutation = useMutation({
    mutationFn: () => api.admin.importUrl({ url: urlInput.trim(), city, country }),
    onSuccess: (data) => {
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLastResult(data);
      setUrlInput('');
      refetchSources();
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
    },
    onError: (err: Error) => Alert.alert('Import Failed', err.message),
  });

  const clearMutation = useMutation({
    mutationFn: (source: Parameters<typeof api.admin.importClear>[0]) =>
      api.admin.importClear(source),
    onSuccess: (data) => {
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Cleared', `Deleted ${data.deleted} events from "${data.source}".`);
      setLastResult(null);
      refetchSources();
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
    },
    onError: (err: Error) => Alert.alert('Clear Failed', err.message),
  });

  const handlePreset = (preset: typeof PRESETS[number]) => {
    setUrlInput(preset.url);
    setCity(preset.city);
    setCountry(preset.country);
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Imported Events',
      `This will permanently delete ALL ${sources?.total ?? 0} imported events. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete All', style: 'destructive', onPress: () => clearMutation.mutate('all') },
      ],
    );
  };

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="lock-closed" size={44} color={colors.textTertiary} />
        <Text style={{ color: colors.text, fontFamily: 'Poppins_700Bold', marginTop: 12 }}>Admin Access Required</Text>
      </View>
    );
  }

  const contentMaxWidth = isDesktop ? 800 : undefined;

  return (
    <View style={[s.fill, { backgroundColor: colors.background }]}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
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
            <Text style={s.headerTitle}>Data Import</Text>
            <Text style={s.headerSub}>
              {sources ? `${sources.total} events imported` : 'Import events from external sources'}
            </Text>
          </View>
          <Pressable onPress={() => refetchSources()} style={s.headerBtn} accessibilityRole="button" accessibilityLabel="Refresh">
            <Ionicons name="refresh" size={18} color="rgba(255,255,255,0.9)" />
          </Pressable>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingHorizontal: hPad, paddingBottom: insets.bottom + 48 }]}
      >
        <View style={[s.content, contentMaxWidth ? { maxWidth: contentMaxWidth, alignSelf: 'center' as const, width: '100%' } : {}]}>

          {/* Result banner */}
          <ResultBanner result={lastResult} />

          {/* ── Quick Presets ─────────────────────────────────────────────── */}
          <View style={s.section}>
            <SectionHeader label="Quick Presets" />
            <View style={s.presetGrid}>
              {PRESETS.map(preset => (
                <Pressable
                  key={preset.name}
                  style={({ pressed }) => [s.presetCard, {
                    backgroundColor: colors.surface, borderColor: preset.color + '40',
                    opacity: pressed ? 0.8 : 1,
                  }]}
                  onPress={() => handlePreset(preset)}
                  accessibilityRole="button"
                  accessibilityLabel={`Use ${preset.name} preset`}
                >
                  <View style={[s.presetIcon, { backgroundColor: preset.color + '18' }]}>
                    <Ionicons name={preset.icon as keyof typeof Ionicons.glyphMap} size={20} color={preset.color} />
                  </View>
                  <Text style={[s.presetName, { color: colors.text }]}>{preset.name}</Text>
                  <Text style={[s.presetDesc, { color: colors.textTertiary }]} numberOfLines={2}>
                    {preset.description}
                  </Text>
                  <View style={[s.presetUseBtn, { backgroundColor: preset.color + '18', borderColor: preset.color + '40' }]}>
                    <Ionicons name="arrow-forward" size={12} color={preset.color} />
                    <Text style={[s.presetUseBtnText, { color: preset.color }]}>Use</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* ── URL Import ────────────────────────────────────────────────── */}
          <View style={s.section}>
            <SectionHeader label="Import from URL" />
            <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <View style={s.cardHeader}>
                <View style={[s.cardIcon, { backgroundColor: CultureTokens.teal + '18' }]}>
                  <Ionicons name="cloud-download-outline" size={20} color={CultureTokens.teal} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.cardTitle, { color: colors.text }]}>URL Importer</Text>
                  <Text style={[s.cardSub, { color: colors.textTertiary }]}>
                    Supports City of Sydney JSON:API, generic JSON-LD, and HTML event pages
                  </Text>
                </View>
              </View>

              <View style={s.inputGroup}>
                <Text style={[s.inputLabel, { color: colors.textSecondary }]}>Event Page URL</Text>
                <View style={[s.inputWrap, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}>
                  <Ionicons name="link-outline" size={16} color={colors.textTertiary} />
                  <TextInput
                    style={[s.input, { color: colors.text }]}
                    placeholder="https://whatson.cityofsydney.nsw.gov.au/events"
                    placeholderTextColor={colors.textTertiary}
                    value={urlInput}
                    onChangeText={setUrlInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    accessibilityLabel="Import URL"
                  />
                  {urlInput.length > 0 ? (
                    <Pressable onPress={() => setUrlInput('')} hitSlop={8}>
                      <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
                    </Pressable>
                  ) : null}
                </View>
              </View>

              <View style={s.metaRow}>
                <View style={[s.inputGroup, { flex: 1 }]}>
                  <Text style={[s.inputLabel, { color: colors.textSecondary }]}>City</Text>
                  <View style={[s.inputWrap, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}>
                    <Ionicons name="location-outline" size={15} color={colors.textTertiary} />
                    <TextInput
                      style={[s.input, { color: colors.text }]}
                      placeholder="Sydney"
                      placeholderTextColor={colors.textTertiary}
                      value={city}
                      onChangeText={setCity}
                      accessibilityLabel="City"
                    />
                  </View>
                </View>
                <View style={[s.inputGroup, { flex: 1 }]}>
                  <Text style={[s.inputLabel, { color: colors.textSecondary }]}>Country</Text>
                  <View style={[s.inputWrap, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}>
                    <Ionicons name="globe-outline" size={15} color={colors.textTertiary} />
                    <TextInput
                      style={[s.input, { color: colors.text }]}
                      placeholder="Australia"
                      placeholderTextColor={colors.textTertiary}
                      value={country}
                      onChangeText={setCountry}
                      accessibilityLabel="Country"
                    />
                  </View>
                </View>
              </View>

              <Pressable
                style={[s.importBtn, {
                  backgroundColor: urlInput.trim() ? CultureTokens.teal : colors.backgroundSecondary,
                  opacity: urlMutation.isPending ? 0.7 : 1,
                }]}
                onPress={() => urlInput.trim() && urlMutation.mutate()}
                disabled={!urlInput.trim() || urlMutation.isPending}
                accessibilityRole="button"
                accessibilityLabel="Import events"
              >
                {urlMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="download-outline" size={18} color={urlInput.trim() ? '#fff' : colors.textTertiary} />
                )}
                <Text style={[s.importBtnText, { color: urlInput.trim() ? '#fff' : colors.textTertiary }]}>
                  {urlMutation.isPending ? 'Importing…' : 'Import Events'}
                </Text>
              </Pressable>

              <View style={[s.infoBox, { backgroundColor: CultureTokens.indigo + '0C', borderColor: CultureTokens.indigo + '25' }]}>
                <Ionicons name="information-circle-outline" size={15} color={CultureTokens.indigo} />
                <Text style={[s.infoText, { color: colors.textSecondary }]}>
                  Events are matched by external ID to prevent duplicates on re-import.
                  Existing events are updated, new ones are created.
                </Text>
              </View>
            </View>
          </View>

          {/* ── Import Sources ────────────────────────────────────────────── */}
          <View style={s.section}>
            <View style={s.sectionHeaderRow}>
              <SectionHeader label="Import Sources" />
              {(sources?.total ?? 0) > 0 ? (
                <Pressable
                  onPress={handleClearAll}
                  style={[s.clearAllBtn, { borderColor: CultureTokens.coral + '44' }]}
                  accessibilityRole="button"
                  accessibilityLabel="Clear all imported events"
                >
                  <Ionicons name="trash-outline" size={13} color={CultureTokens.coral} />
                  <Text style={[s.clearAllText, { color: CultureTokens.coral }]}>Clear All</Text>
                </Pressable>
              ) : null}
            </View>

            {sourcesLoading ? (
              <ActivityIndicator color={CultureTokens.indigo} style={{ marginVertical: 20 }} />
            ) : !sources || sources.sources.length === 0 ? (
              <View style={[s.emptyCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                <Ionicons name="cloud-upload-outline" size={36} color={colors.textTertiary} />
                <Text style={[s.emptyTitle, { color: colors.text }]}>No imported events yet</Text>
                <Text style={[s.emptyText, { color: colors.textSecondary }]}>
                  Use a preset above or paste a URL to import events from external sources.
                </Text>
              </View>
            ) : (
              <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.borderLight, padding: 0 }]}>
                {/* Total summary */}
                <View style={[s.sourceSummary, { borderBottomColor: colors.borderLight }]}>
                  <View style={[s.sourceIcon, { backgroundColor: CultureTokens.indigo + '18' }]}>
                    <Ionicons name="layers-outline" size={18} color={CultureTokens.indigo} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.sourceSummaryTitle, { color: colors.text }]}>
                      {sources.total.toLocaleString()} total imported events
                    </Text>
                    <Text style={[s.sourceSummaryText, { color: colors.textTertiary }]}>
                      Across {sources.sources.length} source{sources.sources.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>

                {/* Per-source rows */}
                {sources.sources.map((src, i) => (
                  <Animated.View
                    key={src.source}
                    entering={FadeInDown.delay(i * 40).springify()}
                    style={[s.sourceRow, { borderBottomColor: colors.borderLight },
                      i === sources.sources.length - 1 && { borderBottomWidth: 0 }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[s.sourceName, { color: colors.text }]}>{src.source}</Text>
                      <Text style={[s.sourceMeta, { color: colors.textTertiary }]}>
                        {src.count} events · last import{' '}
                        {new Date(src.latest).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                    <View style={[s.sourceCount, { backgroundColor: CultureTokens.indigo + '12', borderColor: CultureTokens.indigo + '30' }]}>
                      <Text style={[s.sourceCountText, { color: CultureTokens.indigo }]}>{src.count}</Text>
                    </View>
                    <Pressable
                      onPress={() => Alert.alert(
                        'Clear Source',
                        `Delete all ${src.count} events from "${src.source}"?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: () => clearMutation.mutate(src.source as Parameters<typeof api.admin.importClear>[0]) },
                        ],
                      )}
                      style={[s.clearBtn, { backgroundColor: CultureTokens.coral + '12', borderColor: CultureTokens.coral + '30' }]}
                      accessibilityRole="button"
                      accessibilityLabel={`Clear ${src.source} source`}
                    >
                      {clearMutation.isPending ? (
                        <ActivityIndicator size="small" color={CultureTokens.coral} />
                      ) : (
                        <Ionicons name="trash-outline" size={14} color={CultureTokens.coral} />
                      )}
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            )}
          </View>

          {/* ── Supported Formats ─────────────────────────────────────────── */}
          <View style={s.section}>
            <SectionHeader label="Supported Formats" />
            <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              {[
                { icon: 'git-branch-outline', color: CultureTokens.teal,    title: 'Drupal JSON:API', desc: 'City of Sydney, NSW Government portals — auto-detected' },
                { icon: 'code-slash-outline', color: CultureTokens.indigo,  title: 'JSON-LD (schema.org)', desc: 'Structured event data embedded in HTML pages' },
                { icon: 'globe-outline',       color: CultureTokens.gold, title: 'Generic HTML Scraping', desc: 'Extracts events from common event listing page patterns' },
                { icon: 'document-text-outline', color: '#A78BFA',           title: 'Raw JSON', desc: 'Paste or upload JSON arrays using schema.org Event format' },
              ].map((fmt, i, arr) => (
                <View key={fmt.title}>
                  <View style={s.formatRow}>
                    <View style={[s.formatIcon, { backgroundColor: fmt.color + '18' }]}>
                      <Ionicons name={fmt.icon as keyof typeof Ionicons.glyphMap} size={18} color={fmt.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.formatTitle, { color: colors.text }]}>{fmt.title}</Text>
                      <Text style={[s.formatDesc, { color: colors.textTertiary }]}>{fmt.desc}</Text>
                    </View>
                    <View style={[s.formatBadge, { backgroundColor: '#22C55E18', borderColor: '#22C55E44' }]}>
                      <Text style={[s.formatBadgeText, { color: '#22C55E' }]}>Supported</Text>
                    </View>
                  </View>
                  {i < arr.length - 1 ? <View style={[s.divider, { backgroundColor: colors.borderLight }]} /> : null}
                </View>
              ))}
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

export default function AdminImportScreen() {
  return (
    <ErrorBoundary>
      <ImportContent />
    </ErrorBoundary>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  fill:            { flex: 1 },
  header:          { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 16 },
  headerTitle:     { fontSize: 18, fontFamily: 'Poppins_700Bold', color: '#fff', letterSpacing: -0.2 },
  headerSub:       { fontSize: 12, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  backBtn:         { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  headerBtn:       { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' },

  scroll:          { paddingTop: 20 },
  content:         { gap: 24 },

  section:         { gap: 0 },
  sectionHeaderRow:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },

  card:            { borderRadius: 16, borderWidth: 1, padding: 18, gap: 16 },
  cardHeader:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardIcon:        { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  cardTitle:       { fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  cardSub:         { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },

  // Presets
  presetGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  presetCard:      { flex: 1, minWidth: 160, borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  presetIcon:      { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  presetName:      { fontSize: 13, fontFamily: 'Poppins_700Bold' },
  presetDesc:      { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  presetUseBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, marginTop: 2 },
  presetUseBtnText:{ fontSize: 11, fontFamily: 'Poppins_700Bold' },

  // Inputs
  inputGroup:      { gap: 6 },
  inputLabel:      { fontSize: 11, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.8 },
  inputWrap:       { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  input:           { flex: 1, fontSize: 14, fontFamily: 'Poppins_400Regular', padding: 0 },
  metaRow:         { flexDirection: 'row', gap: 10 },

  importBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14 },
  importBtnText:   { fontSize: 15, fontFamily: 'Poppins_700Bold' },

  infoBox:         { flexDirection: 'row', gap: 8, alignItems: 'flex-start', borderRadius: 10, borderWidth: 1, padding: 12 },
  infoText:        { flex: 1, fontSize: 12, fontFamily: 'Poppins_400Regular' },

  // Sources
  clearAllBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 9, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  clearAllText:    { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  emptyCard:       { borderRadius: 16, borderWidth: 1, padding: 32, alignItems: 'center', gap: 10 },
  emptyTitle:      { fontSize: 15, fontFamily: 'Poppins_700Bold' },
  emptyText:       { fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  sourceSummary:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  sourceIcon:      { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sourceSummaryTitle: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  sourceSummaryText:  { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  sourceRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  sourceName:      { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  sourceMeta:      { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  sourceCount:     { borderRadius: 9, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, alignItems: 'center', justifyContent: 'center' },
  sourceCountText: { fontSize: 13, fontFamily: 'Poppins_700Bold' },
  clearBtn:        { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  // Formats
  formatRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  formatIcon:      { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  formatTitle:     { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  formatDesc:      { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  formatBadge:     { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  formatBadgeText: { fontSize: 10, fontFamily: 'Poppins_700Bold' },
  divider:         { height: StyleSheet.hairlineWidth, marginVertical: 10 },
});
