// Local notifications for kitchen timers (they ring even when the phone is locked).
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL = 'timers';

Notifications.setNotificationHandler({
  // While the app is open, the in-app alarm (alarm.ts) plays the sound, so the banner stays silent.
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let prepared: Promise<boolean> | null = null;

// Sets up the Android channel and asks for permission once.
function prepare() {
  prepared ??= (async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL, {
        name: 'Kitchen timers',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 400, 200, 400, 200, 400],
      });
    }
    const granted = (s: Notifications.NotificationPermissionsStatus) =>
      Platform.OS === 'ios' ? s.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED : s.status === 'granted';
    const current = await Notifications.getPermissionsAsync();
    if (granted(current)) return true;
    return granted(await Notifications.requestPermissionsAsync());
  })().catch(() => false);
  return prepared;
}

export async function scheduleAlarm(label: string, recipeTitle: string, ms: number): Promise<string | null> {
  if (!(await prepare())) return null;
  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: `⏰ ${label}`,
        body: recipeTitle ? `${recipeTitle}: time's up!` : "Time's up!",
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, Math.round(ms / 1000)),
        repeats: false,
        channelId: CHANNEL,
      },
    });
  } catch {
    return null;
  }
}

export async function cancelAlarm(id: string | null) {
  if (id) await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}
