import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface BrowseHeaderProps {
  title: string;
  tagline?: string;
  accentColor: string;
  accentIcon: string;
}

export function BrowseHeader({ title, tagline, accentColor, accentIcon }: BrowseHeaderProps) {
  const colors = useColors();

  return (
    <View style={styles.header}>
      <Pressable
        onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/'); }}
        style={({ pressed }) => [
          styles.backBtn, 
          { backgroundColor: colors.surface, borderColor: colors.borderLight },
          pressed && { backgroundColor: colors.backgroundSecondary }
        ]}
        hitSlop={12}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </Pressable>
      <View style={styles.headerCenter}>
        <View style={[styles.headerIcon, { backgroundColor: accentColor + '15' }]}>
          <Ionicons name={accentIcon as any} size={18} color={accentColor} />
        </View>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
          {tagline ? <Text style={[styles.headerTagline, { color: colors.textSecondary }]}>{tagline}</Text> : null}
        </View>
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.backBtn, 
          { backgroundColor: colors.surface, borderColor: colors.borderLight },
          pressed && { backgroundColor: colors.backgroundSecondary }
        ]}
        hitSlop={12}
        onPress={() => router.push('/search/index' as any)}
        accessibilityLabel="Search"
        accessibilityRole="button"
      >
        <Ionicons name="search-outline" size={20} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.3,
  },
  headerTagline: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
    letterSpacing: -0.1,
  },
});
