// @ts-nocheck
import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, FontFamily, FontSize, LineHeight } from '@/constants/theme';

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
      {/* Gradient accent bar — "Vibrant & Block-based" visual identity */}
      <LinearGradient
        colors={[accent, accent === CultureTokens.indigo ? CultureTokens.teal : CultureTokens.indigo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.accentBar}
      />

      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: colors.text }]} maxFontSizeMultiplier={1.6}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.5}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {onSeeAll && (
        <Pressable
          style={[styles.seeAllBtn, Platform.OS === 'web' && { cursor: 'pointer' as const }]}
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
    marginBottom: 16,
    gap: 14,
  },
  accentBar: {
    width: 4,
    height: 42,
    borderRadius: 3,
    flexShrink: 0,
  },
  textBlock: { flex: 1, gap: 3 },
  title: {
    fontSize: FontSize.title3,
    fontFamily: FontFamily.bold,
    letterSpacing: -0.3,
    lineHeight: LineHeight.title3,
  },
  subtitle: {
    fontSize: FontSize.chip,
    fontFamily: FontFamily.regular,
    lineHeight: LineHeight.chip,
    opacity: 0.75,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 10,
    paddingLeft: 8,
    paddingRight: 2,
    flexShrink: 0,
    minHeight: 44,
  },
  seeAllText: {
    fontSize: FontSize.chip,
    fontFamily: FontFamily.semibold,
  },
});

export default React.memo(SectionHeader);
