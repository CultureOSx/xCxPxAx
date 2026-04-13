// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { api } from './api';
import { router } from 'expo-router';
import type { Notification, Subscription } from 'expo-notifications';
type NotificationsCompat = typeof Notifications & {
  setNotificationChannelAsync: (channelId: string, channel: {
    name: string;
    importance: number;
    vibrationPattern?: number[];
    lightColor?: string;
  }) => Promise<unknown>;
  AndroidImportance: {
    MAX: number;
  };
  addNotificationReceivedListener: (listener: (notification: Notification) => void) => Subscription;
};
const notificationsCompat = Notifications as NotificationsCompat;

/**
 * Configure how the app handles notifications when it's in the foreground.
 */
Notifications.setNotificationHandler(stryMutAct_9fa48("3934") ? {} : (stryCov_9fa48("3934"), {
  handleNotification: stryMutAct_9fa48("3935") ? () => undefined : (stryCov_9fa48("3935"), async () => stryMutAct_9fa48("3936") ? {} : (stryCov_9fa48("3936"), {
    shouldShowAlert: stryMutAct_9fa48("3937") ? false : (stryCov_9fa48("3937"), true),
    shouldPlaySound: stryMutAct_9fa48("3938") ? false : (stryCov_9fa48("3938"), true),
    shouldSetBadge: stryMutAct_9fa48("3939") ? false : (stryCov_9fa48("3939"), true)
  }))
}));
interface NotificationData {
  screen?: string;
  eventId?: string;
  communityId?: string;
  userId?: string;
  url?: string;
}
function handleNotificationResponse(data: NotificationData) {
  if (stryMutAct_9fa48("3940")) {
    {}
  } else {
    stryCov_9fa48("3940");
    try {
      if (stryMutAct_9fa48("3941")) {
        {}
      } else {
        stryCov_9fa48("3941");
        if (stryMutAct_9fa48("3944") ? data.screen === 'event' || data.eventId : stryMutAct_9fa48("3943") ? false : stryMutAct_9fa48("3942") ? true : (stryCov_9fa48("3942", "3943", "3944"), (stryMutAct_9fa48("3946") ? data.screen !== 'event' : stryMutAct_9fa48("3945") ? true : (stryCov_9fa48("3945", "3946"), data.screen === (stryMutAct_9fa48("3947") ? "" : (stryCov_9fa48("3947"), 'event')))) && data.eventId)) {
          if (stryMutAct_9fa48("3948")) {
            {}
          } else {
            stryCov_9fa48("3948");
            router.push(stryMutAct_9fa48("3949") ? {} : (stryCov_9fa48("3949"), {
              pathname: stryMutAct_9fa48("3950") ? "" : (stryCov_9fa48("3950"), '/event/[id]'),
              params: stryMutAct_9fa48("3951") ? {} : (stryCov_9fa48("3951"), {
                id: data.eventId
              })
            }));
          }
        } else if (stryMutAct_9fa48("3954") ? data.screen === 'community' || data.communityId : stryMutAct_9fa48("3953") ? false : stryMutAct_9fa48("3952") ? true : (stryCov_9fa48("3952", "3953", "3954"), (stryMutAct_9fa48("3956") ? data.screen !== 'community' : stryMutAct_9fa48("3955") ? true : (stryCov_9fa48("3955", "3956"), data.screen === (stryMutAct_9fa48("3957") ? "" : (stryCov_9fa48("3957"), 'community')))) && data.communityId)) {
          if (stryMutAct_9fa48("3958")) {
            {}
          } else {
            stryCov_9fa48("3958");
            router.push(stryMutAct_9fa48("3959") ? {} : (stryCov_9fa48("3959"), {
              pathname: stryMutAct_9fa48("3960") ? "" : (stryCov_9fa48("3960"), '/community/[id]'),
              params: stryMutAct_9fa48("3961") ? {} : (stryCov_9fa48("3961"), {
                id: data.communityId
              })
            }));
          }
        } else if (stryMutAct_9fa48("3964") ? data.screen === 'profile' || data.userId : stryMutAct_9fa48("3963") ? false : stryMutAct_9fa48("3962") ? true : (stryCov_9fa48("3962", "3963", "3964"), (stryMutAct_9fa48("3966") ? data.screen !== 'profile' : stryMutAct_9fa48("3965") ? true : (stryCov_9fa48("3965", "3966"), data.screen === (stryMutAct_9fa48("3967") ? "" : (stryCov_9fa48("3967"), 'profile')))) && data.userId)) {
          if (stryMutAct_9fa48("3968")) {
            {}
          } else {
            stryCov_9fa48("3968");
            router.push(stryMutAct_9fa48("3969") ? {} : (stryCov_9fa48("3969"), {
              pathname: stryMutAct_9fa48("3970") ? "" : (stryCov_9fa48("3970"), '/profile/[id]'),
              params: stryMutAct_9fa48("3971") ? {} : (stryCov_9fa48("3971"), {
                id: data.userId
              })
            }));
          }
        } else if (stryMutAct_9fa48("3974") ? data.screen !== 'notifications' : stryMutAct_9fa48("3973") ? false : stryMutAct_9fa48("3972") ? true : (stryCov_9fa48("3972", "3973", "3974"), data.screen === (stryMutAct_9fa48("3975") ? "" : (stryCov_9fa48("3975"), 'notifications')))) {
          if (stryMutAct_9fa48("3976")) {
            {}
          } else {
            stryCov_9fa48("3976");
            router.push(stryMutAct_9fa48("3977") ? "" : (stryCov_9fa48("3977"), '/notifications'));
          }
        } else if (stryMutAct_9fa48("3980") ? data.screen !== 'tickets' : stryMutAct_9fa48("3979") ? false : stryMutAct_9fa48("3978") ? true : (stryCov_9fa48("3978", "3979", "3980"), data.screen === (stryMutAct_9fa48("3981") ? "" : (stryCov_9fa48("3981"), 'tickets')))) {
          if (stryMutAct_9fa48("3982")) {
            {}
          } else {
            stryCov_9fa48("3982");
            router.push(stryMutAct_9fa48("3983") ? "" : (stryCov_9fa48("3983"), '/tickets'));
          }
        } else if (stryMutAct_9fa48("3986") ? data.screen !== 'perks' : stryMutAct_9fa48("3985") ? false : stryMutAct_9fa48("3984") ? true : (stryCov_9fa48("3984", "3985", "3986"), data.screen === (stryMutAct_9fa48("3987") ? "" : (stryCov_9fa48("3987"), 'perks')))) {
          if (stryMutAct_9fa48("3988")) {
            {}
          } else {
            stryCov_9fa48("3988");
            router.push(stryMutAct_9fa48("3989") ? "" : (stryCov_9fa48("3989"), '/(tabs)/perks'));
          }
        } else if (stryMutAct_9fa48("3991") ? false : stryMutAct_9fa48("3990") ? true : (stryCov_9fa48("3990", "3991"), data.url)) {
          if (stryMutAct_9fa48("3992")) {
            {}
          } else {
            stryCov_9fa48("3992");
            const url = data.url;
            if (stryMutAct_9fa48("3995") ? url.startsWith('/') && !url.startsWith('//') || !url.includes('://') : stryMutAct_9fa48("3994") ? false : stryMutAct_9fa48("3993") ? true : (stryCov_9fa48("3993", "3994", "3995"), (stryMutAct_9fa48("3997") ? url.startsWith('/') || !url.startsWith('//') : stryMutAct_9fa48("3996") ? true : (stryCov_9fa48("3996", "3997"), (stryMutAct_9fa48("3998") ? url.endsWith('/') : (stryCov_9fa48("3998"), url.startsWith(stryMutAct_9fa48("3999") ? "" : (stryCov_9fa48("3999"), '/')))) && (stryMutAct_9fa48("4000") ? url.startsWith('//') : (stryCov_9fa48("4000"), !(stryMutAct_9fa48("4001") ? url.endsWith('//') : (stryCov_9fa48("4001"), url.startsWith(stryMutAct_9fa48("4002") ? "" : (stryCov_9fa48("4002"), '//')))))))) && (stryMutAct_9fa48("4003") ? url.includes('://') : (stryCov_9fa48("4003"), !url.includes(stryMutAct_9fa48("4004") ? "" : (stryCov_9fa48("4004"), '://')))))) {
              if (stryMutAct_9fa48("4005")) {
                {}
              } else {
                stryCov_9fa48("4005");
                router.push(url as any);
              }
            }
          }
        }
      }
    } catch (err) {
      if (stryMutAct_9fa48("4006")) {
        {}
      } else {
        stryCov_9fa48("4006");
        console.warn(stryMutAct_9fa48("4007") ? "" : (stryCov_9fa48("4007"), 'Navigation error in notification handler:'), err);
      }
    }
  }
}

/**
 * registerForPushNotificationsAsync
 */
export async function registerForPushNotificationsAsync() {
  if (stryMutAct_9fa48("4008")) {
    {}
  } else {
    stryCov_9fa48("4008");
    let token;
    if (stryMutAct_9fa48("4011") ? Platform.OS !== 'web' : stryMutAct_9fa48("4010") ? false : stryMutAct_9fa48("4009") ? true : (stryCov_9fa48("4009", "4010", "4011"), Platform.OS === (stryMutAct_9fa48("4012") ? "" : (stryCov_9fa48("4012"), 'web')))) {
      if (stryMutAct_9fa48("4013")) {
        {}
      } else {
        stryCov_9fa48("4013");
        return null;
      }
    }
    if (stryMutAct_9fa48("4015") ? false : stryMutAct_9fa48("4014") ? true : (stryCov_9fa48("4014", "4015"), Device.isDevice)) {
      if (stryMutAct_9fa48("4016")) {
        {}
      } else {
        stryCov_9fa48("4016");
        const {
          status: existingStatus
        } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (stryMutAct_9fa48("4019") ? existingStatus === 'granted' : stryMutAct_9fa48("4018") ? false : stryMutAct_9fa48("4017") ? true : (stryCov_9fa48("4017", "4018", "4019"), existingStatus !== (stryMutAct_9fa48("4020") ? "" : (stryCov_9fa48("4020"), 'granted')))) {
          if (stryMutAct_9fa48("4021")) {
            {}
          } else {
            stryCov_9fa48("4021");
            const {
              status
            } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }
        }
        if (stryMutAct_9fa48("4024") ? finalStatus === 'granted' : stryMutAct_9fa48("4023") ? false : stryMutAct_9fa48("4022") ? true : (stryCov_9fa48("4022", "4023", "4024"), finalStatus !== (stryMutAct_9fa48("4025") ? "" : (stryCov_9fa48("4025"), 'granted')))) {
          if (stryMutAct_9fa48("4026")) {
            {}
          } else {
            stryCov_9fa48("4026");
            console.warn(stryMutAct_9fa48("4027") ? "" : (stryCov_9fa48("4027"), 'Failed to get push token for push notification!'));
            return null;
          }
        }
        const projectId = stryMutAct_9fa48("4028") ? Constants?.expoConfig?.extra?.eas?.projectId && Constants?.easConfig?.projectId : (stryCov_9fa48("4028"), (stryMutAct_9fa48("4032") ? Constants.expoConfig?.extra?.eas?.projectId : stryMutAct_9fa48("4031") ? Constants?.expoConfig.extra?.eas?.projectId : stryMutAct_9fa48("4030") ? Constants?.expoConfig?.extra.eas?.projectId : stryMutAct_9fa48("4029") ? Constants?.expoConfig?.extra?.eas.projectId : (stryCov_9fa48("4029", "4030", "4031", "4032"), Constants?.expoConfig?.extra?.eas?.projectId)) ?? (stryMutAct_9fa48("4034") ? Constants.easConfig?.projectId : stryMutAct_9fa48("4033") ? Constants?.easConfig.projectId : (stryCov_9fa48("4033", "4034"), Constants?.easConfig?.projectId)));
        try {
          if (stryMutAct_9fa48("4035")) {
            {}
          } else {
            stryCov_9fa48("4035");
            token = (await Notifications.getExpoPushTokenAsync(stryMutAct_9fa48("4036") ? {} : (stryCov_9fa48("4036"), {
              projectId
            }))).data;
            try {
              if (stryMutAct_9fa48("4037")) {
                {}
              } else {
                stryCov_9fa48("4037");
                const me = await api.auth.me();
                if (stryMutAct_9fa48("4040") ? me.id : stryMutAct_9fa48("4039") ? false : stryMutAct_9fa48("4038") ? true : (stryCov_9fa48("4038", "4039", "4040"), me?.id)) {
                  if (stryMutAct_9fa48("4041")) {
                    {}
                  } else {
                    stryCov_9fa48("4041");
                    await api.users.update(me.id, {
                      pushToken: token
                    } as any);
                  }
                }
              }
            } catch (err) {
              // console.error('Failed to save push token to profile:', err);
            }
          }
        } catch (e) {
          if (stryMutAct_9fa48("4042")) {
            {}
          } else {
            stryCov_9fa48("4042");
            console.error(stryMutAct_9fa48("4043") ? "" : (stryCov_9fa48("4043"), 'Error getting push token:'), e);
          }
        }
      }
    }
    if (stryMutAct_9fa48("4046") ? Platform.OS !== 'android' : stryMutAct_9fa48("4045") ? false : stryMutAct_9fa48("4044") ? true : (stryCov_9fa48("4044", "4045", "4046"), Platform.OS === (stryMutAct_9fa48("4047") ? "" : (stryCov_9fa48("4047"), 'android')))) {
      if (stryMutAct_9fa48("4048")) {
        {}
      } else {
        stryCov_9fa48("4048");
        await notificationsCompat.setNotificationChannelAsync(stryMutAct_9fa48("4049") ? "" : (stryCov_9fa48("4049"), 'default'), stryMutAct_9fa48("4050") ? {} : (stryCov_9fa48("4050"), {
          name: stryMutAct_9fa48("4051") ? "" : (stryCov_9fa48("4051"), 'default'),
          importance: notificationsCompat.AndroidImportance.MAX,
          vibrationPattern: stryMutAct_9fa48("4052") ? [] : (stryCov_9fa48("4052"), [0, 250, 250, 250]),
          lightColor: stryMutAct_9fa48("4053") ? "" : (stryCov_9fa48("4053"), '#FF231F7C')
        }));
      }
    }
    return token;
  }
}

/**
 * setupNotificationListeners
 */
export function setupNotificationListeners(notificationListener: {
  current: Subscription | null;
}, responseListener: {
  current: Subscription | null;
}) {
  if (stryMutAct_9fa48("4054")) {
    {}
  } else {
    stryCov_9fa48("4054");
    notificationListener.current = notificationsCompat.addNotificationReceivedListener((_notification: Notification) => {
      // console.log('Notification Received:', notification);
    });
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      if (stryMutAct_9fa48("4055")) {
        {}
      } else {
        stryCov_9fa48("4055");
        const data = response.notification.request.content.data as NotificationData;
        handleNotificationResponse(data);
      }
    });
    return () => {
      if (stryMutAct_9fa48("4056")) {
        {}
      } else {
        stryCov_9fa48("4056");
        if (stryMutAct_9fa48("4058") ? false : stryMutAct_9fa48("4057") ? true : (stryCov_9fa48("4057", "4058"), notificationListener.current)) {
          if (stryMutAct_9fa48("4059")) {
            {}
          } else {
            stryCov_9fa48("4059");
            notificationListener.current.remove();
          }
        }
        if (stryMutAct_9fa48("4061") ? false : stryMutAct_9fa48("4060") ? true : (stryCov_9fa48("4060", "4061"), responseListener.current)) {
          if (stryMutAct_9fa48("4062")) {
            {}
          } else {
            stryCov_9fa48("4062");
            responseListener.current.remove();
          }
        }
      }
    };
  }
}