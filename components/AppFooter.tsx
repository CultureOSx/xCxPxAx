import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Link } from 'expo-router';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { APP_NAME, APP_DOMAIN } from '@/lib/app-meta';
import { TextStyles } from '@/constants/typography';

const FOOTER_LINKS = [
  { href: '/legal/terms', label: 'Terms' },
  { href: '/legal/privacy', label: 'Privacy' },
  { href: '/legal/cookies', label: 'Cookies' },
  { href: '/help', label: 'Help' },
] as const;

/**
 * Global site footer — web only (main chrome uses WebShell + sidebar).
 * Legal and help routes are in-app; no raw hex — tokens via useColors.
 */
export function AppFooter() {
  const colors = useColors();
  const { hPad, isMobile } = useLayout();
  const [isExpanded, setIsExpanded] = useState(false);
  const panelAnim = useSharedValue(0);
  const panelStyle = useAnimatedStyle(() => ({
    opacity: panelAnim.value,
    transform: [{ translateY: (1 - panelAnim.value) * 8 }],
    maxHeight: panelAnim.value * 240,
    overflow: 'hidden',
  }));

  if (Platform.OS !== 'web') {
    return null;
  }

  const year = new Date().getFullYear();
  const setExpanded = (next: boolean) => {
    setIsExpanded(next);
    panelAnim.value = withTiming(next ? 1 : 0, {
      duration: next ? 220 : 180,
      easing: Easing.out(Easing.cubic),
    });
  };

  return (
    <View style={[styles.shell, { backgroundColor: colors.background, paddingHorizontal: hPad }]}>
      <Pressable
        onHoverIn={() => setExpanded(true)}
        onHoverOut={() => setExpanded(false)}
        onFocus={() => setExpanded(true)}
        onBlur={() => setExpanded(false)}
        onPress={() => setExpanded(!isExpanded)}
        style={styles.dockTrigger}
        accessibilityRole="button"
        accessibilityLabel={isExpanded ? 'Collapse footer' : 'Expand footer'}
      >
        <View style={[styles.dockHandle, { backgroundColor: colors.borderLight }]} />
      </Pressable>

      <Animated.View style={panelStyle} pointerEvents={isExpanded ? 'auto' : 'none'}>
        <View
          style={[
            styles.wrap,
            {
              borderTopColor: colors.borderLight,
              backgroundColor: colors.background,
            },
          ]}
          accessibilityLabel="Site footer, legal links and copyright"
        >
          <View style={[styles.topRow, isMobile && styles.topRowStacked]}>
            <View style={styles.linksRow}>
              {FOOTER_LINKS.map((item, index) => (
                <React.Fragment key={item.href}>
                  {index > 0 ? (
                    <Text
                      style={[styles.sep, { color: colors.textSecondary }]}
                      accessible={false}
                      importantForAccessibility="no"
                    >
                      ·
                    </Text>
                  ) : null}
                  <Link href={item.href} asChild>
                    <Pressable
                      accessibilityRole="link"
                      accessibilityLabel={item.label}
                      style={({ pressed }) => [styles.linkHit, pressed && styles.pressed]}
                    >
                      <Text style={[TextStyles.captionSemibold, { color: colors.primary }]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  </Link>
                </React.Fragment>
              ))}
            </View>
            <Text
              style={[TextStyles.caption, styles.copy, { color: colors.textSecondary }]}
              selectable
            >
              © {year} {APP_NAME}
            </Text>
          </View>
          <Text style={[TextStyles.caption, styles.tagline, { color: colors.textSecondary }]}>
            Cultural events & communities for diaspora cities · {APP_DOMAIN}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    maxWidth: '100%',
    flexShrink: 0,
    alignSelf: 'stretch',
    paddingBottom: 8,
  },
  dockTrigger: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    paddingBottom: 6,
  },
  dockHandle: {
    width: 48,
    height: 4,
    borderRadius: 999,
    opacity: 0.9,
  },
  wrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  topRowStacked: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  linksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  sep: {
    ...TextStyles.caption,
    marginHorizontal: 2,
  },
  linkHit: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  pressed: {
    opacity: 0.72,
  },
  copy: {
    flexShrink: 0,
  },
  tagline: {
    marginTop: 6,
    opacity: 0.92,
  },
});
