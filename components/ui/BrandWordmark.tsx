import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Text as SvgText,
  Defs,
  LinearGradient as SvgGradient,
  Stop
} from 'react-native-svg';
import { CultureTokens } from '@/constants/theme';
import { TAGLINE_PRIMARY } from '@/lib/app-meta';


interface BrandWordmarkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withTagline?: boolean;
  light?: boolean;
  centered?: boolean;
  tagline?: string;
  maxWidth?: number;
}

const SIZES = {
  sm: { fontSize: 20, height: 30, taglineSize: 8, gap: 2, width: 130, taglineLetterSpacing: 1.2 },
  md: { fontSize: 30, height: 40, taglineSize: 11, gap: 3, width: 198, taglineLetterSpacing: 1.5 },
  lg: { fontSize: 44, height: 56, taglineSize: 16, gap: 4, width: 288, taglineLetterSpacing: 1.6 },
  xl: { fontSize: 56, height: 74, taglineSize: 21, gap: 5, width: 362, taglineLetterSpacing: 1.7 },
};

export function BrandWordmark({
  size = 'md',
  withTagline = false,
  light = false,
  centered = false,
  tagline = TAGLINE_PRIMARY,
  maxWidth,
}: BrandWordmarkProps) {
  const { fontSize, height, taglineSize, gap, width, taglineLetterSpacing } = SIZES[size];
  const lockupWidth = typeof maxWidth === 'number' ? Math.min(width, maxWidth) : width;
  const gradId = `brandGradient-${React.useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  // Brand lockup gradient (Indigo -> Coral)
  const colors = [
    CultureTokens.indigo,
    CultureTokens.coral,
  ];

  const renderGradientText = () => {
    const svgWidth = lockupWidth;

    return (
      <View style={{ height, width: svgWidth, justifyContent: 'center', ...(centered && { alignSelf: 'center' }) }}>
        <Svg height={height} width={svgWidth} viewBox={`0 0 ${svgWidth} ${height}`}>
          <Defs>
            <SvgGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={colors[0]} />
              <Stop offset="100%" stopColor={colors[1]} />
            </SvgGradient>
          </Defs>
          <SvgText
            fill={`url(#${gradId})`}
            fontSize={fontSize}
            fontFamily="Poppins_800ExtraBold"
            x={centered ? "50%" : "0"}
            y={fontSize * 0.9}
            textAnchor={centered ? "middle" : "start"}
            letterSpacing="-0.65"
          >
            CulturePass
          </SvgText>
        </Svg>
      </View>
    );
  };

  return (
    <View style={[styles.container, centered && { alignItems: 'center' }]}>
      {renderGradientText()}
      {withTagline && (
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[
            styles.tagline,
            {
              width: lockupWidth,
              marginTop: -gap,
              fontSize: taglineSize,
              color: light ? 'rgba(255,255,255,0.9)' : CultureTokens.gold,
              letterSpacing: taglineLetterSpacing,
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
  tagline: {
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    opacity: 0.96,
    flexShrink: 1,
  },
});
