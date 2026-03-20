import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  TextInput, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { api } from '@/lib/api';
import type { AppUpdate, UpdateCategory } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { CultureTokens } from '@/constants/theme';
import { queryClient } from '@/lib/query-client';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const isWeb = Platform.OS === 'web';

const CATEGORIES: UpdateCategory[] = ['release', 'feature', 'fix', 'announcement'];
const CATEGORY_LABELS: Record<UpdateCategory, string> = {
  release: 'Release', feature: 'Feature', fix: 'Fix', announcement: 'Announcement',
};
const CATEGORY_COLORS: Record<UpdateCategory, string> = {
  release: CultureTokens.indigo, feature: CultureTokens.teal,
  fix: CultureTokens.coral, announcement: CultureTokens.saffron,
};

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function PostRow({ update, onPublish, onDelete }: {
  update: AppUpdate;
  onPublish: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  const catColor = CATEGORY_COLORS[update.category] ?? CultureTokens.indigo;
  const isDraft = update.status === 'draft';

  return (
    <View style={[styles.postRow, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <View style={styles.postRowLeft}>
        <View style={[styles.catDot, { backgroundColor: catColor }]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.postTitle, { color: colors.text }]} numberOfLines={1}>{update.title}</Text>
          <Text style={[styles.postMeta, { color: colors.textTertiary }]}>
            {CATEGORY_LABELS[update.category]}
            {update.version ? `  ·  v${update.version}` : ''}
            {'  ·  '}{isDraft ? 'Draft' : formatDate(update.publishedAt)}
          </Text>
        </View>
      </View>
      <View style={styles.postRowActions}>
        {isDraft && (
          <Pressable
            style={[styles.rowBtn, { backgroundColor: CultureTokens.teal + '18' }]}
            onPress={onPublish}
            accessibilityRole="button"
            accessibilityLabel="Publish"
          >
            <Ionicons name="send-outline" size={14} color={CultureTokens.teal} />
          </Pressable>
        )}
        <Pressable
          style={[styles.rowBtn, { backgroundColor: CultureTokens.coral + '18' }]}
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel="Delete"
        >
          <Ionicons name="trash-outline" size={14} color={CultureTokens.coral} />
        </Pressable>
      </View>
    </View>
  );
}

function UpdatesAdminContent() {
  const colors = useColors();
  const { hPad } = useLayout();
  const insets = useSafeAreaInsets();
  const topInset = isWeb ? 0 : insets.top;
  const { isAdmin } = useRole();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [body, setBody] = useState('');
  const [version, setVersion] = useState('');
  const [category, setCategory] = useState<UpdateCategory>('release');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-updates'],
    queryFn: () => api.admin.listUpdates({ limit: 50 }),
    enabled: isAdmin,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: () => api.updates.create({ title, slug, body, version: version || undefined, category, status: 'draft' }),
    onSuccess: () => {
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTitle(''); setSlug(''); setSlugManual(false); setBody(''); setVersion('');
      queryClient.invalidateQueries({ queryKey: ['admin-updates'] });
      refetch();
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => api.updates.publish(id),
    onSuccess: () => {
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['admin-updates', 'updates'] });
      refetch();
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.updates.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-updates', 'updates'] });
      refetch();
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const handleTitleChange = useCallback((text: string) => {
    setTitle(text);
    if (!slugManual) setSlug(slugify(text));
  }, [slugManual]);

  const handleSubmit = () => {
    if (!title.trim()) return Alert.alert('Required', 'Title is required');
    if (!slug.trim()) return Alert.alert('Required', 'Slug is required');
    if (!body.trim()) return Alert.alert('Required', 'Body is required');
    createMutation.mutate();
  };

  const confirmPublish = (id: string, postTitle: string) => {
    Alert.alert('Publish Post', `Publish "${postTitle}"? It will be visible to all users.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Publish', onPress: () => publishMutation.mutate(id) },
    ]);
  };

  const confirmDelete = (id: string, postTitle: string) => {
    Alert.alert('Delete Post', `Delete "${postTitle}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  if (!isAdmin) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name="lock-closed" size={44} color={colors.textTertiary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Admin Access Required</Text>
      </View>
    );
  }

  const posts = data?.updates ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 12, paddingHorizontal: hPad, borderBottomColor: colors.borderLight }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Release Notes</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Publish changelog &amp; announcements</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingHorizontal: hPad, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Create form ── */}
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>NEW POST</Text>
        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>

          {/* Category selector */}
          <View style={styles.catRow}>
            {CATEGORIES.map(c => (
              <Pressable
                key={c}
                style={[styles.catChip, { borderColor: CATEGORY_COLORS[c] + '50',
                  backgroundColor: category === c ? CATEGORY_COLORS[c] + '20' : colors.backgroundSecondary }]}
                onPress={() => setCategory(c)}
              >
                <Text style={[styles.catChipText, { color: category === c ? CATEGORY_COLORS[c] : colors.textSecondary }]}>
                  {CATEGORY_LABELS[c]}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Title */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Title *</Text>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}
            value={title}
            onChangeText={handleTitleChange}
            placeholder="e.g. v1.2.0 — Event Wallet & Ticket Printing"
            placeholderTextColor={colors.textTertiary}
          />

          {/* Slug */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Slug *</Text>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}
            value={slug}
            onChangeText={text => { setSlug(slugify(text)); setSlugManual(true); }}
            placeholder="auto-generated from title"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
          />

          {/* Version */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Version (optional)</Text>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}
            value={version}
            onChangeText={setVersion}
            placeholder="e.g. 1.2.0"
            placeholderTextColor={colors.textTertiary}
          />

          {/* Body */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Body *</Text>
          <TextInput
            style={[styles.textarea, { color: colors.text, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}
            value={body}
            onChangeText={setBody}
            placeholder="What changed? What's new? Keep it clear and user-friendly."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          <Pressable
            style={[styles.submitBtn, { backgroundColor: CultureTokens.indigo }, createMutation.isPending && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="save-outline" size={16} color="#FFF" />
                <Text style={styles.submitText}>Save as Draft</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* ── Existing posts ── */}
        <Text style={[styles.sectionLabel, { color: colors.textTertiary, marginTop: 24 }]}>EXISTING POSTS</Text>
        {isLoading ? (
          <ActivityIndicator color={CultureTokens.indigo} style={{ marginVertical: 24 }} />
        ) : posts.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No posts yet</Text>
        ) : (
          posts.map(p => (
            <PostRow
              key={p.id}
              update={p}
              onPublish={() => confirmPublish(p.id, p.title)}
              onDelete={() => confirmDelete(p.id, p.title)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

export default function AdminUpdatesScreen() {
  return (
    <ErrorBoundary>
      <UpdatesAdminContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  header:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn:        { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19 },
  headerTitle:    { fontSize: 20, fontFamily: 'Poppins_700Bold' },
  headerSub:      { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 1 },

  content:        { paddingTop: 20, gap: 0 },
  sectionLabel:   { fontSize: 11, fontFamily: 'Poppins_600SemiBold', letterSpacing: 1.2, marginBottom: 10 },
  formCard:       { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10, marginBottom: 8 },
  catRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  catChip:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  catChipText:    { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  fieldLabel:     { fontSize: 12, fontFamily: 'Poppins_500Medium', marginBottom: 4 },
  input:          { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: 'Poppins_400Regular' },
  textarea:       { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: 'Poppins_400Regular', minHeight: 120 },
  submitBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 13, marginTop: 4 },
  submitText:     { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: '#FFF' },

  postRow:        { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8, gap: 10 },
  postRowLeft:    { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  catDot:         { width: 10, height: 10, borderRadius: 5 },
  postTitle:      { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  postMeta:       { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  postRowActions: { flexDirection: 'row', gap: 8 },
  rowBtn:         { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  emptyTitle:     { fontSize: 18, fontFamily: 'Poppins_700Bold', marginTop: 4 },
  emptyText:      { fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center', marginVertical: 16 },
});
