/**
 * ConnectTeaser — coming-soon rail for social connection features.
 *
 * Surfaces the CulturePass social roadmap (Meetups, Groups, Culture Match,
 * Matrimony, Language Circles) as visually distinct teaser cards.
 * Each card is tappable and registers an expression of interest.
 */
// @ts-nocheck


import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, FontFamily, FontSize } from '@/constants/theme';

// ─── Feature definitions ──────────────────────────────────────────────────────

interface ConnectFeature {
  id: string;
  emoji: string;
  title: string;
  description: string;
  gradientStart: string;
  gradientEnd: string;
  accentColor: string;
  icon: keyof typeof Ionicons.glyphMap;
  interestMessage: string;
}

const FEATURES: ConnectFeature[] = [
  {
    id: 'meetups',
    emoji: '🤝',
    title: 'CulturePass Meetups',
    description: 'Attend casual cultural gatherings and activities near you.',
    gradientStart: `${CultureTokens.indigo}28`,
    gradientEnd: `${CultureTokens.teal}14`,
    accentColor: CultureTokens.indigo,
    icon: 'people-circle-outline',
    interestMessage: 'You\'re on the early list for CulturePass Meetups — we\'ll notify you when it launches in your city.',
  },
  {
    id: 'groups',
    emoji: '👥',
    title: 'Cultural Groups',
    description: 'Join hobby circles, diaspora chapters and interest clubs.',
    gradientStart: `${CultureTokens.teal}28`,
    gradientEnd: `${CultureTokens.indigo}14`,
    accentColor: CultureTokens.teal,
    icon: 'grid-outline',
    interestMessage: 'Noted! We\'ll let you know when Cultural Groups launches so you can find your people.',
  },
  {
    id: 'culture-match',
    emoji: '💫',
    title: 'Culture Match',
    description: 'Meet people who share your roots, language and values.',
    gradientStart: `${CultureTokens.coral}28`,
    gradientEnd: `#E91E6314`,
    accentColor: CultureTokens.coral,
    icon: 'heart-circle-outline',
    interestMessage: 'You\'re on the waitlist for Culture Match — culturally intelligent connections, coming soon.',
  },
  {
    id: 'matrimony',
    emoji: '💍',
    title: 'Matrimony',
    description: 'Find a life partner within your culture and community.',
    gradientStart: `${CultureTokens.gold}28`,
    gradientEnd: `${CultureTokens.coral}14`,
    accentColor: CultureTokens.gold,
    icon: 'diamond-outline',
    interestMessage: 'Added to the early access list for CulturePass Matrimony. We\'ll reach out when it\'s ready.',
  },
  {
    id: 'language-circles',
    emoji: '🗣️',
    title: 'Language Circles',
    description: 'Practice languages with native speakers in your city.',
    gradientStart: '#2980B928',
    gradientEnd: `${CultureTokens.teal}14`,
    accentColor: '#2980B9',
    icon: 'chatbubbles-outline',
    interestMessage: 'Great — you\'re on the list for Language Circles. We\'ll notify you when it launches near you.',
  },
];

// ─── Card ─────────────────────────────────────────────────────────────────────

interface FeatureCardProps {
  feature: ConnectFeature;
}

function FeatureCard({ feature }: FeatureCardProps) {
  const colors = useColors();

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      `${feature.emoji}  ${feature.title}`,
      feature.interestMessage,
      [{ text: 'Got it', style: 'default' }],
    );
  }, [feature]);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${feature.title} — coming soon. Tap to register interest.`}
      style={({ pressed }) => [card.root, { opacity: pressed ? 0.88 : 1 }]}
    >
      {/* Gradient card background */}
      <LinearGradient
        colors={[feature.gradientStart, feature.gradientEnd] as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Border */}
      <View style={[card.border, { borderColor: `${feature.accentColor}30` }]} />

      {/* Coming Soon badge */}
      <View style={[card.badge, { backgroundColor: `${feature.accentColor}22`, borderColor: `${feature.accentColor}44` }]}>
        <View style={[card.badgeDot, { backgroundColor: feature.accentColor }]} />
        <Text style={[card.badgeText, { color: feature.accentColor }]}>Coming Soon</Text>
      </View>

      {/* Body */}
      <View style={card.body}>
        <Text style={card.emoji}>{feature.emoji}</Text>
        <Text style={[card.title, { color: colors.textInverse }]} numberOfLines={2}>
          {feature.title}
        </Text>
        <Text style={card.desc} numberOfLines={3}>
          {feature.description}
        </Text>
      </View>

      {/* Notify me footer */}
      <View style={[card.footer, { borderTopColor: `${feature.accentColor}20` }]}>
        <Ionicons name="notifications-outline" size={12} color={feature.accentColor} />
        <Text style={[card.notifyText, { color: feature.accentColor }]}>Notify me</Text>
        <Ionicons name="chevron-forward" size={11} color={`${feature.accentColor}88`} style={{ marginLeft: 'auto' }} />
      </View>
    </Pressable>
  );
}

const card = StyleSheet.create({
  root: {
    width: 192,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { boxShadow: '0 6px 20px rgba(0,0,0,0.18)' } as any,
    }),
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    margin: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.4,
  },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 6,
  },
  emoji: {
    fontSize: 30,
    marginBottom: 2,
  },
  title: {
    fontSize: FontSize.body2,
    fontFamily: FontFamily.bold,
    lineHeight: 20,
  },
  desc: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.62)',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    marginTop: 4,
  },
  notifyText: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
  },
});

// ─── ConnectTeaser (exported) ─────────────────────────────────────────────────

export function ConnectTeaser() {
  const colors = useColors();
  const { hPad } = useLayout();

  return (
    <View style={[rail.wrapper, { paddingHorizontal: hPad }]}>
      {/* Section header */}
      <View style={rail.header}>
        <View style={[rail.accent, { backgroundColor: CultureTokens.coral }]} />
        <View style={{ flex: 1 }}>
          <Text style={[rail.title, { color: colors.text }]}>Meet · Connect · Belong</Text>
          <Text style={[rail.subtitle, { color: colors.textSecondary }]}>
            Social features coming to CulturePass
          </Text>
        </View>
        <View style={[rail.roadmapPill, { backgroundColor: `${CultureTokens.indigo}14`, borderColor: `${CultureTokens.indigo}30` }]}>
          <Text style={[rail.roadmapText, { color: CultureTokens.indigo }]}>Roadmap</Text>
        </View>
      </View>

      {/* Horizontal card scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={rail.scroll}
        decelerationRate="fast"
        snapToInterval={204}
        snapToAlignment="start"
      >
        {FEATURES.map((f) => (
          <FeatureCard key={f.id} feature={f} />
        ))}
      </ScrollView>
    </View>
  );
}

const rail = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  accent: {
    width: 3,
    height: 36,
    borderRadius: 2,
  },
  title: {
    fontSize: FontSize.body2,
    fontFamily: FontFamily.bold,
    letterSpacing: -0.1,
  },
  subtitle: {
    fontSize: FontSize.caption,
    fontFamily: FontFamily.regular,
    marginTop: 1,
  },
  roadmapPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  roadmapText: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.3,
  },
  scroll: {
    gap: 12,
    paddingRight: 8,
  },
});
