import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { 
  Text as SvgText, 
  Defs, 
  LinearGradient as SvgGradient, 
  Stop 
} from 'react-native-svg';
import { CultureTokens } from '@/constants/theme';


interface BrandWordmarkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withTagline?: boolean;
  light?: boolean;
  centered?: boolean;
}

const SIZES = {
  sm: { fontSize: 22, height: 32, taglineSize: 8.5, gap: 1, width: 140 },
  md: { fontSize: 30, height: 40, taglineSize: 11,  gap: 1, width: 188 },
  lg: { fontSize: 44, height: 56, taglineSize: 16,  gap: 2, width: 278 },
  xl: { fontSize: 56, height: 74, taglineSize: 21,  gap: 4, width: 350 },
};

export function BrandWordmark({ 
  size = 'md', 
  withTagline = false,
  light = false,
  centered = false
}: BrandWordmarkProps) {
  const { fontSize, height, taglineSize, gap, width } = SIZES[size];
  
  // High-End Brand Gradient (Indigo -> Coral -> Gold)
  const colors = [
    CultureTokens.indigo,
    CultureTokens.coral,
  ];

  const renderGradientText = () => {
    const svgWidth = width;
    
    return (
      <View style={{ height, width: svgWidth, justifyContent: 'center', ...(centered && { alignSelf: 'center' }) }}>
        <Svg height={height} width={svgWidth} viewBox={`0 0 ${svgWidth} ${height}`}>
          <Defs>
            <SvgGradient id="brandGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={colors[0]} />
              <Stop offset="100%" stopColor={colors[1]} />
            </SvgGradient>
          </Defs>
          <SvgText
            fill="url(#brandGradient)"
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

  const taglineText = "BELONG ANYWHERE";
  const taglineChars = taglineText.split('');

  return (
    <View style={[styles.container, centered && { alignItems: 'center' }]}>
      {renderGradientText()}
      {withTagline && (
        <View style={{ width, flexDirection: 'row', justifyContent: 'space-between', marginTop: -gap }}>
          {taglineChars.map((char, index) => (
            <Text 
              key={`${char}-${index}`}
              style={[
                styles.taglineChar, 
                { 
                  fontSize: taglineSize, 
                  color: light ? 'rgba(255,255,255,0.92)' : CultureTokens.gold,
                }
              ]}
            >
              {char === ' ' ? '\u00A0' : char}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  taglineChar: {
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});
