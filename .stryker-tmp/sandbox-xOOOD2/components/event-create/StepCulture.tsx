// @ts-nocheck
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { ALL_NATIONALITIES, getCulturesForNationality, CULTURES, type Nationality } from '@/constants/cultures';
import { COMMON_LANGUAGES } from '@/constants/languages';
import { FormData, ACCESSIBILITY_OPTIONS } from './types';
import { Field } from './Field';
import type { CreateStyles } from './styles';

interface Props {
  form: FormData;
  colors: ReturnType<typeof useColors>;
  s: CreateStyles;
  toggleCultureTag: (id: string) => void;
  toggleLanguageTag: (id: string) => void;
  toggleAccessibilityTag: (id: string) => void;
  haptic: () => void;
  initialNationalityId?: string | null;
}

export function StepCulture({ form, colors, s, toggleCultureTag, toggleLanguageTag, toggleAccessibilityTag, haptic, initialNationalityId }: Props) {
  const [cultureNationalityId, setCultureNationalityId] = useState<string | null>(initialNationalityId ?? null);
  const [nationalitySearch, setNationalitySearch] = useState('');

  const filteredNationalities = useMemo((): Nationality[] => {
    const q = nationalitySearch.trim().toLowerCase();
    if (!q) return ALL_NATIONALITIES.slice(0, 30);
    return ALL_NATIONALITIES.filter(
      (n) => n.label.toLowerCase().includes(q) || n.id.includes(q),
    );
  }, [nationalitySearch]);

  const filteredCultures = useMemo(() => {
    if (cultureNationalityId) return getCulturesForNationality(cultureNationalityId);
    return ALL_NATIONALITIES.slice(0, 8)
      .flatMap((n) => getCulturesForNationality(n.id))
      .slice(0, 24);
  }, [cultureNationalityId]);

  const suggestedLanguageIds = useMemo(() => {
    const ids = new Set<string>(['eng']);
    form.cultureTagIds.forEach((cid) => {
      const culture = CULTURES[cid];
      if (culture?.primaryLanguageId) ids.add(culture.primaryLanguageId);
    });
    return ids;
  }, [form.cultureTagIds]);

  return (
    <View style={s.fields}>
      <Text style={[s.sectionNote, { color: colors.textSecondary }]}>
        Tag this event so people from specific cultures can discover it. Search for your community (e.g. Indian, Chinese, Greek) to see relevant tags.
      </Text>

      {/* ── 1. Nationality search ─────────────────────────────────────────── */}
      <Field label="1. Select Origin / Background" colors={colors}>
        <View style={[s.natSearchWrap, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            style={[s.natSearchInput, { color: colors.text }]}
            value={nationalitySearch}
            onChangeText={setNationalitySearch}
            placeholder="e.g. Indian, Chinese, Greek…"
            placeholderTextColor={colors.textTertiary}
            returnKeyType="done"
          />
          {nationalitySearch.length > 0 && (
            <Pressable onPress={() => setNationalitySearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 8 }}
        >
          {filteredNationalities.map((n) => {
            const isSelected = cultureNationalityId === n.id;
            return (
              <Pressable
                key={n.id}
                onPress={() => {
                  haptic();
                  setCultureNationalityId(isSelected ? null : n.id);
                }}
                style={({ pressed }) => [
                  s.natChip,
                  {
                    borderColor: isSelected ? CultureTokens.indigo : colors.border,
                    backgroundColor: isSelected ? CultureTokens.indigo + '18' : colors.background,
                  },
                  pressed && { opacity: 0.75 },
                ]}
                accessibilityRole="radio"
                accessibilityLabel={n.label}
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={s.natEmoji}>{n.emoji}</Text>
                <Text style={[s.natLabel, { color: isSelected ? CultureTokens.indigo : colors.text }]}>{n.label}</Text>
                {isSelected && <Ionicons name="checkmark-circle" size={14} color={CultureTokens.indigo} />}
              </Pressable>
            );
          })}
        </ScrollView>
        {cultureNationalityId && (
          <Text style={[s.natHint, { color: colors.textSecondary }]}>
            Showing cultures for {ALL_NATIONALITIES.find((n) => n.id === cultureNationalityId)?.label ?? cultureNationalityId}
          </Text>
        )}
      </Field>

      {/* ── 2. Culture tags ───────────────────────────────────────────────── */}
      <Field label="2. Culture Tags" colors={colors}>
        {filteredCultures.length === 0 ? (
          <Text style={[s.natHint, { color: colors.textSecondary }]}>No cultures found. Try a different origin.</Text>
        ) : (
          <View style={s.tagGrid}>
            {filteredCultures.map((c) => {
              const isSelected = form.cultureTagIds.includes(c.id);
              return (
                <Pressable
                  key={c.id}
                  style={({ pressed }) => [
                    s.tagChip,
                    { borderColor: isSelected ? CultureTokens.gold : colors.border, backgroundColor: isSelected ? CultureTokens.gold + '22' : colors.background },
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => toggleCultureTag(c.id)}
                  accessibilityRole="checkbox"
                  accessibilityLabel={c.label}
                  accessibilityState={{ checked: isSelected }}
                >
                  <Text style={s.tagEmoji}>{c.emoji}</Text>
                  <Text style={[s.tagLabel, { color: isSelected ? CultureTokens.gold : colors.text }]}>{c.label}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </Field>

      {/* ── 3. Language tags ──────────────────────────────────────────────── */}
      <Field label="3. Language Tags" colors={colors}>
        {form.cultureTagIds.length > 0 && suggestedLanguageIds.size > 1 && (
          <Text style={[s.natHint, { color: CultureTokens.indigo, marginBottom: 8 }]}>
            Suggested languages are highlighted based on your culture selections.
          </Text>
        )}
        <View style={s.tagGrid}>
          {COMMON_LANGUAGES.map((l) => {
            const isSelected = form.languageTagIds.includes(l.id);
            const isSuggested = suggestedLanguageIds.has(l.id) && !isSelected;
            return (
              <Pressable
                key={l.id}
                style={({ pressed }) => [
                  s.tagChip,
                  {
                    borderColor: isSelected
                      ? CultureTokens.teal
                      : isSuggested
                        ? CultureTokens.indigo + '80'
                        : colors.border,
                    backgroundColor: isSelected
                      ? CultureTokens.teal + '22'
                      : isSuggested
                        ? CultureTokens.indigo + '10'
                        : colors.background,
                  },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => toggleLanguageTag(l.id)}
                accessibilityRole="checkbox"
                accessibilityLabel={l.name}
                accessibilityState={{ checked: isSelected }}
              >
                {isSuggested && <Ionicons name="sparkles" size={12} color={CultureTokens.indigo} />}
                <Text style={[
                  s.tagLabel,
                  { color: isSelected ? CultureTokens.teal : isSuggested ? CultureTokens.indigo : colors.text },
                ]}>{l.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </Field>

      {/* ── 4. Accessibility tags ─────────────────────────────────────────── */}
      <Field label="4. Accessibility Needs" colors={colors}>
        <Text style={[s.natHint, { color: colors.textSecondary, marginBottom: 8 }]}>
          Help attendees find accessible events.
        </Text>
        <View style={s.tagGrid}>
          {ACCESSIBILITY_OPTIONS.map((opt) => {
            const isSelected = form.accessibilityIds.includes(opt.id);
            return (
              <Pressable
                key={opt.id}
                style={({ pressed }) => [
                  s.tagChip,
                  {
                    borderColor: isSelected ? CultureTokens.coral : colors.border,
                    backgroundColor: isSelected ? CultureTokens.coral + '22' : colors.background,
                  },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => toggleAccessibilityTag(opt.id)}
                accessibilityRole="checkbox"
                accessibilityLabel={opt.label}
                accessibilityState={{ checked: isSelected }}
              >
                <Ionicons name={opt.icon as keyof typeof Ionicons.glyphMap} size={14} color={isSelected ? CultureTokens.coral : colors.text} style={{ marginRight: 4 }} />
                <Text style={[
                  s.tagLabel,
                  { color: isSelected ? CultureTokens.coral : colors.text },
                ]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Field>
    </View>
  );
}
