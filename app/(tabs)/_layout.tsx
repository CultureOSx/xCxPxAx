// app/(tabs)/_layout.tsx
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { CustomTabBar } from '@/components/tabs/CustomTabBar';
import { Ionicons } from '@expo/vector-icons';
import { CultureTodayProvider } from '@/contexts/CultureTodayContext';

/**
 * Main Tab Layout — CulturePass
 * Bottom bar: Discover · Feed · Events · Community · Perks
 * Profile & account: header menu (burger) → /menu
 */
export default function TabsLayout() {
  return (
    <CultureTodayProvider>
      <View style={styles.tabShell}>
        <View style={styles.tabsFlex}>
        <Tabs
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{
            headerShown: false,
            tabBarHideOnKeyboard: true,
            tabBarStyle: {
              position: 'absolute',
              backgroundColor: 'transparent',
              borderTopWidth: 0,
              elevation: 0,
              shadowOpacity: 0,
            },
          }}
          initialRouteName="index"
        >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="communities"
        options={{
          title: 'Communities',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet-outline" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />

      {/* In-tab profile (opened from Account menu, deep links, avatar). Hidden from tab bar. */}
      <Tabs.Screen name="profile" options={{ href: null }} />

      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="directory" options={{ href: null }} />
      <Tabs.Screen name="dashboard" options={{ href: null }} />
        </Tabs>
        </View>
      </View>
    </CultureTodayProvider>
  );
}

const styles = StyleSheet.create({
  tabShell: {
    flex: 1,
  },
  tabsFlex: {
    flex: 1,
  },
});
