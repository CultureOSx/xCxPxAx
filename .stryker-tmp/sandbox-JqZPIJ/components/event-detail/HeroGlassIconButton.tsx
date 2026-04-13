/**
 * Compact hero control with consistent contrast on web/iOS/Android.
 */
// @ts-nocheck


import React from 'react';
import { Pressable, StyleSheet, View, Platform, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function HeroGlassIconButton({ children, style, ...pressableProps }: Props) {
  return (
    <Pressable
      {...pressableProps}
      style={({ pressed }) => [styles.hit, { transform: [{ scale: pressed ? 0.96 : 1 }] }, style]}
    >
      <View style={styles.inner}>
        {children}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    width: 40,
    height: 40,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: Platform.OS === 'web' ? 'rgba(17,17,26,0.56)' : 'rgba(17,17,26,0.48)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.28)' } as object,
    }),
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
