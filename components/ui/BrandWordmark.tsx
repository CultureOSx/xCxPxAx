import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Text as SvgText, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

import { CultureTokens } from '@/constants/theme';
import { TAGLINE_PRIMARY } from '@/lib/app-meta';

interface BrandWordmarkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withTagline?: boolean;
  light?: boolean;
  centered?: boolean;
  tagline?: string;
  maxWidth?: number;
  taglineColor?: string;
  style?: any;
}

const SIZES = {
  sm: { fontSize: 22, height: 32, taglineSize: 9, gap: 1, baseWidth: 145 },
  md: { fontSize: 32, height: 42, taglineSize: 12, gap: 2, baseWidth: 205 },
  lg: { fontSize: 46, height: 58, taglineSize: 15, gap: 3, baseWidth: 295 },
  xl: { fontSize: 58, height: 76, taglineSize: 19, gap: 4, baseWidth: 375 },
};

export function BrandWordmark({
  size = 'md',
  withTagline = false,
  light = false,
  centered = false,
  tagline = TAGLINE_PRIMARY,
  maxWidth,
  taglineColor,
  style,
}: BrandWordmarkProps) {
  const config = SIZES[size];
  const lockupWidth = typeof maxWidth === 'number' ? Math.min(config.baseWidth, maxWidth) : config.baseWidth;

  const gradId = `brandGradient-${React.useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  // Gradient colors - Indigo to Coral (modern & vibrant)
  const gradientColors = [CultureTokens.indigo, CultureTokens.coral];

  return (
    <View style={[styles.container, centered && styles.centeredContainer, style]}>
      {/* Gradient Wordmark */}
      <View style={{ height: config.height, width: lockupWidth, alignSelf: centered ? 'center' : 'flex-start' }}>
        <Svg height={config.height} width={lockupWidth} viewBox={`0 0 ${lockupWidth} ${config.height}`}>
          <Defs>
            <SvgGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={gradientColors[0]} />
              <Stop offset="100%" stopColor={gradientColors[1]} />
            </SvgGradient>
          </Defs>

          <SvgText
            fill={`url(#${gradId})`}
            fontSize={config.fontSize}
            fontFamily="Poppins_800ExtraBold"
            x={centered ? lockupWidth / 2 : config.fontSize * 0.08} // slight left offset for visual balance
            y={config.fontSize * 0.82} // better baseline alignment
            textAnchor={centered ? 'middle' : 'start'}
            letterSpacing="-0.8"
            fontWeight="800"
          >
            CulturePass
          </SvgText>
        </Svg>
      </View>

      {/* Tagline */}
      {withTagline && (
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[
            styles.tagline,
            {
              width: lockupWidth,
              marginTop: -config.gap,
              fontSize: config.taglineSize,
              color: taglineColor ?? (light ? 'rgba(255,255,255,0.92)' : CultureTokens.gold),
              letterSpacing: size === 'xl' ? 1.8 : size === 'lg' ? 1.6 : 1.4,
              textAlign: centered ? 'center' : 'left',
            },
          ]}
        >
          {tagline}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  centeredContainer: {
    alignItems: 'center',
  },
  tagline: {
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    opacity: 0.95,
    flexShrink: 1,
    // Slight shadow for better readability when on colored backgrounds
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});