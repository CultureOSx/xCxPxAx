import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { CultureTokens, CardTokens } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import type { WidgetSpotlightItem } from '@/lib/api';

interface WidgetSpotlightCardProps {
  item: WidgetSpotlightItem;
}

export function WidgetSpotlightCard({ item }: WidgetSpotlightCardProps) {
  const colors = useColors();

  return (
    <Pressable
      style={[styles.card, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}
      onPress={() => {
        if (item.type === 'event') {
          router.push({ pathname: '/event/[id]', params: { id: item.id } });
        }
      }}
      accessibilityRole="button"
      accessibilityLabel={`Open spotlight ${item.title}`}
    >
      <Image source={item.imageUrl ?? undefined} style={StyleSheet.absoluteFillObject} contentFit="cover" />
      <LinearGradient
        colors={['transparent', colors.overlay, colors.background]}
        locations={[0, 0.65, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.badge, { backgroundColor: colors.primarySoft, borderColor: colors.primaryLight }]}>
        <Text style={[styles.badgeText, { color: CultureTokens.indigo }]}>Spotlight</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.description ?? 'Featured cultural moment'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 192,
    borderRadius: CardTokens.radiusLarge,
    overflow: 'hidden',
    borderWidth: 1,
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  content: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    gap: 4,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: 'Poppins_700Bold',
  },
  desc: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Poppins_400Regular',
  },
});
