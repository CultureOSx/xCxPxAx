import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { Input } from '@/components/ui/Input';
import FilterChips from '@/components/ui/FilterChips';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { OlympicsColors } from '@/constants/theme';

export default function SearchScreen() {
  const colors = useColors();
  const [query, setQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const onToggleFilter = (filter: string) => {
    setSelectedFilters((prev) => prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]);
  };

  const onClearAll = () => setSelectedFilters([]);

  const filters = ['Music', 'Food', 'Arts', 'Nightlife', 'Indigenous', 'Sports', 'Workshop'];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LiquidGlassPanel style={styles.searchBar}>
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder="Search events, venues, communities..."
          leftIcon="search"
        />
      </LiquidGlassPanel>

      <FilterChips
        filters={filters}
        selectedFilters={selectedFilters}
        onToggle={onToggleFilter}
        onClearAll={onClearAll}
      />

      <ScrollView style={styles.results} contentContainerStyle={styles.resultsContent}>
        <Text style={[styles.placeholder, { color: colors.textSecondary }]}>Results for "{query || 'all'}" with filters: {selectedFilters.join(', ') || 'none'}</Text>
        {/* Results would use api.search here with the query and filters */}
        <LiquidGlassPanel style={styles.resultCard}>
          <Text style={{ color: colors.text }}>Sample result with black/white + Olympics accent</Text>
        </LiquidGlassPanel>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  searchBar: { margin: 16, marginBottom: 8 },
  results: { flex: 1 },
  resultsContent: { padding: 16, gap: 12 },
  placeholder: { textAlign: 'center', padding: 40 },
  resultCard: { padding: 20 },
});
