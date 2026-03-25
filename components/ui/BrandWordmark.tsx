import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Svg, { 
  Text as SvgText, 
  Defs, 
  LinearGradient as SvgGradient, 
  Stop 
} from 'react-native-svg';
import { CultureTokens } from '@/constants/theme';
import { TextStyles } from '@/constants/typography';

interface BrandWordmarkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withTagline?: boolean;
  light?: boolean;
}

const SIZES = {
  sm: { fontSize: 18, height: 24, taglineSize: 8,  gap: 0 },
  md: { fontSize: 24, height: 32, taglineSize: 10, gap: 1 },
  lg: { fontSize: 32, height: 42, taglineSize: 12, gap: 2 },
  xl: { fontSize: 44, height: 56, taglineSize: 14, gap: 4 },
};

export function BrandWordmark({ 
  size = 'md', 
  withTagline = false,
  light = false 
}: BrandWordmarkProps) {
  const { fontSize, height, taglineSize, gap } = SIZES[size];
  
  // Brand Colors (Indigo -> Coral)
  const colors = [
    CultureTokens.indigo,
    CultureTokens.coral
  ];

  const renderGradientText = () => {
    return (
      <Svg height={height} width={fontSize * 6.5} viewBox={`0 0 ${fontSize * 6.5} ${height}`}>
        <Defs>
          <SvgGradient id="brandGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={colors[0]} />
            <Stop offset="100%" stopColor={colors[1]} />
          </SvgGradient>
        </Defs>
        <SvgText
          fill="url(#brandGradient)"
          fontSize={fontSize}
          fontFamily="Poppins_700Bold"
          x="0"
          y={fontSize}
        >
          CulturePass
        </SvgText>
      </Svg>
    );
  };

  return (
    <View style={styles.container}>
      {renderGradientText()}
      {withTagline && (
        <Text style={[
          styles.tagline, 
          { 
            fontSize: taglineSize, 
            marginTop: -gap,
            color: light ? 'rgba(255,255,255,0.8)' : CultureTokens.gold
          }
        ]}>
          BELONG ANYWHERE
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  tagline: {
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
});
