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
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
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

// The user's notification choices (Account → Notifications), kept in step by the app's store.
let prefs = { enabled: true, preview: true, sound: true };
export function setNotificationPrefs(next: typeof prefs) { prefs = next; }
export const notificationPrefs = () => prefs;
// Asks for permission the first time; false if notifications aren't allowed.
export const ensureNotifications = () => prepare();

// Number on the app icon (e.g. how many timers are running); 0 clears it.
export function setBadge(count: number) {
  Notifications.setBadgeCountAsync(count).catch(() => {});
}

export async function scheduleAlarm(label: string, recipeTitle: string, ms: number): Promise<string | null> {
  if (!prefs.enabled) return null;
  if (!(await prepare())) return null;
  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: prefs.preview ? `⏰ ${label.trim() || 'Timer'}` : '⏰ Timer done',
        body: prefs.preview ? (recipeTitle ? `${recipeTitle}: time's up!` : "Time's up!") : 'Your timer has finished.',
        sound: prefs.sound ? 'default' : false,
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
