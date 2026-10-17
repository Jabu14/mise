// Share codes: a recipe, a cookbook (collection), your shopping list, a Sous chat or your kitchen
// setup, packed into one QR code another phone can scan. Everything travels inside the code itself
// (compressed), so it works with no account or internet.
//
// The code is a link: mise://s/<data>. Mise's scanner opens it straight away; a phone camera offers
// to open it in Mise. Other apps (like an authenticator, which only accepts otpauth:// codes) just
// see it isn't for them.
import { deflate, inflate } from 'pako';
import type { ChatMessage } from './chat-store';
import type { Recipe, Settings } from './store';

export const SHARE_PREFIX = 'mise://s/';
// Past this, the QR gets too dense to scan comfortably from a screen.
export const MAX_CODE = 2200;

export type SharedRecipe = Record<string, unknown>; // the same JSON shape the recipe parser reads
export type Payload =
  | { v: 1; k: 'recipe'; r: SharedRecipe }
  | { v: 1; k: 'book'; name: string; r: SharedRecipe[] }
  | { v: 1; k: 'list'; items: string[] }
  | { v: 1; k: 'chat'; title: string; m: [('u' | 'a'), string][] }
  | { v: 1; k: 'setup'; s: Partial<Settings> };

// ---------- bytes ----------
function utf8(s: string): Uint8Array {
  const out: number[] = [];
  for (const ch of s) {
    let c = ch.codePointAt(0)!;
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else { c -= 0; out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63)); }
  }
  return Uint8Array.from(out);
}
function fromUtf8(b: Uint8Array): string {
  let s = '';
  for (let i = 0; i < b.length;) {
    const x = b[i++];
    let c = x;
    if (x >= 0xf0) c = ((x & 7) << 18) | ((b[i++] & 63) << 12) | ((b[i++] & 63) << 6) | (b[i++] & 63);
    else if (x >= 0xe0) c = ((x & 15) << 12) | ((b[i++] & 63) << 6) | (b[i++] & 63);
    else if (x >= 0xc0) c = ((x & 31) << 6) | (b[i++] & 63);
    s += String.fromCodePoint(c);
  }
  return s;
}
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function toB64(b: Uint8Array) {
  let s = '';
  for (let i = 0; i < b.length; i += 3) {
    const n = (b[i] << 16) | ((b[i + 1] ?? 0) << 8) | (b[i + 2] ?? 0);
    s += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (i + 1 < b.length ? B64[(n >> 6) & 63] : '') + (i + 2 < b.length ? B64[n & 63] : '');
  }
  return s;
}
function fromB64(s: string) {
  const out: number[] = [];
  for (let i = 0; i < s.length; i += 4) {
    const v = [0, 1, 2, 3].map(j => B64.indexOf(s[i + j] ?? 'A'));
    if (v.some(x => x < 0)) throw new Error('bad code');
    const n = (v[0] << 18) | (v[1] << 12) | (v[2] << 6) | v[3];
    out.push((n >> 16) & 255);
    if (i + 2 < s.length) out.push((n >> 8) & 255);
    if (i + 3 < s.length) out.push(n & 255);
  }
  return Uint8Array.from(out);
}

export function encodeShare(p: Payload): string {
  return SHARE_PREFIX + toB64(deflate(utf8(JSON.stringify(p)), { level: 9 }));
}

// Returns null for anything that isn't a valid Mise code.
export function decodeShare(code: string): Payload | null {
  try {
    const data = code.startsWith(SHARE_PREFIX) ? code.slice(SHARE_PREFIX.length) : code;
    if (!/^[A-Za-z0-9_-]{8,6000}$/.test(data)) return null;
    const p = JSON.parse(fromUtf8(inflate(fromB64(data)))) as Payload;
    if (!p || p.v !== 1 || !['recipe', 'book', 'list', 'chat', 'setup'].includes(p.k)) return null;
    return p;
  } catch {
    return null;
  }
}

// ---------- building payloads ----------
const TIME_KEYS: Record<string, string> = { prep: 'prepTime', cook: 'cookTime', bake: 'cookTime', total: 'totalTime' };

export function recipeForShare(r: Recipe): SharedRecipe {
  const times: Record<string, string> = {};
  r.times.forEach(t => { const k = TIME_KEYS[t.label.toLowerCase()]; if (k && !times[k]) times[k] = t.value; });
  return {
    title: r.title,
    ...(r.description ? { description: r.description } : {}),
    ...(r.servings?.label ? { servings: r.servings.label } : {}),
    ...times,
    ...(r.equipment.length ? { equipment: r.equipment } : {}),
    ingredients: r.ingredients.map(g => ({ ...(g.name ? { group: g.name } : {}), items: g.items })),
    steps: r.steps.map(s => ({
      ...(s.phase ? { phase: s.phase } : {}),
      ...(s.title ? { title: s.title } : {}),
      text: s.text,
      ...(s.timers.length ? { timers: s.timers.map(t => ({ minutes: t.minutes, label: t.label })) } : {}),
      ...(s.tip ? { tip: s.tip } : {}),
    })),
    ...(r.notes.length ? { notes: r.notes } : {}),
  };
}

export function chatForShare(title: string, messages: ChatMessage[]): Payload {
  const m = messages.filter(x => x.kind === 'text' && x.text.trim()).slice(-12)
    .map(x => [x.role === 'user' ? 'u' : 'a', x.text.slice(0, 400)] as ['u' | 'a', string]);
  return { v: 1, k: 'chat', title: title.slice(0, 60), m };
}

export const SETUP_KEYS = ['theme', 'mode', 'font', 'textSize', 'units', 'cookLayout', 'stepArt', 'stepIngredients', 'highlightTimes', 'keepAwake', 'timerStyle', 'alarmTone'] as const;
export function setupForShare(s: Settings): Payload {
  const out: Partial<Settings> = {};
  SETUP_KEYS.forEach(k => { (out as Record<string, unknown>)[k] = s[k]; });
  return { v: 1, k: 'setup', s: out };
}
