import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, FontFamily, FontSize, LineHeight } from '@/constants/theme';
import { DISCOVER_TOKENS } from '@/components/Discover/tokens';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  /** Small caps label above the title (e.g. SPOTLIGHT, LISTEN). */
  eyebrow?: string;
  accentColor?: string;
  onSeeAll?: () => void;
  /** Override default “See all” (e.g. “Browse artists”). */
  seeAllLabel?: string;
}

function SectionHeader({
  title,
  subtitle,
  eyebrow,
  accentColor,
  onSeeAll,
  seeAllLabel,
}: SectionHeaderProps) {
  const colors = useColors();
  const accent = accentColor ?? CultureTokens.indigo;
  const gradientEnd = accent === CultureTokens.indigo ? CultureTokens.teal : CultureTokens.indigo;

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[accent, gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.accentBar}
      />

      <View style={styles.textBlock}>
        {eyebrow ? (
          <Text
            style={[styles.eyebrow, { color: accent }]}
            maxFontSizeMultiplier={1.4}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            {eyebrow.toUpperCase()}
          </Text>
        ) : null}
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
          accessibilityLabel={`${seeAllLabel ?? 'See all'} — ${title}`}
        >
          <Text style={[styles.seeAllText, { color: accent }]}>{seeAllLabel ?? 'See all'}</Text>
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
    marginBottom: DISCOVER_TOKENS.sectionHeader.bottomSpacing,
    gap: DISCOVER_TOKENS.sectionHeader.rowGap,
  },
  accentBar: {
    width: DISCOVER_TOKENS.sectionHeader.accentWidth,
    height: DISCOVER_TOKENS.sectionHeader.accentHeight,
    borderRadius: DISCOVER_TOKENS.sectionHeader.accentRadius,
    flexShrink: 0,
  },
  textBlock: { flex: 1, gap: DISCOVER_TOKENS.sectionHeader.subtitleGap },
  eyebrow: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    letterSpacing: 1.4,
    lineHeight: 14,
    opacity: 0.92,
    marginBottom: 1,
  },
  title: {
    fontSize: FontSize.title3,
    fontFamily: FontFamily.bold,
    letterSpacing: -0.3,
    lineHeight: LineHeight.title3,
  },
  subtitle: {
    fontSize: FontSize.chip,
    fontFamily: FontFamily.regular,
    lineHeight: LineHeight.chip + 2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DISCOVER_TOKENS.sectionHeader.actionGap,
    paddingVertical: DISCOVER_TOKENS.sectionHeader.actionPaddingY,
    paddingLeft: DISCOVER_TOKENS.sectionHeader.actionPaddingLeft,
    paddingRight: DISCOVER_TOKENS.sectionHeader.actionPaddingRight,
    flexShrink: 0,
    minHeight: DISCOVER_TOKENS.sectionHeader.actionMinTouch,
  },
  seeAllText: {
    fontSize: FontSize.chip,
    fontFamily: FontFamily.semibold,
  },
});

export default React.memo(SectionHeader);
