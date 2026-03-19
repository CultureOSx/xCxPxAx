// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { CustomTabBar } from '@/components/tabs/CustomTabBar';
import { Ionicons } from '@expo/vector-icons';

const TAB_CONFIG = [
  { name: 'index',        title: 'Discover',  icon: 'compass-outline' },
  { name: 'feed',       title: 'Feed',      icon: 'newspaper-outline' },
  { name: 'calendar',     title: 'Calendar',  icon: 'calendar-outline' },
  { name: 'community',    title: 'Community', icon: 'people-outline' },
  { name: 'perks',        title: 'Perks',     icon: 'gift-outline' },
  { name: 'profile',      title: 'Profile',   icon: 'person-outline' },
] as const;

const HIDDEN_ROUTES = [
  'explore',
  'directory',
  'council',
  'dashboard',
  // add more hidden / deep-link only screens here
] as const;

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: { position: 'absolute' },
      }}
      initialRouteName="calendar" // ← you can change this
    >
      {TAB_CONFIG.map((screen) => (
        <Tabs.Screen
          key={screen.name}
          name={screen.name}
          options={{
            title: screen.title,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={(focused ? screen.icon.replace('-outline', '') : screen.icon) as keyof typeof Ionicons.glyphMap}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}

      {/* Hidden screens – not visible in tab bar */}
      {HIDDEN_ROUTES.map((name) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            href: null,
          }}
        />
      ))}
    </Tabs>
  );
}