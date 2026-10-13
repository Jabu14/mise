// The "Time's up!" sound played inside the app. It loops until the timer is stopped
// (or for 3 minutes at most) and plays even when the iPhone's silent switch is on,
// like the Clock app. When the app is closed or the phone is locked, the timer's
// notification plays the system sound instead.
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

export const TONES = {
  chime: { name: 'Chime', file: require('../../assets/sounds/alarm.wav') },
  bell: { name: 'Bell', file: require('../../assets/sounds/bell.wav') },
  beeps: { name: 'Beeps', file: require('../../assets/sounds/beeps.wav') },
} as const;
export type Tone = keyof typeof TONES;

const MAX_RING_MS = 3 * 60 * 1000;

const players: Partial<Record<Tone, AudioPlayer>> = {};
let current: Tone | null = null;
let autoStop: ReturnType<typeof setTimeout> | null = null;

function playerFor(tone: Tone) {
  players[tone] ??= createAudioPlayer(TONES[tone].file);
  return players[tone]!;
}

async function play(tone: Tone, loop: boolean) {
  await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers' });
  const player = playerFor(tone);
  player.loop = loop;
  await player.seekTo(0);
  player.play();
}

export async function startAlarmSound(tone: Tone = 'chime') {
  if (current === tone) return;
  stopAlarmSound();
  current = tone;
  try {
    await play(tone, true);
  } catch {
    current = null;
  }
  autoStop = setTimeout(stopAlarmSound, MAX_RING_MS);
}

export function stopAlarmSound() {
  if (autoStop) clearTimeout(autoStop);
  autoStop = null;
  current = null;
  for (const p of Object.values(players)) {
    try {
      p?.pause();
    } catch {
      // player already released
    }
  }
}

// Plays a tone once so the user can hear it when choosing.
export async function previewTone(tone: Tone) {
  if (current) return;
  for (const p of Object.values(players)) p?.pause();
  try {
    await play(tone, false);
  } catch {
    // audio unavailable
  }
}
