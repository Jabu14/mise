// The voice Sous and hands-free cooking speak with: the most natural voice installed on the phone
// (Apple's "Premium" and "Enhanced" voices sound far less robotic), or one you pick in Voice settings.
// Fully natural AI voices come once Sous is connected.
import * as Speech from 'expo-speech';

export const RATES: Record<string, number> = { slow: 0.85, normal: 1, fast: 1.12 };

export type PhoneVoice = { id: string; name: string; quality: 'Premium' | 'Enhanced' | 'Standard'; region: string };

// Novelty voices (Bubbles, Zarvox…) and the old "Eloquence" ones aren't good for reading recipes.
const NOVELTY = /speech\.synthesis\.voice|eloquence|novelty/i;
const REGIONS: Record<string, string> = { US: 'US', GB: 'UK', AU: 'Australia', IE: 'Ireland', IN: 'India', ZA: 'South Africa', CA: 'Canada', NZ: 'New Zealand' };

// Voice names from an earlier version of Mise; they now mean "automatic".
const LEGACY = ['basil', 'saffron', 'juniper', 'clove'];
export const voiceId = (id: string) => (LEGACY.includes(id) ? '' : id);

let cache: Promise<PhoneVoice[]> | null = null;

// English voices on this phone, most natural first.
export function phoneVoices(): Promise<PhoneVoice[]> {
  cache ??= Speech.getAvailableVoicesAsync()
    .then(list => {
      const rank = { Premium: 0, Enhanced: 1, Standard: 2 };
      return list
        .filter(v => /^en[-_]/i.test(v.language) && !NOVELTY.test(v.identifier))
        .map(v => {
          const quality: PhoneVoice['quality'] = /premium/i.test(v.identifier) ? 'Premium' : v.quality === Speech.VoiceQuality.Enhanced || /enhanced/i.test(v.identifier) ? 'Enhanced' : 'Standard';
          const country = v.language.split(/[-_]/)[1]?.toUpperCase() ?? '';
          return { id: v.identifier, name: v.name, quality, region: REGIONS[country] ?? country };
        })
        .sort((a, b) => rank[a.quality] - rank[b.quality] || (a.region === 'US' ? -1 : 0) - (b.region === 'US' ? -1 : 0) || a.name.localeCompare(b.name))
        .slice(0, 30);
    })
    .catch(() => []);
  return cache;
}

// Short label for a saved voice id ("" = automatic).
export function voiceLabel(saved: string) {
  const id = voiceId(saved);
  if (!id) return 'Automatic';
  const last = id.split('.').pop() || id;
  return /^[a-z]{2}-[a-z]{2}-x-/i.test(last) ? 'Phone voice' : last;
}

// Speaks `text` with the chosen voice (or the best one on the phone) at the chosen speed.
export function speak(text: string, settings: { aiVoice: string; aiVoiceRate: string }, callbacks: { onStart?: () => void; onDone?: () => void } = {}) {
  Speech.stop();
  const go = (voice?: string) =>
    Speech.speak(text, { voice, rate: RATES[settings.aiVoiceRate] ?? 1, onStart: callbacks.onStart, onDone: callbacks.onDone, onStopped: callbacks.onDone, onError: callbacks.onDone });
  const id = voiceId(settings.aiVoice);
  if (id) go(id);
  else phoneVoices().then(list => go(list[0]?.id)).catch(() => go());
}
