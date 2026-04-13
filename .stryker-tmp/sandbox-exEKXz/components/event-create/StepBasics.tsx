// @ts-nocheck
import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { CultureTokens } from '@/constants/theme';
import { TextStyles } from '@/constants/typography';
import { Input } from '@/components/ui/Input';
import { useColors } from '@/hooks/useColors';
import { Field } from './Field';
import { FormData, EVENT_TYPES } from './types';
import type { CreateStyles } from './styles';

interface Props {
  form: FormData;
  setField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  colors: ReturnType<typeof useColors>;
  s: CreateStyles;
  stepError: string | null;
  haptic: () => void;
}

export function StepBasics({ form, setField, colors, s, stepError, haptic }: Props) {
  return (
    <View style={s.fields}>
      <Field label="Event Title *" colors={colors}>
        <Input
          value={form.title}
          onChangeText={(v) => setField('title', v)}
          placeholder="e.g. Onam Festival Sydney 2026"
          autoCapitalize="words"
          maxLength={120}
          accessibilityLabel="Event title"
        />
      </Field>

      <Field label="Description *" colors={colors}>
        <TextInput
          value={form.description}
          onChangeText={(v) => setField('description', v)}
          placeholder="Tell people what this event is about…"
          placeholderTextColor={colors.textTertiary}
          multiline
          maxLength={1000}
          textAlignVertical="top"
          accessibilityLabel="Event description"
          style={[s.descriptionInput, {
            color: colors.text,
            backgroundColor: colors.surfaceElevated,
            borderColor: stepError && !form.description.trim() ? colors.error : colors.border,
          }]}
        />
      </Field>

      <Field label="Event Type" colors={colors}>
        <View style={s.typeGrid}>
          {EVENT_TYPES.map(({ id, label, emoji }) => {
            const isSelected = form.eventType === id;
            return (
              <Pressable
                key={id}
                style={({ pressed }) => [
                  s.typeChip,
                  {
                    borderColor: isSelected ? CultureTokens.gold : colors.border,
                    backgroundColor: isSelected ? CultureTokens.gold + '15' : colors.surfaceElevated,
                  },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => { haptic(); setField('eventType', id); }}
                accessibilityRole="radio"
                accessibilityLabel={label}
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={s.typeEmoji}>{emoji}</Text>
                <Text style={[TextStyles.labelSemibold, { color: isSelected ? CultureTokens.gold : colors.text }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Field>
    </View>
  );
}
