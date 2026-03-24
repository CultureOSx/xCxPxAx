// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { CustomTabBar } from '@/components/tabs/CustomTabBar';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

/**
 * Main Tab Layout — CulturePass v1.1
 * Updated 5-tab structure: Feed | Events | Community | Calendar | Profile
 */
export default function TabsLayout() {
  const colors = useColors();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: { position: 'absolute' },
      }}
      initialRouteName="index"
    >
      {/* 1. Discovery — Home experience (The first thing users see) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discovery',
          tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" size={size} color={color} />,
        }}
      />

      {/* 2. Feed — Community updates & social feed */}
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />

      {/* 3. Community — Connect with your heritage */}
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-circle-outline" size={size} color={color} />,
        }}
      />

      {/* 4. Calendar — Personal schedule */}
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />

      {/* 5. Profile — User settings & identity */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" size={size} color={color} />,
        }}
      />

      {/* 6. Quest Center — Perks & Gamification (Visible) */}
      <Tabs.Screen
        name="perks"
        options={{
          title: 'Quests',
          tabBarIcon: ({ color, size }) => <Ionicons name="gift-outline" size={size} color={color} />,
        }}
      />

      {/* Hidden Routes */}
      <Tabs.Screen name="directory" options={{ href: null }} />
      <Tabs.Screen name="dashboard" options={{ href: null }} />
      <Tabs.Screen name="discover-classic" options={{ href: null }} />
    </Tabs>
  );
}