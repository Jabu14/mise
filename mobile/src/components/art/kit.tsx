// Drawing kit for Mise's animated illustrations: flat colours, no outlines, big friendly faces
// (in the spirit of Duolingo's characters).
// A scene is drawn on a 240 × 170 canvas and scaled to any width. It is built from <Layer>s: each
// layer is its own small SVG whose shapes use canvas coordinates, inside an Animated.View, so parts
// can bob, spin and squash smoothly on the native thread.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Ellipse, G, Path } from 'react-native-svg';

export const W = 240;
export const H = 170;

export const C = {
  ink: '#3B2A20',
  white: '#FFFFFF',
  cream: '#FFF4E0',
  dough: '#F7CF8A',
  doughShade: '#E5A955',
  crust: '#D98A3A',
  crustShade: '#B56A24',
  bowl: '#4DA3E8',
  bowlShade: '#2F7FC4',
  pot: '#F05D4F',
  potShade: '#C8443A',
  steel: '#C9D2DC',
  steelShade: '#8E9AA6',
  pan: '#4A4E57',
  panShade: '#2E3138',
  wood: '#D69A5B',
  woodShade: '#A96E35',
  green: '#6CC24A',
  leaf: '#3F9B2F',
  tomato: '#FF6B5A',
  carrot: '#FF9A3C',
  flame: '#FFC23D',
  flameIn: '#FF7A1A',
  glass: '#3A2F2B',
  water: '#7FD0F5',
  cheek: '#FF9DA0',
  skin: '#FFD9B3',
  sauce: '#E9B44C',
  mouth: '#7B2F3A',
  tongue: '#F07C8C',
  counterTop: '#F2D3AE',
  counter: '#D9A877',
  counterShade: '#C48F5C',
};

export const STROKE = 3.5;

// Animations run only for the scene on screen, and never when the phone asks for reduced motion.
const ActiveContext = createContext(true);

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then(v => alive && setReduce(v)).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => { alive = false; sub.remove(); };
  }, []);
  return reduce;
}

const EASE = {
  sine: Easing.inOut(Easing.sin),
  linear: Easing.linear,
  out: Easing.out(Easing.quad),
};

// A value that loops 0 → 1 (→ 0 again when pingpong) forever.
export function useLoop(ms: number, { pingpong = true, delay = 0, ease = 'sine' as keyof typeof EASE } = {}) {
  const active = useContext(ActiveContext);
  const reduce = useReduceMotion();
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!active || reduce) { v.setValue(0); return; }
    const to = (toValue: number, duration: number) => Animated.timing(v, { toValue, duration, easing: EASE[ease], useNativeDriver: true });
    const anim = Animated.loop(
      pingpong
        ? Animated.sequence([Animated.delay(delay), to(1, ms), to(0, ms)])
        : Animated.sequence([Animated.delay(delay), to(1, ms), Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true })]),
    );
    anim.start();
    return () => anim.stop();
  }, [active, reduce, ms, pingpong, delay, ease, v]);
  return v;
}

// Eyes close for a moment every few seconds.
export function useBlink(every = 3200) {
  const active = useContext(ActiveContext);
  const reduce = useReduceMotion();
  const [v] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (!active || reduce) { v.setValue(1); return; }
    const anim = Animated.loop(Animated.sequence([
      Animated.delay(every),
      Animated.timing(v, { toValue: 0.1, duration: 70, useNativeDriver: true }),
      Animated.timing(v, { toValue: 1, duration: 90, useNativeDriver: true }),
    ]));
    anim.start();
    return () => anim.stop();
  }, [active, reduce, every, v]);
  return v;
}

export const lerp = (v: Animated.Value, from: number, to: number) => v.interpolate({ inputRange: [0, 1], outputRange: [from, to] });
export const turn = (v: Animated.Value, from: number, to: number) => v.interpolate({ inputRange: [0, 1], outputRange: [`${from}deg`, `${to}deg`] });

// One animated part of a scene. Shapes inside use canvas coordinates; `origin` is the canvas point
// it spins or scales around.
export function Layer({ x = 0, y = 0, w = W, h = H, origin, style, outline = false, children }: {
  x?: number; y?: number; w?: number; h?: number; origin?: [number, number]; outline?: boolean;
  style?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>; children: ReactNode;
}) {
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: x, top: y, width: w, height: h }, origin ? { transformOrigin: `${origin[0] - x}px ${origin[1] - y}px` } : null, style]}>
      <Svg width={w} height={h} viewBox={`${x} ${y} ${w} ${h}`}>
        <G stroke={outline ? C.ink : 'none'} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">{children}</G>
      </Svg>
    </Animated.View>
  );
}

// The canvas, scaled to `width`. `active` pauses every animation inside when false.
export function Scene({ width, active = true, children }: { width: number; active?: boolean; children: ReactNode }) {
  const s = width / W;
  return (
    <ActiveContext.Provider value={active}>
      <View style={{ width, height: H * s, overflow: 'visible' }} accessible={false} importantForAccessibility="no-hide-descendants">
        <View style={{ position: 'absolute', left: (W * s - W) / 2, top: (H * s - H) / 2, width: W, height: H, transform: [{ scale: s }] }}>
          {children}
        </View>
      </View>
    </ActiveContext.Provider>
  );
}

export function Shadow({ cx = 120, cy = 156, rx = 74 }: { cx?: number; cy?: number; rx?: number }) {
  return <Ellipse cx={cx} cy={cy} rx={rx} ry={7} fill={C.ink} opacity={0.12} stroke="none" />;
}

// Cheeks and a smile; the eyes are a separate <Eyes> layer so they can blink.
export function Smile({ cx, cy, open = false, size = 1 }: { cx: number; cy: number; open?: boolean; size?: number }) {
  const k = size;
  return (
    <>
      <Ellipse cx={cx - 21 * k} cy={cy + 2 * k} rx={5.5 * k} ry={3.2 * k} fill={C.cheek} opacity={0.75} stroke="none" />
      <Ellipse cx={cx + 21 * k} cy={cy + 2 * k} rx={5.5 * k} ry={3.2 * k} fill={C.cheek} opacity={0.75} stroke="none" />
      {open
        ? <Path d={`M${cx - 6 * k} ${cy} Q${cx} ${cy + 10 * k} ${cx + 6 * k} ${cy} Z`} fill={C.mouth} />
        : <Path d={`M${cx - 6 * k} ${cy} Q${cx} ${cy + 7 * k} ${cx + 6 * k} ${cy}`} fill="none" stroke={C.ink} strokeWidth={3} />}
    </>
  );
}

export function Eyes({ cx, cy, gap = 12, size = 1, every }: { cx: number; cy: number; gap?: number; size?: number; every?: number }) {
  const blink = useBlink(every);
  const box = { x: cx - gap - 8, y: cy - 8, w: gap * 2 + 16, h: 16 };
  return (
    <Layer {...box} origin={[cx, cy]} style={{ transform: [{ scaleY: blink }] }}>
      {[-gap, gap].map(dx => (
        <G key={dx}>
          <Ellipse cx={cx + dx} cy={cy} rx={3.8 * size} ry={4.8 * size} fill={C.ink} stroke="none" />
          <Ellipse cx={cx + dx + 1.3 * size} cy={cy - 1.7 * size} rx={1.4 * size} ry={1.4 * size} fill={C.white} stroke="none" />
        </G>
      ))}
    </Layer>
  );
}

// Happy closed eyes (^ ^) or sleepy ones (︶ ︶), drawn into whatever layer they're in.
export function ClosedEyes({ cx, cy, gap = 12, sleepy = false }: { cx: number; cy: number; gap?: number; sleepy?: boolean }) {
  const arc = (x: number) => (sleepy ? `M${x - 5} ${cy} Q${x} ${cy + 5} ${x + 5} ${cy}` : `M${x - 5} ${cy + 2} Q${x} ${cy - 5} ${x + 5} ${cy + 2}`);
  return <Path d={`${arc(cx - gap)} ${arc(cx + gap)}`} fill="none" stroke={C.ink} strokeWidth={3} />;
}

// A four-point twinkle.
export function sparkle(x: number, y: number, r: number) {
  return `M${x} ${y - r} Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y} Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r} Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y} Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r} Z`;
}

// A wavy line of steam or heat, rising from (x, y).
export function squiggle(x: number, y: number, len = 26) {
  const s = len / 4;
  return `M${x} ${y} q${s * 0.9} ${-s} 0 ${-s * 2} q${-s * 0.9} ${-s} 0 ${-s * 2}`;
}
