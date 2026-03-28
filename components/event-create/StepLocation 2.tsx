import React from 'react';
import { View } from 'react-native';
import { Input } from '@/components/ui/Input';
import { useColors } from '@/hooks/useColors';
import { FormData } from './types';
import type { CreateStyles } from './styles';

interface Props {
  form: FormData;
  setField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  colors: ReturnType<typeof useColors>;
  s: CreateStyles;
}

export function StepLocation({ form, setField, s }: Props) {
  return (
    <View style={s.fields}>
      <Input
        label="Venue Name"
        value={form.venue}
        onChangeText={(v) => setField('venue', v)}
        placeholder="e.g. Sydney Town Hall"
        autoCapitalize="words"
        accessibilityLabel="Venue name"
        containerStyle={{ marginBottom: 20 }}
      />
      <Input
        label="Street Address"
        value={form.address}
        onChangeText={(v) => setField('address', v)}
        placeholder="e.g. 483 George St, Sydney NSW 2000"
        autoCapitalize="words"
        accessibilityLabel="Street address"
        containerStyle={{ marginBottom: 20 }}
      />
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Input
            label="City *"
            value={form.city}
            onChangeText={(v) => setField('city', v)}
            placeholder="Sydney"
            autoCapitalize="words"
            accessibilityLabel="City"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Input
            label="Country"
            value={form.country}
            onChangeText={(v) => setField('country', v)}
            placeholder="Australia"
            autoCapitalize="words"
            accessibilityLabel="Country"
          />
        </View>
      </View>
    </View>
  );
}
