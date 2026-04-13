// @ts-nocheck
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { CultureTokens } from '@/constants/theme';
import type { DashboardNavItem } from './DashboardShell';

interface DashboardNavProps {
  items: DashboardNavItem[];
  layout?: 'vertical' | 'horizontal';
}

export function DashboardNav({ items, layout = 'vertical' }: DashboardNavProps) {
  const colors = useColors();
  if (items.length === 0) return null;

  if (layout === 'horizontal') {
    return (
      <View style={[styles.horizontal, { borderColor: colors.borderLight }]}>
        {items.map((item) => (
          <Pressable
            key={item.href}
            style={({ pressed }) => [
              styles.hChip,
              {
                backgroundColor: item.active ? CultureTokens.indigo + '18' : colors.backgroundSecondary,
                borderColor: item.active ? CultureTokens.indigo + '40' : colors.borderLight,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
            onPress={() => router.push(item.href)}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <Ionicons name={item.icon as never} size={16} color={item.active ? CultureTokens.indigo : colors.textSecondary} />
            <Text style={[styles.hLabel, { color: item.active ? CultureTokens.indigo : colors.text }]} numberOfLines={1}>
              {item.label}
            </Text>
            {item.badge ? (
              <View style={[styles.badge, { backgroundColor: CultureTokens.coral }]}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            ) : null}
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.vertical, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      {items.map((item) => (
        <Pressable
          key={item.href}
          style={({ pressed }) => [
            styles.vRow,
            {
              backgroundColor: item.active ? CultureTokens.indigo + '15' : 'transparent',
              borderColor: item.active ? CultureTokens.indigo + '30' : 'transparent',
              opacity: pressed ? 0.9 : 1,
            },
          ]}
          onPress={() => router.push(item.href)}
          accessibilityRole="button"
          accessibilityLabel={item.label}
        >
          <View style={styles.iconWrap}>
            <Ionicons name={item.icon as never} size={18} color={item.active ? CultureTokens.indigo : colors.textSecondary} />
          </View>
          <Text style={[styles.vLabel, { color: colors.text }]} numberOfLines={1}>{item.label}</Text>
          {item.badge ? (
            <View style={[styles.badge, { backgroundColor: CultureTokens.coral }]}>
              <Text style={styles.badgeText}>{item.badge}</Text>
            </View>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  vertical: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingVertical: 4,
  },
  vRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 6,
    marginVertical: 2,
    borderWidth: 1,
  },
  vLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  iconWrap: { width: 26, alignItems: 'center' },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { color: '#fff', fontSize: 10, fontFamily: 'Poppins_700Bold' },
  horizontal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 8,
  },
  hChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 999,
  },
  hLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
});

export default DashboardNav;
