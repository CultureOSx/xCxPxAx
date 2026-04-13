// @ts-nocheck
import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { CultureTokens } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface FilterChipProps {
  filters: string[];
  selectedFilters: string[];
  onToggle: (filter: string) => void;
  onClearAll: () => void;
  /** Hub: rounded-rect chips aligned with culture hub segmented controls (not full pills). */
  variant?: 'default' | 'hub';
}

export default function FilterChips({
  filters,
  selectedFilters,
  onToggle,
  onClearAll,
  variant = 'default',
}: FilterChipProps) {
  const colors = useColors();
  const hub = variant === 'hub';
  const webTap = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : {};

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={hub ? styles.containerHub : styles.container}
    >
      {selectedFilters.length > 0 && (
        <TouchableOpacity
          style={[
            hub ? styles.chipHub : styles.chip,
            webTap,
            {
              backgroundColor: hub ? colors.background : colors.surfaceElevated,
              borderColor: colors.borderLight,
            },
          ]}
          onPress={onClearAll}
        >
          <Ionicons name="close" size={14} color={colors.text} style={{ marginRight: 4 }} />
          <Text style={[hub ? styles.chipTextHub : styles.chipText, { color: colors.text }]}>Clear</Text>
        </TouchableOpacity>
      )}

      {filters.map((filter) => {
        const isActive = selectedFilters.includes(filter);
        return (
          <TouchableOpacity
            key={filter}
            style={[
              hub ? styles.chipHub : styles.chip,
              webTap,
              {
                backgroundColor: isActive ? CultureTokens.indigo : colors.backgroundSecondary,
                borderColor: isActive ? CultureTokens.indigo : colors.borderLight,
              },
            ]}
            onPress={() => onToggle(filter)}
          >
            <Text
              style={[
                hub ? styles.chipTextHub : styles.chipText,
                { color: isActive ? colors.textOnBrandGradient : colors.textSecondary },
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingVertical: 12, gap: 10, alignItems: 'center' },
  containerHub: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipHub: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  chipText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13.5,
  },
  chipTextHub: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
  },
});
