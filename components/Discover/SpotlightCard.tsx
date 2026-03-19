import React from 'react';
import { View, Text, Pressable, StyleSheet, Image, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

export interface SpotlightItem {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  type?: string;
}

interface SpotlightCardProps {
  item: SpotlightItem;
  index?: number;
}

function SpotlightCard({ item, index = 0 }: SpotlightCardProps) {
  const colors = useColors();
  return (
    <View>
      <Pressable
        style={({ pressed }) => [
          styles.spotlightCard,
          { backgroundColor: colors.surface },
          pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          Platform.OS === 'web' && { cursor: 'pointer' as any },
          Colors.shadows.medium,
        ]}
        onPress={() => {
          if (item.type === 'event') router.push({ pathname: '/event/[id]', params: { id: item.id } });
        }}
      >
        <Image
          source={{ uri: item.imageUrl }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.spotlightBadge}>
          <Ionicons name="earth" size={10} color={colors.textInverse} />
          <Text style={[styles.spotlightBadgeText, { color: colors.textInverse }]}>First Nations</Text>
        </View>
        <View style={styles.spotlightContent}>
          <View style={styles.spotlightTextRibbon}>
            <Text style={[styles.spotlightTitle, { color: colors.textInverse }]} numberOfLines={2}>{item.title}</Text>
          </View>
          <View style={[styles.spotlightTextRibbon, styles.spotlightDescRibbon]}>
            <Text style={[styles.spotlightDesc, { color: `${colors.textInverse}D9` }]} numberOfLines={2}>{item.description}</Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  spotlightCard: {
    width: 280,
    height: 180,
    borderRadius: 24,
    overflow: 'hidden',
    // backgroundColor will be provided inline via useColors()
  },
  spotlightBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(11,11,20,0.78)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  spotlightBadgeText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    // color assigned inline
  },
  spotlightContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  spotlightTextRibbon: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(11,11,20,0.78)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 6,
  },
  spotlightDescRibbon: {
    marginBottom: 0,
  },
  spotlightTitle: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 4,
  },
  spotlightDesc: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 16,
  },
});

// ⚡ Bolt Optimization: Added React.memo() to prevent unnecessary re-renders in lists
export default React.memo(SpotlightCard);
