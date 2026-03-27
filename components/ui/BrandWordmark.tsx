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
  sm: { fontSize: 20, height: 28, taglineSize: 7,  gap: 1, width: 126 },
  md: { fontSize: 28, height: 38, taglineSize: 10, gap: 1, width: 176 },
  lg: { fontSize: 40, height: 54, taglineSize: 15, gap: 2, width: 252 },
  xl: { fontSize: 52, height: 70, taglineSize: 19, gap: 4, width: 326 },
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
    '#0066CC', // indigo
    '#FFCC00', // gold
    '#FF5E5B', // coral
  ];

  const renderGradientText = () => {
    const svgWidth = width;
    
    return (
      <View style={{ height, width: svgWidth, justifyContent: 'center', ...(centered && { alignSelf: 'center' }) }}>
        <Svg height={height} width={svgWidth} viewBox={`0 0 ${svgWidth} ${height}`}>
          <Defs>
            <SvgGradient id="brandGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={colors[0]} />
              <Stop offset="50%" stopColor={colors[1]} />
              <Stop offset="100%" stopColor={colors[2]} />
            </SvgGradient>
          </Defs>
          <SvgText
            fill="url(#brandGradient)"
            fontSize={fontSize}
            fontFamily="Poppins_700Bold"
            x={centered ? "50%" : "0"}
            y={fontSize * 0.9}
            textAnchor={centered ? "middle" : "start"}
            letterSpacing="-0.5"
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
                  color: light ? 'rgba(255,255,255,0.7)' : CultureTokens.gold,
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
    fontFamily: 'Poppins_600SemiBold',
    textTransform: 'uppercase',
  },
});
