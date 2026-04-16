import React from 'react';
import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import {
  AccessibilityTokens,
  CardGrammarTokens,
  CultureTokens,
  MotionTokens,
} from '@/constants/theme';
import { Button } from '@/components/ui/Button';

interface CardGrammarProps {
  title: string;
  subtitle?: string;
  meta?: string;
  imageUrl?: string;
  trustChips?: string[];
  ctaLabel: string;
  onPress: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
  accessibilityLabel: string;
}

export function CardGrammar({
  title,
  subtitle,
  meta,
  imageUrl,
  trustChips = [],
  ctaLabel,
  onPress,
  iconName = 'sparkles-outline',
  accessibilityLabel,
}: CardGrammarProps) {
  const colors = useColors();
  const [isPressed, setIsPressed] = React.useState(false);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderLight,
          transform: [{ scale: isPressed ? MotionTokens.pressScale : 1 }],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        style={styles.tapArea}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <View style={[styles.imageWrap, { backgroundColor: colors.backgroundSecondary }]}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
          ) : (
            <View style={styles.imageFallback}>
              <Ionicons name={iconName} size={20} color={CultureTokens.indigo} />
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.trustRow}>
            {trustChips.slice(0, 2).map((chip) => (
              <View
                key={chip}
                style={[
                  styles.trustChip,
                  { backgroundColor: `${CultureTokens.indigo}16`, borderColor: `${CultureTokens.indigo}33` },
                ]}
              >
                <Text style={styles.trustChipText} numberOfLines={1}>
                  {chip}
                </Text>
              </View>
            ))}
          </View>

          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
          {meta ? (
            <Text style={[styles.meta, { color: colors.textTertiary }]} numberOfLines={1}>
              {meta}
            </Text>
          ) : null}
        </View>
      </Pressable>

      <View style={styles.ctaWrap}>
        <Button
          variant="primary"
          size="sm"
          fullWidth
          style={{ minHeight: AccessibilityTokens.minButtonHeight }}
          onPress={onPress}
          accessibilityLabel={ctaLabel}
        >
          {ctaLabel}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CardGrammarTokens.width,
    borderRadius: CardGrammarTokens.radius,
    borderWidth: CardGrammarTokens.borderWidth,
    overflow: 'hidden',
  },
  tapArea: {
    ...Platform.select({
      web: { cursor: 'pointer' as const },
      default: {},
    }),
  },
  imageWrap: {
    width: '100%',
    height: CardGrammarTokens.imageHeight,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: CardGrammarTokens.contentPadding,
    gap: CardGrammarTokens.contentGap,
  },
  ctaWrap: {
    paddingHorizontal: CardGrammarTokens.contentPadding,
    paddingBottom: CardGrammarTokens.contentPadding,
  },
  trustRow: {
    minHeight: 20,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  trustChip: {
    borderWidth: 1,
    borderRadius: CardGrammarTokens.trustChipRadius,
    paddingHorizontal: 8,
    paddingVertical: 3,
    justifyContent: 'center',
  },
  trustChipText: {
    color: CultureTokens.indigo,
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
  },
  title: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  meta: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 2,
  },
});
