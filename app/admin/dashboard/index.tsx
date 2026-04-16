import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { AdminDashboardShell } from '@/components/admin/AdminDashboardShell';
import { useColors } from '@/hooks/useColors';
import { useRole } from '@/hooks/useRole';
import { api } from '@/lib/api';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { Button } from '@/components/ui/Button';
import { CultureTokens } from '@/constants/theme';

interface StatCard {
  id: string;
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route?: string;
}

interface WorkspaceInsight {
  label: string;
  count: number;
  color: string;
  route: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  {
    id: 'import',
    label: 'Data Import',
    description: 'JSON, URL, scheduled ingestion',
    icon: 'cloud-upload-outline' as const,
    color: CultureTokens.indigo,
    route: '/admin/import',
  },
  {
    id: 'moderation',
    label: 'Moderation',
    description: 'Review flagged content',
    icon: 'eye-outline' as const,
    color: CultureTokens.coral,
    route: '/admin/moderation',
  },
  {
    id: 'curation',
    label: 'Discover Curation',
    description: 'Featured artists & playlists',
    icon: 'sparkles-outline' as const,
    color: CultureTokens.gold,
    route: '/admin/discover',
  },
] as const;

export default function AdminDashboard() {
  const colors = useColors();
  const { isSuperAdmin } = useRole();

  // Real stats query (mirrors cockpit.tsx pattern)
  const statsQuery = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.admin.stats(),
    staleTime: 30_000,
  });

  const workspaceQuery = useQuery({
    queryKey: ['workspace', 'insights'],
    queryFn: () => api.profiles.my(),
    enabled: isSuperAdmin,
    staleTime: 60_000,
  });

  const stats = useMemo((): StatCard[] => {
    const data = statsQuery.data as any;
    const approvedCount = (workspaceQuery.data ?? []).filter(
      (p: any) => p.handleStatus === 'approved'
    ).length;

    return [
      { 
        id: 'users', 
        label: 'Total Users', 
        value: data?.totalUsers?.toLocaleString() ?? '—', 
        icon: 'people-outline', 
        color: CultureTokens.indigo, 
        route: '/admin/users' 
      },
      { 
        id: 'events', 
        label: 'Live Events', 
        value: data?.liveEvents?.toLocaleString() ?? '—', 
        icon: 'calendar-outline', 
        color: CultureTokens.teal, 
        route: '/events' 
      },
      { 
        id: 'workspace', 
        label: 'Active Creators', 
        value: approvedCount.toLocaleString(), 
        icon: 'briefcase-outline', 
        color: CultureTokens.gold, 
        route: '/admin/profiles' 
      },
      { 
        id: 'pending', 
        label: 'Pending Review', 
        value: data?.pendingModeration?.toLocaleString() ?? '—', 
        icon: 'eye-outline', 
        color: CultureTokens.coral, 
        route: '/admin/moderation' 
      },
      { 
        id: 'revenue', 
        label: 'Revenue (30d)', 
        value: data?.revenue30d ? `$${(data.revenue30d / 100).toLocaleString()}` : '—', 
        icon: 'card-outline', 
        color: '#10B981', 
        route: '/admin/finance' 
      },
    ];
  }, [statsQuery.data, workspaceQuery.data]);

  const insights: WorkspaceInsight[] = useMemo(() => [
    { label: 'Pending Approvals', count: 3, color: CultureTokens.coral, route: '/admin/profiles' },
    { label: 'Active Creators', count: (workspaceQuery.data ?? []).filter((p: any) => p.handleStatus === 'approved').length, color: CultureTokens.teal, route: '/admin/profiles' },
    { label: 'Workspace Events', count: 24, color: CultureTokens.indigo, route: '/admin/events' },
  ], [workspaceQuery.data]);

  return (
    <AdminDashboardShell 
      title="Platform Control" 
      subtitle="Overview • Workspace • Moderation"
    >
      {/* Stats Overview */}
      <LiquidGlassPanel style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PLATFORM HEALTH</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <StatTile key={stat.id} stat={stat} />
          ))}
        </View>
      </LiquidGlassPanel>

      {/* Workspace Insights for Admins */}
      {isSuperAdmin && (
        <LiquidGlassPanel style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>WORKSPACE OVERVIEW</Text>
          <View style={styles.insightsGrid}>
            {insights.map((insight, index) => (
              <Pressable
                key={index}
                onPress={() => router.push(insight.route as any)}
                style={styles.insightCard}
              >
                <View style={[styles.insightIcon, { backgroundColor: insight.color + '20' }]}>
                  <Ionicons name="briefcase-outline" size={24} color={insight.color} />
                </View>
                <Text style={[styles.insightCount, { color: colors.text }]}>{insight.count}</Text>
                <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>{insight.label}</Text>
              </Pressable>
            ))}
          </View>
        </LiquidGlassPanel>
      )}

      {/* Quick Actions */}
      <LiquidGlassPanel style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>QUICK ACTIONS</Text>
        <View style={styles.quickActionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              onPress={() => router.push(action.route as any)}
              leftIcon={action.icon}
              style={styles.quickActionButton}
            >
              {action.label}
            </Button>
          ))}
        </View>
      </LiquidGlassPanel>

      {/* All Tools Section */}
      <LiquidGlassPanel style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ALL ADMIN TOOLS</Text>
        <Button 
          variant="outline" 
          onPress={() => router.push('/admin/events' as any)}
          style={{ marginTop: 8 }}
        >
          View All Tools →
        </Button>
      </LiquidGlassPanel>
    </AdminDashboardShell>
  );
}

// ─── Reusable Stat Tile ──────────────────────────────────────────────────────
function StatTile({ stat }: { stat: StatCard }) {
  const colors = useColors();

  return (
    <Pressable
      onPress={() => stat.route && router.push(stat.route as any)}
      style={({ pressed }) => [
        styles.statCard,
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}
    >
      <LiquidGlassPanel style={{ padding: 20, flex: 1 }}>
        <View style={[styles.statIconWrap, { backgroundColor: stat.color + '18' }]}>
          <Ionicons name={stat.icon} size={28} color={stat.color} />
        </View>
        <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]} numberOfLines={1}>
          {stat.label}
        </Text>
      </LiquidGlassPanel>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  section: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 160,
    borderRadius: 20,
    overflow: 'hidden',
  },
  statIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -1.2,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    opacity: 0.8,
  },
  insightsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  insightCard: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  insightIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  insightCount: {
    fontSize: 36,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -1.5,
    marginBottom: 6,
  },
  insightLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  quickActionButton: {
    flex: 1,
    minWidth: 160,
  },
});
