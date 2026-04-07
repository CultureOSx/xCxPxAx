import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  Platform, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens } from '@/constants/theme';
import { queryClient } from '@/lib/query-client';
import * as Haptics from 'expo-haptics';

const PRESETS = [
  {
    name: 'City of Sydney',
    url: 'https://whatson.cityofsydney.nsw.gov.au/events',
    city: 'Sydney', country: 'Australia',
    icon: 'business-outline', color: CultureTokens.teal,
    description: 'Official events from City of Sydney — uses Drupal JSON:API',
  },
  {
    name: 'Sydney Music',
    url: 'https://whatson.cityofsydney.nsw.gov.au/events?category=music',
    city: 'Sydney', country: 'Australia',
    icon: 'musical-notes-outline', color: CultureTokens.gold,
    description: 'Music & cultural events from What\'s On Sydney',
  },
  {
    name: 'Melbourne Events',
    url: 'https://whatson.melbourne.vic.gov.au/events',
    city: 'Melbourne', country: 'Australia',
    icon: 'location-outline', color: CultureTokens.indigo,
    description: 'What\'s On in Melbourne — auto-detects JSON-LD',
  },
];

type ImportResult = { imported: number; updated: number; skipped: number; errors: string[]; source: string };

function ResultBanner({ result }: { result: ImportResult | null }) {
  const colors = useColors();
  if (!result) return null;
  const hasErrors = result.errors.length > 0;
  const color = hasErrors ? CultureTokens.coral : CultureTokens.teal;
  return (
    <Animated.View entering={FadeInDown.springify()} style={[r.wrap, { backgroundColor: color + '12', borderColor: color + '30' }]}>
      <Ionicons name={hasErrors ? 'warning-outline' : 'checkmark-circle'} size={20} color={color} />
      <View style={{ flex: 1 }}>
        <Text style={[r.title, { color }]}>{hasErrors ? 'Import completed with errors' : 'Import successful'}</Text>
        <Text style={[r.detail, { color: colors.textSecondary }]}>
          {result.imported} imported · {result.updated} updated · {result.skipped} skipped
          {result.source ? ` · ${result.source}` : ''}
        </Text>
        {result.errors.length > 0 && (
          <Text style={[r.errors, { color: CultureTokens.coral }]} numberOfLines={3}>
            {result.errors.slice(0, 3).join('\n')}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}
const r = StyleSheet.create({
  wrap:   { flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderRadius: 14, borderWidth: 1, padding: 14 },
  title:  { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  detail: { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  errors: { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 4 },
});

export function AdHocTab({ onJobCreated }: { onJobCreated?: () => void }) {
  const colors   = useColors();
  const { hPad } = useLayout();

  const [urlInput, setUrlInput] = useState('');
  const [city, setCity]         = useState('Sydney');
  const [country, setCountry]   = useState('Australia');
  const [lastResult, setResult] = useState<ImportResult | null>(null);

  const urlMutation = useMutation({
    mutationFn: () => api.admin.importUrl({ url: urlInput.trim(), city, country }),
    onSuccess: (data) => {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResult(data);
      setUrlInput('');
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-import-sources'] });
      onJobCreated?.();
    },
    onError: (err: Error) => Alert.alert('Import Failed', err.message),
  });

  const clearMutation = useMutation({
    mutationFn: (source: Parameters<typeof api.admin.importClear>[0]) => api.admin.importClear(source),
    onSuccess: (data) => {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Cleared', `Deleted ${data.deleted} events from "${data.source}".`);
      setResult(null);
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-import-sources'] });
    },
    onError: (err: Error) => Alert.alert('Clear Failed', err.message),
  });

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { paddingHorizontal: hPad }]}>
      <View style={s.content}>

        <ResultBanner result={lastResult} />

        {/* Presets */}
        <View style={s.section}>
          <Text style={[s.sectionLabel, { color: colors.textTertiary }]}>QUICK PRESETS</Text>
          <View style={s.grid}>
            {PRESETS.map(p => (
              <Pressable
                key={p.name}
                style={({ pressed }) => [s.presetCard, { backgroundColor: colors.surface, borderColor: p.color + '40', opacity: pressed ? 0.8 : 1 }]}
                onPress={() => { setUrlInput(p.url); setCity(p.city); setCountry(p.country); }}
                accessibilityRole="button" accessibilityLabel={`Use ${p.name} preset`}
              >
                <View style={[s.presetIcon, { backgroundColor: p.color + '18' }]}>
                  <Ionicons name={p.icon as keyof typeof Ionicons.glyphMap} size={20} color={p.color} />
                </View>
                <Text style={[s.presetName, { color: colors.text }]}>{p.name}</Text>
                <Text style={[s.presetDesc, { color: colors.textTertiary }]} numberOfLines={2}>{p.description}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* URL import form */}
        <View style={s.section}>
          <Text style={[s.sectionLabel, { color: colors.textTertiary }]}>IMPORT FROM URL</Text>
          <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <View style={s.inputGroup}>
              <Text style={[s.inputLabel, { color: colors.textSecondary }]}>Event Page URL</Text>
              <View style={[s.inputRow, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}>
                <Ionicons name="link-outline" size={16} color={colors.textTertiary} />
                <TextInput
                  style={[s.input, { color: colors.text }]}
                  placeholder="https://whatson.cityofsydney.nsw.gov.au/events"
                  placeholderTextColor={colors.textTertiary}
                  value={urlInput}
                  onChangeText={setUrlInput}
                  autoCapitalize="none" autoCorrect={false} keyboardType="url"
                  accessibilityLabel="Import URL"
                />
                {urlInput.length > 0 && (
                  <Pressable onPress={() => setUrlInput('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
                  </Pressable>
                )}
              </View>
            </View>

            <View style={s.metaRow}>
              {[{ label: 'City', value: city, set: setCity, placeholder: 'Sydney' },
                { label: 'Country', value: country, set: setCountry, placeholder: 'Australia' }].map(f => (
                <View key={f.label} style={[s.inputGroup, { flex: 1 }]}>
                  <Text style={[s.inputLabel, { color: colors.textSecondary }]}>{f.label}</Text>
                  <View style={[s.inputRow, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}>
                    <TextInput
                      style={[s.input, { color: colors.text }]}
                      placeholder={f.placeholder}
                      placeholderTextColor={colors.textTertiary}
                      value={f.value}
                      onChangeText={f.set}
                      accessibilityLabel={f.label}
                    />
                  </View>
                </View>
              ))}
            </View>

            <Pressable
              style={[s.importBtn, {
                backgroundColor: urlInput.trim() ? CultureTokens.teal : colors.backgroundSecondary,
                opacity: urlMutation.isPending ? 0.7 : 1,
              }]}
              onPress={() => urlInput.trim() && urlMutation.mutate()}
              disabled={!urlInput.trim() || urlMutation.isPending}
              accessibilityRole="button" accessibilityLabel="Import events"
            >
              {urlMutation.isPending
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="download-outline" size={18} color={urlInput.trim() ? '#fff' : colors.textTertiary} />}
              <Text style={[s.importBtnText, { color: urlInput.trim() ? '#fff' : colors.textTertiary }]}>
                {urlMutation.isPending ? 'Importing…' : 'Import Events'}
              </Text>
            </Pressable>

            <View style={[s.infoBox, { backgroundColor: CultureTokens.indigo + '0C', borderColor: CultureTokens.indigo + '25' }]}>
              <Ionicons name="information-circle-outline" size={15} color={CultureTokens.indigo} />
              <Text style={[s.infoText, { color: colors.textSecondary }]}>
                Events are matched by external ID to prevent duplicates. Each run creates a job record visible in the History tab.
              </Text>
            </View>
          </View>
        </View>

        {/* Clear */}
        <View style={s.section}>
          <Text style={[s.sectionLabel, { color: colors.textTertiary }]}>DANGER ZONE</Text>
          <Pressable
            style={[s.clearBtn, { borderColor: CultureTokens.coral + '44' }]}
            onPress={() => Alert.alert('Clear All Imported Events', 'This permanently deletes ALL imported events. Cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete All', style: 'destructive', onPress: () => clearMutation.mutate('all') },
            ])}
            accessibilityRole="button" accessibilityLabel="Clear all imported events"
          >
            {clearMutation.isPending
              ? <ActivityIndicator size="small" color={CultureTokens.coral} />
              : <Ionicons name="trash-outline" size={16} color={CultureTokens.coral} />}
            <Text style={[s.clearBtnText, { color: CultureTokens.coral }]}>Clear All Imported Events</Text>
          </Pressable>
        </View>

      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:      { paddingTop: 20, paddingBottom: 80 },
  content:     { gap: 24 },
  section:     { gap: 10 },
  sectionLabel:{ fontSize: 11, fontFamily: 'Poppins_700Bold', letterSpacing: 1.4 },
  card:        { borderRadius: 16, borderWidth: 1, padding: 18, gap: 16 },
  grid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  presetCard:  { flex: 1, minWidth: 160, borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  presetIcon:  { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  presetName:  { fontSize: 13, fontFamily: 'Poppins_700Bold' },
  presetDesc:  { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  inputGroup:  { gap: 6 },
  inputLabel:  { fontSize: 11, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.8 },
  inputRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  input:       { flex: 1, fontSize: 14, fontFamily: 'Poppins_400Regular', padding: 0 },
  metaRow:     { flexDirection: 'row', gap: 10 },
  importBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14 },
  importBtnText:{ fontSize: 15, fontFamily: 'Poppins_700Bold' },
  infoBox:     { flexDirection: 'row', gap: 8, alignItems: 'flex-start', borderRadius: 10, borderWidth: 1, padding: 12 },
  infoText:    { flex: 1, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  clearBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderStyle: 'dashed' },
  clearBtnText:{ fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
});

export default AdHocTab;
