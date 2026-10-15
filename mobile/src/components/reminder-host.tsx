// Keeps meal plan reminders in step with the plan, and opens the right screen when a reminder
// is tapped. Renders nothing.
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { MEALS, dayKey, usePlanner } from '../lib/planner';
import { reminderUrl, syncPlanReminders, type PlanDay } from '../lib/reminders';
import { useApp } from '../lib/store';

export function ReminderHost() {
  if (Platform.OS === 'web') return null;
  return <NativeReminders />;
}

function NativeReminders() {
  const { settings, getRecipe } = useApp();
  const { entries } = usePlanner();
  const response = Notifications.useLastNotificationResponse();
  const opened = useRef<string | null>(null);

  // What's planned from today on, as one line per meal ("Dinner: Easy Crusty Bread").
  const today = dayKey(new Date());
  const days: PlanDay[] = [...new Set(entries.map(e => e.date))].filter(d => d >= today).sort().map(date => ({
    date,
    lines: MEALS.flatMap(([meal, label]) => entries
      .filter(e => e.date === date && e.meal === meal)
      .map(e => `${label}: ${(e.recipeId ? getRecipe(e.recipeId)?.title : undefined) ?? e.text ?? 'Planned'}`)),
  })).filter(d => d.lines.length);
  const signature = JSON.stringify([days, settings.remindPlan, settings.remindPlanTime, settings.notifyPreview, settings.notifySound]);

  // Re-schedule shortly after the plan or the settings change (not on every keystroke).
  useEffect(() => {
    const [d, on, hour] = JSON.parse(signature) as [PlanDay[], boolean, string];
    const t = setTimeout(() => { syncPlanReminders(d, Number(hour), on).catch(() => {}); }, 1500);
    return () => clearTimeout(t);
  }, [signature]);

  useEffect(() => {
    const id = response?.notification.request.identifier;
    const url = reminderUrl(response?.notification.request.content.data);
    if (!id || !url || opened.current === id) return;
    opened.current = id;
    // Handled: don't open it again the next time the app starts.
    Notifications.clearLastNotificationResponse();
    router.push(url as '/planner');
  }, [response]);

  return null;
}
