import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { CultureTokens } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface FilterChipProps {
  filters: string[];
  selectedFilters: string[];
  onToggle: (filter: string) => void;
  onClearAll: () => void;
}

export default function FilterChips({
  filters,
  selectedFilters,
  onToggle,
  onClearAll,
}: FilterChipProps) {
  const colors = useColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {selectedFilters.length > 0 && (
        <TouchableOpacity
          style={[styles.chip, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
          onPress={onClearAll}
        >
          <Ionicons name="close" size={14} color={colors.text} style={{ marginRight: 4 }} />
          <Text style={[styles.chipText, { color: colors.text }]}>Clear all</Text>
        </TouchableOpacity>
      )}

      {filters.map((filter) => {
        const isActive = selectedFilters.includes(filter);
        return (
          <TouchableOpacity
            key={filter}
            style={[
              styles.chip,
              { backgroundColor: isActive ? CultureTokens.indigo : colors.backgroundSecondary, borderColor: isActive ? CultureTokens.indigo : colors.borderLight },
            ]}
            onPress={() => onToggle(filter)}
          >
            <Text
              style={[
                styles.chipText,
                { color: isActive ? '#fff' : colors.textSecondary },
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
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13.5
  },
});
