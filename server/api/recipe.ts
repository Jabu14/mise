// POST /api/recipe: the app sends recipe text, a link, or photos; we return a structured recipe.
// Every input is size-checked and validated here before anything reaches the AI.
import { checkLimits } from '../lib/limits.ts';
import { AiUnavailableError, Anthropic, NotARecipeError, recipeFromInput, type RecipeInput } from '../lib/recipe-ai.ts';

const MAX_BODY = 12 * 1024 * 1024; // 12 MB (three compressed photos)
const MAX_TEXT = 60_000;
const MAX_PHOTOS = 3;
const MAX_PHOTO_B64 = 5_500_000; // ~4 MB image
const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const DEVICE_RE = /^[a-z0-9]{8,64}$/;

// Only the published web app may call this from a browser; the phone app sends no Origin.
const ALLOWED_ORIGINS = new Set((process.env.ALLOWED_ORIGINS ?? 'https://jabu14.github.io').split(',').map(s => s.trim()));

function cors(origin: string | null): Record<string, string> {
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return {};
  return { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Mise-Device', Vary: 'Origin' };
}

function reply(status: number, body: unknown, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...cors(origin) },
  });
}

const fail = (status: number, code: string, message: string, origin: string | null) => reply(status, { error: { code, message } }, origin);

// Rejects anything that isn't a plain public http(s) address.
function safeUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length > 2048) return null;
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal') || !host.includes('.')) return null;
  if (/^[\d.]+$/.test(host) || host.includes(':')) return null; // raw IP addresses
  return url.toString();
}

function parseInput(body: unknown): RecipeInput | string {
  if (!body || typeof body !== 'object') return 'Send a JSON object.';
  const b = body as Record<string, unknown>;
  if (b.kind === 'text') {
    if (typeof b.text !== 'string' || b.text.trim().length < 20) return 'Paste a bit more of the recipe.';
    if (b.text.length > MAX_TEXT) return 'That text is too long.';
    return { kind: 'text', text: b.text };
  }
  if (b.kind === 'url') {
    const url = safeUrl(b.url);
    return url ? { kind: 'url', url } : 'That link doesn’t look right.';
  }
  if (b.kind === 'photos') {
    if (!Array.isArray(b.photos) || !b.photos.length || b.photos.length > MAX_PHOTOS) return `Send 1 to ${MAX_PHOTOS} photos.`;
    const photos: Extract<RecipeInput, { kind: 'photos' }>['photos'] = [];
    for (const p of b.photos as unknown[]) {
      const photo = p as Record<string, unknown>;
      if (typeof photo?.mediaType !== 'string' || !PHOTO_TYPES.has(photo.mediaType)) return 'Photos must be JPEG, PNG or WebP.';
      if (typeof photo.data !== 'string' || photo.data.length > MAX_PHOTO_B64 || !/^[A-Za-z0-9+/=]+$/.test(photo.data)) return 'A photo is too large or damaged.';
      photos.push({ mediaType: photo.mediaType as 'image/jpeg', data: photo.data });
    }
    return { kind: 'photos', photos };
  }
  return 'Unknown request.';
}

export function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: cors(request.headers.get('origin')) });
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && !ALLOWED_ORIGINS.has(origin)) return fail(403, 'forbidden', 'Not allowed.', origin);
  if (!process.env.ANTHROPIC_API_KEY) return fail(503, 'not_configured', 'The AI is not set up yet.', origin);

  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > MAX_BODY) return fail(413, 'too_large', 'That is too large to send.', origin);

  const deviceId = request.headers.get('x-mise-device') ?? '';
  if (!DEVICE_RE.test(deviceId)) return fail(400, 'bad_request', 'Missing device id.', origin);
  const ip = (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';

  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY) return fail(413, 'too_large', 'That is too large to send.', origin);
    body = JSON.parse(raw);
  } catch {
    return fail(400, 'bad_request', 'Send valid JSON.', origin);
  }
  const input = parseInput(body);
  if (typeof input === 'string') return fail(400, 'bad_input', input, origin);

  try {
    const limit = await checkLimits(deviceId, ip);
    if (!limit.ok) {
      const message = limit.reason === 'global' ? 'The AI is very busy today. Please try again tomorrow.' : 'You’ve reached today’s AI limit. Try again tomorrow.';
      return fail(429, 'rate_limited', message, origin);
    }
  } catch (err) {
    console.error('limiter error', err instanceof Error ? err.message : err);
    return fail(503, 'unavailable', 'The AI is unavailable right now.', origin);
  }

  try {
    const recipe = await recipeFromInput(input);
    return reply(200, { recipe }, origin);
  } catch (err) {
    if (err instanceof NotARecipeError) return fail(422, 'not_a_recipe', err.message, origin);
    if (err instanceof AiUnavailableError) return fail(502, 'ai_failed', err.message, origin);
    if (err instanceof Anthropic.RateLimitError) return fail(503, 'busy', 'The AI is busy. Try again in a minute.', origin);
    if (err instanceof Anthropic.APIError) {
      console.error('anthropic error', err.status, err.message);
      return fail(502, 'ai_failed', 'The AI could not convert this. Try again.', origin);
    }
    console.error('unexpected error', err instanceof Error ? err.message : err);
    return fail(500, 'server_error', 'Something went wrong.', origin);
  }
}
