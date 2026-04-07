import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { useColors } from '@/hooks/useColors';
import { MAIN_TAB_UI } from '@/components/tabs/mainTabTokens';
import { CultureTokens } from '@/constants/theme';

interface TabPrimaryHeaderProps {
  title: string;
  subtitle?: string;
  locationLabel?: string;
  rightActions?: ReactNode;
  children?: ReactNode;
  hPad: number;
}

export function TabPrimaryHeader({
  title,
  subtitle,
  locationLabel,
  rightActions,
  children,
  hPad,
}: TabPrimaryHeaderProps) {
  const colors = useColors();

  return (
    <LiquidGlassPanel
      borderRadius={0}
      bordered={false}
      style={{
        borderBottomWidth: MAIN_TAB_UI.headerBorderWidth,
        borderBottomColor: colors.borderLight,
      }}
      contentStyle={[styles.wrap, { paddingHorizontal: hPad }]}
    >
      <View style={styles.row}>
        <View style={styles.left}>
          <Text
            style={[styles.title, { color: colors.text }]}
            accessibilityRole="header"
            numberOfLines={1}
            maxFontSizeMultiplier={1.4}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
          {locationLabel ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={MAIN_TAB_UI.iconSize.sm} color={CultureTokens.indigo} />
              <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
                {locationLabel}
              </Text>
            </View>
          ) : null}
        </View>
        {rightActions ? <View style={styles.actions}>{rightActions}</View> : null}
      </View>
      {children ? <View style={styles.extra}>{children}</View> : null}
    </LiquidGlassPanel>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 10,
    paddingBottom: MAIN_TAB_UI.headerVerticalPadding,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  left: {
    flex: 1,
    minWidth: 0,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.35,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Poppins_500Medium',
  },
  locationRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'Poppins_400Regular',
  },
  extra: {
    marginTop: 2,
  },
});
