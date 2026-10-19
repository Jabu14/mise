// The average colour of a photo, used to tint a recipe's header so it matches the image.
// Trick that works in Expo Go (no native colour module): shrink the image to 1×1 with
// expo-image-manipulator, read that single pixel out of the tiny PNG (inflated with pako).
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { inflate } from 'pako';

function b64ToBytes(b64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const out: number[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    const n = (chars.indexOf(clean[i]) << 18) | (chars.indexOf(clean[i + 1]) << 12) | ((chars.indexOf(clean[i + 2]) & 63) << 6) | (chars.indexOf(clean[i + 3]) & 63);
    out.push((n >> 16) & 255);
    if (clean[i + 2] && clean[i + 2] !== '=') out.push((n >> 8) & 255);
    if (clean[i + 3] && clean[i + 3] !== '=') out.push(n & 255);
  }
  return Uint8Array.from(out);
}

const u32 = (b: Uint8Array, i: number) => (b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3];
const hex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');

// Reads the one pixel out of a 1×1 PNG's base64.
function pixelFromPng(b64: string): string | null {
  try {
    const bytes = b64ToBytes(b64);
    if (bytes[0] !== 0x89 || bytes[1] !== 0x50) return null; // not a PNG
    let i = 8;
    let colorType = 6;
    const idat: number[] = [];
    while (i + 8 <= bytes.length) {
      const len = u32(bytes, i);
      const type = String.fromCharCode(bytes[i + 4], bytes[i + 5], bytes[i + 6], bytes[i + 7]);
      const start = i + 8;
      if (type === 'IHDR') colorType = bytes[start + 9];
      else if (type === 'IDAT') for (let j = 0; j < len; j++) idat.push(bytes[start + j]);
      else if (type === 'IEND') break;
      i = start + len + 4;
    }
    if (!idat.length) return null;
    const raw = inflate(Uint8Array.from(idat)); // [filter, ...channels]
    const ch = colorType === 2 ? 3 : colorType === 6 ? 4 : colorType === 0 ? 1 : 3;
    const p = 1; // skip the per-row filter byte
    if (ch === 1) return `#${hex(raw[p])}${hex(raw[p])}${hex(raw[p])}`;
    return `#${hex(raw[p])}${hex(raw[p + 1])}${hex(raw[p + 2])}`;
  } catch {
    return null;
  }
}

export async function imageAverageColor(uri: string): Promise<string | null> {
  try {
    const ctx = ImageManipulator.manipulate(uri).resize({ width: 1, height: 1 });
    const img = await ctx.renderAsync();
    const out = await img.saveAsync({ base64: true, format: SaveFormat.PNG });
    return out.base64 ? pixelFromPng(out.base64) : null;
  } catch {
    return null;
  }
}

// a·(1-t) + b·t for two #rrggbb colours.
export function mixHex(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
  const m = pa.map((v, i) => Math.round(v * (1 - t) + pb[i] * t));
  return `#${m.map(v => v.toString(16).padStart(2, '0')).join('')}`;
}
