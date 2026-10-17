// The settings pages (Account → App), each opened as /settings?section=…
import type { IconName } from '../components/ui';

export type SettingsSection = 'cook' | 'units' | 'handsfree' | 'timers' | 'haptics';
export const SETTINGS_SECTIONS: [SettingsSection, string, IconName, string][] = [
  ['cook', 'Cook mode', 'restaurant-outline', 'Layout, step pictures and what each step shows'],
  ['units', 'Units', 'scale-outline', 'Metric, US or as the recipe is written'],
  ['handsfree', 'Hands-free', 'mic-outline', 'Steps read aloud and voice commands'],
  ['timers', 'Timers & alarms', 'alarm-outline', 'The sound when a timer ends'],
  ['haptics', 'Vibration', 'phone-portrait-outline', 'Little taps when you press things'],
];
