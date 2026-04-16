/**
 * Culture Today — 365-day calendar of observances (countries, states, cultures).
 */
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Stack, Link, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useTabScrollBottomPadding } from '@/hooks/useTabScrollBottomPadding';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { api } from '@/lib/api';
import { CultureTokens, FontFamily, FontSize, LineHeight } from '@/constants/theme';
import type { CultureTodayEntry } from '@/shared/schema';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function groupByDay(entries: CultureTodayEntry[]): Map<string, CultureTodayEntry[]> {
  const m = new Map<string, CultureTodayEntry[]>();
  for (const e of entries) {
    const k = e.dayKey || `${String(e.month).padStart(2, '0')}-${String(e.day).padStart(2, '0')}`;
    const arr = m.get(k) ?? [];
    arr.push(e);
    m.set(k, arr);
  }
  for (const arr of m.values()) {
    arr.sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
  }
  return m;
}

export default function CultureTodayCalendarScreen() {
  const colors = useColors();
  const { hPad, isDesktop, contentWidth } = useLayout();
  const bottomPad = useTabScrollBottomPadding(24);
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['culture-today-month', month],
    queryFn: () => api.cultureToday.month(month),
  });

  const byDay = useMemo(() => groupByDay(data?.entries ?? []), [data?.entries]);
  const dayKeys = useMemo(() => [...byDay.keys()].sort(), [byDay]);

  return (
    <ErrorBoundary>
      <Stack.Screen options={{ title: 'Culture Today', headerShown: false }} />
      <ScrollView
        style={[styles.root, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: hPad, paddingBottom: bottomPad },
          isDesktop ? { maxWidth: contentWidth, alignSelf: 'center', width: '100%' } : null,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.miniHeader, { borderBottomColor: colors.borderLight }]}>
          <Text style={[styles.seriesLine, { color: colors.textSecondary }]}>Reimagine</Text>
          <Text style={[styles.miniKicker, { color: CultureTokens.indigo }]}>Culture Today · 365 calendar</Text>
          <Text style={[styles.miniTitle, { color: colors.text }]}>Every day, a reason to celebrate</Text>
          <Text style={[styles.miniSub, { color: colors.textSecondary }]}>
            Countries, states, and cultures — open a date for the full story, sources, and tagged events.
          </Text>
          <Link href="/(tabs)/index" asChild>
            <Pressable
              style={({ pressed }) => [styles.backLink, pressed && { opacity: 0.7 }]}
              accessibilityRole="link"
              accessibilityLabel="Back to Discover"
            >
              <Ionicons name="chevron-back" size={16} color={CultureTokens.indigo} />
              <Text style={[styles.backLinkText, { color: CultureTokens.indigo }]}>Back to app</Text>
            </Pressable>
          </Link>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Month</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthRow}>
          {MONTHS.map((label, i) => {
            const m = i + 1;
            const active = m === month;
            return (
              <Pressable
                key={label}
                onPress={() => setMonth(m)}
                style={[
                  styles.monthChip,
                  {
                    borderColor: active ? CultureTokens.indigo : colors.borderLight,
                    backgroundColor: active ? `${CultureTokens.indigo}18` : colors.surfaceElevated,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={label}
              >
                <Text style={[styles.monthChipText, { color: active ? CultureTokens.indigo : colors.text }]}>
                  {label.slice(0, 3)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <Text style={[styles.muted, { color: colors.textSecondary }]}>Loading {MONTHS[month - 1]}…</Text>
        ) : null}
        {isError ? (
          <Pressable onPress={() => void refetch()} accessibilityRole="button">
            <Text style={[styles.error, { color: CultureTokens.coral }]}>Could not load. Tap to retry.</Text>
          </Pressable>
        ) : null}

        {!isLoading && dayKeys.length === 0 ? (
          <Text style={[styles.muted, { color: colors.textSecondary }]}>
            No published entries for {MONTHS[month - 1]} yet. Admins can add days under Admin → Culture Today calendar.
          </Text>
        ) : null}

        {dayKeys.map((dk) => {
          const list = byDay.get(dk) ?? [];
          const [mm, dd] = dk.split('-');
          return (
            <View key={dk} style={[styles.dayBlock, { borderColor: colors.borderLight, backgroundColor: colors.surfaceElevated }]}>
              <Pressable
                onPress={() => router.push(`/culture-today/${dk}`)}
                style={styles.dayHeader}
                accessibilityRole="button"
                accessibilityLabel={`Open ${dk}`}
              >
                <Text style={[styles.dayNum, { color: colors.text }]}>{parseInt(dd, 10)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dayKey, { color: colors.textSecondary }]}>{MONTHS[parseInt(mm, 10) - 1]} {parseInt(dd, 10)}</Text>
                  <Text style={[styles.dayHint, { color: CultureTokens.indigo }]}>View day →</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </Pressable>
              {list.slice(0, 3).map((e) => (
                <View key={e.id} style={styles.entryRow}>
                  <Text style={[styles.entryTitle, { color: colors.text }]} numberOfLines={2}>{e.title}</Text>
                  {e.subtitle ? (
                    <Text style={[styles.entrySub, { color: colors.textSecondary }]} numberOfLines={2}>{e.subtitle}</Text>
                  ) : null}
                  <Text style={[styles.scope, { color: colors.textTertiary }]}>
                    {[e.scopeType, e.countryName, e.stateRegion, e.cultureLabel].filter(Boolean).join(' · ')}
                  </Text>
                </View>
              ))}
              {list.length > 3 ? (
                <Text style={[styles.more, { color: CultureTokens.indigo }]}>+{list.length - 3} more on this day</Text>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingTop: Platform.OS === 'web' ? 16 : 12, gap: 14 },
  miniHeader: {
    paddingBottom: 14,
    marginBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    gap: 6,
  },
  seriesLine: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.caption,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  miniKicker: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.caption,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  miniTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.title2,
    lineHeight: LineHeight.title2,
    letterSpacing: -0.3,
  },
  miniSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.callout,
    lineHeight: LineHeight.callout,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  backLinkText: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.chip,
  },
  sectionLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 4,
  },
  monthRow: { gap: 8, paddingVertical: 4 },
  monthChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  monthChipText: { fontFamily: FontFamily.semibold, fontSize: FontSize.chip },
  muted: { fontFamily: FontFamily.regular, fontSize: FontSize.callout },
  error: { fontFamily: FontFamily.medium, fontSize: FontSize.callout, marginTop: 8 },
  dayBlock: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 4,
  },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  dayNum: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    width: 44,
    textAlign: 'center',
  },
  dayKey: { fontFamily: FontFamily.medium, fontSize: FontSize.caption },
  dayHint: { fontFamily: FontFamily.semibold, fontSize: FontSize.caption, marginTop: 2 },
  entryRow: { marginTop: 8, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#00000014' },
  entryTitle: { fontFamily: FontFamily.semibold, fontSize: FontSize.body },
  entrySub: { fontFamily: FontFamily.regular, fontSize: FontSize.chip, marginTop: 2 },
  scope: { fontFamily: FontFamily.regular, fontSize: FontSize.caption, marginTop: 4 },
  more: { fontFamily: FontFamily.semibold, fontSize: FontSize.caption, marginTop: 8 },
});
