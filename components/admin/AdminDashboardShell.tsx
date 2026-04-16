import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/lib/auth';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CultureTokens, LiquidGlassTokens } from '@/constants/theme';

type AdminDashboardShellProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
};

export function AdminDashboardShell({
  children,
  title = 'Admin',
  subtitle,
  showBack = true,
}: AdminDashboardShellProps) {
  const colors = useColors();
  const { hPad, contentWidth, isDesktop } = useLayout();
  const { isAdmin, isSuperAdmin, isLoading: roleLoading } = useRole();
  const { user } = useAuth();

  if (roleLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <LiquidGlassPanel>
          <Ionicons name="shield-checkmark" size={48} color={colors.primary} />
        </LiquidGlassPanel>
      </View>
    );
  }

  if (!isAdmin && !isSuperAdmin) {
    // Redirect workspace users to their workspace
    router.replace('/workspace');
    return null;
  }

  const adminName = user?.displayName?.split(' ')[0] ?? 'Admin';
  const now = new Date();
  const greetingHour = now.getHours();
  const greeting = greetingHour < 12 
    ? 'Good morning' 
    : greetingHour < 17 
      ? 'Good afternoon' 
      : 'Good evening';

  return (
    <ErrorBoundary>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {/* Glass Header */}
        <LiquidGlassPanel style={styles.header} borderRadius={LiquidGlassTokens.corner.mainCard}>
          <LinearGradient
            colors={[CultureTokens.violet + '18', 'transparent']}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          
          <View style={styles.headerContent}>
            {showBack && (
              <Pressable
                onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
                style={styles.backBtn}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="chevron-back" size={22} color={colors.text} />
              </Pressable>
            )}

            <View style={styles.headerText}>
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={14} color={CultureTokens.coral} />
                <Text style={[styles.badgeText, { color: CultureTokens.coral }]}>PLATFORM ADMIN</Text>
              </View>
              <Text style={[styles.greeting, { color: colors.text }]}>
                {greeting}, {adminName}
              </Text>
              {subtitle && (
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {subtitle}
                </Text>
              )}
            </View>

            <View style={styles.headerActions}>
              <Text style={[styles.date, { color: colors.textTertiary }]}>
                {now.toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' })}
              </Text>
            </View>
          </View>
        </LiquidGlassPanel>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop && { maxWidth: contentWidth, alignSelf: 'center', paddingHorizontal: hPad },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    margin: 16,
    marginTop: 8,
    borderRadius: LiquidGlassTokens.corner.mainCard,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,94,91,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,94,91,0.3)',
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.5,
  },
  greeting: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
  },
  headerActions: {
    alignItems: 'flex-end',
  },
  date: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 8,
    gap: 24,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
});
