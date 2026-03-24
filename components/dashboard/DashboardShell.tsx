import React from 'react';
import { View, ScrollView, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';

export type DashboardNavItem = {
  label: string;
  icon: string;
  href: string;
  badge?: number | string;
  active?: boolean;
};

interface DashboardShellProps {
  header: React.ReactNode;
  nav?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Shared dashboard shell with responsive padding, safe areas, and optional nav rail.
 * Keeps layout consistent across Admin/Organizer/Venue/Sponsor hubs.
 */
export function DashboardShell({ header, nav, children }: DashboardShellProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isDesktop, hPad } = useLayout();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.topPadding, { paddingTop: Platform.OS === 'web' ? 0 : insets.top }]} />
      <View style={[styles.body, { paddingHorizontal: hPad }]}>
        {isDesktop ? (
          <View style={styles.desktopRow}>
            {nav ? <View style={styles.navColumn}>{nav}</View> : null}
            <View style={styles.contentColumn}>
              {header}
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
              >
                {children}
              </ScrollView>
            </View>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.mobileContent,
              { paddingBottom: insets.bottom + 40, paddingHorizontal: hPad },
            ]}
          >
            {nav ? <View style={styles.mobileNav}>{nav}</View> : null}
            {header}
            {children}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topPadding: { height: 0 },
  body: { flex: 1, width: '100%' },
  desktopRow: { flexDirection: 'row', gap: 18, flex: 1 },
  navColumn: { width: 240 },
  contentColumn: { flex: 1 },
  scrollContent: { gap: 18 },
  mobileContent: { gap: 18 },
  mobileNav: { marginBottom: 8 },
});

export default DashboardShell;
