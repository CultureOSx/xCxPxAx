/**
 * CultureTag — branded chip for culture/heritage tags.
 * Colour-mapped by tag name with flag emoji prefix.
 * Use anywhere cultureTags / cultureTag arrays are rendered.
 */
// @ts-nocheck

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// ── Culture → { color, bg, flag } ────────────────────────────────────────────

const CULTURE_MAP: Record<string, { color: string; bg: string; flag: string }> = {
  // South Asian
  indian:       { color: '#FF6B00', bg: '#FF6B0018', flag: '🇮🇳' },
  hindi:        { color: '#FF6B00', bg: '#FF6B0018', flag: '🇮🇳' },
  punjabi:      { color: '#FF8C00', bg: '#FF8C0018', flag: '🇮🇳' },
  bengali:      { color: '#E63946', bg: '#E6394618', flag: '🇧🇩' },
  tamil:        { color: '#D62839', bg: '#D6283918', flag: '🇱🇰' },
  telugu:       { color: '#C77DFF', bg: '#C77DFF18', flag: '🇮🇳' },
  malayali:     { color: '#00897B', bg: '#00897B18', flag: '🌴' },
  kerala:       { color: '#00897B', bg: '#00897B18', flag: '🌴' },
  malayalam:    { color: '#00897B', bg: '#00897B18', flag: '🌴' },
  kannada:      { color: '#F4A261', bg: '#F4A26118', flag: '🇮🇳' },
  gujarati:     { color: '#E76F51', bg: '#E76F5118', flag: '🇮🇳' },
  marathi:      { color: '#E9C46A', bg: '#E9C46A18', flag: '🇮🇳' },
  nepali:       { color: '#1D3557', bg: '#1D355718', flag: '🇳🇵' },
  sinhala:      { color: '#8B0000', bg: '#8B000018', flag: '🇱🇰' },
  pakistani:    { color: '#006600', bg: '#00660018', flag: '🇵🇰' },
  urdu:         { color: '#006600', bg: '#00660018', flag: '🇵🇰' },
  bangladeshi:  { color: '#006A4E', bg: '#006A4E18', flag: '🇧🇩' },

  // East Asian
  chinese:      { color: '#C0392B', bg: '#C0392B18', flag: '🇨🇳' },
  mandarin:     { color: '#C0392B', bg: '#C0392B18', flag: '🇨🇳' },
  cantonese:    { color: '#E74C3C', bg: '#E74C3C18', flag: '🇭🇰' },
  hongkong:     { color: '#E74C3C', bg: '#E74C3C18', flag: '🇭🇰' },
  taiwanese:    { color: '#1B4F72', bg: '#1B4F7218', flag: '🇹🇼' },
  japanese:     { color: '#BC002D', bg: '#BC002D18', flag: '🇯🇵' },
  korean:       { color: '#003478', bg: '#00347818', flag: '🇰🇷' },
  vietnamese:   { color: '#D62828', bg: '#D6282818', flag: '🇻🇳' },
  thai:         { color: '#2D6A4F', bg: '#2D6A4F18', flag: '🇹🇭' },
  filipino:     { color: '#0038A8', bg: '#0038A818', flag: '🇵🇭' },
  tagalog:      { color: '#0038A8', bg: '#0038A818', flag: '🇵🇭' },
  indonesian:   { color: '#CE1126', bg: '#CE112618', flag: '🇮🇩' },
  malay:        { color: '#010066', bg: '#01006618', flag: '🇲🇾' },
  malaysian:    { color: '#010066', bg: '#01006618', flag: '🇲🇾' },
  cambodian:    { color: '#032EA1', bg: '#032EA118', flag: '🇰🇭' },
  burmese:      { color: '#F7C53E', bg: '#F7C53E18', flag: '🇲🇲' },
  lao:          { color: '#CE1126', bg: '#CE112618', flag: '🇱🇦' },

  // Middle Eastern & African
  arabic:       { color: '#006C35', bg: '#006C3518', flag: '🌙' },
  arab:         { color: '#006C35', bg: '#006C3518', flag: '🌙' },
  lebanese:     { color: '#00A651', bg: '#00A65118', flag: '🇱🇧' },
  persian:      { color: '#239F40', bg: '#239F4018', flag: '🇮🇷' },
  iranian:      { color: '#239F40', bg: '#239F4018', flag: '🇮🇷' },
  turkish:      { color: '#E30A17', bg: '#E30A1718', flag: '🇹🇷' },
  african:      { color: '#F4A261', bg: '#F4A26118', flag: '🌍' },
  nigerian:     { color: '#008751', bg: '#00875118', flag: '🇳🇬' },
  ghanaian:     { color: '#006B3F', bg: '#006B3F18', flag: '🇬🇭' },
  eritrean:     { color: '#4189DD', bg: '#4189DD18', flag: '🇪🇷' },
  ethiopian:    { color: '#078930', bg: '#07893018', flag: '🇪🇹' },
  somali:       { color: '#4189DD', bg: '#4189DD18', flag: '🇸🇴' },
  sudanese:     { color: '#D21034', bg: '#D2103418', flag: '🇸🇩' },

  // European
  greek:        { color: '#0D5EAF', bg: '#0D5EAF18', flag: '🇬🇷' },
  italian:      { color: '#009246', bg: '#00924618', flag: '🇮🇹' },
  spanish:      { color: '#AA151B', bg: '#AA151B18', flag: '🇪🇸' },
  portuguese:   { color: '#006600', bg: '#00660018', flag: '🇵🇹' },
  french:       { color: '#002395', bg: '#00239518', flag: '🇫🇷' },
  german:       { color: '#DD0000', bg: '#DD000018', flag: '🇩🇪' },
  polish:       { color: '#DC143C', bg: '#DC143C18', flag: '🇵🇱' },
  ukrainian:    { color: '#005BBB', bg: '#005BBB18', flag: '🇺🇦' },
  russian:      { color: '#CC0000', bg: '#CC000018', flag: '🇷🇺' },
  croatian:     { color: '#FF0000', bg: '#FF000018', flag: '🇭🇷' },
  serbian:      { color: '#C6363C', bg: '#C6363C18', flag: '🇷🇸' },
  macedonian:   { color: '#D4AF37', bg: '#D4AF3718', flag: '🇲🇰' },

  // Pacific & Indigenous
  indigenous:   { color: '#CC6600', bg: '#CC660018', flag: '🪃' },
  aboriginal:   { color: '#CC6600', bg: '#CC660018', flag: '🪃' },
  maori:        { color: '#000000', bg: '#00000018', flag: '🇳🇿' },
  pacific:      { color: '#0077B6', bg: '#0077B618', flag: '🌊' },
  fijian:       { color: '#68BFE5', bg: '#68BFE518', flag: '🇫🇯' },
  samoan:       { color: '#CE1126', bg: '#CE112618', flag: '🇼🇸' },
  tongan:       { color: '#C10000', bg: '#C1000018', flag: '🇹🇴' },
};

const DEFAULT_STYLE = { color: '#6B7280', bg: '#6B728018', flag: '' };

function getTagStyle(tag: string) {
  const key = tag.toLowerCase().replace(/[^a-z]/g, '');
  // exact match first, then prefix match
  if (CULTURE_MAP[key]) return CULTURE_MAP[key];
  const partial = Object.keys(CULTURE_MAP).find((k) => key.includes(k) || k.includes(key));
  return partial ? CULTURE_MAP[partial] : DEFAULT_STYLE;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface CultureTagProps {
  tag: string;
  size?: 'sm' | 'md';
}

export function CultureTag({ tag, size = 'sm' }: CultureTagProps) {
  const s = getTagStyle(tag);
  const isMd = size === 'md';

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: s.bg,
          borderColor: s.color + '40',
          paddingHorizontal: isMd ? 10 : 7,
          paddingVertical: isMd ? 5 : 3,
        },
      ]}
    >
      {s.flag ? (
        <Text style={[styles.flag, { fontSize: isMd ? 13 : 11 }]} aria-hidden>
          {s.flag}
        </Text>
      ) : null}
      <Text
        style={[styles.label, { color: s.color, fontSize: isMd ? 12 : 10 }]}
        numberOfLines={1}
      >
        {tag}
      </Text>
    </View>
  );
}

/**
 * Renders a row of CultureTag chips from an array.
 * Deduplicates and limits to `max` tags.
 */
export function CultureTagRow({
  tags,
  max = 3,
  size = 'sm',
}: {
  tags: string[];
  max?: number;
  size?: 'sm' | 'md';
}) {
  const unique = Array.from(new Set(tags)).slice(0, max);
  if (unique.length === 0) return null;
  return (
    <View style={styles.row}>
      {unique.map((tag) => (
        <CultureTag key={tag} tag={tag} size={size} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  flag: {
    lineHeight: 16,
  },
  label: {
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.1,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
});
