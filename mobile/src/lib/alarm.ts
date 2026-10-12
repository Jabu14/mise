// The "Time's up!" sound played inside the app. It loops until the timer is stopped
// (or for 3 minutes at most) and plays even when the iPhone's silent switch is on,
// like the Clock app. When the app is closed or the phone is locked, the timer's
// notification plays the system sound instead.
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

const MAX_RING_MS = 3 * 60 * 1000;

let player: AudioPlayer | null = null;
let autoStop: ReturnType<typeof setTimeout> | null = null;
let ringing = false;

export async function startAlarmSound() {
  if (ringing) return;
  ringing = true;
  try {
    await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers' });
    player ??= createAudioPlayer(require('../../assets/sounds/alarm.wav'));
    player.loop = true;
    await player.seekTo(0);
    if (ringing) player.play();
  } catch {
    ringing = false;
  }
  if (autoStop) clearTimeout(autoStop);
  autoStop = setTimeout(stopAlarmSound, MAX_RING_MS);
}

export function stopAlarmSound() {
  ringing = false;
  if (autoStop) clearTimeout(autoStop);
  autoStop = null;
  try {
    player?.pause();
  } catch {
    // player already released
  }
}
