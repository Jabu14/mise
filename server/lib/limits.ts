// Abuse protection: per-device and per-IP daily limits, plus a global daily cap on AI calls,
// so a leaked endpoint can't run up the bill.
// Uses Upstash Redis when UPSTASH_REDIS_REST_URL / _TOKEN are set (shared across all server
// instances); otherwise an in-memory counter (fine for local dev, per-instance in production).

const DAY = 24 * 60 * 60;

export const LIMITS = {
  perDevice: Number(process.env.AI_LIMIT_PER_DEVICE ?? 25),
  perIp: Number(process.env.AI_LIMIT_PER_IP ?? 60),
  global: Number(process.env.AI_DAILY_LIMIT ?? 500),
};

const memory = new Map<string, { count: number; resetAt: number }>();

async function incr(key: string): Promise<number> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([['INCR', key], ['EXPIRE', key, String(DAY), 'NX']]),
    });
    if (!res.ok) throw new Error(`rate limiter unavailable (${res.status})`);
    const [first] = (await res.json()) as [{ result: number }];
    return first.result;
  }
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.resetAt < now) {
    memory.set(key, { count: 1, resetAt: now + DAY * 1000 });
    return 1;
  }
  entry.count += 1;
  return entry.count;
}

export type LimitResult = { ok: true } | { ok: false; reason: 'device' | 'ip' | 'global' };

// Counts one AI request against every limit; fails closed if the limiter itself is down.
export async function checkLimits(deviceId: string, ip: string): Promise<LimitResult> {
  const day = new Date().toISOString().slice(0, 10);
  const [device, byIp, global] = await Promise.all([
    incr(`mise:ai:${day}:device:${deviceId}`),
    incr(`mise:ai:${day}:ip:${ip}`),
    incr(`mise:ai:${day}:global`),
  ]);
  if (global > LIMITS.global) return { ok: false, reason: 'global' };
  if (device > LIMITS.perDevice) return { ok: false, reason: 'device' };
  if (byIp > LIMITS.perIp) return { ok: false, reason: 'ip' };
  return { ok: true };
}
