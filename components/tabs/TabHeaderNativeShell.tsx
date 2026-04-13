/**
 * Solid tab header chrome for iOS/Android — one safe-area inset, no stacked BlurView/LiquidGlass.
 * Web: use LiquidGlassPanel in the caller instead (this component is not used on web).
 */
import React, { type ReactNode } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { CultureTokens } from '@/constants/theme';
import {
  HEADER_CHROME_TOKENS,
  MAIN_TAB_UI,
  TAB_HEADER_NATIVE_INSET_GAP,
} from '@/components/tabs/mainTabTokens';

type TabHeaderNativeShellProps = {
  hPad: number;
  children: ReactNode;
  style?: object;
  /** When false, only top/side padding + background (e.g. nested section). */
  showBottomBorder?: boolean;
  /** When false, hides brand accent line at the bottom edge. */
  showBrandStrip?: boolean;
  zIndex?: number;
};

export function TabHeaderNativeShell({
  hPad,
  children,
  style,
  showBottomBorder = false,
  showBrandStrip = false,
  zIndex,
}: TabHeaderNativeShellProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.surface,
          borderBottomWidth: showBottomBorder ? MAIN_TAB_UI.headerBorderWidth : 0,
          borderBottomColor: showBottomBorder ? colors.border : 'transparent',
          paddingTop: insets.top + TAB_HEADER_NATIVE_INSET_GAP,
          paddingHorizontal: hPad,
          zIndex: zIndex ?? HEADER_CHROME_TOKENS.zIndex,
        },
        Platform.OS === 'ios' && showBottomBorder
          ? {
              shadowColor: HEADER_CHROME_TOKENS.shadow.iosColor,
              shadowOffset: { width: 0, height: HEADER_CHROME_TOKENS.shadow.iosHeight },
              shadowOpacity: HEADER_CHROME_TOKENS.shadow.iosOpacity,
              shadowRadius: HEADER_CHROME_TOKENS.shadow.iosRadius,
            }
          : null,
        Platform.OS === 'android' && showBottomBorder
          ? { elevation: HEADER_CHROME_TOKENS.shadow.androidElevation }
          : null,
        style,
      ]}
    >
      {children}
      {/* Brand gradient accent strip at bottom edge */}
      {showBrandStrip ? (
        <LinearGradient
          colors={[CultureTokens.indigo, CultureTokens.teal, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.brandStrip}
          pointerEvents="none"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
  },
  brandStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: HEADER_CHROME_TOKENS.stripHeight,
  },
});
