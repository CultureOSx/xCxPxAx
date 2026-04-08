import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import CultureImage from '@/components/ui/CultureImage';
import { CultureTagRow } from '@/components/ui/CultureTag';
import { CultureTokens } from '@/constants/theme';
import { useSaved } from '@/contexts/SavedContext';
import { useColors } from '@/hooks/useColors';
import { formatEventDateTime } from '@/lib/dateUtils';
import type { EventData } from '@/shared/schema';

interface EventCardProps {
  event: EventData;
  isLive?: boolean;
  canEdit?: boolean;
  onEdit?: (event: EventData) => void;
  onDelete?: (event: EventData) => void;
}

function EventCardInner({ event, isLive, canEdit, onEdit, onDelete }: EventCardProps) {
  const colors = useColors();
  const { isEventSaved, toggleSaveEvent } = useSaved();
  const isSaved = isEventSaved(event.id);
  const [hovered, setHovered] = useState(false);
  const [showUndo, setShowUndo] = useState(false);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) {
        clearTimeout(deleteTimerRef.current);
      }
    };
  }, []);

  const handleCardPress = useCallback(() => {
    router.push({ pathname: '/event/[id]', params: { id: event.id } });
  }, [event.id]);

  const handleSavePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleSaveEvent(event.id);
  }, [event.id, toggleSaveEvent]);

  const handleEdit = useCallback(() => {
    onEdit?.(event);
  }, [event, onEdit]);

  const handleDelete = useCallback(() => {
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current);
    }
    setShowUndo(true);
    deleteTimerRef.current = setTimeout(() => {
      onDelete?.(event);
      setShowUndo(false);
      deleteTimerRef.current = null;
    }, 3500);
  }, [event, onDelete]);

  const handleUndo = useCallback(() => {
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }
    setShowUndo(false);
  }, []);

  const priceDisplay =
    event.priceLabel ??
    (event.priceCents === 0
      ? 'Free'
      : event.priceCents != null
        ? `$${(event.priceCents / 100).toFixed(2)}`
        : null);

  const isFreeDisplay =
    priceDisplay != null && String(priceDisplay).trim().toLowerCase() === 'free';

  const ageBadge =
    event.ageSuitability && event.ageSuitability !== 'all' ? event.ageSuitability : null;

  const cultureTags = Array.from(
    new Set([...(event.cultureTags ?? []), ...(event.cultureTag ?? [])]),
  ).slice(0, 1);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.borderLight },
        Platform.OS === 'web' && hovered && { borderColor: colors.border, transform: [{ scale: 1.01 }] },
      ]}
    >
      <Pressable
        style={({ pressed }) => [
          styles.cardTapArea,
          pressed && { opacity: 0.9, transform: [{ scale: 0.98 }], backgroundColor: colors.backgroundSecondary },
        ]}
        onPress={handleCardPress}
        onHoverIn={Platform.OS === 'web' ? () => setHovered(true) : undefined}
        onHoverOut={Platform.OS === 'web' ? () => setHovered(false) : undefined}
        accessibilityRole="button"
        accessibilityLabel={`Event: ${event.title}, on ${event.date}`}
        accessibilityHint={`Double tap to view details for ${event.title}`}
      >
        <View style={[styles.imageContainer, { backgroundColor: colors.backgroundSecondary }]}>
          <CultureImage
            uri={event.imageUrl ?? undefined}
            style={styles.image}
            contentFit="cover"
            recyclingKey={`event-${event.id}`}
          />
          {ageBadge ? (
            <View style={[styles.ageBadge, { backgroundColor: colors.overlay, borderColor: colors.borderLight }]}>
              <Text style={[styles.ageBadgeText, { color: colors.text }]}>{ageBadge}</Text>
            </View>
          ) : null}
          {isLive ? (
            <View style={styles.liveBadge}>
              <View
                style={[StyleSheet.absoluteFill, { backgroundColor: CultureTokens.coral, opacity: 0.9, borderRadius: 8 }]}
              />
              <Ionicons name="pulse" size={12} color="white" style={{ marginRight: 4 }} />
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {event.title}
          </Text>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={12} color={CultureTokens.gold} />
            <Text style={styles.date}>{formatEventDateTime(event.date, event.time)}</Text>
          </View>

          {event.venue ? (
            <View style={styles.meta}>
              <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
                {event.venue}
              </Text>
            </View>
          ) : null}

          <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
            <View style={styles.footerLeft}>
              {event.category ? (
                <View
                  style={[
                    styles.categoryPill,
                    { backgroundColor: CultureTokens.gold + '15', borderColor: CultureTokens.gold + '30' },
                  ]}
                >
                  <Text style={[styles.categoryText, { color: CultureTokens.gold }]}>
                    {event.category}
                  </Text>
                </View>
              ) : null}
              <CultureTagRow tags={cultureTags} max={2} />
              {(event.accessibility ?? []).slice(0, 1).map((tag, idx) => (
                <View key={`acc-${idx}`} style={[styles.richTagPill, { borderColor: CultureTokens.coral + '60' }]}>
                  <Ionicons name="body-outline" size={10} color={CultureTokens.coral} style={{ marginRight: 2 }} />
                  <Text style={[styles.richTagText, { color: CultureTokens.coral }]}>{tag}</Text>
                </View>
              ))}
              {priceDisplay ? (
                <Text style={[styles.price, { color: isFreeDisplay ? CultureTokens.teal : colors.text }]}>
                  {priceDisplay}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.saveButtonFloating, pressed && { opacity: 0.7 }]}
        onPress={handleSavePress}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={isSaved ? 'Remove from saved events' : 'Save event'}
      >
        <View
          style={[
            styles.saveIconBg,
            { backgroundColor: colors.backgroundSecondary },
            isSaved && { backgroundColor: CultureTokens.indigo + '20' },
          ]}
        >
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={16}
            color={isSaved ? CultureTokens.indigo : colors.textSecondary}
          />
        </View>
      </Pressable>

      {canEdit ? (
        <View style={styles.crudActionsRow}>
          <Pressable
            onPress={handleEdit}
            style={({ pressed }) => [styles.crudBtn, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel={`Edit event ${event.title}`}
          >
            <Ionicons name="create-outline" size={18} color={CultureTokens.indigo} />
          </Pressable>
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [styles.crudBtn, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel={`Delete event ${event.title}`}
          >
            <Ionicons name="trash-outline" size={18} color={CultureTokens.coral} />
          </Pressable>
        </View>
      ) : null}

      {showUndo ? (
        <View style={styles.snackbar} accessibilityLiveRegion="polite">
          <Text style={styles.snackbarText}>Event deleted</Text>
          <Pressable onPress={handleUndo} accessibilityRole="button" accessibilityLabel="Undo delete">
            <Text style={styles.snackbarUndo}>Undo</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const EventCard = React.memo(EventCardInner);
export default EventCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  cardTapArea: {
    width: '100%',
  },
  imageContainer: {
    width: '100%',
    height: 140,
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
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  ageBadgeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    textTransform: 'uppercase',
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
  },
  liveBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  info: {
    padding: 14,
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
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
    color: CultureTokens.gold,
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
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 10,
    borderTopWidth: 1,
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
  },
  crudActionsRow: {
    flexDirection: 'row',
    position: 'absolute',
    top: 10,
    right: 10,
    gap: 8,
    zIndex: 10,
  },
  crudBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#eee',
  },
  snackbar: {
    position: 'absolute',
    bottom: 18,
    left: 18,
    right: 18,
    backgroundColor: '#222',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  snackbarText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
  },
  snackbarUndo: {
    color: CultureTokens.gold,
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    marginLeft: 18,
  },
});
