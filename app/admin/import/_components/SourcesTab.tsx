import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  Platform, TextInput, Alert, ActivityIndicator, Modal,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api, type IngestSource, type IngestScheduleInterval } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens } from '@/constants/theme';
import { queryClient } from '@/lib/query-client';
import * as Haptics from 'expo-haptics';

const SCHEDULE_OPTIONS: { value: IngestScheduleInterval | null; label: string }[] = [
  { value: null,       label: 'Manual only' },
  { value: 'hourly',   label: 'Every hour' },
  { value: 'every6h',  label: 'Every 6 hours' },
  { value: 'every12h', label: 'Every 12 hours' },
  { value: 'daily',    label: 'Daily' },
  { value: 'weekly',   label: 'Weekly' },
];

function statusColor(status: IngestSource['lastStatus']): string {
  if (status === 'success') return '#22C55E';
  if (status === 'error')   return CultureTokens.coral;
  if (status === 'running') return CultureTokens.teal;
  return '#94A3B8';
}

function formatRelative(iso: string | null): string {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

// ── Add/Edit modal ────────────────────────────────────────────────────────────

function SourceModal({ source, onClose, onSaved }: {
  source: IngestSource | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const colors = useColors();
  const editing = source !== null;

  const [name, setName]       = useState(source?.name ?? '');
  const [url, setUrl]         = useState(source?.url ?? '');
  const [city, setCity]       = useState(source?.city ?? 'Sydney');
  const [country, setCountry] = useState(source?.country ?? 'Australia');
  const [enabled, setEnabled] = useState(source?.enabled ?? true);
  const [schedule, setSchedule] = useState<IngestScheduleInterval | null>(source?.scheduleInterval ?? null);

  const createMutation = useMutation({
    mutationFn: () => api.admin.ingestSourceCreate({ name, url, city, country, enabled, scheduleInterval: schedule }),
    onSuccess: () => { if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onSaved(); },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const updateMutation = useMutation({
    mutationFn: () => api.admin.ingestSourceUpdate(source!.id, { name, url, city, country, enabled, scheduleInterval: schedule }),
    onSuccess: () => { if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onSaved(); },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;
  const canSave   = name.trim().length > 0 && url.trim().length > 0;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={[m.overlay, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[m.sheet, { backgroundColor: colors.background }]}>
          <View style={m.handle} />

          <View style={[m.header, { borderBottomColor: colors.borderLight }]}>
            <Text style={[m.title, { color: colors.text }]}>{editing ? 'Edit Source' : 'Add Source'}</Text>
            <Pressable onPress={onClose} style={[m.closeBtn, { backgroundColor: colors.surface }]} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={m.form} showsVerticalScrollIndicator={false}>
            {([
              { label: 'Source Name', value: name, set: setName, placeholder: 'City of Sydney Events' },
              { label: 'URL', value: url, set: setUrl, placeholder: 'https://…', keyboard: 'url' as const },
              { label: 'City', value: city, set: setCity, placeholder: 'Sydney' },
              { label: 'Country', value: country, set: setCountry, placeholder: 'Australia' },
            ] as const).map(f => (
              <View key={f.label} style={m.inputGroup}>
                <Text style={[m.inputLabel, { color: colors.textSecondary }]}>{f.label}</Text>
                <View style={[m.inputRow, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                  <TextInput
                    style={[m.input, { color: colors.text }]}
                    placeholder={f.placeholder}
                    placeholderTextColor={colors.textTertiary}
                    value={f.value}
                    onChangeText={f.set}
                    autoCapitalize="none"
                    keyboardType={'keyboard' in f ? f.keyboard : 'default'}
                    accessibilityLabel={f.label}
                  />
                </View>
              </View>
            ))}

            {/* Schedule */}
            <View style={m.inputGroup}>
              <Text style={[m.inputLabel, { color: colors.textSecondary }]}>Auto-sync Schedule</Text>
              <View style={m.scheduleGrid}>
                {SCHEDULE_OPTIONS.map(opt => (
                  <Pressable
                    key={String(opt.value)}
                    style={[m.scheduleChip, {
                      backgroundColor: schedule === opt.value ? CultureTokens.indigo : colors.surface,
                      borderColor: schedule === opt.value ? CultureTokens.indigo : colors.borderLight,
                    }]}
                    onPress={() => setSchedule(opt.value)}
                    accessibilityRole="button"
                    accessibilityLabel={opt.label}
                  >
                    <Text style={[m.scheduleChipText, { color: schedule === opt.value ? '#fff' : colors.text }]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Enabled toggle */}
            <Pressable
              style={[m.toggleRow, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
              onPress={() => setEnabled(v => !v)}
              accessibilityRole="switch"
              accessibilityLabel="Enable source"
            >
              <View style={{ flex: 1 }}>
                <Text style={[m.toggleLabel, { color: colors.text }]}>Enabled</Text>
                <Text style={[m.toggleSub, { color: colors.textTertiary }]}>Disabled sources are skipped by the scheduler</Text>
              </View>
              <View style={[m.toggle, { backgroundColor: enabled ? CultureTokens.teal : colors.borderLight }]}>
                <View style={[m.toggleThumb, { transform: [{ translateX: enabled ? 18 : 2 }] }]} />
              </View>
            </Pressable>

            <Pressable
              style={[m.saveBtn, { backgroundColor: canSave ? CultureTokens.indigo : colors.backgroundSecondary, opacity: isPending ? 0.7 : 1 }]}
              onPress={() => canSave && (editing ? updateMutation.mutate() : createMutation.mutate())}
              disabled={!canSave || isPending}
              accessibilityRole="button" accessibilityLabel="Save source"
            >
              {isPending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="checkmark" size={18} color={canSave ? '#fff' : colors.textTertiary} />}
              <Text style={[m.saveBtnText, { color: canSave ? '#fff' : colors.textTertiary }]}>
                {isPending ? 'Saving…' : editing ? 'Save Changes' : 'Add Source'}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay:       { flex: 1, justifyContent: 'flex-end' },
  sheet:         { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', paddingBottom: 32 },
  handle:        { width: 40, height: 4, borderRadius: 2, backgroundColor: '#3F3F5A', alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  title:         { fontSize: 17, fontFamily: 'Poppins_700Bold' },
  closeBtn:      { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  form:          { padding: 20, gap: 18, paddingBottom: 40 },
  inputGroup:    { gap: 6 },
  inputLabel:    { fontSize: 11, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.8 },
  inputRow:      { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  input:         { flex: 1, fontSize: 14, fontFamily: 'Poppins_400Regular', padding: 0 },
  scheduleGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  scheduleChip:  { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  scheduleChipText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  toggleRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  toggleLabel:   { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  toggleSub:     { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  toggle:        { width: 42, height: 26, borderRadius: 13, justifyContent: 'center' },
  toggleThumb:   { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  saveBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14, marginTop: 4 },
  saveBtnText:   { fontSize: 15, fontFamily: 'Poppins_700Bold' },
});

// ── Main tab ──────────────────────────────────────────────────────────────────

export function SourcesTab({ onJobCreated }: { onJobCreated?: () => void }) {
  const colors   = useColors();
  const { hPad } = useLayout();
  const [modalSource, setModalSource] = useState<IngestSource | 'new' | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-ingest-sources'],
    queryFn:  () => api.admin.ingestSourcesList(),
    staleTime: 10_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.admin.ingestSourceDelete(id),
    onSuccess: () => {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      queryClient.invalidateQueries({ queryKey: ['admin-ingest-sources'] });
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const runMutation = useMutation({
    mutationFn: (id: string) => api.admin.ingestSourceRun(id),
    onSuccess: (res) => {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Run Complete', `Imported ${res.imported}, updated ${res.updated}, skipped ${res.skipped}.`);
      queryClient.invalidateQueries({ queryKey: ['admin-ingest-sources'] });
      onJobCreated?.();
    },
    onError: (err: Error) => Alert.alert('Run Failed', err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      api.admin.ingestSourceUpdate(id, { enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-ingest-sources'] }),
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const sources = data?.sources ?? [];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { paddingHorizontal: hPad }]}>
      <View style={s.content}>

        <View style={s.topRow}>
          <Text style={[s.sectionLabel, { color: colors.textTertiary }]}>SAVED SOURCES ({sources.length})</Text>
          <Pressable
            style={[s.addBtn, { backgroundColor: CultureTokens.indigo }]}
            onPress={() => setModalSource('new')}
            accessibilityRole="button" accessibilityLabel="Add source"
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={s.addBtnText}>Add Source</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <ActivityIndicator color={CultureTokens.indigo} style={{ marginVertical: 40 }} />
        ) : sources.length === 0 ? (
          <View style={[s.emptyCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Ionicons name="cloud-upload-outline" size={40} color={colors.textTertiary} />
            <Text style={[s.emptyTitle, { color: colors.text }]}>No sources saved yet</Text>
            <Text style={[s.emptyText, { color: colors.textSecondary }]}>
              Add recurring import sources and configure auto-sync schedules.
            </Text>
            <Pressable
              style={[s.addBtn, { backgroundColor: CultureTokens.indigo, marginTop: 8 }]}
              onPress={() => setModalSource('new')}
              accessibilityRole="button"
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={s.addBtnText}>Add First Source</Text>
            </Pressable>
          </View>
        ) : (
          sources.map((src, i) => (
            <Animated.View
              key={src.id}
              entering={FadeInDown.delay(i * 40).springify()}
              style={[s.sourceCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            >
              {/* Status dot */}
              <View style={[s.statusDot, { backgroundColor: statusColor(src.lastStatus) }]} />

              <View style={s.sourceBody}>
                <View style={s.sourceMeta}>
                  <Text style={[s.sourceName, { color: colors.text }]}>{src.name}</Text>
                  <Text style={[s.sourceUrl, { color: colors.textTertiary }]} numberOfLines={1}>{src.url}</Text>
                  <View style={s.sourceStats}>
                    {src.scheduleInterval && (
                      <View style={[s.chip, { backgroundColor: CultureTokens.indigo + '14', borderColor: CultureTokens.indigo + '30' }]}>
                        <Ionicons name="time-outline" size={11} color={CultureTokens.indigo} />
                        <Text style={[s.chipText, { color: CultureTokens.indigo }]}>
                          {SCHEDULE_OPTIONS.find(o => o.value === src.scheduleInterval)?.label ?? src.scheduleInterval}
                        </Text>
                      </View>
                    )}
                    <Text style={[s.lastRun, { color: colors.textTertiary }]}>
                      Last run: {formatRelative(src.lastRunAt)}
                    </Text>
                    {src.totalImported > 0 && (
                      <Text style={[s.lastRun, { color: colors.textTertiary }]}>
                        · {src.totalImported.toLocaleString()} imported total
                      </Text>
                    )}
                  </View>
                </View>

                <View style={s.sourceActions}>
                  {/* Run now */}
                  <Pressable
                    style={[s.actionBtn, { backgroundColor: CultureTokens.teal + '14', borderColor: CultureTokens.teal + '30' }]}
                    onPress={() => runMutation.mutate(src.id)}
                    disabled={runMutation.isPending || !src.enabled}
                    accessibilityRole="button" accessibilityLabel="Run now"
                  >
                    {runMutation.isPending
                      ? <ActivityIndicator size="small" color={CultureTokens.teal} />
                      : <Ionicons name="play" size={14} color={CultureTokens.teal} />}
                  </Pressable>

                  {/* Edit */}
                  <Pressable
                    style={[s.actionBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}
                    onPress={() => setModalSource(src)}
                    accessibilityRole="button" accessibilityLabel="Edit source"
                  >
                    <Ionicons name="pencil-outline" size={14} color={colors.textSecondary} />
                  </Pressable>

                  {/* Toggle enabled */}
                  <Pressable
                    style={[s.togglePill, { backgroundColor: src.enabled ? CultureTokens.teal + '18' : colors.backgroundSecondary }]}
                    onPress={() => toggleMutation.mutate({ id: src.id, enabled: !src.enabled })}
                    accessibilityRole="switch" accessibilityLabel={src.enabled ? 'Disable source' : 'Enable source'}
                  >
                    <Text style={[s.toggleText, { color: src.enabled ? CultureTokens.teal : colors.textTertiary }]}>
                      {src.enabled ? 'ON' : 'OFF'}
                    </Text>
                  </Pressable>

                  {/* Delete */}
                  <Pressable
                    style={[s.actionBtn, { backgroundColor: CultureTokens.coral + '12', borderColor: CultureTokens.coral + '30' }]}
                    onPress={() => Alert.alert('Delete Source', `Remove "${src.name}"? This won't delete imported events.`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(src.id) },
                    ])}
                    accessibilityRole="button" accessibilityLabel="Delete source"
                  >
                    <Ionicons name="trash-outline" size={14} color={CultureTokens.coral} />
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          ))
        )}

      </View>

      {modalSource !== null && (
        <SourceModal
          source={modalSource === 'new' ? null : modalSource}
          onClose={() => setModalSource(null)}
          onSaved={() => {
            setModalSource(null);
            refetch();
            queryClient.invalidateQueries({ queryKey: ['admin-ingest-sources'] });
          }}
        />
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:      { paddingTop: 20, paddingBottom: 80 },
  content:     { gap: 14 },
  topRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLabel:{ fontSize: 11, fontFamily: 'Poppins_700Bold', letterSpacing: 1.4 },
  addBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText:  { fontSize: 13, fontFamily: 'Poppins_700Bold', color: '#fff' },
  emptyCard:   { borderRadius: 20, borderWidth: 1, padding: 36, alignItems: 'center', gap: 10 },
  emptyTitle:  { fontSize: 15, fontFamily: 'Poppins_700Bold' },
  emptyText:   { fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  sourceCard:  { borderRadius: 16, borderWidth: 1, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  statusDot:   { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  sourceBody:  { flex: 1, gap: 10 },
  sourceMeta:  { gap: 3 },
  sourceName:  { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  sourceUrl:   { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  sourceStats: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip:        { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  chipText:    { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  lastRun:     { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  sourceActions:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBtn:   { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  togglePill:  { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  toggleText:  { fontSize: 11, fontFamily: 'Poppins_700Bold' },
});
