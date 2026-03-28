import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { CultureTokens } from '@/constants/theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  accentColor?: string;
  onSeeAll?: () => void;
}

function SectionHeader({ title, subtitle, accentColor, onSeeAll }: SectionHeaderProps) {
  const colors = useColors();
  const accent = accentColor ?? CultureTokens.indigo;

  return (
    <View style={styles.wrap}>
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: accent }]} />

      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>

      {onSeeAll && (
        <Pressable
          style={styles.seeAllBtn}
          onPress={onSeeAll}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={`See all ${title}`}
        >
          <Text style={[styles.seeAllText, { color: accent }]}>See all</Text>
          <Ionicons name="chevron-forward" size={13} color={accent} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  accentBar: {
    width: 4,
    height: 36,
    borderRadius: 2,
    flexShrink: 0,
  },
  textBlock: { flex: 1 },
  title: {
    fontSize: 19,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
    lineHeight: 18,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    flexShrink: 0,
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
});

export default React.memo(SectionHeader);
