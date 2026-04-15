import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Text as SvgText,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from 'react-native-svg';
import { CultureTokens } from '@/constants/theme';
import { TAGLINE_PRIMARY } from '@/lib/app-meta';

type Size = 'sm' | 'md' | 'lg' | 'xl';

interface BrandWordmarkProps {
  size?: Size;
  withTagline?: boolean;
  light?: boolean;
  centered?: boolean;
  tagline?: string;
  maxWidth?: number;
}

const SIZES: Record<Size, {
  fontSize: number;
  height: number;
  taglineSize: number;
  gap: number;
  baseWidth: number;
  letterSpacing: number;
  taglineLetterSpacing: number;
}> = {
  sm: { fontSize: 22, height: 32, taglineSize: 9,  gap: 2,  baseWidth: 140, letterSpacing: -0.7, taglineLetterSpacing: 1.4 },
  md: { fontSize: 32, height: 44, taglineSize: 12, gap: 3,  baseWidth: 205, letterSpacing: -0.8, taglineLetterSpacing: 1.6 },
  lg: { fontSize: 46, height: 60, taglineSize: 16, gap: 4,  baseWidth: 295, letterSpacing: -1.0, taglineLetterSpacing: 1.8 },
  xl: { fontSize: 58, height: 78, taglineSize: 20, gap: 5,  baseWidth: 375, letterSpacing: -1.1, taglineLetterSpacing: 2.0 },
};

export function BrandWordmark({
  size = 'md',
  withTagline = false,
  light = false,
  centered = true,
  tagline = TAGLINE_PRIMARY,
  maxWidth,
}: BrandWordmarkProps) {
  const config = SIZES[size];
  
  // Responsive width calculation
  const wordmarkWidth = typeof maxWidth === 'number' 
    ? Math.min(config.baseWidth, maxWidth) 
    : config.baseWidth;

  const gradientId = `brandGrad-${React.useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <View style={[
      styles.container,
      centered && styles.centered
    ]}>
      {/* Gradient Wordmark */}
      <View style={{ 
        height: config.height, 
        width: wordmarkWidth,
        alignSelf: centered ? 'center' : 'flex-start'
      }}>
        <Svg 
          height={config.height} 
          width={wordmarkWidth} 
          viewBox={`0 0 ${wordmarkWidth} ${config.height}`}
        >
          <Defs>
            <SvgGradient 
              id={gradientId} 
              x1="0%" 
              y1="0%" 
              x2="100%" 
              y2="0%"
            >
              <Stop offset="0%" stopColor={CultureTokens.indigo} />
              <Stop offset="100%" stopColor={CultureTokens.coral} />
            </SvgGradient>
          </Defs>

          <SvgText
            fill={`url(#${gradientId})`}
            fontSize={config.fontSize}
            fontFamily="Poppins_800ExtraBold"
            x={centered ? wordmarkWidth / 2 : 0}
            y={config.fontSize * 0.82} // Fine-tuned vertical alignment
            textAnchor={centered ? "middle" : "start"}
            letterSpacing={config.letterSpacing}
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
            centered && styles.taglineCentered,
            {
              width: wordmarkWidth,
              marginTop: -config.gap,
              fontSize: config.taglineSize,
              color: light ? 'rgba(255,255,255,0.85)' : CultureTokens.indigo,
              letterSpacing: config.taglineLetterSpacing,
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
    maxWidth: '100%',
  },
  centered: {
    alignItems: 'center',
  },
  tagline: {
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    opacity: 0.95,
    flexShrink: 1,
  },
  taglineCentered: {
    textAlign: 'center',
    alignSelf: 'center',
  },
});