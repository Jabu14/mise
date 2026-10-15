// Gentle reminders (Account → Notifications → Reminders):
// - Meal plan: on each day you've planned something, a note at the time you choose with what's on.
// - Finish what you started: if you leave cook mode halfway, a nudge a few hours later
//   (cancelled as soon as you go back to it).
// Tapping a reminder opens the plan or the recipe.
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ensureNotifications, notificationPrefs } from './notifications';

const CHANNEL = 'reminders';
const FINISH_AFTER_MS = 4 * 60 * 60 * 1000;

type Kind = 'plan' | 'finish' | 'start';

async function cancelKind(kind: Kind) {
  const all = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
  await Promise.all(all.filter(n => n.content.data?.kind === kind).map(n => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {})));
}

export type PlanDay = { date: string; lines: string[] }; // date = YYYY-MM-DD, lines like "Dinner: Easy Crusty Bread"

// Replace all meal plan reminders with ones for these days (only future times are scheduled).
export async function syncPlanReminders(days: PlanDay[], hour: number, on: boolean) {
  if (Platform.OS === 'web') return;
  await cancelKind('plan');
  const now = Date.now();
  const upcoming = days
    .map(d => { const [y, m, day] = d.date.split('-').map(Number); return { ...d, at: new Date(y, m - 1, day, hour, 0, 0) }; })
    .filter(d => d.lines.length && d.at.getTime() > now + 60_000)
    .slice(0, 14);
  if (!on || !upcoming.length || !(await ensureNotifications())) return;
  const { preview, sound } = notificationPrefs();
  for (const d of upcoming) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: hour >= 15 ? '🍽️ Tonight’s plan' : '🍽️ Today’s meal plan',
        body: preview ? d.lines.join('\n') : 'You have meals planned today.',
        sound: sound ? 'default' : false,
        data: { kind: 'plan', url: '/planner' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: d.at, channelId: CHANNEL },
    }).catch(() => {});
  }
}

export async function scheduleFinishReminder(recipeId: string, title: string, step: number, total: number) {
  if (Platform.OS === 'web') return;
  await cancelKind('finish');
  if (!(await ensureNotifications())) return;
  const { preview, sound } = notificationPrefs();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: preview ? `Still making ${title}?` : 'Still cooking?',
      body: preview ? `You stopped at step ${step + 1} of ${total}. Tap to pick up where you left off.` : 'Tap to pick up where you left off.',
      sound: sound ? 'default' : false,
      data: { kind: 'finish', url: `/recipe/${recipeId}` },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: FINISH_AFTER_MS / 1000, repeats: false, channelId: CHANNEL },
  }).catch(() => {});
}

export function cancelFinishReminder() {
  if (Platform.OS !== 'web') cancelKind('finish').catch(() => {});
}

// Only these screens can be opened from a notification.
export function reminderUrl(data: unknown): string | null {
  const url = data && typeof data === 'object' ? (data as Record<string, unknown>).url : null;
  return typeof url === 'string' && /^\/(planner|recipe\/[a-z0-9]{4,32})$/.test(url) ? url : null;
}

// "Ready by": a reminder when it's time to start cooking (one at a time). Returns false if
// notifications aren't allowed.
export async function scheduleStartReminder(recipeId: string, title: string, at: Date, readyBy: string): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  await cancelKind('start');
  if (at.getTime() < Date.now() + 60_000 || !(await ensureNotifications())) return false;
  const { preview, sound } = notificationPrefs();
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: preview ? `Time to start ${title}` : 'Time to start cooking',
      body: preview ? `Start now and it'll be ready by ${readyBy}.` : 'Tap to open the recipe.',
      sound: sound ? 'default' : false,
      data: { kind: 'start', url: `/recipe/${recipeId}` },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: CHANNEL },
  }).catch(() => null);
  return !!id;
}
