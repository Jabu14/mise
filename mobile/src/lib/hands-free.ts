// Hands-free cooking: read steps out loud, and listen for claps to move on.
// Voice commands ("next", "back") need speech recognition, which Expo Go doesn't include, so for
// now the microphone only measures loudness and picks out sharp claps (nothing is recorded or kept:
// the audio goes to a temporary file that is thrown away every minute).
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { File } from 'expo-file-system';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import { plainText } from '../shared/parser';
import type { Settings, Step } from './store';
import { VOICES } from './voices';

const SAMPLE_MS = 50;
const RESTART_MS = 60_000;     // start a fresh temporary file this often
const CLAP_GAP_MS = 140;       // two peaks closer than this are the same clap
const SEQUENCE_END_MS = 700;   // this long after the last clap, the claps are counted
const LOUD_DB = -22;           // a clap is at least this loud…
const JUMP_DB = 16;            // …and this much louder than the room

export type ListenState = 'off' | 'starting' | 'listening' | 'no-mic';

// Calls onClaps(n) after a quick run of n ≥ 2 claps. Pauses while `quiet` (e.g. while Mise speaks).
export function useClapCommands({ enabled, quiet, onClaps }: { enabled: boolean; quiet: boolean; onClaps: (count: number) => void }) {
  const recorder = useAudioRecorder({ ...RecordingPresets.LOW_QUALITY, isMeteringEnabled: true });
  const [state, setState] = useState<ListenState>('off');
  const latest = useRef({ quiet, onClaps });
  useEffect(() => { latest.current = { quiet, onClaps }; });

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    let sampler: ReturnType<typeof setInterval> | undefined;
    let restarter: ReturnType<typeof setInterval> | undefined;
    let base = -50;
    let above = false;
    let claps: number[] = [];

    const throwAway = () => {
      const uri = recorder.uri;
      if (!uri) return;
      try { const f = new File(uri); if (f.exists) f.delete(); } catch { /* already gone */ }
    };

    const sample = () => {
      const now = Date.now();
      const level = recorder.getStatus().metering;
      if (latest.current.quiet || level == null) { claps = []; above = false; return; }
      const loud = level > LOUD_DB && level - base > JUMP_DB;
      if (loud && !above && (!claps.length || now - claps[claps.length - 1] > CLAP_GAP_MS)) claps.push(now);
      above = loud;
      if (!loud) base = base * 0.95 + level * 0.05; // follow the room's background noise
      if (claps.length && now - claps[claps.length - 1] > SEQUENCE_END_MS) {
        const count = claps.length;
        claps = [];
        if (count >= 2) latest.current.onClaps(count);
      }
    };

    (async () => {
      setState('starting');
      const permission = await requestRecordingPermissionsAsync().catch(() => null);
      if (!alive) return;
      if (!permission?.granted) { setState('no-mic'); return; }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true, shouldRouteThroughEarpiece: false }).catch(() => {});
      await recorder.prepareToRecordAsync();
      if (!alive) return;
      recorder.record();
      setState('listening');
      sampler = setInterval(sample, SAMPLE_MS);
      restarter = setInterval(async () => {
        await recorder.stop().catch(() => {});
        throwAway();
        if (!alive) return;
        await recorder.prepareToRecordAsync().catch(() => {});
        if (alive) recorder.record();
      }, RESTART_MS);
    })().catch(() => alive && setState('no-mic'));

    return () => {
      alive = false;
      if (sampler) clearInterval(sampler);
      if (restarter) clearInterval(restarter);
      recorder.stop().catch(() => {}).finally(() => {
        throwAway();
        setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
      });
      setState('off');
    };
  }, [enabled, recorder]);

  return enabled ? state : 'off';
}

// Speaks a step in Sous's chosen voice.
export function speakStep(step: Step, number: number, total: number, settings: Settings, callbacks: { onStart?: () => void; onDone?: () => void } = {}) {
  const timer = step.timers[0];
  const parts = [
    `Step ${number} of ${total}. ${step.title}.`,
    plainText(step.text),
    step.tip ? `Tip: ${plainText(step.tip)}` : '',
    timer ? 'Clap three times to start the timer.' : number < total ? 'Clap twice when you’re ready for the next step.' : 'That’s the last step.',
  ];
  say(parts.filter(Boolean).join(' '), settings, callbacks);
}

export function say(text: string, settings: Settings, { onStart, onDone }: { onStart?: () => void; onDone?: () => void } = {}) {
  const v = VOICES[settings.aiVoice] ?? VOICES.basil;
  Speech.stop();
  Speech.speak(text, { pitch: v.pitch, rate: v.rate, onStart, onDone, onStopped: onDone, onError: onDone });
}

export const stopSpeaking = () => { Speech.stop(); };
