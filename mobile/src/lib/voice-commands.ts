// Spoken commands for hands-free cooking ("next", "back", "repeat", "start the timer"…), using the
// phone's own speech recognition. That needs Mise's own app build: inside Expo Go the native module
// isn't there, so `voiceCommandsAvailable` is false and cook mode falls back to claps.
import { useEffect, useRef, useState } from 'react';

export type VoiceCommand = 'next' | 'back' | 'repeat' | 'timer' | 'pause' | 'ingredients' | 'quiet';

type Recognizer = {
  start(o: object): void;
  stop(): void;
  abort(): void;
  requestPermissionsAsync(): Promise<{ granted: boolean }>;
  isRecognitionAvailable(): boolean;
  addListener(event: string, cb: (e: { results?: { transcript: string }[]; isFinal?: boolean; error?: string }) => void): { remove(): void };
};

let recognizer: Recognizer | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  recognizer = require('expo-speech-recognition').ExpoSpeechRecognitionModule as Recognizer;
} catch {
  recognizer = null; // Expo Go
}

export const voiceCommandsAvailable = (() => {
  try { return !!recognizer && recognizer.isRecognitionAvailable(); } catch { return false; }
})();

// Words for each command, checked in this order (the first match wins).
const COMMANDS: [VoiceCommand, RegExp][] = [
  ['quiet', /\b(be quiet|stop talking|shush|hush|quiet)\b/],
  ['pause', /\b(pause|stop) (the )?timer\b/],
  ['timer', /\b(start|set) (the |a )?timer\b|\btimer\b/],
  ['back', /\b(go back|back|previous|last step)\b/],
  ['repeat', /\b(repeat|again|say that again|read (it|that) again|what was that)\b/],
  ['ingredients', /\b(ingredients|what do i need)\b/],
  ['next', /\b(next|continue|go on|done|finished|ready)\b/],
];

const HINTS = ['next', 'next step', 'back', 'go back', 'repeat', 'start timer', 'pause timer', 'ingredients', 'hey Mise', 'Mise'];
const WAKE = /\b(hey |hi |ok |okay )?(mise|meez|mees|miss|mice|mize|miz)\b/;
const WAKE_WINDOW_MS = 6000;

export type HearState = 'off' | 'starting' | 'listening' | 'no-mic' | 'unavailable';

export function useVoiceCommands({ enabled, quiet, wakeWord, onCommand }: {
  enabled: boolean; quiet: boolean; wakeWord: boolean; onCommand: (c: VoiceCommand, heard: string) => void;
}) {
  const [state, setState] = useState<HearState>('off');
  const [awake, setAwake] = useState(false);
  const latest = useRef({ onCommand, wakeWord });
  useEffect(() => { latest.current = { onCommand, wakeWord }; });
  const run = enabled && voiceCommandsAvailable && !quiet;

  useEffect(() => {
    if (!run || !recognizer) return;
    const rec = recognizer;
    let alive = true;
    let handled = 0; // characters of the current transcript already acted on
    let wokeAt = 0;
    let restart: ReturnType<typeof setTimeout> | undefined;

    const begin = () => {
      handled = 0;
      try {
        rec.start({ lang: 'en-US', interimResults: true, continuous: true, contextualStrings: HINTS, addsPunctuation: false, iosTaskHint: 'confirmation' });
      } catch {
        setState('unavailable');
      }
    };

    const subs = [
      rec.addListener('start', () => alive && setState('listening')),
      rec.addListener('end', () => { if (alive) restart = setTimeout(begin, 250); }), // keep listening
      rec.addListener('error', e => { if (alive && (e.error === 'not-allowed' || e.error === 'service-not-allowed')) setState('no-mic'); }),
      rec.addListener('result', e => {
        const text = (e.results?.[0]?.transcript ?? '').toLowerCase();
        const fresh = text.slice(handled);
        if (!fresh.trim()) return;
        const now = Date.now();
        if (WAKE.test(fresh)) { wokeAt = now; setAwake(true); setTimeout(() => setAwake(false), WAKE_WINDOW_MS); }
        if (latest.current.wakeWord && now - wokeAt > WAKE_WINDOW_MS) return;
        const hit = COMMANDS.find(([, re]) => re.test(fresh));
        if (hit) {
          handled = text.length;
          wokeAt = 0;
          setAwake(false);
          latest.current.onCommand(hit[0], fresh.trim());
        }
      }),
    ];

    (async () => {
      setState('starting');
      const p = await rec.requestPermissionsAsync().catch(() => ({ granted: false }));
      if (!alive) return;
      if (!p.granted) { setState('no-mic'); return; }
      begin();
    })();

    return () => {
      alive = false;
      if (restart) clearTimeout(restart);
      subs.forEach(s => s.remove());
      try { rec.abort(); } catch { /* not running */ }
    };
  }, [run]);

  if (!enabled) return { state: 'off' as HearState, awake: false };
  if (!voiceCommandsAvailable) return { state: 'unavailable' as HearState, awake: false };
  return { state, awake };
}
