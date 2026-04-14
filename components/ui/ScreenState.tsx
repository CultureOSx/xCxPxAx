import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Button } from '@/components/ui/Button';
import { FontFamily, CardTokens } from '@/constants/theme';

interface ScreenStateCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: string;
}

export function ScreenStateCard({ icon, title, message, actionLabel, onAction }: ScreenStateCardProps) {
  const colors = useColors();
  return (
    <View style={[ss.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <Ionicons name={icon} size={48} color={colors.textTertiary} />
      <Text style={[ss.title, { color: colors.text }]}>{title}</Text>
      {message ? <Text style={[ss.message, { color: colors.textSecondary }]}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Button variant="outline" size="md" onPress={onAction} style={{ marginTop: 16 }}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

const ss = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    borderRadius: CardTokens.radius,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  title: { fontFamily: FontFamily.semibold, fontSize: 18, textAlign: 'center' },
  message: { fontFamily: FontFamily.regular, fontSize: 14, textAlign: 'center', maxWidth: 320, lineHeight: 20 },
});
