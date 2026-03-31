import { ReactNode } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
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
}: TabScreenShellProps) {
  const tabBottomPad = useTabScrollBottomPadding(tabBarExtraPadding);

  return (
    <View style={styles.root}>
      <ScrollView
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
  content: {
    width: '100%',
    alignSelf: 'center',
  },
});