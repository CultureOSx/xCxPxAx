import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { gradients } from '@/constants/theme';

import type { CultureWalletMapProps } from './CultureWalletMap';

export function CultureWalletMap({ cultures: _cultures }: CultureWalletMapProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <LinearGradient
        colors={[...gradients.midnight]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.background + '99' }]} />
      <View style={styles.overlay}>
        <Ionicons name="map-outline" size={40} color={colors.textTertiary} />
        <Text style={[styles.text, { color: colors.textSecondary }]}>Culture map</Text>
        <Text style={[styles.sub, { color: colors.textTertiary }]}>
          Open CulturePass on iOS or Android to explore your culture wallet on the map.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 200, borderRadius: 16, overflow: 'hidden' },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 8 },
  text: { marginTop: 8, fontFamily: 'Poppins_600SemiBold', fontSize: 16, textAlign: 'center' },
  sub: { fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 20, textAlign: 'center', maxWidth: 320 },
});

export default CultureWalletMap;
