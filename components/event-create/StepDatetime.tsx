import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens } from '@/constants/theme';
import { Input } from '@/components/ui/Input';
import { DatePickerInput } from '@/components/ui/DatePickerInput';
import { useColors } from '@/hooks/useColors';
import { formatDateForCountry } from '@/lib/dateUtils';
import { FormData } from './types';
import type { CreateStyles } from './styles';

interface Props {
  form: FormData;
  setField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  colors: ReturnType<typeof useColors>;
  s: CreateStyles;
}

export function StepDatetime({ form, setField, colors, s }: Props) {
  return (
    <View style={s.fields}>
      <DatePickerInput
        label="Start Date *"
        value={form.date}
        onChangeDate={(v) => setField('date', v)}
        placeholder="Select start date"
        accessibilityLabel="Event start date"
        containerStyle={{ marginBottom: 20 }}
      />
      <DatePickerInput
        label="End Date (optional)"
        value={form.endDate}
        onChangeDate={(v) => setField('endDate', v)}
        placeholder="Select end date"
        accessibilityLabel="Event end date"
        containerStyle={{ marginBottom: 20 }}
      />
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Input
            label="Start Time"
            value={form.time}
            onChangeText={(v) => setField('time', v)}
            placeholder="18:30"
            keyboardType="numbers-and-punctuation"
            maxLength={5}
            accessibilityLabel="Event start time"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Input
            label="End Time"
            value={form.endTime}
            onChangeText={(v) => setField('endTime', v)}
            placeholder="22:00"
            keyboardType="numbers-and-punctuation"
            maxLength={5}
            accessibilityLabel="Event end time"
          />
        </View>
      </View>

      {form.date ? (
        <View style={[s.infoBox, { backgroundColor: CultureTokens.teal + '10', borderColor: CultureTokens.teal + '20', marginTop: 12 }]}>
          <Ionicons name="calendar-outline" size={18} color={CultureTokens.teal} />
          <Text style={[s.infoText, { color: colors.textSecondary }]}>
            Displaying as: {formatDateForCountry(form.date, form.country)}
          </Text>
        </View>
      ) : null}

      <View style={[s.infoBox, { backgroundColor: CultureTokens.indigo + '10', borderColor: CultureTokens.indigo + '20', marginTop: 8 }]}>
        <Ionicons name="information-circle-outline" size={18} color={CultureTokens.saffron} />
        <Text style={[s.infoText, { color: colors.textSecondary }]}>
          Time in 24h format (e.g. 18:30).
        </Text>
      </View>
    </View>
  );
}
