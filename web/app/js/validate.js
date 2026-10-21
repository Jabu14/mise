// Everything loaded from storage or imported from a backup file goes through here first.
// Wrong types become safe defaults, unknown fields are dropped and sizes are capped, so a
// tampered backup can't inject HTML into the page or break the app.

const ID_RE = /^[a-z0-9]{4,32}$/;
const MAX = { title: 200, line: 4000, source: 100000, groups: 30, items: 300, steps: 200, notes: 100, timers: 20 };

const str = (v, max = MAX.line) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '').slice(0, max);
const num = (v, min, max, fallback) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback);
const list = (v, max) => (Array.isArray(v) ? v.slice(0, max) : []);
const obj = v => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const strings = (v, max) => list(v, max).map(x => str(x)).filter(Boolean);

export const isId = v => typeof v === 'string' && ID_RE.test(v);
export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function cleanTimer(v) {
  const t = obj(v);
  const minutes = num(t.minutes, 0, 72 * 60, 0);
  return minutes > 0 ? { minutes, label: str(t.label, 80), ...(t.auto ? { auto: true } : {}) } : null;
}

export function cleanParsed(v) {
  const p = obj(v);
  const servings = obj(p.servings);
  return {
    title: str(p.title, MAX.title).trim() || 'Untitled recipe',
    description: str(p.description),
    servings: p.servings ? { count: typeof servings.count === 'number' && servings.count > 0 && servings.count < 10000 ? servings.count : null, label: str(servings.label, 120) } : null,
    times: list(p.times, 8).map(x => ({ label: str(obj(x).label, 20), value: str(obj(x).value, 60) })).filter(t => t.label && t.value),
    equipment: strings(p.equipment, 50),
    ingredients: list(p.ingredients, MAX.groups).map(g => ({ name: str(obj(g).name, 80), items: strings(obj(g).items, MAX.items) })).filter(g => g.items.length),
    steps: list(p.steps, MAX.steps)
      .map(x => {
        const s = obj(x);
        return { title: str(s.title, MAX.title), text: str(s.text), tip: str(s.tip), phase: str(s.phase, 80), timers: list(s.timers, 4).map(cleanTimer).filter(Boolean) };
      })
      .filter(s => s.title || s.text),
    notes: strings(p.notes, MAX.notes),
  };
}

// Returns a safe recipe, or null if it isn't usable. Invalid ids get a fresh one.
export function cleanRecipe(v) {
  const r = obj(v);
  const parsed = cleanParsed(r);
  if (!parsed.steps.length) return null;
  const progress = obj(r.progress);
  const keys = new Set(parsed.ingredients.flatMap((g, gi) => g.items.map((_, ii) => `${gi}.${ii}`)));
  const now = Date.now();
  const out = {
    ...parsed,
    id: isId(r.id) ? r.id : newId(),
    source: str(r.source, MAX.source),
    emoji: str(r.emoji, 8) || '🍳',
    progress: {
      step: Math.round(num(progress.step, 0, parsed.steps.length, 0)),
      checked: strings(progress.checked, MAX.items).filter(k => keys.has(k)),
      scale: num(progress.scale, 0.25, 50, 1),
    },
    createdAt: num(r.createdAt, 0, now + 1, now),
    updatedAt: num(r.updatedAt, 0, now + 1, now),
  };
  if (typeof r.lastOpened === 'number') out.lastOpened = num(r.lastOpened, 0, now + 1, 0);
  if (typeof r.lastCooked === 'number') out.lastCooked = num(r.lastCooked, 0, now + 1, 0);
  return out;
}

export function cleanRecipes(v) {
  const seen = new Set();
  return list(v, 2000).map(cleanRecipe).filter(r => r && !seen.has(r.id) && seen.add(r.id));
}

const CHOICES = {
  theme: ['sourdough', 'sage', 'tomato', 'blueberry', 'plum', 'teal', 'honey', 'charcoal'],
  mode: ['auto', 'light', 'dark'],
  font: ['classic', 'modern', 'rounded', 'cookbook'],
  textSize: ['s', 'm', 'l', 'xl'],
  cards: ['soft', 'flat'],
  cookLayout: ['cards', 'list'],
};

export function cleanSettings(v, defaults) {
  const s = obj(v);
  const out = { ...defaults };
  for (const [key, fallback] of Object.entries(defaults)) {
    const value = s[key];
    if (CHOICES[key]) out[key] = CHOICES[key].includes(value) ? value : fallback;
    else if (typeof fallback === 'boolean') out[key] = typeof value === 'boolean' ? value : fallback;
    else if (typeof fallback === 'string') out[key] = typeof value === 'string' ? value.slice(0, 8000) : fallback;
  }
  return out;
}

export function cleanTimers(v) {
  const now = Date.now();
  const maxMs = 72 * 3600000;
  return list(v, MAX.timers)
    .map(x => {
      const t = obj(x);
      if (!isId(t.id)) return null;
      return {
        id: t.id,
        key: str(t.key, 120),
        label: str(t.label, 120) || 'Timer',
        recipeId: isId(t.recipeId) ? t.recipeId : '',
        recipeTitle: str(t.recipeTitle, MAX.title),
        endAt: num(t.endAt, 0, now + maxMs, now),
        pausedLeft: t.pausedLeft == null ? null : num(t.pausedLeft, 0, maxMs, 0),
        done: t.done === true,
      };
    })
    .filter(Boolean);
}
