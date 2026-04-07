import { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Platform,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { gradients } from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';

import { AdHocTab }   from '@/components/admin-import/AdHocTab';
import { SourcesTab } from '@/components/admin-import/SourcesTab';
import { JobsTab }    from '@/components/admin-import/JobsTab';

const TABS = [
  { id: 'adhoc',   label: 'Import',   icon: 'cloud-download-outline' as const },
  { id: 'sources', label: 'Sources',  icon: 'server-outline' as const },
  { id: 'jobs',    label: 'History',  icon: 'document-text-outline' as const },
] as const;

type TabId = typeof TABS[number]['id'];

function ImportContent() {
  const insets   = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const colors   = useColors();
  const { hPad } = useLayout();
  const { isAdmin } = useRole();
  const [activeTab, setActiveTab] = useState<TabId>('adhoc');

  if (!isAdmin) {
    return (
      <View style={[s.fill, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name="lock-closed" size={44} color={colors.textTertiary} />
        <Text style={[s.lockText, { color: colors.text }]}>Admin Access Required</Text>
      </View>
    );
  }

  return (
    <View style={[s.fill, { backgroundColor: colors.background }]}>

      {/* ── Header ───────────────────────────────────────────────────────────── */}
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
            <Text style={s.headerTitle}>Data Ingestion</Text>
            <Text style={s.headerSub}>Import, schedule, and monitor event sources</Text>
          </View>
        </Animated.View>

        {/* Tab bar */}
        <View style={[s.tabBar, { paddingHorizontal: hPad }]}>
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                style={[s.tab, active && s.tabActive]}
                onPress={() => setActiveTab(tab.id)}
                accessibilityRole="tab"
                accessibilityLabel={tab.label}
              >
                <Ionicons
                  name={tab.icon}
                  size={15}
                  color={active ? '#fff' : 'rgba(255,255,255,0.5)'}
                />
                <Text style={[s.tabText, { color: active ? '#fff' : 'rgba(255,255,255,0.5)' }]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </LinearGradient>

      {/* ── Tab content ─────────────────────────────────────────────────────── */}
      {activeTab === 'adhoc'   && <AdHocTab   onJobCreated={() => {}} />}
      {activeTab === 'sources' && <SourcesTab onJobCreated={() => setActiveTab('jobs')} />}
      {activeTab === 'jobs'    && <JobsTab />}

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

const s = StyleSheet.create({
  fill:        { flex: 1 },
  lockText:    { fontFamily: 'Poppins_700Bold', fontSize: 16, marginTop: 12 },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 16 },
  headerTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: '#fff', letterSpacing: -0.2 },
  headerSub:   { fontSize: 12, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  backBtn:     { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  tabBar:      { flexDirection: 'row', gap: 4, paddingBottom: 14 },
  tab:         { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  tabActive:   { backgroundColor: 'rgba(255,255,255,0.15)' },
  tabText:     { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
});
