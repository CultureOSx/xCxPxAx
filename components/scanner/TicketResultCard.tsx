import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TicketScanResult } from './types';
import { getOutcomeConfig } from './utils';
import { CultureTokens } from '@/constants/theme';

export function TicketResultCard({ result, onClose, onScanNext, onPrintBadge }: {
  result: TicketScanResult;
  onClose: () => void;
  onScanNext: () => void;
  onPrintBadge: () => void;
}) {
  const cfg = getOutcomeConfig(result);
  const t = result.ticket;

  return (
    <View style={[rs.card, { borderColor: cfg.color + '30' }]}>
      {/* Thin colored top stripe — status at a glance */}
      <View style={[rs.stripe, { backgroundColor: cfg.color }]} />

      {/* Status row */}
      <View style={rs.statusRow}>
        <View style={[rs.statusIconWrap, { backgroundColor: cfg.color + '18' }]}>
          <Ionicons name={cfg.icon as never} size={22} color={cfg.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[rs.statusTitle, { color: cfg.color }]}>{cfg.title}</Text>
          <Text style={rs.statusMsg} numberOfLines={1}>{result.message}</Text>
        </View>
        <Pressable onPress={onClose} style={rs.closeBtn} accessibilityRole="button" accessibilityLabel="Dismiss">
          <Ionicons name="close" size={16} color="rgba(255,255,255,0.5)" />
        </Pressable>
      </View>

      {/* Ticket details */}
      {t && (
        <View style={rs.details}>
          <Text style={rs.eventTitle} numberOfLines={2}>{t.eventTitle}</Text>

          <View style={rs.metaRow}>
            {t.eventDate && (
              <View style={rs.metaItem}>
                <Ionicons name="calendar-outline" size={12} color={CultureTokens.indigo} />
                <Text style={rs.metaText}>{t.eventDate}</Text>
              </View>
            )}
            {t.eventTime && (
              <View style={rs.metaItem}>
                <Ionicons name="time-outline" size={12} color={CultureTokens.saffron} />
                <Text style={rs.metaText}>{t.eventTime}</Text>
              </View>
            )}
            {t.eventVenue && (
              <View style={rs.metaItem}>
                <Ionicons name="location-outline" size={12} color={CultureTokens.coral} />
                <Text style={rs.metaText} numberOfLines={1}>{t.eventVenue}</Text>
              </View>
            )}
          </View>

          <View style={rs.chipRow}>
            {t.tierName && (
              <View style={[rs.chip, { backgroundColor: CultureTokens.indigo + '20' }]}>
                <Text style={[rs.chipText, { color: CultureTokens.indigo }]}>{t.tierName}</Text>
              </View>
            )}
            <View style={[rs.chip, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
              <Text style={[rs.chipText, { color: 'rgba(255,255,255,0.5)' }]}>{t.quantity || 1}×</Text>
            </View>
            {t.ticketCode && (
              <View style={[rs.chip, { backgroundColor: cfg.color + '15', marginLeft: 'auto' }]}>
                <Text style={[rs.chipText, { color: cfg.color, letterSpacing: 0.8 }]}>{t.ticketCode}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={rs.actions}>
        <Pressable style={rs.actionSecondary} onPress={onClose} accessibilityRole="button">
          <Text style={rs.actionSecondaryText}>Done</Text>
        </Pressable>
        {t?.id && (
          <Pressable style={rs.actionSecondary} onPress={onPrintBadge} accessibilityRole="button">
            <Ionicons name="print-outline" size={14} color={CultureTokens.warning} />
            <Text style={[rs.actionSecondaryText, { color: CultureTokens.warning }]}>Print</Text>
          </Pressable>
        )}
        <Pressable style={[rs.actionPrimary, { backgroundColor: CultureTokens.indigo }]} onPress={onScanNext} accessibilityRole="button">
          <Ionicons name="camera-outline" size={14} color="#fff" />
          <Text style={rs.actionPrimaryText}>Scan Next</Text>
        </Pressable>
      </View>
    </View>
  );
}

const rs = StyleSheet.create({
  card:               { borderRadius: 14, overflow: 'hidden', borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.03)' },
  stripe:             { height: 3, width: '100%' },
  statusRow:          { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10 },
  statusIconWrap:     { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statusTitle:        { fontSize: 15, fontFamily: 'Poppins_700Bold' },
  statusMsg:          { fontSize: 12, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.55)', marginTop: 1 },
  closeBtn:           { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  details:            { paddingHorizontal: 14, paddingBottom: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 12 },
  eventTitle:         { fontSize: 15, fontFamily: 'Poppins_700Bold', color: '#FFFFFF', marginBottom: 8 },
  metaRow:            { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  metaItem:           { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:           { fontSize: 12, fontFamily: 'Poppins_500Medium', color: 'rgba(255,255,255,0.65)' },
  chipRow:            { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chip:               { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7 },
  chipText:           { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  actions:            { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  actionSecondary:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  actionSecondaryText:{ fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: 'rgba(255,255,255,0.65)' },
  actionPrimary:      { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 9 },
  actionPrimaryText:  { fontSize: 13, fontFamily: 'Poppins_700Bold', color: '#fff' },
});
