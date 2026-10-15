// Everything read from storage or pasted by the user goes through here before the app uses it.
// Unknown keys are dropped, wrong types are replaced with safe defaults, and sizes are capped,
// so corrupted or tampered data can't crash the app or bloat it.
import type { Chat, ChatAttachment, ChatMessage } from './chat-store';
import type { KitchenTimer, Parsed, Recipe, Settings, Step, Timer, TimerHistoryItem } from './store';

export const LIMITS = {
  source: 100_000,   // characters of pasted recipe text
  title: 200,
  line: 4_000,       // one ingredient / step / note
  prompt: 8_000,
  name: 40,
  groups: 30,
  items: 300,
  steps: 200,
  notes: 100,
  timersPerStep: 4,
  activeTimers: 20,
  history: 12,
  maxMinutes: 72 * 60,
};

const ID_RE = /^[a-z0-9]{4,32}$/;

const str = (v: unknown, max: number = LIMITS.line) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '').slice(0, max);
const num = (v: unknown, min: number, max: number, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
const list = (v: unknown, max: number): unknown[] => (Array.isArray(v) ? v.slice(0, max) : []);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const strings = (v: unknown, max: number) => list(v, max).map(x => str(x)).filter(Boolean);

// Recipe text reads better without em dashes (AI answers love them): "kneading — time does" becomes
// "kneading, time does", and "5—10" becomes "5-10".
const undash = (s: string) => s.replace(/(\d)\s*—\s*(\d)/g, '$1-$2').replace(/\s*—\s*/g, ', ').replace(/,\s*([,.;:!?)])/g, '$1').replace(/^,\s*/, '').replace(/[ \t]+,/g, ',').replace(/ {2,}/g, ' ');
const rstr = (v: unknown, max?: number) => undash(str(v, max));
const rstrings = (v: unknown, max: number) => list(v, max).map(x => rstr(x)).filter(Boolean);

export const isId = (v: unknown): v is string => typeof v === 'string' && ID_RE.test(v);

function cleanTimer(v: unknown): Timer | null {
  const t = obj(v);
  const minutes = num(t.minutes, 0, LIMITS.maxMinutes, 0);
  if (!(minutes > 0)) return null;
  return { minutes, label: str(t.label, 80), ...(t.auto ? { auto: true } : {}) };
}

function cleanStep(v: unknown): Step {
  const s = obj(v);
  return {
    title: rstr(s.title, LIMITS.title),
    text: rstr(s.text),
    tip: rstr(s.tip),
    phase: rstr(s.phase, 80),
    timers: list(s.timers, LIMITS.timersPerStep).map(cleanTimer).filter((t): t is Timer => !!t),
  };
}

export function cleanParsed(v: unknown): Parsed {
  const p = obj(v);
  const servings = obj(p.servings);
  return {
    title: rstr(p.title, LIMITS.title).trim() || 'Untitled recipe',
    description: rstr(p.description),
    servings: p.servings ? { count: typeof servings.count === 'number' && servings.count > 0 && servings.count < 10_000 ? servings.count : null, label: rstr(servings.label, 120) } : null,
    times: list(p.times, 8).map(x => ({ label: rstr(obj(x).label, 20), value: rstr(obj(x).value, 60) })).filter(t => t.label && t.value),
    equipment: rstrings(p.equipment, 50),
    ingredients: list(p.ingredients, LIMITS.groups)
      .map(g => ({ name: rstr(obj(g).name, 80), items: rstrings(obj(g).items, LIMITS.items) }))
      .filter(g => g.items.length),
    steps: list(p.steps, LIMITS.steps).map(cleanStep).filter(s => s.title || s.text),
    notes: rstrings(p.notes, LIMITS.notes),
  };
}

export function cleanRecipe(v: unknown): Recipe | null {
  const r = obj(v);
  if (!isId(r.id)) return null;
  const parsed = cleanParsed(r);
  if (!parsed.steps.length) return null;
  const progress = obj(r.progress);
  const ingredientKeys = new Set(parsed.ingredients.flatMap((g, gi) => g.items.map((_, ii) => `${gi}.${ii}`)));
  const time = Date.now();
  return {
    ...parsed,
    id: r.id,
    source: str(r.source, LIMITS.source),
    emoji: str(r.emoji, 8) || '🍳',
    progress: {
      step: Math.round(num(progress.step, 0, parsed.steps.length, 0)),
      // Ingredient ticks, plus the prep screen's own (prep tasks, equipment, preheating).
      checked: strings(progress.checked, LIMITS.items).filter(k => ingredientKeys.has(k) || /^(prep\.\d{1,3}|eq\.\d{1,3}|oven)$/.test(k)),
      scale: num(progress.scale, 0.25, 50, 1),
    },
    createdAt: num(r.createdAt, 0, time + 1, time),
    updatedAt: num(r.updatedAt, 0, time + 1, time),
    ...(typeof r.lastOpened === 'number' ? { lastOpened: num(r.lastOpened, 0, time + 1, 0) } : {}),
    ...(typeof r.lastCooked === 'number' ? { lastCooked: num(r.lastCooked, 0, time + 1, 0) } : {}),
    cookCount: Math.round(num(r.cookCount, 0, 1e6, 0)),
  };
}

export function cleanRecipes(v: unknown): Recipe[] {
  const seen = new Set<string>();
  return list(v, 2000)
    .map(cleanRecipe)
    .filter((r): r is Recipe => !!r && !seen.has(r.id) && !!seen.add(r.id));
}

// Settings: only known keys, and only allowed values for each choice.
const CHOICES: Partial<Record<keyof Settings, readonly string[]>> = {
  theme: ['sourdough', 'sage', 'tomato', 'blueberry', 'plum', 'teal', 'honey', 'charcoal'],
  mode: ['auto', 'light', 'dark'],
  font: ['classic', 'modern', 'rounded', 'cookbook', 'playful', 'elegant', 'clean'],
  textSize: ['s', 'm', 'l', 'xl'],
  cards: ['soft', 'flat'],
  cookLayout: ['cards', 'list'],
  timerStyle: ['ring', 'clock', 'sand'],
  alarmTone: ['chime', 'bell', 'beeps'],
  aiStyle: ['short', 'detailed'],
  aiUnits: ['metric', 'us', 'both'],
  aiSkill: ['beginner', 'home', 'confident'],
  aiVoiceRate: ['slow', 'normal', 'fast'],
  remindPlanTime: ['9', '12', '16'],
  units: ['original', 'metric', 'us'],
};

export function cleanSettings(v: unknown, defaults: Settings): Settings {
  const s = obj(v);
  const out = { ...defaults } as Record<string, unknown>;
  for (const [key, fallback] of Object.entries(defaults)) {
    const value = s[key];
    const choices = CHOICES[key as keyof Settings];
    if (choices) out[key] = typeof value === 'string' && choices.includes(value) ? value : fallback;
    else if (typeof fallback === 'boolean') out[key] = typeof value === 'boolean' ? value : fallback;
    else if (typeof fallback === 'string') out[key] = typeof value === 'string' ? value.slice(0, key === 'name' ? LIMITS.name : LIMITS.prompt) : fallback;
  }
  return out as Settings;
}

export function cleanTimers(v: unknown): KitchenTimer[] {
  const time = Date.now();
  return list(v, LIMITS.activeTimers)
    .map(x => {
      const t = obj(x);
      if (!isId(t.id)) return null;
      const total = num(t.total, 1000, LIMITS.maxMinutes * 60000, 60000);
      return {
        id: t.id,
        key: str(t.key, 120) || `quick:${t.id}`,
        label: str(t.label, 120) || 'Timer',
        recipeId: isId(t.recipeId) ? t.recipeId : '',
        recipeTitle: str(t.recipeTitle, LIMITS.title),
        total,
        endAt: num(t.endAt, 0, time + LIMITS.maxMinutes * 60000, time),
        pausedLeft: t.pausedLeft == null ? null : num(t.pausedLeft, 0, LIMITS.maxMinutes * 60000, 0),
        done: t.done === true,
        notificationId: typeof t.notificationId === 'string' ? t.notificationId.slice(0, 200) : null,
      };
    })
    .filter((t): t is KitchenTimer => !!t);
}

export function cleanHistory(v: unknown): { items: TimerHistoryItem[]; started: number } {
  const h = obj(v);
  return {
    items: list(h.items, LIMITS.history)
      .map(x => ({ minutes: num(obj(x).minutes, 0, LIMITS.maxMinutes, 0), label: str(obj(x).label, 120), at: num(obj(x).at, 0, Date.now() + 1, 0) }))
      .filter(i => i.minutes > 0),
    started: Math.round(num(h.started, 0, 1e9, 0)),
  };
}

// Chats: only local recording files are accepted as audio sources.
const AUDIO_RE = /^file:\/\/\/[^\s"'<>]{1,500}\.(m4a|aac|caf|wav|mp4|3gp)$/i;
const PHOTO_RE = /^file:\/\/\/[^\s"'<>]{1,500}$/i;

export function cleanChats(v: unknown): Chat[] {
  const now = Date.now();
  const seen = new Set<string>();
  return list(v, 200)
    .map(x => {
      const c = obj(x);
      if (!isId(c.id) || seen.has(c.id)) return null;
      seen.add(c.id);
      const messages: ChatMessage[] = list(c.messages, 500)
        .map(y => {
          const m = obj(y);
          if (!isId(m.id) || (m.role !== 'user' && m.role !== 'assistant')) return null;
          const kind = m.kind === 'voice' ? 'voice' : 'text';
          const audioUri = typeof m.audioUri === 'string' && AUDIO_RE.test(m.audioUri) ? m.audioUri : undefined;
          if (kind === 'voice' && !audioUri) return null;
          const a = obj(m.attachment);
          const attachment: ChatAttachment | undefined =
            a.type === 'recipe' && isId(a.recipeId) ? { type: 'recipe', recipeId: a.recipeId, title: str(a.title, LIMITS.title) }
            : a.type === 'photo' && typeof a.uri === 'string' && PHOTO_RE.test(a.uri) ? { type: 'photo', uri: a.uri }
            : undefined;
          return {
            id: m.id, role: m.role, kind, text: str(m.text, 8000), at: num(m.at, 0, now + 1, now),
            ...(audioUri ? { audioUri, durationMs: num(m.durationMs, 0, 15 * 60 * 1000, 0) } : {}),
            ...(attachment ? { attachment } : {}),
          } as ChatMessage;
        })
        .filter((m): m is ChatMessage => !!m);
      return { id: c.id, title: str(c.title, 60) || 'New chat', autoTitle: c.autoTitle !== false, pinned: c.pinned === true, createdAt: num(c.createdAt, 0, now + 1, now), updatedAt: num(c.updatedAt, 0, now + 1, now), messages };
    })
    .filter((c): c is Chat => !!c);
}
