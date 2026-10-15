// Packaged-food lookups for the nutrition scanner, from Open Food Facts: a free, open database of
// millions of products (data under the Open Database License; we show its credit on every product).
// Only the barcode is sent. Recent scans are kept on the phone.
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

export type Level = 'low' | 'moderate' | 'high';

export type Product = {
  code: string;
  name: string;
  brand: string;
  quantity: string;
  image: string | null;
  nutriscore: 'a' | 'b' | 'c' | 'd' | 'e' | null;
  nova: 1 | 2 | 3 | 4 | null;
  levels: { fat?: Level; 'saturated-fat'?: Level; sugars?: Level; salt?: Level };
  per100: { kcal?: number; fat?: number; saturated?: number; carbs?: number; sugars?: number; fiber?: number; protein?: number; salt?: number };
  allergens: string[];
  ingredients: string;
};

export type RecentScan = { code: string; name: string; brand: string; nutriscore: Product['nutriscore']; at: number };

const RECENT_KEY = 'mise.scans.v1';
export const isBarcode = (s: string) => /^\d{6,14}$/.test(s.trim());

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 10) / 10 : typeof v === 'string' && v.trim() !== '' && Number.isFinite(+v) ? Math.round(+v * 10) / 10 : undefined);
const level = (v: unknown): Level | undefined => (v === 'low' || v === 'moderate' || v === 'high' ? v : undefined);

export class FoodError extends Error {}

export async function fetchProduct(code: string): Promise<Product | null> {
  const c = code.trim();
  if (!isBarcode(c)) throw new FoodError('That doesn’t look like a barcode.');
  const fields = 'code,product_name,product_name_en,brands,quantity,image_front_url,nutriscore_grade,nova_group,nutriments,nutrient_levels,allergens_tags,ingredients_text,ingredients_text_en';
  let res: Response;
  try {
    res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${c}.json?fields=${fields}&lc=en`, {
      headers: { Accept: 'application/json', 'User-Agent': `Mise/${Constants.expoConfig?.version ?? '1'} (https://github.com/Jabu14/mise)` },
    });
  } catch {
    throw new FoodError('No connection. Check your internet and try again.');
  }
  if (res.status === 404) return null;
  if (!res.ok) throw new FoodError('The food database didn’t answer. Try again in a moment.');
  const data = (await res.json().catch(() => null)) as { status?: number; product?: Record<string, unknown> } | null;
  if (!data || data.status !== 1 || !data.product) return null;
  const p = data.product;
  const n = (p.nutriments && typeof p.nutriments === 'object' ? p.nutriments : {}) as Record<string, unknown>;
  const lv = (p.nutrient_levels && typeof p.nutrient_levels === 'object' ? p.nutrient_levels : {}) as Record<string, unknown>;
  const grade = str(p.nutriscore_grade, 2).toLowerCase();
  const nova = Number(p.nova_group);
  const image = str(p.image_front_url, 500);
  return {
    code: c,
    name: str(p.product_name_en) || str(p.product_name) || 'Unnamed product',
    brand: str(p.brands).split(',')[0]?.trim() ?? '',
    quantity: str(p.quantity, 40),
    image: /^https:\/\//.test(image) ? image : null,
    nutriscore: (['a', 'b', 'c', 'd', 'e'] as const).find(g => g === grade) ?? null,
    nova: nova >= 1 && nova <= 4 ? (nova as Product['nova']) : null,
    levels: { fat: level(lv.fat), 'saturated-fat': level(lv['saturated-fat']), sugars: level(lv.sugars), salt: level(lv.salt) },
    per100: {
      kcal: num(n['energy-kcal_100g']), fat: num(n.fat_100g), saturated: num(n['saturated-fat_100g']), carbs: num(n.carbohydrates_100g),
      sugars: num(n.sugars_100g), fiber: num(n.fiber_100g), protein: num(n.proteins_100g), salt: num(n.salt_100g),
    },
    allergens: Array.isArray(p.allergens_tags)
      ? p.allergens_tags.filter((t): t is string => typeof t === 'string').slice(0, 14).map(t => t.replace(/^[a-z]{2}:/, '').replace(/-/g, ' '))
      : [],
    ingredients: str(p.ingredients_text_en, 1500) || str(p.ingredients_text, 1500),
  };
}

export async function readRecentScans(): Promise<RecentScan[]> {
  try {
    const list = JSON.parse((await AsyncStorage.getItem(RECENT_KEY)) || '[]');
    if (!Array.isArray(list)) return [];
    return list.filter(x => x && isBarcode(String(x.code))).slice(0, 20).map(x => ({
      code: String(x.code), name: str(x.name) || 'Product', brand: str(x.brand), at: Number(x.at) || 0,
      nutriscore: (['a', 'b', 'c', 'd', 'e'] as const).find(g => g === x.nutriscore) ?? null,
    }));
  } catch {
    return [];
  }
}

export async function rememberScan(p: Product) {
  const list = (await readRecentScans()).filter(s => s.code !== p.code);
  const next: RecentScan[] = [{ code: p.code, name: p.name, brand: p.brand, nutriscore: p.nutriscore, at: Date.now() }, ...list].slice(0, 20);
  await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next)).catch(() => {});
}

export const NUTRISCORE_COLORS: Record<string, string> = { a: '#038141', b: '#85BB2F', c: '#FECB02', d: '#EE8100', e: '#E63E11' };
export const NOVA_LABELS: Record<number, string> = { 1: 'Unprocessed or minimally processed', 2: 'Processed culinary ingredient', 3: 'Processed food', 4: 'Ultra-processed food' };
export const LEVEL_COLORS: Record<Level, string> = { low: '#2E9E4F', moderate: '#E8A100', high: '#E0452F' };
