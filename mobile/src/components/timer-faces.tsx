// Three ways to show a running timer: a tick ring, a kitchen clock dial, and an hourglass.
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { mix, useTheme } from '../lib/theme';
import { formatDuration } from '../shared/parser';
import { Txt, clock } from './ui';

export type FaceProps = { remaining: number; total: number; paused: boolean; done: boolean; size: number; now: number };

// Current time, refreshed ~30 times a second while `active` (for smooth hands and sand).
export function useSmoothNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    let last = 0;
    const loop = (t: number) => {
      if (t - last > 33) {
        last = t;
        setNow(Date.now());
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [active]);
  return now;
}

// Big digital time with the last segment in the accent colour (00:04:59 style).
export function BigTime({ ms, done, paused, size = 54 }: { ms: number; done: boolean; paused: boolean; size?: number }) {
  const th = useTheme();
  if (done) return <Txt kind="head" weight="bold" size={size * 0.8} color={th.c.accent}>Time&apos;s up!</Txt>;
  const text = clock(ms).padStart(5, '0');
  const cut = text.lastIndexOf(':');
  const style = { fontVariant: ['tabular-nums' as const], lineHeight: size * 1.15 };
  return (
    <Txt kind="head" weight="bold" size={size} color={paused ? th.c.muted : th.c.text} style={style}>
      {text.slice(0, cut + 1)}
      <Txt kind="head" weight="bold" size={size} color={paused ? th.c.muted : th.c.accent} style={style}>{text.slice(cut + 1)}</Txt>
    </Txt>
  );
}

// ---------- Ring: 60 ticks that switch off as time runs out ----------

export function RingFace({ remaining, total, paused, done, size }: FaceProps) {
  const th = useTheme();
  const c = size / 2;
  const left = done ? 0 : Math.max(0, Math.min(1, remaining / total));
  const lit = left * 60;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {Array.from({ length: 60 }, (_, i) => {
          const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
          const major = i % 5 === 0;
          const outer = c - 4;
          const inner = outer - (major ? 18 : 12);
          // Lit ticks get brighter towards the moving edge; the edge tick fades out smoothly.
          const on = Math.min(1, Math.max(0, lit - i));
          const strength = (0.45 + 0.55 * (i / Math.max(lit, 1))) * on;
          return (
            <Line
              key={i}
              x1={c + inner * Math.cos(angle)}
              y1={c + inner * Math.sin(angle)}
              x2={c + outer * Math.cos(angle)}
              y2={c + outer * Math.sin(angle)}
              stroke={on > 0 ? (paused ? th.c.muted : th.c.accent) : th.c.line}
              strokeOpacity={on > 0 ? Math.min(1, strength) : 1}
              strokeWidth={major ? 4 : 3}
              strokeLinecap="round"
            />
          );
        })}
      </Svg>
      <BigTime ms={remaining} done={done} paused={paused} size={size * 0.17} />
      <Txt muted size={14} weight="bold">Total {formatDuration(total / 60000)}</Txt>
    </View>
  );
}

// ---------- Clock: kitchen-timer dial with a shrinking wedge and a sweeping second hand ----------

function wedgePath(cx: number, cy: number, r: number, fraction: number) {
  if (fraction <= 0) return '';
  if (fraction >= 0.9999) return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
  const a = fraction * Math.PI * 2 - Math.PI / 2;
  const x = cx + r * Math.cos(a);
  const y = cy + r * Math.sin(a);
  return `M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${fraction > 0.5 ? 1 : 0} 1 ${x} ${y} Z`;
}

// End point of a clock hand `length` long at `deg` degrees clockwise from 12 o'clock.
const handX = (c: number, deg: number, length: number) => c + length * Math.sin((deg * Math.PI) / 180);
const handY = (c: number, deg: number, length: number) => c - length * Math.cos((deg * Math.PI) / 180);

export function ClockFace({ remaining, total, paused, done, size, now }: FaceProps) {
  const th = useTheme();
  const c = size / 2;
  const r = c - 6;
  const minutesLeft = done ? 0 : remaining / 60000;
  const dial = total > 60 * 60000 ? Math.ceil(total / 3600000) * 60 : 60; // minutes shown on the dial
  const fraction = Math.min(1, minutesLeft / dial);
  const handAngle = fraction * 360;
  const secAngle = paused || done ? 0 : ((now / 1000) % 60) * 6;
  const labelStep = dial / 12;

  return (
    <View style={{ alignItems: 'center', gap: 14 }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="wedge" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={th.c.accent} stopOpacity={0.95} />
            <Stop offset="1" stopColor={mix(th.c.accent, '#000000', 0.15)} stopOpacity={0.95} />
          </LinearGradient>
        </Defs>
        <Circle cx={c} cy={c} r={r} fill={th.c.surface} stroke={th.c.line} strokeWidth={3} />
        <Path d={wedgePath(c, c, r * 0.78, fraction)} fill={paused ? th.c.muted : 'url(#wedge)'} />
        {Array.from({ length: 60 }, (_, i) => {
          const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
          const major = i % 5 === 0;
          const o = r - 6;
          const inn = o - (major ? 12 : 6);
          return <Line key={i} x1={c + inn * Math.cos(a)} y1={c + inn * Math.sin(a)} x2={c + o * Math.cos(a)} y2={c + o * Math.sin(a)} stroke={major ? th.c.text : th.c.muted} strokeWidth={major ? 2.5 : 1.2} strokeLinecap="round" />;
        })}
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
          const d = r - 30;
          const value = i * labelStep;
          const label = dial > 60 ? (value % 60 === 0 ? `${value / 60}h` : '') : String(value);
          return label ? (
            <SvgText key={i} x={c + d * Math.cos(a)} y={c + d * Math.sin(a) + 5} fill={th.c.text} fontSize={size * 0.055} fontWeight="700" textAnchor="middle">{label}</SvgText>
          ) : null;
        })}
        <Line x1={c} y1={c} x2={handX(c, handAngle, r * 0.72)} y2={handY(c, handAngle, r * 0.72)} stroke={th.c.text} strokeWidth={6} strokeLinecap="round" />
        <Line x1={handX(c, secAngle, -14)} y1={handY(c, secAngle, -14)} x2={handX(c, secAngle, r * 0.86)} y2={handY(c, secAngle, r * 0.86)} stroke={th.c.temp} strokeWidth={2} strokeLinecap="round" />
        <Circle cx={c} cy={c} r={9} fill={th.c.text} />
        <Circle cx={c} cy={c} r={3.5} fill={th.c.temp} />
      </Svg>
      <BigTime ms={remaining} done={done} paused={paused} size={size * 0.15} />
    </View>
  );
}

// ---------- Sand: an hourglass that drains as time passes ----------

const TOP_BULB = 'M 44 42 L 156 42 C 156 92 112 118 104 146 L 96 146 C 88 118 44 92 44 42 Z';
const BOTTOM_BULB = 'M 96 154 L 104 154 C 112 182 156 208 156 258 L 44 258 C 44 208 88 182 96 154 Z';

export function SandFace({ remaining, total, paused, done, size, now }: FaceProps) {
  const th = useTheme();
  const progress = done ? 1 : 1 - Math.max(0, Math.min(1, remaining / total));
  const width = size * 0.66;
  const height = width * 1.5;
  const sand = paused ? th.c.muted : th.c.accent;
  const sandDark = mix(sand, '#000000', 0.18);
  const cap = mix(th.c.accent, th.dark ? '#000000' : '#ffffff', th.dark ? 0.15 : 0.1);

  // Top sand surface falls from y=48 to the neck; bottom pile rises from the base.
  const topLevel = 48 + progress * (144 - 48);
  const pile = progress * 100;
  const flowing = !done && !paused && progress < 0.995;
  const dashOffset = -((now / 12) % 24);

  return (
    <View style={{ alignItems: 'center', gap: 14 }}>
      <Svg width={width} height={height} viewBox="0 0 200 300">
        <Defs>
          <ClipPath id="topBulb"><Path d={TOP_BULB} /></ClipPath>
          <ClipPath id="bottomBulb"><Path d={BOTTOM_BULB} /></ClipPath>
          <LinearGradient id="sand" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={sandDark} />
            <Stop offset="0.5" stopColor={sand} />
            <Stop offset="1" stopColor={sandDark} />
          </LinearGradient>
          <LinearGradient id="cap" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={cap} />
            <Stop offset="1" stopColor={mix(cap, '#000000', 0.25)} />
          </LinearGradient>
        </Defs>

        {/* soft shadow under the hourglass */}
        <Ellipse cx={100} cy={290} rx={86} ry={8} fill={th.c.accent} opacity={0.18} />

        {/* glass */}
        <Path d={TOP_BULB} fill={th.c.surface} opacity={0.55} />
        <Path d={BOTTOM_BULB} fill={th.c.surface} opacity={0.55} />

        {/* sand in the top bulb */}
        <G clipPath="url(#topBulb)">
          <Rect x={40} y={topLevel} width={120} height={150 - topLevel} fill="url(#sand)" />
        </G>

        {/* falling stream */}
        {flowing && (
          <Line x1={100} y1={144} x2={100} y2={258 - pile * 0.9} stroke={sand} strokeWidth={3} strokeDasharray="8 4" strokeDashoffset={dashOffset} strokeLinecap="round" />
        )}

        {/* pile in the bottom bulb */}
        <G clipPath="url(#bottomBulb)">
          <Path d={`M 30 262 L 30 ${262 - pile * 0.55} Q 100 ${262 - pile * 1.35} 170 ${262 - pile * 0.55} L 170 262 Z`} fill="url(#sand)" />
        </G>

        {/* glass outline and shine */}
        <Path d={TOP_BULB} fill="none" stroke={th.c.line} strokeWidth={3} />
        <Path d={BOTTOM_BULB} fill="none" stroke={th.c.line} strokeWidth={3} />
        <Path d="M 58 52 C 60 80 76 100 88 116" stroke="#ffffff" strokeOpacity={0.5} strokeWidth={4} strokeLinecap="round" fill="none" />
        <Path d="M 58 248 C 60 222 72 204 84 190" stroke="#ffffff" strokeOpacity={0.35} strokeWidth={4} strokeLinecap="round" fill="none" />

        {/* caps */}
        <Rect x={22} y={22} width={156} height={22} rx={11} fill="url(#cap)" />
        <Rect x={22} y={256} width={156} height={22} rx={11} fill="url(#cap)" />
        <Rect x={34} y={26} width={132} height={5} rx={2.5} fill="#ffffff" opacity={0.35} />
      </Svg>
      <BigTime ms={remaining} done={done} paused={paused} size={size * 0.15} />
    </View>
  );
}
