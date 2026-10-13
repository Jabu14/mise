// A running timer drawn in the chosen style (Ring / Clock / Sand), plus small timer helpers.
import type { KitchenTimer, Settings } from '../lib/store';
import { ClockFace, RingFace, SandFace, useSmoothNow, type FaceProps } from './timer-faces';

export type TimerStyle = Settings['timerStyle'];
export const NEXT_STYLE: Record<TimerStyle, TimerStyle> = { ring: 'clock', clock: 'sand', sand: 'ring' };

// "25 min, 5 sec" / "1 hr, 5 sec"
export function durationWords(ms: number) {
  const total = Math.round(ms / 1000);
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  return [h && `${h} hr`, m && `${m} min`, s && `${s} sec`].filter(Boolean).join(', ') || '0 sec';
}

export function TimerFace({ t, size, mini, style }: { t: KitchenTimer; size: number; mini?: boolean; style: TimerStyle }) {
  const paused = t.pausedLeft != null;
  const now = useSmoothNow(!paused && !t.done);
  const remaining = paused ? (t.pausedLeft as number) : Math.max(0, t.endAt - now);
  const props: FaceProps = { remaining, total: t.total || 60000, paused, done: t.done, size, now, mini };
  return style === 'clock' ? <ClockFace {...props} /> : style === 'sand' ? <SandFace {...props} /> : <RingFace {...props} />;
}
