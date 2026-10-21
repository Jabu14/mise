// Kitchen timers. Each one stores its end time (not a countdown), so they stay
// correct if the phone locks or the app reloads.
import { settings } from './store.js';
import { cleanTimers } from './validate.js';

const KEY = 'mise.timers.v1';
let timers = load();
const listeners = new Set();
let audioCtx = null;
let alarmLoop = null;
let alarmStop = null;

function load() {
  try {
    return cleanTimers(JSON.parse(localStorage.getItem(KEY)));
  } catch {
    return [];
  }
}

function emit(tickOnly = false) {
  if (!tickOnly) {
    try { localStorage.setItem(KEY, JSON.stringify(timers)); } catch { /* storage full or blocked */ }
  }
  listeners.forEach(fn => fn(timers, tickOnly));
}

export const onTimersChange = fn => listeners.add(fn);
export const getTimers = () => timers;
export const findTimer = key => timers.find(t => t.key === key);

export function remaining(t) {
  if (t.pausedLeft != null) return t.pausedLeft;
  return Math.max(0, t.endAt - Date.now());
}

export function startTimer({ key, minutes, label, recipeId, recipeTitle }) {
  const ms = Math.round(minutes * 60000);
  timers.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    key, label, recipeId, recipeTitle,
    endAt: Date.now() + ms,
    pausedLeft: null,
    done: false,
  });
  if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {});
  emit();
}

export function togglePause(id) {
  const t = timers.find(x => x.id === id);
  if (!t || t.done) return;
  if (t.pausedLeft != null) {
    t.endAt = Date.now() + t.pausedLeft;
    t.pausedLeft = null;
  } else {
    t.pausedLeft = remaining(t);
  }
  emit();
}

export function addMinute(id) {
  const t = timers.find(x => x.id === id);
  if (!t) return;
  if (t.done) {
    t.done = false;
    t.endAt = Date.now() + 60000;
  } else if (t.pausedLeft != null) t.pausedLeft += 60000;
  else t.endAt += 60000;
  stopAlarmIfQuiet();
  emit();
}

export function removeTimer(id) {
  timers = timers.filter(t => t.id !== id);
  stopAlarmIfQuiet();
  emit();
}

function tick() {
  let finished = false;
  for (const t of timers) {
    if (!t.done && t.pausedLeft == null && t.endAt <= Date.now()) {
      t.done = true;
      finished = true;
      ring(t);
    }
  }
  emit(!finished);
}
setInterval(tick, 1000);
document.addEventListener('visibilitychange', tick);

// ---------- Alarm ----------

function ring(t) {
  if (settings.vibrate && navigator.vibrate) navigator.vibrate([400, 200, 400, 200, 400]);
  if (settings.timerSound) startAlarm();
  notify(t);
}

async function notify(t) {
  if (!('Notification' in window) || Notification.permission !== 'granted' || document.visibilityState === 'visible') return;
  const title = `⏰ ${t.label}: time's up!`;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) reg.showNotification(title, { body: t.recipeTitle || '', tag: t.id, renotify: true, vibrate: [400, 200, 400] });
    else new Notification(title, { body: t.recipeTitle || '' });
  } catch { /* notifications unavailable */ }
}

function startAlarm() {
  if (alarmLoop) return;
  beep();
  alarmLoop = setInterval(beep, 2200);
  alarmStop = setTimeout(stopAlarm, 2 * 60000);
}

function stopAlarm() {
  clearInterval(alarmLoop);
  clearTimeout(alarmStop);
  alarmLoop = null;
}

function stopAlarmIfQuiet() {
  if (!timers.some(t => t.done)) stopAlarm();
}

function getAudio() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  return audioCtx;
}

// Browsers only allow sound after a tap, so we wake the audio engine on every tap.
export function unlockAudio() {
  const ctx = getAudio();
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
}

export function beep() {
  const ctx = getAudio();
  if (!ctx) return;
  const now = ctx.currentTime;
  [0, 0.22, 0.44].forEach((offset, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = i === 2 ? 1175 : 880;
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.35, now + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + offset);
    osc.stop(now + offset + 0.2);
  });
}
