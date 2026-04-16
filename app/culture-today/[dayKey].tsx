import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Linking } from 'react-native';
import { Stack, useLocalSearchParams, router, Link } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useTabScrollBottomPadding } from '@/hooks/useTabScrollBottomPadding';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { api } from '@/lib/api';
import { CultureTokens, FontFamily, FontSize, LineHeight } from '@/constants/theme';
import { CULTURE_TODAY_EVENT_TAG } from '@/shared/schema';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CultureTodayDayScreen() {
  const { dayKey: raw } = useLocalSearchParams<{ dayKey: string }>();
  const dayKey = Array.isArray(raw) ? raw[0] : raw;
  const colors = useColors();
  const { hPad, isDesktop, contentWidth } = useLayout();
  const bottomPad = useTabScrollBottomPadding(24);

  const valid = typeof dayKey === 'string' && /^\d{2}-\d{2}$/.test(dayKey);

  const { data: dayData, isLoading: dayLoading } = useQuery({
    queryKey: ['culture-today-day', dayKey],
    queryFn: () => api.cultureToday.day(dayKey!),
    enabled: valid,
  });

  const { data: eventsData, isLoading: evLoading } = useQuery({
    queryKey: ['culture-today-tagged-events', dayKey],
    queryFn: () => api.events.list({ tag: CULTURE_TODAY_EVENT_TAG, page: 1, pageSize: 80 }),
    enabled: valid,
  });

  const matchingEvents = useMemo(() => {
    if (!dayKey || !eventsData?.events) return [];
    return eventsData.events.filter((e) => {
      const d = (e.date ?? '').trim();
      if (d.length < 10) return false;
      return d.slice(5, 10) === dayKey;
    });
  }, [eventsData?.events, dayKey]);

  const [mm, dd] = (dayKey ?? '--').split('-');
  const monthNum = parseInt(mm, 10);
  const dayNum = parseInt(dd, 10);
  const titleLabel =
    valid && monthNum >= 1 && monthNum <= 12
      ? `${MONTHS[monthNum - 1]} ${dayNum}`
      : 'Culture Today';

  if (!valid) {
    return (
      <ErrorBoundary>
        <Stack.Screen options={{ title: 'Culture Today', headerShown: true }} />
        <View style={[styles.center, { backgroundColor: colors.background, padding: hPad }]}>
          <Text style={{ color: colors.text }}>Invalid date. Use format MM-DD.</Text>
          <Pressable onPress={() => router.replace('/culture-today')} style={{ marginTop: 16 }}>
            <Text style={{ color: CultureTokens.indigo }}>Open calendar</Text>
          </Pressable>
        </View>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Stack.Screen
        options={{
          title: titleLabel,
          headerShown: true,
          headerBackTitle: '',
        }}
      />
      <ScrollView
        style={[styles.root, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: hPad, paddingBottom: bottomPad },
          isDesktop ? { maxWidth: contentWidth, alignSelf: 'center', width: '100%' } : null,
        ]}
      >
        <View style={[styles.miniHeader, { borderBottomColor: colors.borderLight }]}>
          <Text style={[styles.seriesLine, { color: colors.textSecondary }]}>Reimagine</Text>
          <Text style={[styles.miniKicker, { color: CultureTokens.indigo }]}>Culture Today · This day</Text>
          <Text style={[styles.miniTitle, { color: colors.text }]}>{titleLabel}</Text>
          <Text style={[styles.miniSub, { color: colors.textSecondary }]}>
            Story & sources from our calendar rows below. Events use the “{CULTURE_TODAY_EVENT_TAG}” tag on this
            month-day (any year). Browse the full year in the 365 calendar.
          </Text>
          <Link href="/culture-today" asChild>
            <Pressable
              style={({ pressed }) => [styles.calLink, pressed && { opacity: 0.72 }]}
              accessibilityRole="link"
              accessibilityLabel="Open 365 calendar"
            >
              <Text style={[styles.calLinkText, { color: CultureTokens.indigo }]}>365 calendar</Text>
              <Ionicons name="calendar-outline" size={16} color={CultureTokens.indigo} />
            </Pressable>
          </Link>
        </View>

        <Text style={[styles.section, { color: colors.text }]}>Story & sources</Text>
        <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
          Curated observances for {titleLabel} (admin calendar).
        </Text>

        {dayLoading ? (
          <Text style={{ color: colors.textSecondary }}>Loading entries…</Text>
        ) : (
          (dayData?.entries ?? []).map((e) => (
            <View key={e.id} style={[styles.card, { borderColor: colors.borderLight, backgroundColor: colors.surfaceElevated }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{e.title}</Text>
              {e.subtitle ? <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{e.subtitle}</Text> : null}
              {e.body ? <Text style={[styles.body, { color: colors.text }]}>{e.body}</Text> : null}
              <Text style={[styles.meta, { color: colors.textTertiary }]}>
                {[e.scopeType, e.countryName, e.stateRegion, e.cultureLabel].filter(Boolean).join(' · ')}
              </Text>
              {e.learnMoreUrl ? (
                <Pressable
                  onPress={() => void Linking.openURL(e.learnMoreUrl!).catch(() => {})}
                  style={styles.learn}
                  accessibilityRole="link"
                  accessibilityLabel="Learn more"
                >
                  <Text style={{ color: CultureTokens.indigo, fontFamily: FontFamily.semibold }}>Learn more</Text>
                  <Ionicons name="open-outline" size={14} color={CultureTokens.indigo} />
                </Pressable>
              ) : null}
            </View>
          ))
        )}

        {!dayLoading && (dayData?.entries?.length ?? 0) === 0 ? (
          <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
            No published calendar rows for this day yet.
          </Text>
        ) : null}

        <Text style={[styles.section, { color: colors.text, marginTop: 8 }]}>Tagged events on this day</Text>
        {evLoading ? <Text style={{ color: colors.textSecondary }}>Loading events…</Text> : null}
        {matchingEvents.map((ev) => (
          <Pressable
            key={ev.id}
            onPress={() => router.push(`/event/${ev.id}`)}
            style={[styles.evRow, { borderColor: colors.borderLight }]}
            accessibilityRole="button"
            accessibilityLabel={ev.title}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.evTitle, { color: colors.text }]} numberOfLines={2}>{ev.title}</Text>
              <Text style={[styles.evMeta, { color: colors.textSecondary }]}>
                {ev.date} · {ev.city}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>
        ))}
        {!evLoading && matchingEvents.length === 0 ? (
          <Text style={{ color: colors.textSecondary }}>
            No published events with the {CULTURE_TODAY_EVENT_TAG} tag on this calendar day yet.
          </Text>
        ) : null}
      </ScrollView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingTop: Platform.OS === 'web' ? 12 : 8, gap: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  miniHeader: {
    paddingBottom: 12,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    gap: 6,
  },
  seriesLine: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.caption,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  calLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  calLinkText: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.chip,
  },
  miniKicker: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.caption,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  miniTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.title3,
    lineHeight: LineHeight.title3,
  },
  miniSub: { fontFamily: FontFamily.regular, fontSize: FontSize.chip, lineHeight: 18 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  cardTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.body },
  cardSub: { fontFamily: FontFamily.regular, fontSize: FontSize.chip },
  body: { fontFamily: FontFamily.regular, fontSize: FontSize.callout, lineHeight: LineHeight.callout, marginTop: 4 },
  meta: { fontFamily: FontFamily.regular, fontSize: FontSize.caption, marginTop: 4 },
  learn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  section: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.title3,
    marginTop: 16,
  },
  sectionHint: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.chip,
    lineHeight: 18,
    marginTop: 4,
  },
  evRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  evTitle: { fontFamily: FontFamily.semibold, fontSize: FontSize.body },
  evMeta: { fontFamily: FontFamily.regular, fontSize: FontSize.caption, marginTop: 2 },
});
