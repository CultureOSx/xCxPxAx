import { ReactNode } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { useTabScrollBottomPadding } from '@/hooks/useTabScrollBottomPadding';

interface TabScreenShellProps {
  children: ReactNode;
  contentMaxWidth?: number;
  horizontalPadding?: number;
  /** Adds tab bar + safe-area bottom inset so content is not hidden behind the floating tab bar. */
  reserveTabBarSpace?: boolean;
  /** Extra pixels below `reserveTabBarSpace` clearance */
  tabBarExtraPadding?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  showsVerticalScrollIndicator?: boolean;
  /** Subtle brand-gradient mesh behind scroll content (Liquid Glass ambient). */
  ambientMesh?: boolean;
}

export default function TabScreenShell({
  children,
  contentMaxWidth,
  horizontalPadding = 0,
  reserveTabBarSpace = false,
  tabBarExtraPadding = 0,
  contentContainerStyle,
  refreshControl,
  showsVerticalScrollIndicator = false,
  ambientMesh = false,
}: TabScreenShellProps) {
  const colors = useColors();
  const tabBottomPad = useTabScrollBottomPadding(tabBarExtraPadding);

  return (
    <View style={[styles.root, ambientMesh && { backgroundColor: colors.background }]}>
      {ambientMesh ? (
        <LinearGradient
          colors={gradients.culturepassBrand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ambientMesh}
          pointerEvents="none"
        />
      ) : null}
      <ScrollView
        style={ambientMesh ? styles.scrollTransparent : undefined}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        refreshControl={refreshControl}
        contentContainerStyle={[
          styles.content,
          {
            maxWidth: contentMaxWidth,
            paddingHorizontal: horizontalPadding,
            paddingBottom: reserveTabBarSpace ? tabBottomPad : undefined,
          },
          contentContainerStyle,
        ]}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  ambientMesh: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.06,
  },
  scrollTransparent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    width: '100%',
    alignSelf: 'center',
  },
});