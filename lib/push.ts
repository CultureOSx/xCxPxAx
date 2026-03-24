import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { api } from './api';
import { router } from 'expo-router';

/**
 * Configure how the app handles notifications when it's in the foreground.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationData {
  screen?: string;
  eventId?: string;
  communityId?: string;
  userId?: string;
  url?: string;
}

function handleNotificationResponse(data: NotificationData) {
  try {
    if (data.screen === 'event' && data.eventId) {
      router.push({ pathname: '/event/[id]', params: { id: data.eventId } });
    } else if (data.screen === 'community' && data.communityId) {
      router.push({ pathname: '/community/[id]', params: { id: data.communityId } });
    } else if (data.screen === 'profile' && data.userId) {
      router.push({ pathname: '/profile/[id]', params: { id: data.userId } });
    } else if (data.screen === 'notifications') {
      router.push('/notifications');
    } else if (data.screen === 'tickets') {
      router.push('/tickets');
    } else if (data.screen === 'perks') {
      router.push('/(tabs)/perks');
    } else if (data.url) {
      const url = data.url;
      if (url.startsWith('/') && !url.startsWith('//') && !url.includes('://')) {
        router.push(url as any);
      }
    }
  } catch (err) {
    console.warn('Navigation error in notification handler:', err);
  }
}

/**
 * registerForPushNotificationsAsync
 */
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'web') {
    return null;
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data;
      
      try {
        const me = await api.auth.me();
        if (me?.id) {
          await api.users.update(me.id, { pushToken: token } as any);
        }
      } catch (err) {
        // console.error('Failed to save push token to profile:', err);
      }

    } catch (e) {
      console.error('Error getting push token:', e);
    }
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}

/**
 * setupNotificationListeners
 */
export function setupNotificationListeners(
  notificationListener: { current: any },
  responseListener: { current: any }
) {
  notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
    // console.log('Notification Received:', notification);
  });

  responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data as NotificationData;
    handleNotificationResponse(data);
  });

  return () => {
    if (notificationListener.current) {
      notificationListener.current.remove();
    }
    if (responseListener.current) {
      responseListener.current.remove();
    }
  };
}
