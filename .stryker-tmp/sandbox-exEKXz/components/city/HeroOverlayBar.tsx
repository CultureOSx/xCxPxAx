// @ts-nocheck
import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens } from '@/constants/theme';

const SCRIM_BG = 'rgba(0,0,0,0.58)';
const SCRIM_BORDER = 'rgba(255,255,255,0.32)';
const ICON_TEXT = '#FFFFFF';

const webCursor = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : {};

export type HeroOverlayBarProps = {
  paddingTop: number;
  centerLabel: string;
  onBack: () => void;
  onShare: () => void;
  /** When set, center is tappable (e.g. location picker). */
  onCenterPress?: () => void;
  backA11y?: string;
  shareA11y?: string;
  centerA11y?: string;
};

/**
 * High-contrast hero controls for photos with bright skies — avoids washed-out glass-only chrome.
 */
export function HeroOverlayBar({
  paddingTop,
  centerLabel,
  onBack,
  onShare,
  onCenterPress,
  backA11y = 'Go back',
  shareA11y = 'Share',
  centerA11y,
}: HeroOverlayBarProps) {
  const centerContent = (
    <>
      <Ionicons name="location" size={14} color={CultureTokens.gold} />
      <Text style={styles.chipText} numberOfLines={2}>
        {centerLabel}
      </Text>
      {onCenterPress ? (
        <Ionicons name="chevron-down" size={14} color={ICON_TEXT} style={{ opacity: 0.92 }} />
      ) : null}
    </>
  );

  return (
    <View style={[styles.row, { paddingTop }]}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [styles.circle, pressed && styles.pressed, webCursor]}
        accessibilityRole="button"
        accessibilityLabel={backA11y}
      >
        <Ionicons name="chevron-back" size={24} color={ICON_TEXT} />
      </Pressable>

      {onCenterPress ? (
        <Pressable
          onPress={onCenterPress}
          style={({ pressed }) => [styles.chip, pressed && styles.pressed, webCursor]}
          accessibilityRole="button"
          accessibilityLabel={centerA11y ?? `Location: ${centerLabel}. Tap to change.`}
        >
          {centerContent}
        </Pressable>
      ) : (
        <View
          style={styles.chip}
          accessibilityLabel={centerA11y ?? centerLabel}
          accessibilityRole="text"
        >
          {centerContent}
        </View>
      )}

      <Pressable
        onPress={onShare}
        style={({ pressed }) => [styles.circle, pressed && styles.pressed, webCursor]}
        accessibilityRole="button"
        accessibilityLabel={shareA11y}
      >
        <Ionicons name="share-social-outline" size={22} color={ICON_TEXT} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    zIndex: 12,
  },
  pressed: { opacity: 0.88 },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: SCRIM_BG,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: SCRIM_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
      },
      android: { elevation: 6 },
      web: { boxShadow: '0 2px 12px rgba(0,0,0,0.45)' },
    }),
  },
  chip: {
    flex: 1,
    maxWidth: '56%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: SCRIM_BG,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: SCRIM_BORDER,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 5,
      },
      android: { elevation: 5 },
      web: { boxShadow: '0 2px 12px rgba(0,0,0,0.4)' },
    }),
  },
  chipText: {
    flex: 1,
    color: ICON_TEXT,
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    lineHeight: 16,
  },
});
