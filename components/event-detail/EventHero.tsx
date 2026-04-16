import React from 'react';
import { View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { EventData } from '@/shared/schema';
import type { ColorTheme } from '@/constants/colors';

interface EventHeroProps {
  event: EventData;
  heroDisplayUri?: string;
  saved: boolean;
  canEdit: boolean;
  uploading: boolean;
  isDesktop: boolean;
  topInset: number;
  handleBack: () => void;
  handleShare: () => void;
  handleSave: () => void;
  handlePickCover?: () => void;
  colors: ColorTheme;
  s: Record<string, unknown>;
}

export function EventHero({
  heroDisplayUri,
  isDesktop,
  topInset,
  handleBack,
  handleShare,
  handleSave,
  saved,
}: EventHeroProps) {
  const height = isDesktop ? 400 : 280;

  return (
    <View style={{ width: '100%', height, backgroundColor: '#1a1a2e', position: 'relative' }}>
      {heroDisplayUri ? (
        <Image source={{ uri: heroDisplayUri }} style={{ width: '100%', height }} contentFit="cover" />
      ) : null}
      <View style={{ position: 'absolute', top: topInset + 12, left: 16 }}>
        <Pressable
          onPress={handleBack}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </Pressable>
      </View>
      <View style={{ position: 'absolute', top: topInset + 12, right: 16, flexDirection: 'row', gap: 10 }}>
        <Pressable
          onPress={handleShare}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}
          accessibilityRole="button"
          accessibilityLabel="Share event"
        >
          <Ionicons name="share-outline" size={18} color="#fff" />
        </Pressable>
        <Pressable
          onPress={handleSave}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Unsave event' : 'Save event'}
        >
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}
