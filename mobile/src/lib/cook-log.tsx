// The cooking journal: every time you finish a recipe it's logged here, and you can add how it
// went (stars), a photo and a note for next time. Photos are copied into the app's own folder so
// they stay even if you delete them from your camera roll. Everything is kept on the phone.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

export type CookEntry = { id: string; recipeId: string; title: string; at: number; rating: number; note: string; photo?: string };

const KEY = 'mise.cooklog.v1';
const MAX = 400;
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function clean(v: unknown): CookEntry[] {
  if (!Array.isArray(v)) return [];
  return v.slice(0, MAX).flatMap(x => {
    const o = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>;
    if (typeof o.id !== 'string' || typeof o.recipeId !== 'string' || typeof o.at !== 'number' || !Number.isFinite(o.at)) return [];
    const rating = typeof o.rating === 'number' ? Math.max(0, Math.min(5, Math.round(o.rating))) : 0;
    const photo = typeof o.photo === 'string' && /^(file|content|blob|data|https?):/.test(o.photo) ? o.photo : undefined;
    return [{
      id: o.id.slice(0, 32), recipeId: o.recipeId.slice(0, 32), title: typeof o.title === 'string' ? o.title.slice(0, 120) : 'Recipe',
      at: o.at, rating, note: typeof o.note === 'string' ? o.note.slice(0, 1000) : '', ...(photo ? { photo } : {}),
    }];
  });
}

// Keep a copy of a picked photo inside the app. On the web there's no app folder, so the picked
// image is used as is (it may not survive a reload).
export async function keepPhoto(uri: string, id: string): Promise<string> {
  if (Platform.OS === 'web') return uri;
  const dir = new Directory(Paths.document, 'cook-photos');
  dir.create({ idempotent: true, intermediates: true });
  const dest = new File(dir, `${id}-${Date.now().toString(36)}.jpg`);
  await new File(uri).copy(dest);
  return dest.uri;
}

function dropPhoto(uri?: string) {
  if (!uri || Platform.OS === 'web' || !uri.startsWith('file:')) return;
  try { new File(uri).delete(); } catch { /* already gone */ }
}

// Weeks in a row (ending this week or last week) with at least one cook.
export function weekStreak(entries: CookEntry[], now = Date.now()) {
  const weekOf = (t: number) => {
    const d = new Date(t);
    const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
    return Math.round(monday.getTime() / (7 * 864e5));
  };
  const weeks = new Set(entries.map(e => weekOf(e.at)));
  let w = weekOf(now);
  if (!weeks.has(w)) w -= 1; // this week isn't over yet: a streak through last week still counts
  let n = 0;
  while (weeks.has(w)) { n++; w--; }
  return n;
}

type LogValue = {
  entries: CookEntry[];
  log: (recipeId: string, title: string, at?: number) => string;
  clearAll: () => void;
  update: (id: string, patch: Partial<Pick<CookEntry, 'rating' | 'note' | 'photo'>>) => void;
  remove: (id: string) => void;
  forRecipe: (recipeId: string) => CookEntry[];
};

const Ctx = createContext<LogValue | null>(null);
export const useCookLog = () => useContext(Ctx)!;

export function CookLogProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<CookEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(raw => setEntries(clean(raw ? JSON.parse(raw) : [])))
      .catch(() => setEntries([]))
      .finally(() => setReady(true));
  }, []);
  useEffect(() => { if (ready) AsyncStorage.setItem(KEY, JSON.stringify(entries)).catch(() => {}); }, [ready, entries]);

  // Newest first.
  const log = useCallback((recipeId: string, title: string, at = Date.now()) => {
    const id = newId();
    setEntries(list => [{ id, recipeId, title: title.slice(0, 120), at, rating: 0, note: '' }, ...list].sort((a, b) => b.at - a.at).slice(0, MAX));
    return id;
  }, []);
  const update = useCallback<LogValue['update']>((id, patch) => {
    setEntries(list => list.map(e => {
      if (e.id !== id) return e;
      if ('photo' in patch && patch.photo !== e.photo) dropPhoto(e.photo);
      return { ...e, ...patch, note: (patch.note ?? e.note).slice(0, 1000) };
    }));
  }, []);
  const remove = useCallback((id: string) => {
    setEntries(list => {
      dropPhoto(list.find(e => e.id === id)?.photo);
      return list.filter(e => e.id !== id);
    });
  }, []);
  const clearAll = useCallback(() => setEntries(list => { list.forEach(e => dropPhoto(e.photo)); return []; }), []);
  const forRecipe = useCallback((recipeId: string) => entries.filter(e => e.recipeId === recipeId), [entries]);

  const value = useMemo(() => ({ entries, log, update, remove, clearAll, forRecipe }), [entries, log, update, remove, clearAll, forRecipe]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// Monday-based week number for a time, shared by the streak screens.
export function weekNumber(t: number) {
  const d = new Date(t);
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
  return Math.round(monday.getTime() / (7 * 864e5));
}

// The longest run of weeks in a row with at least one cook.
export function bestStreak(entries: CookEntry[]) {
  const weeks = [...new Set(entries.map(e => weekNumber(e.at)))].sort((a, b) => a - b);
  let best = 0, run = 0;
  weeks.forEach((w, i) => { run = i && w === weeks[i - 1] + 1 ? run + 1 : 1; best = Math.max(best, run); });
  return best;
}
