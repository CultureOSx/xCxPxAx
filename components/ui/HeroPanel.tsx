/**
 * HeroPanel — Standard hero image container for T2 Detail screens.
 *
 * Renders a full-width hero image with:
 *  - `gradients.heroOverlay` gradient overlay (transparent → rgba(0,0,0,0.6))
 *  - Absolute-positioned children (back button, share button, title, badges)
 *  - Responsive height (320px mobile, 400px desktop/tablet)
 *
 * Usage:
 *   <HeroPanel uri={event.imageUrl}>
 *     <BackButton circled color="#fff" style={styles.back} />
 *     <View style={styles.titleArea}>
 *       <Text style={[TextStyles.hero, { color: '#fff' }]}>{event.title}</Text>
 *     </View>
 *   </HeroPanel>
 */
import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import CultureImage from './CultureImage';
import { gradients } from '@/constants/theme';
import { useLayout } from '@/hooks/useLayout';

interface HeroPanelProps {
  /** Image URI — passed to CultureImage */
  uri: string | null | undefined;
  /** Blurhash or thumbhash placeholder */
  blurhash?: string | null;
  /**
   * Override hero height.
   * Defaults to 320 mobile / 400 tablet+desktop.
   */
  height?: number;
  /**
   * Override gradient colors.
   * Defaults to `gradients.heroOverlay` = ['transparent', 'rgba(0,0,0,0.6)'].
   */
  gradientColors?: string[];
  /** Additional style for the container */
  style?: StyleProp<ViewStyle>;
  /** Children are positioned absolutely inside the hero */
  children?: React.ReactNode;
}

export function HeroPanel({
  uri,
  blurhash,
  height,
  gradientColors,
  style,
  children,
}: HeroPanelProps) {
  const { isDesktop, isTablet } = useLayout();

  const resolvedHeight =
    height ?? (isDesktop || isTablet ? 400 : 320);

  const overlayColors = (gradientColors ?? gradients.heroOverlay) as [
    string,
    string,
    ...string[]
  ];

  return (
    <View style={[styles.container, { height: resolvedHeight }, style]}>
      <CultureImage
        uri={uri}
        blurhash={blurhash}
        width="100%"
        height={resolvedHeight}
        contentFit="cover"
        priority="high"
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={overlayColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFillObject, styles.gradient]}
        pointerEvents="none"
      />
      {children && (
        <View style={styles.childrenLayer} pointerEvents="box-none">
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#0A0E14',
  },
  gradient: {
    zIndex: 1,
  },
  childrenLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
});
