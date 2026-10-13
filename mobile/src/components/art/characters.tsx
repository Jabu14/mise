// Mise's little cooks: three friendly characters in a flat, big-head style who act out the steps.
// A character is drawn standing at `cx` with feet on the floor (y ≈ 160); arms are passed in as
// separate layers so each scene can animate them (stirring, chopping, waving…).
import type { ReactNode } from 'react';
import { Animated } from 'react-native';
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { C, H, Layer, W, useBlink } from './kit';

export type Cook = {
  skin: string; skinShade: string; hair: string; brow: string;
  top: string; topShade: string; pants: string; shoe: string;
  style: 'bun' | 'curly' | 'hijab'; band?: string;
};

export const CAST: Cook[] = [
  { skin: '#E8B48A', skinShade: '#D39A6E', hair: '#2B1D16', brow: '#2B1D16', top: '#FF9F1C', topShade: '#E88A0A', pants: '#3D5A80', shoe: '#FF5E5B', style: 'bun' },
  { skin: '#8D5A3B', skinShade: '#76482D', hair: '#1E1410', brow: '#1E1410', top: '#2EC4B6', topShade: '#1FA396', pants: '#5E4AE3', shoe: '#FFD23F', style: 'curly', band: '#FFD23F' },
  { skin: '#F2C9A0', skinShade: '#DEAF84', hair: '#FF8FC7', brow: '#5A3B2A', top: '#9B5DE5', topShade: '#7E43C9', pants: '#F15BB5', shoe: '#3D5A80', style: 'hijab' },
];

export const SHOULDER_Y = 98;
export const shoulders = (cx: number) => ({ left: [cx - 16, SHOULDER_Y] as [number, number], right: [cx + 16, SHOULDER_Y] as [number, number] });

// A long noodle arm from the shoulder, bending through `c`, ending in a hand (or an oven mitt).
export function Arm({ who, s, c, h, hand }: { who: Cook; s: [number, number]; c: [number, number]; h: [number, number]; hand?: string }) {
  return (
    <G>
      <Path d={`M${s[0]} ${s[1]} Q${c[0]} ${c[1]} ${h[0]} ${h[1]}`} fill="none" stroke={who.top} strokeWidth={10} strokeLinecap="round" />
      {hand
        ? <Ellipse cx={h[0]} cy={h[1]} rx={8} ry={9} fill={hand} />
        : <Circle cx={h[0]} cy={h[1]} r={6} fill={who.skin} />}
    </G>
  );
}

// A hand resting on the hip (left or right side).
export function HipArm({ who, cx, side }: { who: Cook; cx: number; side: 'left' | 'right' }) {
  const k = side === 'left' ? -1 : 1;
  return <Arm who={who} s={[cx + 16 * k, SHOULDER_Y]} c={[cx + 30 * k, 114]} h={[cx + 16 * k, 126]} />;
}

type Eyes = 'open' | 'happy' | 'sleepy';
type Mouth = 'smile' | 'o' | 'grin';

export function Character({ who, cx, eyes = 'open', mouth = 'smile', look = [1.6, 0], style, back, front }: {
  who: Cook; cx: number; eyes?: Eyes; mouth?: Mouth; look?: [number, number];
  style?: Animated.WithAnimatedValue<object>; back?: ReactNode; front?: ReactNode;
}) {
  const hy = who.style === 'hijab' ? 62 : 60;
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: `${cx}px 160px` }, style]}>
      {back}
      <Layer>
        <Ellipse cx={cx} cy={162} rx={26} ry={5} fill={C.ink} opacity={0.12} />
        {/* legs and shoes */}
        <Rect x={cx - 12} y={130} width={10} height={27} rx={5} fill={who.pants} />
        <Rect x={cx + 2} y={130} width={10} height={27} rx={5} fill={who.pants} />
        <Ellipse cx={cx - 8} cy={158} rx={9} ry={4.5} fill={who.shoe} />
        <Ellipse cx={cx + 9} cy={158} rx={9} ry={4.5} fill={who.shoe} />
        {/* body and apron */}
        <Path d={`M${cx - 20} 136 Q${cx - 23} 95 ${cx} 91 Q${cx + 23} 95 ${cx + 20} 136 Z`} fill={who.top} />
        <Path d={`M${cx + 6} 92 Q${cx + 23} 96 ${cx + 20} 136 L${cx + 11} 136 Q${cx + 15} 110 ${cx + 6} 92 Z`} fill={who.topShade} />
        <Path d={`M${cx - 9} 104 L${cx - 5} 93 M${cx + 9} 104 L${cx + 5} 93`} fill="none" stroke={C.white} strokeWidth={3} strokeLinecap="round" />
        <Path d={`M${cx - 12} 103 H${cx + 12} V126 Q${cx + 12} 134 ${cx + 4} 134 H${cx - 4} Q${cx - 12} 134 ${cx - 12} 126 Z`} fill={C.white} />
        <Rect x={cx - 6} y={113} width={12} height={8} rx={2.5} fill="none" stroke={C.steel} strokeWidth={2} />
        {/* neck, head, hair */}
        <Rect x={cx - 5} y={78} width={10} height={16} rx={4} fill={who.skinShade} />
        {who.style === 'hijab' ? (
          <>
            <Path d={`M${cx - 30} 104 Q${cx - 36} 28 ${cx} 28 Q${cx + 36} 28 ${cx + 30} 104 Q${cx} 94 ${cx - 30} 104 Z`} fill={who.hair} />
            <Path d={`M${cx + 14} 34 Q${cx + 34} 50 ${cx + 30} 104 L${cx + 22} 100 Q${cx + 28} 60 ${cx + 14} 34 Z`} fill="#000" opacity={0.08} />
            <Ellipse cx={cx} cy={hy} rx={19} ry={21} fill={who.skin} />
          </>
        ) : (
          <>
            <Ellipse cx={cx - 23} cy={63} rx={4.5} ry={6} fill={who.skin} />
            <Ellipse cx={cx + 23} cy={63} rx={4.5} ry={6} fill={who.skin} />
            <Ellipse cx={cx} cy={hy} rx={23} ry={24} fill={who.skin} />
          </>
        )}
        {who.style === 'bun' ? (
          <>
            <Circle cx={cx + 3} cy={30} r={10} fill={who.hair} />
            <Path d={`M${cx - 24} 60 Q${cx - 26} 34 ${cx} 35 Q${cx + 26} 34 ${cx + 24} 58 Q${cx + 14} 44 ${cx - 2} 46 Q${cx - 16} 46 ${cx - 24} 60 Z`} fill={who.hair} />
            <Rect x={cx - 3} y={36} width={12} height={4} rx={2} fill={who.top} />
          </>
        ) : null}
        {who.style === 'curly' ? (
          <>
            {[[-21, 50, 9], [-17, 39, 10], [-6, 33, 10], [7, 32, 10], [18, 37, 10], [23, 48, 9], [24, 58, 7], [-23, 60, 7]].map(([dx, y, r]) => (
              <Circle key={`${dx}${y}`} cx={cx + dx} cy={y} r={r} fill={who.hair} />
            ))}
            <Path d={`M${cx - 22} 47 Q${cx} 35 ${cx + 22} 47`} fill="none" stroke={who.band} strokeWidth={6} strokeLinecap="round" />
          </>
        ) : null}
        {/* face */}
        <Path d={`M${cx - 13} ${hy - 10} q4 -3 8 0 M${cx + 5} ${hy - 10} q4 -3 8 0`} fill="none" stroke={who.brow} strokeWidth={2.6} strokeLinecap="round" />
        <Ellipse cx={cx + 2} cy={hy + 7} rx={3} ry={2.4} fill={who.skinShade} />
        <Ellipse cx={cx - 13} cy={hy + 10} rx={4.5} ry={2.8} fill={C.cheek} opacity={0.55} />
        <Ellipse cx={cx + 15} cy={hy + 10} rx={4.5} ry={2.8} fill={C.cheek} opacity={0.55} />
        {mouth === 'o' ? <Ellipse cx={cx + 1} cy={hy + 16} rx={3.5} ry={4} fill={C.mouth} /> : null}
        {mouth === 'smile' ? (
          <>
            <Path d={`M${cx - 6} ${hy + 13} Q${cx + 1} ${hy + 23} ${cx + 8} ${hy + 13} Z`} fill={C.mouth} />
            <Ellipse cx={cx + 1} cy={hy + 18} rx={3} ry={1.8} fill={C.tongue} />
          </>
        ) : null}
        {mouth === 'grin' ? <Path d={`M${cx - 6} ${hy + 14} Q${cx + 1} ${hy + 20} ${cx + 8} ${hy + 14}`} fill="none" stroke={C.mouth} strokeWidth={3} strokeLinecap="round" /> : null}
        {eyes !== 'open' ? (
          <Path
            d={[cx - 8, cx + 9].map(x => (eyes === 'sleepy' ? `M${x - 5} ${hy} Q${x} ${hy + 4} ${x + 5} ${hy}` : `M${x - 5} ${hy + 2} Q${x} ${hy - 5} ${x + 5} ${hy + 2}`)).join(' ')}
            fill="none" stroke={C.ink} strokeWidth={3} strokeLinecap="round"
          />
        ) : null}
      </Layer>
      {eyes === 'open' ? <CookEyes cx={cx} cy={hy} look={look} /> : null}
      {front}
    </Animated.View>
  );
}

function CookEyes({ cx, cy, look }: { cx: number; cy: number; look: [number, number] }) {
  const blink = useBlink(2900);
  return (
    <Layer x={cx - 18} y={cy - 9} w={38} h={18} origin={[cx, cy]} style={{ transform: [{ scaleY: blink }] }}>
      {[cx - 8, cx + 9].map(x => (
        <G key={x}>
          <Ellipse cx={x} cy={cy} rx={5.5} ry={6.5} fill={C.white} />
          <Ellipse cx={x + look[0]} cy={cy + look[1]} rx={3} ry={3.6} fill="#2B1D16" />
          <Circle cx={x + look[0] + 1} cy={cy + look[1] - 1.4} r={1.1} fill={C.white} />
        </G>
      ))}
    </Layer>
  );
}

// The kitchen counter on the right of most scenes (top at y = 118).
export function Counter({ from = 126 }: { from?: number }) {
  return (
    <Layer>
      <Rect x={from} y={121} width={W - from + 10} height={60} fill={C.counter} />
      <Rect x={from + 10} y={132} width={W - from - 20} height={30} rx={4} fill={C.counterShade} opacity={0.5} />
      <Rect x={from - 4} y={114} width={W - from + 14} height={9} rx={4} fill={C.counterTop} />
    </Layer>
  );
}

// A mixing bowl standing on the counter: `back` (inside and contents) goes behind tools, `front` in front.
export function BowlBack({ x, y = 91, r = 30, fill = C.dough }: { x: number; y?: number; r?: number; fill?: string }) {
  return (
    <>
      <Ellipse cx={x} cy={y} rx={r} ry={r * 0.22} fill={C.bowlShade} />
      <Ellipse cx={x} cy={y + 1} rx={r * 0.83} ry={r * 0.15} fill={fill} />
    </>
  );
}

export function BowlFront({ x, y = 91, r = 30 }: { x: number; y?: number; r?: number }) {
  const ry = r * 0.22, d = r * 0.9;
  return (
    <>
      <Path d={`M${x - r} ${y} A${r} ${ry} 0 0 0 ${x + r} ${y} Q${x + r * 0.93} ${y + d} ${x} ${y + d} Q${x - r * 0.93} ${y + d} ${x - r} ${y} Z`} fill={C.bowl} />
      <Path d={`M${x - r * 0.72} ${y + ry + 2} Q${x - r * 0.66} ${y + d * 0.62} ${x - r * 0.3} ${y + d * 0.82}`} fill="none" stroke={C.white} strokeOpacity={0.5} strokeWidth={3.5} strokeLinecap="round" />
    </>
  );
}
