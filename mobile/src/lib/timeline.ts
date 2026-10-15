// "Ready by 7 PM": work backwards from when you want to eat to when each step should start.
// A step takes as long as its timer (waiting, baking…), or about 5 minutes of hands-on work if it
// has none. "Every 30 minutes, 3 sets" counts all the sets, and a step that starts with "While…"
// or "Meanwhile" happens during the step before it, so it adds no time. It's an estimate, so the
// total is rounded to 5 minutes and shown as "about".
import { plainText } from '../shared/parser';
import type { Recipe } from './store';

const HANDS_ON = 5;
const WORDS: Record<string, number> = { two: 2, three: 3, four: 4, five: 5, six: 6 };
const count = (s?: string) => (s ? Number(s) || WORDS[s.toLowerCase()] || 1 : 1);

function repeats(text: string) {
  if (!/\bevery\b/i.test(text)) return 1;
  const sets = text.match(/\b(\d+|two|three|four|five|six)\s+(?:sets|rounds)\b/i)?.[1];
  return count(sets ?? text.match(/\b(\d+|two|three|four|five|six)\s+times\b/i)?.[1]);
}

const isMeanwhile = (text: string) => /^\s*(while|meanwhile|in the meantime)\b/i.test(text);

export function stepMinutes(r: Recipe): number[] {
  return r.steps.map(s => {
    const text = plainText(s.text);
    const timer = s.timers[0]?.minutes ?? 0;
    return timer ? timer * repeats(text) : HANDS_ON;
  });
}

export type Slot = { index: number; title: string; at: Date; minutes: number };

export function schedule(r: Recipe, readyAt: Date): { start: Date; slots: Slot[]; total: number } {
  const mins = stepMinutes(r);
  const parallel = r.steps.map((s, i) => i > 0 && isMeanwhile(plainText(s.text)));
  const raw = mins.reduce((sum, m, i) => sum + (parallel[i] ? 0 : m), 0);
  const total = Math.ceil(raw / 5) * 5;
  const start = new Date(readyAt.getTime() - total * 60_000);
  let t = start.getTime();
  let prevStart = t;
  const slots = r.steps.map((s, i) => {
    // A "while…" step starts with the step before it (or finishes when it does, if it's longer).
    const at = parallel[i] ? Math.max(prevStart, t - mins[i] * 60_000) : t;
    if (!parallel[i]) { prevStart = t; t += mins[i] * 60_000; }
    return { index: i, title: s.title || plainText(s.text).slice(0, 60), at: new Date(at), minutes: mins[i] };
  });
  return { start, slots, total };
}

export const clockTime = (d: Date) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
