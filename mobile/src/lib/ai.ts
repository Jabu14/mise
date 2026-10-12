// Talks to Mise's AI server (server/ folder). The AI key lives only on the server; the app just
// sends recipe text, a link or photos and gets back a recipe in the app's own JSON format.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { parseRecipe } from '../shared/parser';
import type { Parsed } from './store';

// Set EXPO_PUBLIC_AI_URL (e.g. in mobile/.env.local) to the server's /api/recipe address.
export const AI_URL = process.env.EXPO_PUBLIC_AI_URL ?? '';
export const aiAvailable = () => /^https?:\/\/.+/.test(AI_URL);

const DEVICE_KEY = 'mise.device.v1';
const TIMEOUT_MS = 150_000;

export type AiPhoto = { mediaType: 'image/jpeg'; data: string };
export type AiRequest = { kind: 'text'; text: string } | { kind: 'url'; url: string } | { kind: 'photos'; photos: AiPhoto[] };

// A random id for this install, used only for the server's per-device daily limit.
async function deviceId(): Promise<string> {
  const saved = await AsyncStorage.getItem(DEVICE_KEY).catch(() => null);
  if (saved && /^[a-z0-9]{8,64}$/.test(saved)) return saved;
  const id = Array.from({ length: 24 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('');
  await AsyncStorage.setItem(DEVICE_KEY, id).catch(() => {});
  return id;
}

// Shrinks a photo to a sensible size for reading text (keeps uploads small and fast).
export async function preparePhoto(uri: string, width: number): Promise<AiPhoto> {
  const context = ImageManipulator.manipulate(uri);
  if (width > 1600) context.resize({ width: 1600 });
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true });
  if (!saved.base64) throw new Error('Could not read that photo.');
  return { mediaType: 'image/jpeg', data: saved.base64 };
}

export class AiError extends Error {}

// Returns the recipe as JSON text (fed into the same reader as pasted recipes) plus the parsed result.
export async function importWithAi(request: AiRequest): Promise<{ source: string; recipe: Parsed }> {
  if (!aiAvailable()) throw new AiError('AI import isn’t set up yet.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(AI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Mise-Device': await deviceId() },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
  } catch {
    throw new AiError(controller.signal.aborted ? 'That took too long. Please try again.' : 'Couldn’t reach the AI. Check your internet connection.');
  } finally {
    clearTimeout(timer);
  }

  const body = (await res.json().catch(() => null)) as { recipe?: unknown; error?: { message?: unknown } } | null;
  if (!res.ok || !body?.recipe) {
    const message = typeof body?.error?.message === 'string' ? body.error.message.slice(0, 200) : 'The AI couldn’t convert this. Please try again.';
    throw new AiError(message);
  }
  const source = JSON.stringify(body.recipe, null, 2);
  const recipe = parseRecipe(source);
  if (!recipe?.steps.length) throw new AiError('The AI couldn’t find any steps in that.');
  return { source, recipe };
}
