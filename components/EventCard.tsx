import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import CultureImage from '@/components/ui/CultureImage';
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens } from '@/constants/theme';
import { router } from 'expo-router';
import { useSaved } from '@/contexts/SavedContext';
import * as Haptics from 'expo-haptics';
import type { EventData } from '@/shared/schema';
import { useColors } from '@/hooks/useColors';
import { formatEventDateTime } from '@/lib/dateUtils';

interface EventCardProps {
  event: EventData;
  isLive?: boolean;
}

function EventCardInner({ event, isLive }: EventCardProps) {
  const colors = useColors();
  const styles = getStyles(colors);
  const { isEventSaved, toggleSaveEvent } = useSaved();
  const isSaved = isEventSaved(event.id);
  const [hovered, setHovered] = useState(false);

  const handleCardPress = useCallback(() => {
    router.push({ pathname: '/event/[id]', params: { id: event.id } });
  }, [event.id]);

  const handleSavePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleSaveEvent(event.id);
  }, [event.id, toggleSaveEvent]);

  const priceDisplay = event.priceLabel ?? (
    event.priceCents === 0 ? 'Free' :
    event.priceCents != null ? `$${(event.priceCents / 100).toFixed(2)}` :
    null
  );
  const ageBadge = event.ageSuitability && event.ageSuitability !== 'all'
    ? event.ageSuitability
    : null;

  return (
    <View style={[styles.card, Platform.OS === 'web' && hovered && styles.cardHovered]}>
      <Pressable
        style={({ pressed }) => [styles.cardTapArea, pressed && styles.cardPressed]}
        onPress={handleCardPress}
        onHoverIn={Platform.OS === 'web' ? () => setHovered(true) : undefined}
        onHoverOut={Platform.OS === 'web' ? () => setHovered(false) : undefined}
        accessibilityRole="button"
        accessibilityLabel={`Event: ${event.title}, on ${event.date}`}
        accessibilityHint={`Double tap to view details for ${event.title}`}
      >
        <View style={styles.imageContainer}>
          <CultureImage
            uri={event.imageUrl ?? undefined}
            style={styles.image}
            contentFit="cover"
            recyclingKey={`event-${event.id}`}
          />
          {ageBadge && (
            <View style={styles.ageBadge}>
              <Text style={styles.ageBadgeText}>{ageBadge}</Text>
            </View>
          )}

          {isLive && (
            <View style={styles.liveBadge}>
              <View style={[StyleSheet.absoluteFill, { backgroundColor: CultureTokens.coral, opacity: 0.9, borderRadius: 8 }]} />
              <Ionicons name="pulse" size={12} color="white" style={{ marginRight: 4 }} />
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
          )}
        </View>
        
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={12} color={CultureTokens.indigo} />
            <Text style={styles.date}>{formatEventDateTime(event.date, event.time)}</Text>
          </View>
          
          {event.venue ? (
            <View style={styles.meta}>
              <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.metaText} numberOfLines={1}>{event.venue}</Text>
            </View>
          ) : null}
          
          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              {event.category ? (
                <View style={[styles.categoryPill, { backgroundColor: CultureTokens.saffron + '15', borderColor: CultureTokens.saffron + '30' }]}>
                  <Text style={[styles.categoryText, { color: CultureTokens.saffron }]}>{event.category}</Text>
                </View>
              ) : null}
              {Array.from(new Set([...(event.cultureTags || []), ...(event.cultureTag || [])])).slice(0, 1).map((tag, idx) => (
                <View key={`culture-${idx}`} style={styles.richTagPill}>
                  <Text style={styles.richTagText}>{tag}</Text>
                </View>
              ))}
              {(event.accessibility || []).slice(0, 1).map((tag, idx) => (
                <View key={`acc-${idx}`} style={[styles.richTagPill, { borderColor: CultureTokens.coral + '60' }]}>
                  <Ionicons name="body-outline" size={10} color={CultureTokens.coral} style={{ marginRight: 2 }} />
                  <Text style={[styles.richTagText, { color: CultureTokens.coral }]}>{tag}</Text>
                </View>
              ))}
              {priceDisplay ? (
                <Text style={styles.price}>{priceDisplay}</Text>
              ) : null}
            </View>
          </View>
        </View>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.saveButtonFloating,
          pressed && { opacity: 0.7 }
        ]}
        onPress={handleSavePress}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={isSaved ? "Remove from saved events" : "Save event"}
      >
        <View style={[styles.saveIconBg, isSaved && { backgroundColor: CultureTokens.indigo + '20' }]}>
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={16}
          color={isSaved ? CultureTokens.indigo : colors.textSecondary}
          />
        </View>
      </Pressable>
    </View>
  );
}

// Memoize to avoid re-renders when parent re-renders with unchanged event data
const EventCard = React.memo(EventCardInner);
export default EventCard;

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
    position: 'relative',
  },
  cardTapArea: {
    width: '100%',
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
    backgroundColor: colors.backgroundSecondary,
  },
  cardHovered: {
    transform: [{ scale: 1.01 }],
    borderColor: colors.border,
  },
  imageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: colors.backgroundSecondary,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  ageBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: colors.overlay,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  ageBadgeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    color: colors.text,
    textTransform: 'uppercase',
  },
  info: {
    padding: 14,
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: colors.text,
    marginBottom: 4,
    lineHeight: 22,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  date: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: CultureTokens.indigo,
    flexShrink: 1,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  metaText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
  },
  richTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.3)',
  },
  richTagText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    color: '#888',
  },
  price: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: colors.text,
  },
  saveButtonFloating: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    padding: 2,
  },
  saveIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  liveBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    zIndex: 10,
    boxShadow: `0px 2px 4px 0px ${CultureTokens.coral}80`,
  },
  liveBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
