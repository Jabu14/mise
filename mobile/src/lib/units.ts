// Show a recipe in the units you think in: "As written", "Metric" (g, ml, °C, cm) or "US"
// (oz, lb, cups, °F, inches). Only clear-cut conversions are made: weights to weights, volumes to
// volumes. Teaspoons and tablespoons stay as they are (both systems use them), and small gram
// amounts (like 7 g yeast) stay in grams because ounces would be too rough.
export type UnitMode = 'original' | 'metric' | 'us';

const QTY = String.raw`(?:\d+\s+\d+\/\d+|\d+\/\d+|\d*[½⅓⅔¼¾⅛]|\d+(?:[.,]\d+)?)`;
const FRAC: Record<string, number> = { '½': 0.5, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 0.25, '¾': 0.75, '⅛': 0.125 };

function parseQty(s: string): number {
  s = s.trim().replace(',', '.');
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return +mixed[1] + +mixed[2] / +mixed[3];
  const frac = s.match(/^(\d+)\/(\d+)$/);
  if (frac) return +frac[1] / +frac[2];
  const uni = s.match(/^(\d*)([½⅓⅔¼¾⅛])$/);
  if (uni) return (uni[1] ? +uni[1] : 0) + FRAC[uni[2]];
  return parseFloat(s);
}

// 1.5 → "1½", 0.33 → "⅓" (to the nearest quarter or third).
function nice(n: number): string {
  const whole = Math.floor(n);
  const rest = n - whole;
  const options: [number, string][] = [[0, ''], [0.25, '¼'], [1 / 3, '⅓'], [0.5, '½'], [2 / 3, '⅔'], [0.75, '¾'], [1, '']];
  const [v, sym] = options.reduce((best, o) => (Math.abs(o[0] - rest) < Math.abs(best[0] - rest) ? o : best));
  const w = v === 1 ? whole + 1 : whole;
  return w ? `${w}${sym}` : sym || '0';
}

const round = (n: number, step: number) => Math.round(n / step) * step;
const metricNum = (n: number) => (n >= 100 ? String(round(n, 5)) : n >= 10 ? String(Math.round(n)) : String(Math.round(n * 10) / 10));

type Unit = { kind: 'mass' | 'volume' | 'length'; toBase: number; system: 'metric' | 'us' };
const UNITS: [RegExp, Unit][] = [
  [/^(?:g|grams?|gr)$/i, { kind: 'mass', toBase: 1, system: 'metric' }],
  [/^(?:kg|kilo(?:gram)?s?)$/i, { kind: 'mass', toBase: 1000, system: 'metric' }],
  [/^(?:oz|ounces?)$/i, { kind: 'mass', toBase: 28.35, system: 'us' }],
  [/^(?:lbs?|pounds?)$/i, { kind: 'mass', toBase: 453.6, system: 'us' }],
  [/^(?:ml|millilit(?:er|re)s?)$/i, { kind: 'volume', toBase: 1, system: 'metric' }],
  [/^(?:cl)$/i, { kind: 'volume', toBase: 10, system: 'metric' }],
  [/^(?:dl)$/i, { kind: 'volume', toBase: 100, system: 'metric' }],
  [/^(?:l|lit(?:er|re)s?)$/i, { kind: 'volume', toBase: 1000, system: 'metric' }],
  [/^(?:fl\.? ?oz)$/i, { kind: 'volume', toBase: 29.57, system: 'us' }],
  [/^(?:cups?)$/i, { kind: 'volume', toBase: 240, system: 'us' }],
  [/^(?:pints?)$/i, { kind: 'volume', toBase: 473, system: 'us' }],
  [/^(?:quarts?|qt)$/i, { kind: 'volume', toBase: 946, system: 'us' }],
  [/^(?:cm|centimet(?:er|re)s?)$/i, { kind: 'length', toBase: 1, system: 'metric' }],
  [/^(?:mm)$/i, { kind: 'length', toBase: 0.1, system: 'metric' }],
  [/^(?:inch(?:es)?|in|")$/i, { kind: 'length', toBase: 2.54, system: 'us' }],
];
const UNIT_WORDS = String.raw`fl\.? ?oz|g|grams?|gr|kg|kilo(?:gram)?s?|oz|ounces?|lbs?|pounds?|ml|millilit(?:er|re)s?|cl|dl|l|lit(?:er|re)s?|cups?|pints?|quarts?|qt|cm|centimet(?:er|re)s?|mm|inch(?:es)?`;
const AMOUNT_RE = new RegExp(String.raw`(?<![\w.,/])(${QTY})(?:\s*(?:-|–|to)\s*(${QTY}))?\s*(${UNIT_WORDS})(?![\w])`, 'gi');
const TEMP_RE = /(?<![\w.,])(\d{2,3})\s*(?:°\s*|º\s*|degrees?\s+)(C|F|Celsius|Fahrenheit|centigrade)\b/gi;

// One base amount (g, ml or cm) written in the target system.
function write(base: number, kind: Unit['kind'], to: 'metric' | 'us'): string {
  if (to === 'metric') {
    if (kind === 'mass') return base >= 1000 ? `${Math.round(base / 100) / 10} kg` : `${metricNum(base)} g`;
    if (kind === 'volume') return base >= 1000 ? `${Math.round(base / 100) / 10} l` : `${metricNum(base)} ml`;
    return `${base >= 10 ? Math.round(base) : Math.round(base * 2) / 2} cm`;
  }
  if (kind === 'mass') {
    const oz = base / 28.35;
    if (oz < 16) return `${nice(round(oz, 0.25))} oz`;
    const lb = oz / 16;
    // A clean quarter if it's close (2¼ lb), otherwise one decimal (1.1 lb).
    return Math.abs(round(lb, 0.25) - lb) / lb < 0.03 ? `${nice(round(lb, 0.25))} lb` : `${Math.round(lb * 10) / 10} lb`;
  }
  if (kind === 'volume') {
    const cups = base / 240;
    if (cups >= 0.25) return `${nice(cups)} ${cups > 1.1 ? 'cups' : 'cup'}`;
    const tbsp = base / 15;
    return tbsp >= 1 ? `${nice(tbsp)} tbsp` : `${nice(base / 5)} tsp`;
  }
  return `${nice(round(base / 2.54, 0.25))} in`;
}

const ONE = String.raw`(${QTY})(?:\s*(?:-|–|to)\s*(?:${QTY}))?\s*(${UNIT_WORDS})(?![\w])`;
// "375 ml (1½ cups)": the recipe already gives both, so keep the one in your units.
const PAIR_RE = new RegExp(String.raw`(?<![\w.,/])(${ONE})\s*\(\s*(${ONE})\s*\)`, 'gi');
// "1 lb 4 oz" → one amount.
const LB_OZ_RE = new RegExp(String.raw`(?<![\w.,/])(${QTY})\s*(?:lbs?|pounds?)\s+(${QTY})\s*(?:oz|ounces?)(?![\w])`, 'gi');
// "7 g (2¼ tsp)": spoons are what US cooks use for small amounts, grams for metric.
const SPOON_PAIR_RE = new RegExp(String.raw`(?<![\w.,/])(${QTY}\s*(?:g|grams?|ml))\s*\(\s*(${QTY}\s*(?:tsps?|teaspoons?|tbsps?|tablespoons?))\s*\)`, 'gi');
const TEMP_PAIR_RE = /(\d{2,3}\s*°\s*([CF]))\s*\(\s*(\d{2,3}\s*°\s*([CF]))\s*\)/gi;
const systemOf = (word: string) => UNITS.find(([re]) => re.test(word.trim()))?.[1].system;

export function convertUnits(text: string, mode: UnitMode): string {
  if (!text || mode === 'original') return text;
  let out = text.replace(PAIR_RE, (match, first: string, _a: string, u1: string, second: string, _b: string, u2: string) => {
    const s1 = systemOf(u1), s2 = systemOf(u2);
    if (!s1 || !s2 || s1 === s2) return match;
    return s1 === mode ? first : second;
  });
  out = out.replace(SPOON_PAIR_RE, (_m, metric: string, spoons: string) => (mode === 'us' ? spoons : metric));
  // "230°C (450°F)" → just the one you use.
  out = out.replace(TEMP_PAIR_RE, (match, t1: string, u1: string, t2: string, u2: string) => {
    if (u1.toUpperCase() === u2.toUpperCase()) return match;
    const want = mode === 'us' ? 'F' : 'C';
    return u1.toUpperCase() === want ? t1 : t2;
  });
  if (mode === 'metric') out = out.replace(LB_OZ_RE, (_m, lb: string, oz: string) => write(parseQty(lb) * 453.6 + parseQty(oz) * 28.35, 'mass', 'metric'));
  out = out.replace(AMOUNT_RE, (match, a: string, b: string | undefined, word: string) => {
    const unit = UNITS.find(([re]) => re.test(word.trim()))?.[1];
    if (!unit || unit.system === mode) return match;
    const first = parseQty(a) * unit.toBase;
    // Small weights stay in grams: ounces would be too rough (7 g yeast ≠ ¼ oz).
    if (mode === 'us' && unit.kind === 'mass' && first < 20) return match;
    if (!Number.isFinite(first) || first <= 0) return match;
    if (!b) return write(first, unit.kind, mode);
    const second = parseQty(b) * unit.toBase;
    const [w1, w2] = [write(first, unit.kind, mode), write(second, unit.kind, mode)];
    const u2 = w2.split(' ').slice(1).join(' ');
    return w1.endsWith(u2) ? `${w1.slice(0, -u2.length).trim()}–${w2}` : `${w1}–${w2}`;
  });
  out = out.replace(TEMP_RE, (match, n: string, u: string) => {
    const isF = /^f/i.test(u);
    if (isF === (mode === 'us')) return match;
    const v = Number(n);
    // Oven temperatures snap to the usual dial steps (220°C ↔ 425°F, 180°C ↔ 350°F).
    if (isF) { const c = (v - 32) * 5 / 9; return `${round(c, c >= 100 ? 10 : 5)}°C`; }
    const f = v * 9 / 5 + 32;
    return `${round(f, f >= 200 ? 25 : 5)}°F`;
  });
  return out;
}

export const UNIT_CHOICES: [UnitMode, string][] = [['original', 'As written'], ['metric', 'Metric'], ['us', 'US']];
