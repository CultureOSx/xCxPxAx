import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  Platform, ActivityIndicator, Alert, Modal,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api, type IngestionJob } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens } from '@/constants/theme';
import { queryClient } from '@/lib/query-client';
import * as Haptics from 'expo-haptics';

function jobStatusColor(status: IngestionJob['status']): string {
  if (status === 'success') return '#22C55E';
  if (status === 'error')   return CultureTokens.coral;
  if (status === 'running') return CultureTokens.teal;
  return '#94A3B8';
}

function jobStatusIcon(status: IngestionJob['status']): keyof typeof Ionicons.glyphMap {
  if (status === 'success') return 'checkmark-circle';
  if (status === 'error')   return 'close-circle';
  if (status === 'running') return 'sync';
  return 'time-outline';
}

function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function formatDuration(start: string, end: string | null): string {
  if (!end) return '—';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ── Job detail modal ──────────────────────────────────────────────────────────

function JobDetailModal({ job, onClose, onRetry }: {
  job: IngestionJob; onClose: () => void; onRetry: (id: string) => void;
}) {
  const colors = useColors();
  const statusColor = jobStatusColor(job.status);
  const canRetry = job.status === 'error' && job.retryCount < 3;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={[d.overlay, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[d.sheet, { backgroundColor: colors.background }]}>
          <View style={d.handle} />

          <View style={[d.header, { borderBottomColor: colors.borderLight }]}>
            <View style={[d.statusBadge, { backgroundColor: statusColor + '18', borderColor: statusColor + '40' }]}>
              <Ionicons name={jobStatusIcon(job.status)} size={14} color={statusColor} />
              <Text style={[d.statusText, { color: statusColor }]}>{job.status.toUpperCase()}</Text>
            </View>
            <Pressable onPress={onClose} style={[d.closeBtn, { backgroundColor: colors.surface }]} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={d.body} showsVerticalScrollIndicator={false}>
            <Text style={[d.urlText, { color: colors.text }]} numberOfLines={3}>{job.sourceUrl}</Text>

            <View style={d.statsGrid}>
              {[
                { label: 'Imported',  value: String(job.imported) },
                { label: 'Updated',   value: String(job.updated) },
                { label: 'Skipped',   value: String(job.skipped) },
                { label: 'Errors',    value: String(job.errors) },
                { label: 'Duration',  value: formatDuration(job.startedAt, job.completedAt) },
                { label: 'Triggered', value: job.triggeredBy },
              ].map(stat => (
                <View key={stat.label} style={[d.statBox, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                  <Text style={[d.statValue, { color: colors.text }]}>{stat.value}</Text>
                  <Text style={[d.statLabel, { color: colors.textTertiary }]}>{stat.label}</Text>
                </View>
              ))}
            </View>

            {job.errorMessages.length > 0 && (
              <View style={[d.errorBox, { backgroundColor: CultureTokens.coral + '0C', borderColor: CultureTokens.coral + '25' }]}>
                <Text style={[d.errorTitle, { color: CultureTokens.coral }]}>Error Details</Text>
                {job.errorMessages.map((msg, i) => (
                  <Text key={i} style={[d.errorLine, { color: colors.textSecondary }]}>{msg}</Text>
                ))}
              </View>
            )}

            <View style={[d.metaBox, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              {[
                { label: 'Job ID', value: job.id },
                { label: 'Started', value: new Date(job.startedAt).toLocaleString() },
                { label: 'Completed', value: job.completedAt ? new Date(job.completedAt).toLocaleString() : '—' },
                ...(job.retryCount > 0 ? [{ label: 'Retry #', value: String(job.retryCount) }] : []),
                ...(job.parentJobId ? [{ label: 'Retry of', value: job.parentJobId }] : []),
              ].map(row => (
                <View key={row.label} style={d.metaRow}>
                  <Text style={[d.metaLabel, { color: colors.textTertiary }]}>{row.label}</Text>
                  <Text style={[d.metaValue, { color: colors.text }]} numberOfLines={1}>{row.value}</Text>
                </View>
              ))}
            </View>

            {canRetry && (
              <Pressable
                style={[d.retryBtn, { backgroundColor: CultureTokens.indigo }]}
                onPress={() => { onRetry(job.id); onClose(); }}
                accessibilityRole="button" accessibilityLabel="Retry job"
              >
                <Ionicons name="refresh" size={16} color="#fff" />
                <Text style={d.retryBtnText}>Retry Job ({3 - job.retryCount} retries left)</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const d = StyleSheet.create({
  overlay:     { flex: 1, justifyContent: 'flex-end' },
  sheet:       { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '88%', paddingBottom: 32 },
  handle:      { width: 40, height: 4, borderRadius: 2, backgroundColor: '#3F3F5A', alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  statusText:  { fontSize: 12, fontFamily: 'Poppins_700Bold', letterSpacing: 0.5 },
  closeBtn:    { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  body:        { padding: 20, gap: 16, paddingBottom: 40 },
  urlText:     { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  statsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statBox:     { flex: 1, minWidth: '28%', borderRadius: 12, borderWidth: 1, padding: 12, alignItems: 'center', gap: 2 },
  statValue:   { fontSize: 18, fontFamily: 'Poppins_700Bold' },
  statLabel:   { fontSize: 10, fontFamily: 'Poppins_400Regular', textTransform: 'uppercase', letterSpacing: 0.8 },
  errorBox:    { borderRadius: 12, borderWidth: 1, padding: 14, gap: 6 },
  errorTitle:  { fontSize: 13, fontFamily: 'Poppins_700Bold' },
  errorLine:   { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  metaBox:     { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  metaRow:     { flexDirection: 'row', justifyContent: 'space-between', padding: 12, gap: 12 },
  metaLabel:   { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  metaValue:   { fontSize: 12, fontFamily: 'Poppins_400Regular', flex: 1, textAlign: 'right' },
  retryBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14 },
  retryBtnText:{ fontSize: 14, fontFamily: 'Poppins_700Bold', color: '#fff' },
});

// ── Main tab ──────────────────────────────────────────────────────────────────

const STATUS_FILTERS = ['all', 'success', 'error', 'running'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

export function JobsTab() {
  const colors   = useColors();
  const { hPad } = useLayout();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedJob, setSelectedJob]   = useState<IngestionJob | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-ingest-jobs', statusFilter],
    queryFn:  () => api.admin.ingestJobsList({ limit: 30, status: statusFilter === 'all' ? undefined : statusFilter }),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  const retryMutation = useMutation({
    mutationFn: (id: string) => api.admin.ingestJobRetry(id),
    onSuccess: () => {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Retry Started', 'A new job has been queued.');
      queryClient.invalidateQueries({ queryKey: ['admin-ingest-jobs'] });
    },
    onError: (err: Error) => Alert.alert('Retry Failed', err.message),
  });

  const jobs = data?.jobs ?? [];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { paddingHorizontal: hPad }]}>
      <View style={s.content}>

        {/* Filter chips */}
        <View style={s.filters}>
          {STATUS_FILTERS.map(f => (
            <Pressable
              key={f}
              style={[s.filterChip, { backgroundColor: statusFilter === f ? CultureTokens.indigo : colors.surface, borderColor: statusFilter === f ? CultureTokens.indigo : colors.borderLight }]}
              onPress={() => setStatusFilter(f)}
              accessibilityRole="button" accessibilityLabel={`Filter by ${f}`}
            >
              <Text style={[s.filterText, { color: statusFilter === f ? '#fff' : colors.textSecondary }]}>
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </Pressable>
          ))}
          <Pressable onPress={() => refetch()} style={[s.refreshBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]} accessibilityRole="button" accessibilityLabel="Refresh">
            <Ionicons name="refresh" size={14} color={colors.textSecondary} />
          </Pressable>
        </View>

        {isLoading ? (
          <ActivityIndicator color={CultureTokens.indigo} style={{ marginVertical: 40 }} />
        ) : jobs.length === 0 ? (
          <View style={[s.emptyCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Ionicons name="document-text-outline" size={40} color={colors.textTertiary} />
            <Text style={[s.emptyTitle, { color: colors.text }]}>No jobs yet</Text>
            <Text style={[s.emptyText, { color: colors.textSecondary }]}>
              Run an import or trigger a source to see job history here.
            </Text>
          </View>
        ) : (
          jobs.map((job, i) => {
            const statusColor = jobStatusColor(job.status);
            const canRetry = job.status === 'error' && job.retryCount < 3;

            return (
              <Animated.View
                key={job.id}
                entering={FadeInDown.delay(i * 30).springify()}
              >
                <Pressable
                  style={[s.jobCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                  onPress={() => setSelectedJob(job)}
                  accessibilityRole="button" accessibilityLabel="View job details"
                >
                  <View style={[s.jobStatusBar, { backgroundColor: statusColor }]} />
                  <View style={s.jobBody}>
                    <View style={s.jobTop}>
                      <View style={[s.statusBadge, { backgroundColor: statusColor + '14', borderColor: statusColor + '30' }]}>
                        <Ionicons name={jobStatusIcon(job.status)} size={12} color={statusColor} />
                        <Text style={[s.statusText, { color: statusColor }]}>{job.status}</Text>
                      </View>
                      <Text style={[s.jobTime, { color: colors.textTertiary }]}>{formatRelative(job.startedAt)}</Text>
                      <View style={[s.triggerBadge, { backgroundColor: job.triggeredBy === 'scheduler' ? CultureTokens.indigo + '14' : colors.backgroundSecondary }]}>
                        <Ionicons
                          name={job.triggeredBy === 'scheduler' ? 'time-outline' : 'person-outline'}
                          size={11}
                          color={job.triggeredBy === 'scheduler' ? CultureTokens.indigo : colors.textTertiary}
                        />
                      </View>
                    </View>

                    <Text style={[s.jobUrl, { color: colors.text }]} numberOfLines={1}>{job.sourceUrl}</Text>

                    <View style={s.jobStats}>
                      {[
                        { label: 'imported', value: job.imported, color: '#22C55E' },
                        { label: 'updated',  value: job.updated,  color: CultureTokens.teal },
                        { label: 'errors',   value: job.errors,   color: job.errors > 0 ? CultureTokens.coral : colors.textTertiary },
                      ].map(stat => (
                        <Text key={stat.label} style={[s.jobStat, { color: stat.color }]}>
                          {stat.value} {stat.label}
                        </Text>
                      ))}
                      <Text style={[s.jobStat, { color: colors.textTertiary }]}>
                        {formatDuration(job.startedAt, job.completedAt)}
                      </Text>
                    </View>
                  </View>

                  <View style={s.jobRight}>
                    {canRetry && (
                      <Pressable
                        style={[s.retryBtn, { backgroundColor: CultureTokens.indigo + '14', borderColor: CultureTokens.indigo + '30' }]}
                        onPress={(e) => { e.stopPropagation?.(); retryMutation.mutate(job.id); }}
                        accessibilityLabel="Retry job"
                      >
                        {retryMutation.isPending
                          ? <ActivityIndicator size="small" color={CultureTokens.indigo} />
                          : <Ionicons name="refresh" size={14} color={CultureTokens.indigo} />}
                      </Pressable>
                    )}
                    <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                  </View>
                </Pressable>
              </Animated.View>
            );
          })
        )}

      </View>

      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onRetry={(id) => { retryMutation.mutate(id); queryClient.invalidateQueries({ queryKey: ['admin-ingest-jobs'] }); }}
        />
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:       { paddingTop: 20, paddingBottom: 80 },
  content:      { gap: 12 },
  filters:      { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filterChip:   { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  filterText:   { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  refreshBtn:   { borderRadius: 8, borderWidth: 1, width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  emptyCard:    { borderRadius: 20, borderWidth: 1, padding: 36, alignItems: 'center', gap: 10 },
  emptyTitle:   { fontSize: 15, fontFamily: 'Poppins_700Bold' },
  emptyText:    { fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  jobCard:      { borderRadius: 14, borderWidth: 1, flexDirection: 'row', overflow: 'hidden' },
  jobStatusBar: { width: 4 },
  jobBody:      { flex: 1, padding: 12, gap: 6 },
  jobTop:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 6, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 3 },
  statusText:   { fontSize: 10, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase' },
  jobTime:      { fontSize: 11, fontFamily: 'Poppins_400Regular', flex: 1 },
  triggerBadge: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  jobUrl:       { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  jobStats:     { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  jobStat:      { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  jobRight:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 12 },
  retryBtn:     { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});

export default JobsTab;
