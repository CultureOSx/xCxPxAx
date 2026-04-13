// @ts-nocheck
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { CustomTabBar } from '@/components/tabs/CustomTabBar';
import { Ionicons } from '@expo/vector-icons';

/**
 * Main Tab Layout — CulturePass
 * Bottom bar: Discover · Events · Community · My City · Perks · Profile
 * Menu: accessible via /menu deep link and profile header avatar
 */
export default function TabsLayout() {
  return (
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
          title: 'Discover',
          tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Events',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="city"
        options={{
          title: 'My City',
          tabBarIcon: ({ color, size }) => <Ionicons name="location-outline" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="perks"
        options={{
          title: 'Perks',
          tabBarIcon: ({ color, size }) => <Ionicons name="gift-outline" size={size} color={color} />,
        }}
      />

      {/* Profile — primary destination in tab bar. Shows user avatar when authenticated. */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" size={size} color={color} />,
        }}
      />

      {/* Menu — accessible via deep link (/menu) and profile header. Hidden from tab bar. */}
      <Tabs.Screen name="menu" options={{ href: null }} />

      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="directory" options={{ href: null }} />
      <Tabs.Screen name="dashboard" options={{ href: null }} />
    </Tabs>
  );
}
