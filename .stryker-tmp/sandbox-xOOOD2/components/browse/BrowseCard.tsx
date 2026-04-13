// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { TextStyles } from '@/constants/typography';
import { Card } from '@/components/ui/Card';
import { CultureTokens } from '@/constants/theme';
import type { BrowseItem } from '@/components/BrowsePage';

interface BrowseCardProps {
  item: BrowseItem;
  layout: 'list' | 'grid';
  accentColor: string;
  accentIcon: string;
  imageRatio?: number;
  onPress: (item: BrowseItem) => void;
  renderExtra?: (item: BrowseItem) => React.ReactNode;
}

export function BrowseCardComponent({ 
  item, 
  layout, 
  accentColor, 
  accentIcon, 
  imageRatio = 1, 
  onPress, 
  renderExtra 
}: BrowseCardProps) {
  const colors = useColors();
  const isGrid = layout === 'grid';

  const handlePress = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(item);
  };

  return (
    <Card
      padding={isGrid ? 0 : 14}
      radius={16}
      style={[
        styles.card, 
        { backgroundColor: colors.surface, borderColor: colors.borderLight },
        isGrid && styles.gridCard,
      ]}
      onPress={handlePress}
    >
      <View style={isGrid ? [styles.gridImageWrap, { aspectRatio: imageRatio }] : styles.cardImage}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" transition={200} />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, styles.cardImageFallback, { backgroundColor: colors.surfaceElevated, borderColor: accentColor + '35' }]}>
            <Ionicons name={accentIcon as keyof typeof Ionicons.glyphMap} size={isGrid ? 32 : 28} color={accentColor} />
          </View>
        )}
        {isGrid && item.badge && (
          <View style={styles.gridBadge}>
            <Text style={[TextStyles.badgeCaps, { color: '#FFFFFF', fontSize: 9 }]}>{item.badge}</Text>
          </View>
        )}
      </View>

      <View
        style={[
          styles.cardInfo,
          isGrid && styles.gridInfo,
          isGrid && { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.borderLight },
        ]}
      >
        <View style={styles.cardTitleRow}>
          <Text 
            style={[
              isGrid ? TextStyles.labelSemibold : TextStyles.headline, 
              { color: colors.text }
            ]} 
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {item.isPromoted && (
            <View style={[styles.miniPromoBadge, { borderColor: accentColor + '55' }]}>
              <Ionicons name="star" size={10} color={isGrid ? '#FFFFFF' : colors.text} />
            </View>
          )}
        </View>
        
        {item.subtitle && (
          <Text 
            style={[
              TextStyles.caption, 
              { color: colors.textSecondary }
            ]} 
            numberOfLines={1}
          >
            {item.subtitle}
          </Text>
        )}

        {!isGrid && item.description && (
          <Text style={[TextStyles.caption, { color: colors.textTertiary, marginTop: 4 }]} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.cardBottom}>
          {item.priceLabel && (
            <Text style={[TextStyles.callout, { color: accentColor, fontWeight: '700' }]}>
              {item.priceLabel}
            </Text>
          )}
          {!isGrid && item.badge && (
            <View style={[styles.cardBadge, { backgroundColor: colors.surfaceElevated, borderColor: accentColor + '30' }]}>
              <Text style={[TextStyles.badgeCaps, { color: colors.textSecondary }]}>{item.badge}</Text>
            </View>
          )}
          {item.rating != null && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color={CultureTokens.gold} />
              <Text style={[TextStyles.captionSemibold, { color: colors.textSecondary }]}>
                {item.rating}{item.reviews ? ` (${item.reviews})` : ''}
              </Text>
            </View>
          )}
        </View>
        {renderExtra?.(item)}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', borderWidth: 1, gap: 14, overflow: 'hidden' },
  gridCard: { flexDirection: 'column', gap: 0 },
  cardImage: { width: 80, height: 80, borderRadius: 12, overflow: 'hidden' },
  gridImageWrap: { width: '100%', overflow: 'hidden' },
  cardImageFallback: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  gridBadge: { 
    position: 'absolute', 
    top: 8, 
    right: 8, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 4, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.15)' 
  },
  cardInfo: { flex: 1, gap: 2, justifyContent: 'center' },
  gridInfo: { padding: 10, gap: 2 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  miniPromoBadge: { 
    width: 18, 
    height: 18, 
    borderRadius: 9, 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.2)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  cardBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});

// ⚡ Performance Optimization: Added React.memo to prevent unnecessary re-renders in lists
export const BrowseCard = React.memo(BrowseCardComponent);
