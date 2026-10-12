// App state saved on the phone: recipes, look & feel settings, and kitchen timers.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { guessEmoji } from '../shared/parser';
import { startAlarmSound, stopAlarmSound } from './alarm';
import { cancelAlarm, scheduleAlarm } from './notifications';
import { LIMITS, cleanHistory, cleanParsed, cleanRecipes, cleanSettings, cleanTimers } from './validate';

export type Timer = { minutes: number; label: string; auto?: boolean };
export type Step = { title: string; text: string; tip: string; timers: Timer[]; phase: string };
export type Group = { name: string; items: string[] };
export type Recipe = {
  id: string;
  title: string;
  description: string;
  servings: { count: number | null; label: string } | null;
  times: { label: string; value: string }[];
  equipment: string[];
  ingredients: Group[];
  steps: Step[];
  notes: string[];
  source: string;
  emoji: string;
  progress: { step: number; checked: string[]; scale: number };
  createdAt: number;
  updatedAt: number;
  lastOpened?: number;
  lastCooked?: number;
  cookCount?: number;
};
export type Parsed = Omit<Recipe, 'id' | 'source' | 'emoji' | 'progress' | 'createdAt' | 'updatedAt' | 'lastOpened' | 'lastCooked' | 'cookCount'> & { warnings?: string[] };
export type TimerHistoryItem = { minutes: number; label: string; at: number };

export const DEFAULT_SETTINGS = {
  theme: 'sourdough',
  mode: 'auto',         // auto | light | dark
  font: 'classic',      // classic | modern | rounded | cookbook
  textSize: 'm',        // s | m | l | xl
  cards: 'soft',        // soft | flat
  cookLayout: 'cards',  // cards (one step at a time) | list
  stepIngredients: true,
  highlightTimes: true,
  keepAwake: true,
  haptics: true,
  alarmSound: true,
  timerStyle: 'ring',   // ring | clock | sand
  name: '',
  recipePrompt: '',     // empty = the built-in prompt
};
export type Settings = typeof DEFAULT_SETTINGS;

export type KitchenTimer = {
  id: string;
  key: string;
  label: string;
  recipeId: string;      // '' for a quick timer started from the Timers tab
  recipeTitle: string;
  total: number;         // full length in ms (for the progress bar)
  endAt: number;
  pausedLeft: number | null;
  done: boolean;
  notificationId: string | null;
};

const KEYS = { recipes: 'mise.recipes.v1', settings: 'mise.settings.v1', timers: 'mise.timers.v1', history: 'mise.timerHistory.v1' };
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

type AppValue = {
  ready: boolean;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  resetLook: () => void;
  recipes: Recipe[];
  getRecipe: (id: string | undefined) => Recipe | undefined;
  saveParsed: (parsed: Parsed, source: string, existingId?: string) => string;
  patchRecipe: (id: string, patch: Partial<Recipe>) => void;
  setProgress: (id: string, patch: Partial<Recipe['progress']>) => void;
  markCooked: (id: string) => void;
  deleteRecipe: (id: string) => void;
};

type TimerValue = {
  timers: KitchenTimer[];
  now: number;
  remaining: (t: KitchenTimer) => number;
  startTimer: (t: { key?: string; minutes: number; label: string; recipeId?: string; recipeTitle?: string }) => void;
  togglePause: (id: string) => void;
  addTime: (id: string, minutes?: number) => void;
  removeTimer: (id: string) => void;
  history: TimerHistoryItem[];
  timersStarted: number;
  removeHistory: (ats: number[]) => void;
};

const AppContext = createContext<AppValue | null>(null);
const TimerContext = createContext<TimerValue | null>(null);

export const useApp = () => useContext(AppContext)!;
export const useTimers = () => useContext(TimerContext)!;

// Raw stored JSON; always passed through a clean* function before use.
async function load(key: string): Promise<unknown> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function save(key: string, value: unknown) {
  AsyncStorage.setItem(key, JSON.stringify(value)).catch(err => console.warn('Could not save', key, err));
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [timers, setTimers] = useState<KitchenTimer[]>([]);
  const [history, setHistory] = useState<{ items: TimerHistoryItem[]; started: number }>({ items: [], started: 0 });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    Promise.all([load(KEYS.settings), load(KEYS.recipes), load(KEYS.timers), load(KEYS.history)]).then(([s, r, t, h]) => {
      setSettings(cleanSettings(s, DEFAULT_SETTINGS));
      setRecipes(cleanRecipes(r));
      setTimers(cleanTimers(t));
      setHistory(cleanHistory(h));
      setReady(true);
    });
  }, []);

  useEffect(() => { if (ready) save(KEYS.settings, settings); }, [ready, settings]);
  useEffect(() => { if (ready) save(KEYS.recipes, recipes); }, [ready, recipes]);
  useEffect(() => { if (ready) save(KEYS.timers, timers); }, [ready, timers]);
  useEffect(() => { if (ready) save(KEYS.history, history); }, [ready, history]);

  // ----- recipes & settings -----

  const updateSettings = useCallback((patch: Partial<Settings>) => setSettings(s => cleanSettings({ ...s, ...patch }, DEFAULT_SETTINGS)), []);
  const resetLook = useCallback(() => setSettings(s => ({ ...DEFAULT_SETTINGS, recipePrompt: s.recipePrompt })), []);
  const getRecipe = useCallback((id: string | undefined) => recipes.find(r => r.id === id), [recipes]);

  const saveParsed = useCallback((parsed: Parsed, source: string, existingId?: string) => {
    const data = cleanParsed(parsed);
    const id = existingId || newId();
    const time = Date.now();
    setRecipes(list => {
      const existing = list.find(r => r.id === id);
      const recipe: Recipe = {
        ...data,
        equipment: data.equipment || [],
        notes: data.notes || [],
        id,
        source: source.slice(0, LIMITS.source),
        emoji: guessEmoji(data),
        progress: { step: 0, checked: [], scale: existing?.progress.scale || 1 },
        createdAt: existing?.createdAt || time,
        updatedAt: time,
        lastOpened: time,
      };
      return existing ? list.map(r => (r.id === id ? recipe : r)) : [...list, recipe];
    });
    return id;
  }, []);

  const patchRecipe = useCallback((id: string, patch: Partial<Recipe>) => {
    setRecipes(list => list.map(r => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const setProgress = useCallback((id: string, patch: Partial<Recipe['progress']>) => {
    setRecipes(list => list.map(r => (r.id === id ? { ...r, progress: { ...r.progress, ...patch } } : r)));
  }, []);

  const markCooked = useCallback((id: string) => {
    setRecipes(list => list.map(r => (r.id === id ? { ...r, lastCooked: Date.now(), cookCount: (r.cookCount || 0) + 1 } : r)));
  }, []);

  const deleteRecipe = useCallback((id: string) => setRecipes(list => list.filter(r => r.id !== id)), []);

  // ----- timers -----
  // Each timer stores its end time and schedules a phone notification, so the alarm
  // goes off even when the phone is locked or Mise is closed.

  const timersRef = useRef(timers);
  const hapticsRef = useRef(settings.haptics);
  useEffect(() => {
    timersRef.current = timers;
    hapticsRef.current = settings.haptics;
  }, [timers, settings.haptics]);

  // Tick once a second while a timer runs; mark timers done as they finish.
  const hasRunning = timers.some(t => !t.done);
  useEffect(() => {
    if (!hasRunning) return;
    const interval = setInterval(() => {
      const time = Date.now();
      setNow(time);
      const finished = timersRef.current.filter(t => !t.done && t.pausedLeft == null && t.endAt <= time);
      if (!finished.length) return;
      if (hapticsRef.current) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      setTimers(list => list.map(t => (finished.some(f => f.id === t.id) ? { ...t, done: true } : t)));
    }, 1000);
    return () => clearInterval(interval);
  }, [hasRunning]);

  const remaining = useCallback((t: KitchenTimer) => (t.pausedLeft != null ? t.pausedLeft : Math.max(0, t.endAt - Date.now())), []);

  const updateTimer = useCallback((id: string, fn: (t: KitchenTimer) => KitchenTimer | Promise<KitchenTimer>) => {
    const current = timersRef.current.find(t => t.id === id);
    if (!current) return;
    Promise.resolve(fn(current)).then(next => setTimers(list => list.map(t => (t.id === id ? next : t))));
  }, []);

  const startTimer = useCallback<TimerValue['startTimer']>(async ({ key, minutes, label, recipeId = '', recipeTitle = '' }) => {
    const ms = Math.round(Math.min(Math.max(minutes, 1 / 60), LIMITS.maxMinutes) * 60000);
    if (timersRef.current.length >= LIMITS.activeTimers) return;
    const id = newId();
    const timer: KitchenTimer = { id, key: key || `quick:${id}`, label, recipeId, recipeTitle, total: ms, endAt: Date.now() + ms, pausedLeft: null, done: false, notificationId: null };
    setTimers(list => [...list, timer]);
    setNow(Date.now());
    setHistory(h => ({
      started: h.started + 1,
      items: [{ minutes, label, at: Date.now() }, ...h.items.filter(i => !(i.minutes === minutes && i.label === label))].slice(0, LIMITS.history),
    }));
    const notificationId = await scheduleAlarm(label, recipeTitle, ms);
    setTimers(list => list.map(t => (t.id === timer.id ? { ...t, notificationId } : t)));
  }, []);

  const togglePause = useCallback((id: string) => {
    updateTimer(id, async t => {
      if (t.done) return t;
      if (t.pausedLeft != null) {
        const notificationId = await scheduleAlarm(t.label, t.recipeTitle, t.pausedLeft);
        return { ...t, endAt: Date.now() + t.pausedLeft, pausedLeft: null, notificationId };
      }
      await cancelAlarm(t.notificationId);
      return { ...t, pausedLeft: Math.max(0, t.endAt - Date.now()), notificationId: null };
    });
  }, [updateTimer]);

  const addTime = useCallback((id: string, minutes = 1) => {
    const ms = minutes * 60000;
    updateTimer(id, async t => {
      await cancelAlarm(t.notificationId);
      const total = (t.total || ms) + ms;
      if (t.pausedLeft != null) return { ...t, total, pausedLeft: t.pausedLeft + ms };
      const endAt = t.done ? Date.now() + ms : t.endAt + ms;
      const notificationId = await scheduleAlarm(t.label, t.recipeTitle, endAt - Date.now());
      return { ...t, total: t.done ? ms : total, endAt, done: false, notificationId };
    });
    setNow(Date.now());
  }, [updateTimer]);

  const removeTimer = useCallback((id: string) => {
    const t = timersRef.current.find(x => x.id === id);
    if (t) cancelAlarm(t.notificationId);
    setTimers(list => list.filter(x => x.id !== id));
  }, []);

  const removeHistory = useCallback((ats: number[]) => {
    const gone = new Set(ats);
    setHistory(h => ({ ...h, items: h.items.filter(i => !gone.has(i.at)) }));
  }, []);

  // Ring while any timer says "Time's up!"; stop once they're all stopped or extended.
  const anyRinging = timers.some(t => t.done);
  const soundOn = settings.alarmSound;
  useEffect(() => {
    if (anyRinging && soundOn) startAlarmSound();
    else stopAlarmSound();
  }, [anyRinging, soundOn]);

  const appValue = useMemo<AppValue>(
    () => ({ ready, settings, updateSettings, resetLook, recipes, getRecipe, saveParsed, patchRecipe, setProgress, markCooked, deleteRecipe }),
    [ready, settings, updateSettings, resetLook, recipes, getRecipe, saveParsed, patchRecipe, setProgress, markCooked, deleteRecipe],
  );
  const timerValue = useMemo<TimerValue>(
    () => ({ timers, now, remaining, startTimer, togglePause, addTime, removeTimer, history: history.items, timersStarted: history.started, removeHistory }),
    [timers, now, remaining, startTimer, togglePause, addTime, removeTimer, history, removeHistory],
  );

  return (
    <AppContext.Provider value={appValue}>
      <TimerContext.Provider value={timerValue}>{children}</TimerContext.Provider>
    </AppContext.Provider>
  );
}
