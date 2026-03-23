import React from 'react';
import { View, Text } from 'react-native';
import { useColors } from '@/hooks/useColors';

export function Field({
  label,
  children,
  colors,
}: {
  label: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Text>
      {children}
    </View>
  );
}
