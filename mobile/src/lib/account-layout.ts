// Which sections the Account tab shows, and in what order. Changed from Developer → Account layout.
// The Developer section itself always stays at the bottom so it can't be hidden by mistake.
import type { IconName } from '../components/ui';
import type { Settings } from './store';

export type AccountSection = 'plan' | 'kitchen' | 'account' | 'sous' | 'app' | 'help';
export const ACCOUNT_SECTIONS: [AccountSection, string, IconName][] = [
  ['plan', 'Plan', 'sparkles'],
  ['kitchen', 'Your kitchen', 'restaurant-outline'],
  ['account', 'Account', 'person-outline'],
  ['sous', 'Sous', 'chatbubble-outline'],
  ['app', 'App', 'color-palette-outline'],
  ['help', 'Help & legal', 'help-circle-outline'],
];
const DEFAULT = ACCOUNT_SECTIONS.map(s => s[0]);

export function accountLayout(s: Pick<Settings, 'accountOrder' | 'accountHidden'>) {
  const saved = s.accountOrder.split(',').filter((k): k is AccountSection => DEFAULT.includes(k as AccountSection));
  const all = [...new Set([...saved, ...DEFAULT])]; // sections added later still show up
  const hidden = new Set(s.accountHidden.split(',').filter(Boolean));
  return { all, hidden, order: all.filter(k => !hidden.has(k)) };
}
