import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { listCultureHubFocusCountries, getRegionsForCountry } from '@/lib/marketplaceLocation';
import { useLocations } from '@/hooks/useLocations';
import { CultureTokens } from '@/constants/theme';
import { TextStyles } from '@/constants/typography';

type Props = {
  visible: boolean;
  onClose: () => void;
  initialCountry: string;
  initialStateCode: string | undefined;
  onApply: (country: string, stateCode: string | undefined) => void;
};

export function CultureHubLocationModal({
  visible,
  onClose,
  initialCountry,
  initialStateCode,
  onApply,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { states: auStates } = useLocations();
  const [country, setCountry] = useState(initialCountry);
  const [stateCode, setStateCode] = useState<string | undefined>(initialStateCode);

  useEffect(() => {
    if (!visible) return;
    setCountry(initialCountry);
    setStateCode(initialStateCode);
  }, [visible, initialCountry, initialStateCode]);

  const countries = useMemo(() => listCultureHubFocusCountries(), []);
  const regions = useMemo(() => getRegionsForCountry(country, auStates), [country, auStates]);

  const haptic = () => {
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
  };

  const pickCountry = (name: string) => {
    haptic();
    setCountry(name);
    setStateCode(undefined);
  };

  const apply = () => {
    haptic();
    onApply(country, stateCode);
    onClose();
  };

  const bottomPad = Math.max(insets.bottom, 16);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.sheet, { backgroundColor: colors.background, paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <Text style={[TextStyles.title3, { color: colors.text, flex: 1 }]}>Where to look</Text>
          <Pressable
            onPress={() => {
              haptic();
              onClose();
            }}
            hitSlop={12}
            accessibilityLabel="Close"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={28} color={colors.textSecondary} />
          </Pressable>
        </View>
        <Text style={[TextStyles.caption, { color: colors.textTertiary, marginBottom: 16, paddingHorizontal: 4 }]}>
          Choose a country (e.g. all Kerala or Gujarati events in Australia or the US). Optionally narrow to a state or
          region.
        </Text>

        <Text style={[TextStyles.callout, { color: colors.text, marginBottom: 8 }]}>Country</Text>
        <ScrollView
          style={{ maxHeight: 200 }}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {countries.map((c) => {
            const active = c.name === country;
            return (
              <Pressable
                key={c.name}
                onPress={() => pickCountry(c.name)}
                style={[
                  styles.row,
                  {
                    backgroundColor: active ? CultureTokens.indigo + '18' : colors.surface,
                    borderColor: active ? CultureTokens.indigo : colors.borderLight,
                  },
                ]}
                accessibilityLabel={`${c.name}${active ? ', selected' : ''}`}
                accessibilityRole="button"
              >
                <Text style={{ fontSize: 22, marginRight: 12 }}>{c.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[TextStyles.callout, { color: colors.text }]}>{c.name}</Text>
                  <Text style={[TextStyles.caption, { color: colors.textTertiary }]}>{c.hint}</Text>
                </View>
                {active && <Ionicons name="checkmark-circle" size={22} color={CultureTokens.indigo} />}
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={[TextStyles.callout, { color: colors.text, marginTop: 20, marginBottom: 8 }]}>
          State / region
        </Text>
        <ScrollView
          style={{ flex: 1, maxHeight: 320 }}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
        >
          <Pressable
            onPress={() => {
              haptic();
              setStateCode(undefined);
            }}
            style={[
              styles.row,
              {
                backgroundColor: stateCode === undefined ? CultureTokens.gold + '22' : colors.surface,
                borderColor: stateCode === undefined ? CultureTokens.gold : colors.borderLight,
              },
            ]}
            accessibilityLabel={`Entire ${country}${stateCode === undefined ? ', selected' : ''}`}
            accessibilityRole="button"
          >
            <Ionicons name="earth-outline" size={22} color={CultureTokens.indigo} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={[TextStyles.callout, { color: colors.text }]}>Entire {country}</Text>
              <Text style={[TextStyles.caption, { color: colors.textTertiary }]}>
                All tagged events in this country
              </Text>
            </View>
            {stateCode === undefined && <Ionicons name="checkmark-circle" size={22} color={CultureTokens.gold} />}
          </Pressable>

          {regions.length === 0 && country === 'India' && (
            <Text style={[TextStyles.caption, { color: colors.textTertiary, marginTop: 8, paddingHorizontal: 4 }]}>
              Use “Entire India” for now — state filters for India are coming as we normalise event regions.
            </Text>
          )}

          {regions.map((r) => {
            const active = r.code === stateCode;
            return (
              <Pressable
                key={r.code}
                onPress={() => {
                  haptic();
                  setStateCode(r.code);
                }}
                style={[
                  styles.row,
                  {
                    backgroundColor: active ? CultureTokens.indigo + '18' : colors.surface,
                    borderColor: active ? CultureTokens.indigo : colors.borderLight,
                  },
                ]}
                accessibilityLabel={`${r.name}${active ? ', selected' : ''}`}
                accessibilityRole="button"
              >
                <Text style={{ fontSize: 20, marginRight: 12 }}>{r.emoji}</Text>
                <Text style={[TextStyles.callout, { color: colors.text, flex: 1 }]}>{r.name}</Text>
                {active && <Ionicons name="checkmark-circle" size={22} color={CultureTokens.indigo} />}
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable
          onPress={apply}
          style={[styles.applyBtn, { backgroundColor: CultureTokens.indigo, marginBottom: bottomPad }]}
          accessibilityLabel="Apply location"
          accessibilityRole="button"
        >
          <Text style={[TextStyles.callout, { color: colors.textOnBrandGradient, fontFamily: 'Poppins_600SemiBold' }]}>
            Apply
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  applyBtn: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
});
