import React from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens } from '@/constants/theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useColors } from '@/hooks/useColors';
import { FormData, TierDraft } from './types';
import type { CreateStyles } from './styles';

interface Props {
  form: FormData;
  setField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  colors: ReturnType<typeof useColors>;
  s: CreateStyles;
  currency: string;
  showAddTier: boolean;
  setShowAddTier: (v: boolean) => void;
  newTier: TierDraft;
  setNewTier: React.Dispatch<React.SetStateAction<TierDraft>>;
  addTier: () => void;
  removeTier: (index: number) => void;
  haptic: () => void;
}

const TIER_PRESETS = ['Early Bird', 'General Admission', 'VIP'];

export function StepTickets({ form, setField, colors, s, currency, showAddTier, setShowAddTier, newTier, setNewTier, addTier, removeTier, haptic }: Props) {
  return (
    <View style={s.fields}>
      <Text style={[s.sectionNote, { color: colors.textSecondary }]}>
        Add ticket tiers. Each tier can have its own price and capacity.
      </Text>

      {form.tiers.map((tier, i) => (
        <View key={i} style={[s.tierRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <View style={s.tierInfo}>
            <Text style={[s.tierName, { color: colors.text }]}>{tier.name}</Text>
            <Text style={[s.tierDetails, { color: colors.textSecondary }]}>
              {parseFloat(tier.priceCents || '0') === 0
                ? 'Free'
                : `${currency} ${parseFloat(tier.priceCents || '0').toFixed(2)}`}
              {tier.capacity ? ` · ${tier.capacity} spots` : ''}
            </Text>
          </View>
          <Pressable onPress={() => removeTier(i)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Remove ${tier.name} tier`}>
            <Ionicons name="close-circle" size={22} color={CultureTokens.coral} />
          </Pressable>
        </View>
      ))}

      {showAddTier ? (
        <View style={[s.addTierForm, { backgroundColor: colors.surfaceElevated, borderColor: CultureTokens.gold + '40' }]}>
          <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>TIER NAME</Text>
          <View style={s.tierPresets}>
            {TIER_PRESETS.map((preset) => (
              <Pressable
                key={preset}
                onPress={() => setNewTier((t) => ({ ...t, name: preset }))}
                style={[s.tierPreset, { borderColor: newTier.name === preset ? CultureTokens.gold : colors.border, backgroundColor: newTier.name === preset ? CultureTokens.gold + '15' : colors.background }]}
                accessibilityRole="button"
              >
                <Text style={[s.tierPresetText, { color: newTier.name === preset ? CultureTokens.gold : colors.textSecondary }]}>{preset}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={[s.inlineInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
            value={newTier.name}
            onChangeText={(v) => setNewTier((t) => ({ ...t, name: v }))}
            placeholder="Or type custom tier name…"
            placeholderTextColor={colors.textTertiary}
          />
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>PRICE ({currency})</Text>
              <TextInput
                style={[s.inlineInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                value={newTier.priceCents}
                onChangeText={(v) => setNewTier((t) => ({ ...t, priceCents: v.replace(/[^0-9.]/g, '') }))}
                placeholder="0.00 = Free"
                placeholderTextColor={colors.textTertiary}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>CAPACITY</Text>
              <TextInput
                style={[s.inlineInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                value={newTier.capacity}
                onChangeText={(v) => setNewTier((t) => ({ ...t, capacity: v.replace(/[^0-9]/g, '') }))}
                placeholder="Unlimited"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
              />
            </View>
          </View>
          <View style={s.row}>
            <Button variant="outline" size="sm" onPress={() => setShowAddTier(false)} style={{ flex: 1 }}>Cancel</Button>
            <Button variant="primary" size="sm" onPress={addTier} style={{ flex: 1, backgroundColor: CultureTokens.gold }}>Add Tier</Button>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={() => { setShowAddTier(true); haptic(); }}
          style={[s.addTierBtn, { borderColor: CultureTokens.gold + '60', backgroundColor: CultureTokens.gold + '10' }]}
          accessibilityRole="button"
          accessibilityLabel="Add ticket tier"
        >
          <Ionicons name="add-circle-outline" size={22} color={CultureTokens.gold} />
          <Text style={[s.addTierText, { color: CultureTokens.gold }]}>Add Ticket Tier</Text>
        </Pressable>
      )}

      <Input
        label="Overall Capacity (optional)"
        value={form.capacity}
        onChangeText={(v) => setField('capacity', v.replace(/[^0-9]/g, ''))}
        placeholder="e.g. 500 total attendees"
        keyboardType="number-pad"
        leftIcon="people-outline"
        accessibilityLabel="Event capacity"
        containerStyle={{ marginTop: 8 }}
      />
    </View>
  );
}
