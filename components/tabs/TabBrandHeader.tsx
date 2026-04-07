import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/lib/auth';
import { routeWithRedirect } from '@/lib/routes';
import { useColors } from '@/hooks/useColors';
import { CultureTokens } from '@/constants/theme';
import { MAIN_TAB_UI } from '@/components/tabs/mainTabTokens';

const isWeb = Platform.OS === 'web';
const HEADER_TAGLINE = 'Discover ❤️ Enjoy Culture.';

interface TabBrandHeaderProps {
  showMenu?: boolean;
}

export function TabBrandHeader({ showMenu = true }: TabBrandHeaderProps) {
  const colors = useColors();
  const { isAuthenticated } = useAuth();

  const haptic = () => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  return (
    <View style={styles.row}>
      <Pressable
        style={styles.brandPress}
        onPress={() => {
          haptic();
          router.push('/(tabs)' as const);
        }}
        accessibilityRole="button"
        accessibilityLabel="CulturePass home"
      >
        <View style={[styles.logoWrap, { backgroundColor: colors.primarySoft }]}>
          <Image
            source={require('@/assets/images/culturepass-logo.png')}
            style={styles.logo}
            contentFit="cover"
          />
        </View>
        <View style={styles.brandTextWrap}>
          <Text style={[styles.brandName, { color: colors.text }]} numberOfLines={1}>
            CulturePass
          </Text>
          <Text style={[styles.brandTagline, { color: CultureTokens.gold }]} numberOfLines={1}>
            {HEADER_TAGLINE}
          </Text>
        </View>
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          style={[styles.iconBtn, { backgroundColor: colors.primarySoft }]}
          onPress={() => {
            haptic();
            router.push('/search' as const);
          }}
          accessibilityRole="button"
          accessibilityLabel="Search"
        >
          <Ionicons name="search" size={MAIN_TAB_UI.iconSize.md} color={colors.text} />
        </Pressable>

        <Pressable
          style={[styles.iconBtn, { backgroundColor: colors.primarySoft }]}
          onPress={() => {
            haptic();
            if (isAuthenticated) {
              router.push('/notifications' as const);
              return;
            }
            router.push(routeWithRedirect('/(onboarding)/login', '/notifications'));
          }}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Ionicons name={isAuthenticated ? 'notifications' : 'notifications-outline'} size={MAIN_TAB_UI.iconSize.md} color={colors.text} />
          {isAuthenticated ? <View style={[styles.notifDot, { borderColor: colors.background }]} /> : null}
        </Pressable>

        {showMenu ? (
          <Pressable
            style={[styles.iconBtn, styles.menuBtn, { backgroundColor: colors.primarySoft, borderColor: colors.borderLight }]}
            onPress={() => {
              haptic();
              router.push('/menu' as const);
            }}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
          >
            <Ionicons name="menu" size={MAIN_TAB_UI.iconSize.lg} color={colors.text} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  brandPress: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  logoWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  logo: {
    width: 36,
    height: 36,
  },
  brandTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  brandName: {
    fontSize: 18,
    lineHeight: 22,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.2,
  },
  brandTagline: {
    marginTop: 1,
    fontSize: 11,
    lineHeight: 14,
    fontFamily: 'Poppins_500Medium',
    letterSpacing: 0.2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtn: {
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  notifDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: CultureTokens.coral,
    borderWidth: 1.5,
  },
});
