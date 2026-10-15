// The meal plan: for each day, breakfast / lunch / dinner, each a saved recipe or a note
// ("Leftovers", "Eating out"). Saved on the phone.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Meal = 'breakfast' | 'lunch' | 'dinner';
export const MEALS: [Meal, string][] = [['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['dinner', 'Dinner']];

export type PlanEntry = { id: string; date: string; meal: Meal; recipeId?: string; text?: string };

const KEY = 'mise.plan.v1';
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Local date as YYYY-MM-DD.
export function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// The 7 days (Monday first) of the week that contains `d`, shifted by `offset` weeks.
export function weekDays(d: Date, offset = 0) {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

function clean(v: unknown): PlanEntry[] {
  if (!Array.isArray(v)) return [];
  return v.slice(0, 500).flatMap(x => {
    const o = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>;
    const meal = MEALS.find(([m]) => m === o.meal)?.[0];
    if (typeof o.id !== 'string' || typeof o.date !== 'string' || !DATE_RE.test(o.date) || !meal) return [];
    const recipeId = typeof o.recipeId === 'string' && /^[a-z0-9]{4,32}$/.test(o.recipeId) ? o.recipeId : undefined;
    const text = typeof o.text === 'string' ? o.text.trim().slice(0, 80) : undefined;
    if (!recipeId && !text) return [];
    return [{ id: o.id.slice(0, 32), date: o.date, meal, ...(recipeId ? { recipeId } : {}), ...(text ? { text } : {}) }];
  });
}

type PlannerValue = {
  entries: PlanEntry[];
  add: (date: string, meal: Meal, item: { recipeId?: string; text?: string }) => void;
  remove: (id: string) => void;
  clearWeek: (dates: string[]) => void;
};

const Ctx = createContext<PlannerValue | null>(null);
export const usePlanner = () => useContext(Ctx)!;

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<PlanEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(raw => setEntries(clean(raw ? JSON.parse(raw) : [])))
      .catch(() => setEntries([]))
      .finally(() => setReady(true));
  }, []);
  useEffect(() => { if (ready) AsyncStorage.setItem(KEY, JSON.stringify(entries)).catch(() => {}); }, [ready, entries]);

  const add = useCallback<PlannerValue['add']>((date, meal, item) => {
    if (!DATE_RE.test(date) || (!item.recipeId && !item.text?.trim())) return;
    setEntries(list => [...list, { id: newId(), date, meal, ...(item.recipeId ? { recipeId: item.recipeId } : {}), ...(item.text?.trim() ? { text: item.text.trim().slice(0, 80) } : {}) }].slice(-500));
  }, []);
  const remove = useCallback((id: string) => setEntries(list => list.filter(e => e.id !== id)), []);
  const clearWeek = useCallback((dates: string[]) => setEntries(list => list.filter(e => !dates.includes(e.date))), []);

  const value = useMemo(() => ({ entries, add, remove, clearWeek }), [entries, add, remove, clearWeek]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
