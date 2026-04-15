/**
 * Admin — Culture Today calendar (365 entries, Firestore-backed).
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { CultureTokens, FontFamily, FontSize } from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { CultureTodayEntry, CultureTodayScopeType } from '@/shared/schema';

const SCOPES: CultureTodayScopeType[] = ['global', 'country', 'state', 'culture'];

export default function AdminCultureTodayScreen() {
  const colors = useColors();
  const { hPad, isDesktop } = useLayout();
  const insets = useSafeAreaInsets();
  const { isAdmin, isLoading: roleLoading } = useRole();
  const qc = useQueryClient();

  const [month, setMonth] = useState('4');
  const [day, setDay] = useState('13');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [body, setBody] = useState('');
  const [learnMoreUrl, setLearnMoreUrl] = useState('');
  const [scopeType, setScopeType] = useState<CultureTodayScopeType>('global');
  const [countryName, setCountryName] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [cultureLabel, setCultureLabel] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [published, setPublished] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-culture-today-entries'],
    queryFn: () => api.cultureToday.admin.listEntries(),
    enabled: isAdmin,
  });

  const clearForm = useCallback(() => {
    setEditingId(null);
    setTitle('');
    setSubtitle('');
    setBody('');
    setLearnMoreUrl('');
    setCountryName('');
    setStateRegion('');
    setCultureLabel('');
    setSortOrder('0');
    setPublished(true);
    setScopeType('global');
    setMonth('4');
    setDay('13');
  }, []);

  const loadEntryIntoForm = useCallback((e: CultureTodayEntry) => {
    setEditingId(e.id);
    setMonth(String(e.month));
    setDay(String(e.day));
    setTitle(e.title);
    setSubtitle(e.subtitle ?? '');
    setBody(e.body ?? '');
    setLearnMoreUrl(e.learnMoreUrl ?? '');
    setScopeType(e.scopeType);
    setCountryName(e.countryName ?? '');
    setStateRegion(e.stateRegion ?? '');
    setCultureLabel(e.cultureLabel ?? '');
    setSortOrder(String(e.sortOrder));
    setPublished(e.published);
  }, []);

  const seedMut = useMutation({
    mutationFn: () => api.cultureToday.admin.seed(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-culture-today-entries'] });
      Alert.alert('Seeded', 'Starter rows were written (idempotent per seed id).');
    },
    onError: (e: Error) => Alert.alert('Seed failed', e.message),
  });

  const updateMut = useMutation({
    mutationFn: () =>
      api.cultureToday.admin.updateEntry(editingId!, {
        month: parseInt(month, 10),
        day: parseInt(day, 10),
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        body: body.trim() || undefined,
        learnMoreUrl: learnMoreUrl.trim() || undefined,
        scopeType,
        countryName: countryName.trim() || undefined,
        stateRegion: stateRegion.trim() || undefined,
        cultureLabel: cultureLabel.trim() || undefined,
        sortOrder: parseInt(sortOrder, 10) || 0,
        published,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-culture-today-entries'] });
      setEditingId(null);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Updated', 'Calendar entry saved.');
    },
    onError: (e: Error) => Alert.alert('Update failed', e.message),
  });

  const createMut = useMutation({
    mutationFn: () =>
      api.cultureToday.admin.createEntry({
        month: parseInt(month, 10),
        day: parseInt(day, 10),
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        body: body.trim() || undefined,
        learnMoreUrl: learnMoreUrl.trim() || undefined,
        scopeType,
        countryName: countryName.trim() || undefined,
        stateRegion: stateRegion.trim() || undefined,
        cultureLabel: cultureLabel.trim() || undefined,
        sortOrder: parseInt(sortOrder, 10) || 0,
        published,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-culture-today-entries'] });
      clearForm();
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Calendar entry created.');
    },
    onError: (e: Error) => Alert.alert('Save failed', e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.cultureToday.admin.deleteEntry(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-culture-today-entries'] }),
    onError: (e: Error) => Alert.alert('Delete failed', e.message),
  });

  const onDelete = useCallback(
    (id: string) => {
      Alert.alert('Delete entry?', id, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMut.mutate(id) },
      ]);
    },
    [deleteMut],
  );

  if (roleLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={CultureTokens.indigo} />
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <ErrorBoundary>
        <Stack.Screen options={{ title: 'Culture Today' }} />
        <View style={[styles.center, { backgroundColor: colors.background, padding: hPad }]}>
          <Text style={{ color: colors.text }}>Admin access required.</Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: CultureTokens.indigo }}>Go back</Text>
          </Pressable>
        </View>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Stack.Screen options={{ title: 'Culture Today calendar' }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{
          padding: hPad,
          paddingBottom: insets.bottom + 32,
          maxWidth: isDesktop ? 720 : undefined,
          alignSelf: 'center',
          width: '100%',
        }}
      >
        <Text style={[styles.h1, { color: colors.text }]}>Culture Today</Text>
        <Text style={[styles.p, { color: colors.textSecondary }]}>
          Curate observances by calendar day (MM-DD). Public app reads published rows only.
        </Text>

        <Pressable
          style={[styles.seedBtn, { borderColor: CultureTokens.teal }]}
          onPress={() => seedMut.mutate()}
          disabled={seedMut.isPending}
        >
          {seedMut.isPending ? (
            <ActivityIndicator color={CultureTokens.teal} />
          ) : (
            <>
              <Ionicons name="leaf-outline" size={18} color={CultureTokens.teal} />
              <Text style={[styles.seedText, { color: CultureTokens.teal }]}>Seed starter rows</Text>
            </>
          )}
        </Pressable>

        {editingId ? (
          <View style={[styles.editBanner, { backgroundColor: `${CultureTokens.indigo}12` }]}>
            <Text style={{ color: CultureTokens.indigo, fontFamily: FontFamily.medium, flex: 1 }} numberOfLines={2}>
              Editing {editingId}
            </Text>
            <Pressable onPress={clearForm} accessibilityRole="button" accessibilityLabel="Cancel edit">
              <Text style={{ color: CultureTokens.indigo, fontFamily: FontFamily.semibold, textDecorationLine: 'underline' }}>
                Cancel
              </Text>
            </Pressable>
          </View>
        ) : null}

        <Text style={[styles.h2, { color: colors.text }]}>{editingId ? 'Edit entry' : 'New entry'}</Text>
        <View style={styles.row2}>
          <Field label="Month (1–12)" value={month} onChangeText={setMonth} colors={colors} />
          <Field label="Day (1–31)" value={day} onChangeText={setDay} colors={colors} />
        </View>
        <Field label="Title" value={title} onChangeText={setTitle} colors={colors} />
        <Field label="Subtitle" value={subtitle} onChangeText={setSubtitle} colors={colors} />
        <Field label="Body" value={body} onChangeText={setBody} colors={colors} multiline />
        <Field label="Learn more URL" value={learnMoreUrl} onChangeText={setLearnMoreUrl} colors={colors} />
        <Text style={[styles.label, { color: colors.textSecondary }]}>Scope</Text>
        <View style={styles.scopeRow}>
          {SCOPES.map((s) => (
            <Pressable
              key={s}
              onPress={() => setScopeType(s)}
              style={[
                styles.scopeChip,
                {
                  borderColor: scopeType === s ? CultureTokens.indigo : colors.borderLight,
                  backgroundColor: scopeType === s ? `${CultureTokens.indigo}14` : colors.surfaceElevated,
                },
              ]}
            >
              <Text style={{ color: scopeType === s ? CultureTokens.indigo : colors.text, fontFamily: FontFamily.medium }}>
                {s}
              </Text>
            </Pressable>
          ))}
        </View>
        <Field label="Country name" value={countryName} onChangeText={setCountryName} colors={colors} />
        <Field label="State / region" value={stateRegion} onChangeText={setStateRegion} colors={colors} />
        <Field label="Culture label" value={cultureLabel} onChangeText={setCultureLabel} colors={colors} />
        <Field label="Sort order" value={sortOrder} onChangeText={setSortOrder} colors={colors} />
        <Pressable
          onPress={() => setPublished(!published)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 10 }}
        >
          <Ionicons name={published ? 'checkbox' : 'square-outline'} size={22} color={CultureTokens.indigo} />
          <Text style={{ color: colors.text }}>Published</Text>
        </Pressable>

        <Pressable
          style={[styles.saveBtn, { backgroundColor: CultureTokens.indigo }]}
          onPress={() => {
            if (!title.trim()) {
              Alert.alert('Title required');
              return;
            }
            if (editingId) updateMut.mutate();
            else createMut.mutate();
          }}
          disabled={createMut.isPending || updateMut.isPending}
        >
          {createMut.isPending || updateMut.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>{editingId ? 'Save changes' : 'Create entry'}</Text>
          )}
        </Pressable>

        <Text style={[styles.h2, { color: colors.text, marginTop: 28 }]}>All entries ({data?.entries?.length ?? 0})</Text>
        <Pressable onPress={() => void refetch()} style={{ marginBottom: 12 }}>
          <Text style={{ color: CultureTokens.indigo }}>Refresh</Text>
        </Pressable>
        {isLoading ? <ActivityIndicator color={CultureTokens.indigo} /> : null}
        {(data?.entries ?? []).map((e) => (
          <View key={e.id} style={[styles.rowCard, { borderColor: colors.borderLight, backgroundColor: colors.surfaceElevated }]}>
            <Pressable
              style={{ flex: 1 }}
              onPress={() => loadEntryIntoForm(e)}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${e.title}`}
            >
              <Text style={[styles.cardTitle, { color: colors.text }]}>{e.title}</Text>
              <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
                {e.dayKey} · {e.scopeType} {e.published ? '' : '(draft)'} · tap to edit
              </Text>
            </Pressable>
            <Pressable onPress={() => onDelete(e.id)} accessibilityLabel={`Delete ${e.title}`}>
              <Ionicons name="trash-outline" size={20} color={CultureTokens.coral} />
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </ErrorBoundary>
  );
}

function Field({
  label,
  value,
  onChangeText,
  colors,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  colors: ReturnType<typeof useColors>;
  multiline?: boolean;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.textTertiary}
        style={[
          styles.input,
          {
            borderColor: colors.border,
            color: colors.text,
            backgroundColor: colors.surfaceElevated,
            minHeight: multiline ? 100 : 44,
          },
        ]}
        multiline={multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  h1: { fontFamily: FontFamily.bold, fontSize: 22, marginBottom: 6 },
  h2: { fontFamily: FontFamily.bold, fontSize: 17, marginBottom: 8 },
  p: { fontFamily: FontFamily.regular, fontSize: FontSize.callout, marginBottom: 16 },
  seedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  seedText: { fontFamily: FontFamily.semibold, fontSize: FontSize.body },
  row2: { flexDirection: 'row', gap: 12 },
  label: { fontFamily: FontFamily.medium, fontSize: FontSize.caption, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
  },
  scopeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  scopeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  saveBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontFamily: FontFamily.bold, fontSize: FontSize.body },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  cardTitle: { fontFamily: FontFamily.semibold, fontSize: FontSize.body },
  cardMeta: { fontFamily: FontFamily.regular, fontSize: FontSize.caption, marginTop: 2 },
  editBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
});
