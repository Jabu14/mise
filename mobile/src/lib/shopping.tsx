// The shopping list: ingredients from your recipes (or typed in), with matching items combined
// ("1 onion" + "2 onions" = "3 onions"), grouped by supermarket aisle, and ticked off as you shop.
// Saved on the phone.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { scaleText } from '../shared/parser';
import type { Recipe } from './store';

export type Aisle = 'Produce' | 'Meat & fish' | 'Dairy & eggs' | 'Bakery & grains' | 'Pantry' | 'Frozen' | 'Other';
export const AISLES: Aisle[] = ['Produce', 'Meat & fish', 'Dairy & eggs', 'Bakery & grains', 'Pantry', 'Frozen', 'Other'];

export type ShopItem = {
  id: string;
  key: string;          // unit|name, used to combine matching items
  name: string;         // e.g. "bread flour"
  qty: number | null;   // null when the line has no amount ("salt to taste")
  unit: string;         // "g", "cup", "" …
  aisle: Aisle;
  checked: boolean;
  sources: string[];    // recipe names it came from
  addedAt: number;
};

const KEY = 'mise.shopping.v1';
const MAX_ITEMS = 300;
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// ---------- reading an ingredient line ----------

const FRACTIONS: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': 0.125 };
const UNITS: Record<string, string> = {
  g: 'g', gram: 'g', grams: 'g', kg: 'kg', mg: 'mg', ml: 'ml', l: 'l', litre: 'l', liter: 'l',
  tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp', tbsp: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp',
  cup: 'cup', cups: 'cup', oz: 'oz', lb: 'lb', lbs: 'lb', pinch: 'pinch', clove: 'clove', cloves: 'clove',
  can: 'can', cans: 'can', slice: 'slice', slices: 'slice', stick: 'stick', sticks: 'stick', handful: 'handful',
};
const AMOUNT = /^(\d+\s+\d\/\d|\d+\/\d+|\d+[½¼¾⅓⅔⅛]|[½¼¾⅓⅔⅛]|\d+(?:[.,]\d+)?)\s*([a-zA-Z]+\b\.?)?\s*(.*)$/;

function toNumber(s: string) {
  const t = s.trim().replace(',', '.');
  const mixed = t.match(/^(\d+)\s+(\d)\/(\d)$/);
  if (mixed) return +mixed[1] + +mixed[2] / +mixed[3];
  const frac = t.match(/^(\d+)\/(\d+)$/);
  if (frac) return +frac[1] / +frac[2];
  const uni = t.match(/^(\d*)([½¼¾⅓⅔⅛])$/);
  if (uni) return (+uni[1] || 0) + FRACTIONS[uni[2]];
  return parseFloat(t);
}

export function parseLine(line: string): { name: string; qty: number | null; unit: string } {
  const text = line.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
  const m = text.match(AMOUNT);
  let qty: number | null = null, unit = '', rest = text;
  if (m) {
    qty = toNumber(m[1]);
    const u = (m[2] || '').replace('.', '').toLowerCase();
    if (UNITS[u]) { unit = UNITS[u]; rest = m[3]; } else rest = `${m[2] || ''} ${m[3]}`.trim();
  }
  const name = rest.replace(/\([^)]*\)/g, '').replace(/,.*$/, '').replace(/^of\s+/i, '').replace(/\s+/g, ' ').trim();
  return { name: name || text, qty: Number.isFinite(qty as number) ? qty : null, unit };
}

const AISLE_RULES: [Aisle, RegExp][] = [
  ['Frozen', /\bfrozen\b|ice cream/],
  ['Pantry', /\b(stock|broth|sauce|paste|canned|tinned|powder|oil|vinegar|salt|sugar|spice|yeast|honey|syrup)\b/],
  ['Dairy & eggs', /\b(milk|butter|cheese|cream|yogh?urt|eggs?|parmesan|mozzarella|feta|ricotta|ghee)\b/],
  ['Meat & fish', /\b(chicken|beef|pork|lamb|bacon|sausages?|turkey|fish|salmon|tuna|shrimps?|prawns?|mince|ham|steak|cod)\b/],
  ['Bakery & grains', /\b(flour|bread|rice|pasta|spaghetti|noodles?|oats?|tortillas?|buns?|couscous|quinoa|breadcrumbs?)\b/],
  ['Produce', /\b(onions?|garlic|tomato(es)?|potato(es)?|carrots?|lemons?|limes?|apples?|bananas?|berries|lettuce|spinach|herbs?|basil|parsley|cilantro|coriander|mint|ginger|bell peppers?|chill?i(es)?|cucumbers?|zucchini|courgettes?|mushrooms?|avocados?|celery|scallions?|spring onions?|leeks?|cabbage|broccoli|cauliflower|kale|oranges?|thyme|rosemary)\b/],
  ['Pantry', /\b(pepper|cumin|paprika|cinnamon|nutmeg|oregano|beans|lentils|chickpeas|nuts?|almonds?|vanilla|cocoa|chocolate|mustard|ketchup|mayo|mayonnaise|soy|baking)\b/],
];

export function aisleFor(name: string): Aisle {
  const n = name.toLowerCase();
  return AISLE_RULES.find(([, re]) => re.test(n))?.[0] ?? 'Other';
}

// Plain water (and similar) never needs buying.
const SKIP = /^(warm |cold |hot |boiling |lukewarm |ice[- ]?cold |tap )?water$/i;

const plural = (unit: string, qty: number | null) => (unit && qty != null && qty > 1 && !['g', 'kg', 'mg', 'ml', 'l', 'oz', 'tsp', 'tbsp'].includes(unit) ? `${unit}s` : unit);

export function formatQty(q: number) {
  const whole = Math.floor(q), frac = q - whole;
  const glyph = Object.entries(FRACTIONS).find(([, v]) => Math.abs(v - frac) < 0.02)?.[0];
  if (glyph && whole) return `${whole}${glyph}`;
  if (glyph) return glyph;
  return String(+q.toFixed(q >= 10 ? 0 : 2));
}

// "1000 g" reads better as "1 kg" (and 1500 ml as 1.5 l).
export function itemLabel(i: ShopItem) {
  let { qty, unit } = i;
  if (qty != null && qty >= 1000 && (unit === 'g' || unit === 'ml')) { qty /= 1000; unit = unit === 'g' ? 'kg' : 'l'; }
  return [qty != null ? formatQty(qty) : '', plural(unit, qty), i.name].filter(Boolean).join(' ');
}

function clean(v: unknown): ShopItem[] {
  if (!Array.isArray(v)) return [];
  return v.slice(0, MAX_ITEMS).flatMap(x => {
    const o = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>;
    if (typeof o.id !== 'string' || typeof o.name !== 'string' || !o.name.trim()) return [];
    const aisle = AISLES.includes(o.aisle as Aisle) ? (o.aisle as Aisle) : 'Other';
    return [{
      id: o.id.slice(0, 32), key: String(o.key ?? '').slice(0, 200), name: o.name.slice(0, 200),
      qty: typeof o.qty === 'number' && Number.isFinite(o.qty) ? o.qty : null, unit: String(o.unit ?? '').slice(0, 12),
      aisle, checked: o.checked === true,
      sources: Array.isArray(o.sources) ? o.sources.filter(s => typeof s === 'string').slice(0, 10).map(s => s.slice(0, 120)) : [],
      addedAt: typeof o.addedAt === 'number' ? o.addedAt : 0,
    }];
  });
}

// ---------- the list ----------

type ShoppingValue = {
  items: ShopItem[];
  addFromRecipe: (r: Recipe) => number;
  addText: (text: string) => void;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clearChecked: () => void;
  clearAll: () => void;
};

const Ctx = createContext<ShoppingValue | null>(null);
export const useShopping = () => useContext(Ctx)!;

function addLines(list: ShopItem[], lines: string[], source: string) {
  const next = [...list];
  let added = 0;
  for (const line of lines) {
    const p = parseLine(line);
    if (!p.name || SKIP.test(p.name)) continue;
    const key = `${p.unit}|${p.name.toLowerCase()}`;
    const same = next.findIndex(i => i.key === key && !i.checked);
    if (same >= 0) {
      const i = next[same];
      next[same] = {
        ...i,
        qty: i.qty != null && p.qty != null ? i.qty + p.qty : i.qty ?? p.qty,
        sources: source && !i.sources.includes(source) ? [...i.sources, source] : i.sources,
      };
    } else {
      if (next.length >= MAX_ITEMS) break;
      next.push({ id: newId(), key, name: p.name, qty: p.qty, unit: p.unit, aisle: aisleFor(p.name), checked: false, sources: source ? [source] : [], addedAt: Date.now() });
    }
    added++;
  }
  return { next, added };
}

export function ShoppingProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(raw => setItems(clean(raw ? JSON.parse(raw) : [])))
      .catch(() => setItems([]))
      .finally(() => setReady(true));
  }, []);
  useEffect(() => { if (ready) AsyncStorage.setItem(KEY, JSON.stringify(items)).catch(() => {}); }, [ready, items]);

  const addFromRecipe = useCallback((r: Recipe) => {
    const scale = r.progress.scale || 1;
    const lines = r.ingredients.flatMap(g => g.items).map(l => scaleText(l, scale));
    setItems(list => addLines(list, lines, r.title).next);
    return lines.filter(l => { const n = parseLine(l).name; return n && !SKIP.test(n); }).length;
  }, []);

  const addText = useCallback((text: string) => {
    const t = text.trim().slice(0, 200);
    if (t) setItems(list => addLines(list, [t], '').next);
  }, []);
  const toggle = useCallback((id: string) => setItems(list => list.map(i => (i.id === id ? { ...i, checked: !i.checked } : i))), []);
  const remove = useCallback((id: string) => setItems(list => list.filter(i => i.id !== id)), []);
  const clearChecked = useCallback(() => setItems(list => list.filter(i => !i.checked)), []);
  const clearAll = useCallback(() => setItems([]), []);

  const value = useMemo(() => ({ items, addFromRecipe, addText, toggle, remove, clearChecked, clearAll }), [items, addFromRecipe, addText, toggle, remove, clearChecked, clearAll]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
