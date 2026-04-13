// @ts-nocheck
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { CultureTokens } from '@/constants/theme';
import { BrandWordmark } from '@/components/ui/BrandWordmark';
import { TAGLINE_PRIMARY } from '@/lib/app-meta';

interface BrandLockupProps {
  light?: boolean;
  withTagline?: boolean;
  tagline?: string;
  wordmarkSize?: 'sm' | 'md' | 'lg' | 'xl';
  wordmarkMaxWidth?: number;
  logoSize?: number;
  logoRadius?: number;
  logoBackground?: 'none' | 'soft' | 'gradient';
  softLogoBackgroundColor?: string;
}

export function BrandLockup({
  light = false,
  withTagline = true,
  tagline = TAGLINE_PRIMARY,
  wordmarkSize = 'sm',
  wordmarkMaxWidth,
  logoSize = 32,
  logoRadius,
  logoBackground = 'none',
  softLogoBackgroundColor,
}: BrandLockupProps) {
  const radius = logoRadius ?? Math.round(logoSize / 2);

  const mark = (
    <Image
      source={require('@/assets/images/culturepass-logo.png')}
      style={{ width: logoSize, height: logoSize }}
      contentFit="cover"
    />
  );

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.logoWrap,
          {
            width: logoSize,
            height: logoSize,
            borderRadius: radius,
            backgroundColor: softLogoBackgroundColor,
          },
        ]}
      >
        {logoBackground === 'gradient' ? (
          <LinearGradient
            colors={[CultureTokens.indigo, CultureTokens.coral]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        {mark}
      </View>
      <BrandWordmark
        size={wordmarkSize}
        withTagline={withTagline}
        light={light}
        tagline={tagline}
        maxWidth={wordmarkMaxWidth}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '100%',
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
});

