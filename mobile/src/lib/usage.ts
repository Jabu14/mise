// Counts of how much you use the AI features, kept on this phone (shown on Account → Usage).
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'mise.usage.v1';

// The server's default daily allowance of "Import with AI" per phone (server/lib/limits.ts).
export const AI_IMPORTS_PER_DAY = 25;

export type Usage = { day: string; month: string; importsToday: number; importsMonth: number; importsTotal: number };

const today = () => new Date().toISOString().slice(0, 10);
const count = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.min(Math.round(v), 1e7) : 0);

export async function readUsage(): Promise<Usage> {
  const d = today();
  let raw: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse((await AsyncStorage.getItem(KEY)) || '{}');
    if (parsed && typeof parsed === 'object') raw = parsed;
  } catch {
    // start fresh
  }
  const sameDay = raw.day === d;
  const sameMonth = raw.month === d.slice(0, 7);
  return {
    day: d,
    month: d.slice(0, 7),
    importsToday: sameDay ? count(raw.importsToday) : 0,
    importsMonth: sameMonth ? count(raw.importsMonth) : 0,
    importsTotal: count(raw.importsTotal),
  };
}

export async function countAiImport() {
  const u = await readUsage();
  const next: Usage = { ...u, importsToday: u.importsToday + 1, importsMonth: u.importsMonth + 1, importsTotal: u.importsTotal + 1 };
  await AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
}
