import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator , Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import type { AppUpdate, UpdateCategory } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens } from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { goBackOrReplace } from '@/lib/navigation';
import * as Haptics from 'expo-haptics';

const CATEGORY_CONFIG: Record<UpdateCategory, { label: string; color: string; icon: string }> = {
  release:      { label: 'Release',      color: CultureTokens.indigo,  icon: 'rocket-outline' },
  feature:      { label: 'Feature',      color: CultureTokens.teal,    icon: 'sparkles-outline' },
  fix:          { label: 'Fix',          color: CultureTokens.coral,   icon: 'construct-outline' },
  announcement: { label: 'Announcement', color: CultureTokens.gold, icon: 'megaphone-outline' },
};

function formatDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function UpdateCard({ update }: { update: AppUpdate }) {
  const colors = useColors();
  const cat = CATEGORY_CONFIG[update.category] ?? CATEGORY_CONFIG.announcement;
  const preview = update.body.length > 140 ? update.body.slice(0, 140) + '…' : update.body;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.borderLight, opacity: pressed ? 0.88 : 1 },
      ]}
      onPress={() => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: '/updates/[id]', params: { id: update.id } });
      }}
      accessibilityRole="button"
      accessibilityLabel={update.title}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.catBadge, { backgroundColor: cat.color + '18' }]}>
          <Ionicons name={cat.icon as keyof typeof Ionicons.glyphMap} size={12} color={cat.color} />
          <Text style={[styles.catText, { color: cat.color }]}>{cat.label}</Text>
        </View>
        {update.version && (
          <View style={[styles.versionPill, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.versionText, { color: colors.textSecondary }]}>v{update.version}</Text>
          </View>
        )}
        <Text style={[styles.dateText, { color: colors.textTertiary }]}>
          {formatDate(update.publishedAt)}
        </Text>
      </View>
      <Text style={[styles.cardTitle, { color: colors.text }]}>{update.title}</Text>
      <Text style={[styles.cardBody, { color: colors.textSecondary }]}>{preview}</Text>
      <View style={styles.readMore}>
        <Text style={[styles.readMoreText, { color: cat.color }]}>Read more</Text>
        <Ionicons name="chevron-forward" size={13} color={cat.color} />
      </View>
    </Pressable>
  );
}

function UpdatesContent() {
  const colors = useColors();
  const { hPad } = useLayout();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;

  const { data, isLoading } = useQuery({
    queryKey: ['updates'],
    queryFn: () => api.updates.list({ limit: 50 }),
    staleTime: 60_000,
  });

  const updates = data?.updates ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 12, paddingHorizontal: hPad, borderBottomColor: colors.borderLight }]}>
        <Pressable
          style={styles.backBtn}
          onPress={() => goBackOrReplace('/(tabs)')}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>What&apos;s New</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Release notes &amp; announcements</Text>
        </View>
        <Ionicons name="newspaper-outline" size={22} color={CultureTokens.indigo} />
      </View>

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={CultureTokens.indigo} />
        </View>
      ) : updates.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="newspaper-outline" size={48} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No updates yet</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.list, { paddingHorizontal: hPad, paddingBottom: insets.bottom + 40 }]}
        >
          {updates.map(u => <UpdateCard key={u.id} update={u} />)}
        </ScrollView>
      )}
    </View>
  );
}

export default function UpdatesScreen() {
  return (
    <ErrorBoundary>
      <UpdatesContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn:      { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19 },
  headerTitle:  { fontSize: 20, fontFamily: 'Poppins_700Bold' },
  headerSub:    { fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText:    { fontSize: 15, fontFamily: 'Poppins_500Medium' },
  list:         { paddingTop: 20, gap: 14 },

  card:         { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  catBadge:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  catText:      { fontSize: 11, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  versionPill:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  versionText:  { fontSize: 11, fontFamily: 'Poppins_500Medium' },
  dateText:     { fontSize: 11, fontFamily: 'Poppins_400Regular', marginLeft: 'auto' },
  cardTitle:    { fontSize: 16, fontFamily: 'Poppins_700Bold', lineHeight: 22 },
  cardBody:     { fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 20 },
  readMore:     { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  readMoreText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
});
