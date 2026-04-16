import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Link } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useAppAppearance } from '@/hooks/useAppAppearance';
import { APP_NAME, APP_DOMAIN } from '@/lib/app-meta';
import { TextStyles } from '@/constants/typography';
import { glass } from '@/constants/colors';

const FOOTER_LINKS = [
  { href: '/legal/terms', label: 'Terms' },
  { href: '/legal/privacy', label: 'Privacy' },
  { href: '/legal/cookies', label: 'Cookies' },
  { href: '/help', label: 'Help' },
] as const;

const WEB_LINK_HIT = Platform.OS === 'web' ? ({ cursor: 'pointer' as const }) : null;

/**
 * Global site footer — web only (main chrome uses WebShell + sidebar).
 * Thin glass strip: legal links, copyright, and domain in one compact row.
 */
export function AppFooter() {
  const colors = useColors();
  const { hPad, isMobile } = useLayout();
  const { resolvedScheme } = useAppAppearance();
  const glassSkin = resolvedScheme === 'light' ? glass.light : glass.dark;

  if (Platform.OS !== 'web') {
    return null;
  }

  const year = new Date().getFullYear();

  return (
    <View
      style={[
        styles.shell,
        {
          paddingHorizontal: hPad,
          backgroundColor: glassSkin.backgroundColor,
          borderTopColor: glassSkin.borderColor,
        },
      ]}
      accessible
      accessibilityLabel={`Site footer. ${APP_NAME}. Legal links and help.`}
    >
      <View style={[styles.row, isMobile && styles.rowStacked]}>
        <View style={styles.linksRow} accessibilityRole="toolbar">
          {FOOTER_LINKS.map((item, index) => (
            <React.Fragment key={item.href}>
              {index > 0 ? (
                <Text
                  style={[styles.sep, { color: colors.textTertiary }]}
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
                  style={({ pressed }) => [
                    styles.linkHit,
                    WEB_LINK_HIT,
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <Text style={[TextStyles.captionSemibold, { color: colors.primary }]}>{item.label}</Text>
                </Pressable>
              </Link>
            </React.Fragment>
          ))}
        </View>

        <Text
          style={[
            TextStyles.caption,
            styles.meta,
            { color: colors.textSecondary },
            isMobile && styles.metaStacked,
          ]}
          selectable
          numberOfLines={1}
        >
          © {year} {APP_NAME}
          <Text style={{ color: colors.textTertiary }}> · </Text>
          {APP_DOMAIN}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    maxWidth: '100%',
    flexShrink: 0,
    alignSelf: 'stretch',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    minHeight: 28,
    rowGap: 4,
  },
  rowStacked: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  linksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 2,
  },
  sep: {
    ...TextStyles.caption,
    marginHorizontal: 2,
    userSelect: 'none',
  } as const,
  linkHit: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 6,
  },
  meta: {
    flexShrink: 1,
    textAlign: 'right',
    minWidth: 0,
  },
  metaStacked: {
    alignSelf: 'stretch',
    textAlign: 'left',
  },
});
