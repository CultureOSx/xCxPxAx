import React, { memo, useMemo } from 'react';
import { Image, ImageProps } from 'expo-image';
import { StyleSheet, ViewStyle, ImageStyle, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface CultureImageProps extends Omit<ImageProps, 'source' | 'style' | 'placeholder'> {
  uri: string | null | undefined;
  blurhash?: string | null;           // Prefer ThumbHash when possible (smaller + better quality)
  thumbhash?: string | null;          // Newer, more efficient alternative
  width?: number | string;
  height?: number | string;
  style?: ImageStyle | ViewStyle | any;
  priority?: 'high' | 'normal' | 'low';
  contentFit?: 'cover' | 'contain' | 'fill' | 'none';
  recyclingKey?: string;              // Critical for FlashList
  borderRadius?: number;
  onLoad?: () => void;
  fallbackColor?: string;
}

const CultureImage = memo(({
  uri,
  blurhash,
  thumbhash,
  width,
  height,
  style,
  priority = 'normal',
  contentFit = 'cover',
  recyclingKey,
  borderRadius = 12,
  onLoad,
  fallbackColor,
  ...rest
}: CultureImageProps) => {
  const colors = useColors();

  // Build placeholder object once
  const placeholder = useMemo(() => {
    if (thumbhash) return { thumbhash };
    if (blurhash) return { blurhash };
    return undefined;
  }, [thumbhash, blurhash]);

  // Final source with fallback — treat empty string same as null to avoid browser broken-image icon
  const source = useMemo(() => {
    if (!uri || uri.trim() === '') return null;
    return { uri };
  }, [uri]);

  if (!source) {
    return (
      <View
        style={[
          styles.base,
          { backgroundColor: fallbackColor || colors.surface, borderRadius },
          width !== undefined && { width: width as any },
          height !== undefined && { height: height as any },
          style,
        ]}
      />
    );
  }

  return (
    <Image
      source={source}
      style={[
        styles.base,
        { borderRadius },
        width !== undefined && { width: width as any },
        height !== undefined && { height: height as any },
        style,
      ]}
      recyclingKey={recyclingKey || uri || undefined}   // Most important for FlashList performance
      transition={280}                      // Smooth cross-fade (ms) — eliminates flicker on recycle
      contentFit={contentFit}
      priority={priority}
      cachePolicy="memory-disk"             // Balanced caching
      placeholder={placeholder}
      placeholderContentFit="cover"        // Important: forces placeholder to fill container
      onLoad={onLoad}
      allowDownscaling={true}               // Newer prop: reduces memory on large images
      contentPosition="center"
      accessibilityLabel="Image"            // Improve with dynamic label in parent if possible
      {...rest}
    />
  );
});

CultureImage.displayName = 'CultureImage';

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#f5f5f5', // Light fallback (will be overridden by theme in most cases)
    overflow: 'hidden',
  },
});

export default CultureImage;
