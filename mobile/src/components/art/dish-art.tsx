// The recipe's picture at the top of its page: a friendly animated dish chosen from the recipe's
// name (bread, cake, pasta, soup, salad, pizza, cookies, pancakes), or a covered plate otherwise.
import type { ReactNode } from 'react';
import { Animated } from 'react-native';
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { C, Eyes, Layer, Scene, Shadow, Smile, lerp, sparkle, squiggle, useLoop } from './kit';

// The dish gently floats; its shadow breathes with it.
function Float({ children, eyes, steam }: { children: ReactNode; eyes: [number, number]; steam?: number[] }) {
  const v = useLoop(1600);
  const lift = { transform: [{ translateY: lerp(v, 0, -7) }] };
  return (
    <>
      <Layer origin={[120, 156]} style={{ transform: [{ scaleX: lerp(v, 1, 0.9) }], opacity: lerp(v, 1, 0.7) }}><Shadow rx={70} /></Layer>
      <Layer style={lift}>{children}</Layer>
      {/* The eyes ride along with the dish and blink on their own. */}
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', inset: 0 }, lift]}>
        <Eyes cx={eyes[0]} cy={eyes[1]} />
      </Animated.View>
      {steam?.map((x, i) => <Steam key={x} x={x} delay={i * 900} />)}
    </>
  );
}

function Steam({ x, delay }: { x: number; delay: number }) {
  const v = useLoop(2200, { pingpong: false, delay, ease: 'linear' });
  return (
    <Layer style={{ opacity: v.interpolate({ inputRange: [0, 0.25, 0.7, 1], outputRange: [0, 1, 1, 0] }), transform: [{ translateY: lerp(v, 0, -16) }] }}>
      <Path d={squiggle(x, 52, 24)} fill="none" stroke={C.steelShade} strokeWidth={3} />
    </Layer>
  );
}

function Twinkles({ points }: { points: [number, number, number][] }) {
  return <>{points.map(([x, y, r], i) => <Twinkle key={i} x={x} y={y} r={r} delay={i * 400} />)}</>;
}

function Twinkle({ x, y, r, delay }: { x: number; y: number; r: number; delay: number }) {
  const v = useLoop(800, { delay });
  return (
    <Layer origin={[x, y]} style={{ opacity: lerp(v, 0.3, 1), transform: [{ scale: lerp(v, 0.5, 1.1) }] }}>
      <Path d={sparkle(x, y, r)} fill={C.flame} strokeWidth={2.5} />
    </Layer>
  );
}

const Bread = () => (
  <Float eyes={[120, 102]}>
    <Path d="M52 140 Q46 80 120 74 Q194 80 188 140 Z" fill={C.crust} />
    <Path d="M66 132 Q62 96 104 84" fill="none" stroke={C.white} strokeOpacity={0.35} strokeWidth={6} />
    <Path d="M92 84 l10 12 M118 80 l10 12 M144 84 l10 12" fill="none" stroke={C.crustShade} strokeWidth={3.5} />
    <Smile cx={120} cy={116} open />
  </Float>
);

const Cake = () => (
  <>
    <Float eyes={[120, 112]}>
      <Rect x={60} y={86} width={120} height={58} rx={12} fill={C.cream} />
      <Path d="M60 100 Q70 112 80 100 Q90 112 100 100 Q110 112 120 100 Q130 112 140 100 Q150 112 160 100 Q170 112 180 100 V96 Q180 86 168 86 H72 Q60 86 60 96 Z" fill={C.cheek} />
      <Rect x={116} y={58} width={8} height={28} rx={3} fill={C.bowl} />
      <Path d="M120 46 c-6 4 -6 10 0 12 c6 -2 6 -8 0 -12 Z" fill={C.flame} />
      <Smile cx={120} cy={126} open />
    </Float>
    <Twinkles points={[[52, 62, 9], [190, 56, 10]]} />
  </>
);

const Pasta = () => (
  <Float eyes={[120, 120]} steam={[100, 140]}>
    <Path d="M50 100 A70 14 0 0 0 190 100 Q186 150 120 152 Q54 150 50 100 Z" fill={C.white} />
    <Path d="M62 100 Q66 68 120 66 Q174 68 178 100 Z" fill={C.flame} />
    <Path d="M78 96 q10 -18 22 -4 q10 14 22 -2 q12 -16 22 0 q8 12 16 2 M86 84 q12 -12 24 0 q12 10 24 -2" fill="none" stroke={C.crust} strokeWidth={3} />
    <Circle cx={104} cy={78} r={7} fill={C.tomato} strokeWidth={3} />
    <Circle cx={138} cy={80} r={6} fill={C.tomato} strokeWidth={3} />
    <Path d="M120 70 q-4 -10 6 -12 q2 8 -6 12 Z" fill={C.green} strokeWidth={2.5} />
    <Smile cx={120} cy={134} />
  </Float>
);

const Soup = () => (
  <Float eyes={[120, 114]} steam={[96, 120, 144]}>
    <Rect x={38} y={92} width={18} height={11} rx={5.5} fill={C.potShade} />
    <Rect x={184} y={92} width={18} height={11} rx={5.5} fill={C.potShade} />
    <Path d="M56 82 H184 V130 Q184 148 166 148 H74 Q56 148 56 130 Z" fill={C.pot} />
    <Rect x={48} y={74} width={144} height={14} rx={7} fill={C.potShade} />
    <Path d="M68 96 V128" fill="none" stroke={C.white} strokeOpacity={0.4} strokeWidth={5} />
    <Smile cx={120} cy={128} open />
  </Float>
);

const Salad = () => (
  <Float eyes={[120, 124]}>
    <Path d="M66 92 Q60 64 86 64 Q92 46 112 54 Q126 40 142 56 Q166 50 170 70 Q186 76 174 94 Z" fill={C.green} />
    <Circle cx={100} cy={74} r={7} fill={C.tomato} strokeWidth={3} />
    <Circle cx={146} cy={72} r={6} fill={C.tomato} strokeWidth={3} />
    <Ellipse cx={124} cy={66} rx={8} ry={5} fill={C.flame} strokeWidth={3} />
    <Path d="M48 96 A72 14 0 0 0 192 96 Q188 150 120 152 Q52 150 48 96 Z" fill={C.bowl} />
    <Smile cx={120} cy={138} />
  </Float>
);

const Pizza = () => (
  <Float eyes={[120, 96]}>
    <Path d="M120 150 L56 58 Q120 30 184 58 Z" fill={C.flame} />
    <Path d="M56 58 Q120 30 184 58 Q186 66 178 68 Q120 44 62 68 Q54 66 56 58 Z" fill={C.crust} />
    <Circle cx={100} cy={78} r={8} fill={C.tomato} strokeWidth={3} />
    <Circle cx={142} cy={82} r={7} fill={C.tomato} strokeWidth={3} />
    <Circle cx={120} cy={122} r={6} fill={C.tomato} strokeWidth={3} />
    <Smile cx={120} cy={108} open size={0.9} />
  </Float>
);

const Cookie = () => (
  <>
    <Float eyes={[120, 100]}>
      <Circle cx={120} cy={106} r={52} fill={C.dough} />
      <Path d="M86 82 Q92 70 104 66" fill="none" stroke={C.white} strokeOpacity={0.5} strokeWidth={5} />
      {[[92, 96], [150, 92], [104, 132], [142, 128], [124, 80]].map(([x, y]) => <Ellipse key={`${x}${y}`} cx={x} cy={y} rx={6} ry={5} fill={C.crustShade} strokeWidth={2.5} />)}
      <Smile cx={120} cy={114} open />
    </Float>
    <Twinkles points={[[54, 60, 8], [188, 70, 9]]} />
  </>
);

const Pancakes = () => (
  <Float eyes={[120, 92]}>
    <Ellipse cx={120} cy={136} rx={74} ry={13} fill={C.white} />
    {[124, 112, 100].map(y => (
      <G key={y}>
        <Ellipse cx={120} cy={y + 3} rx={60} ry={13} fill={C.crustShade} />
        <Ellipse cx={120} cy={y} rx={60} ry={12} fill={C.crust} />
      </G>
    ))}
    <Path d="M70 98 Q60 112 74 116 M168 98 Q178 112 164 118" fill="none" stroke={C.crustShade} strokeWidth={4} />
    <Path d="M80 96 Q120 80 160 96 Q150 114 120 112 Q90 114 80 96 Z" fill={C.crustShade} strokeWidth={3} />
    <Rect x={108} y={72} width={24} height={14} rx={4} fill={C.flame} />
    <Smile cx={120} cy={104} size={0.9} />
  </Float>
);

const Cloche = () => (
  <>
    <Float eyes={[120, 104]}>
      <Ellipse cx={120} cy={138} rx={82} ry={13} fill={C.white} />
      <Path d="M54 134 Q56 66 120 64 Q184 66 186 134 Z" fill={C.steel} />
      <Path d="M70 118 Q72 88 98 76" fill="none" stroke={C.white} strokeOpacity={0.7} strokeWidth={6} />
      <Circle cx={120} cy={58} r={8} fill={C.steelShade} />
      <Smile cx={120} cy={118} />
    </Float>
    <Twinkles points={[[50, 62, 9], [192, 60, 10], [180, 108, 6]]} />
  </>
);

type DishKey = 'pancakes' | 'pizza' | 'cookie' | 'cake' | 'bread' | 'pasta' | 'soup' | 'salad' | 'cloche';

const DISHES: [RegExp, DishKey][] = [
  [/\b(pancake|waffle|crepe|crêpe)/, 'pancakes'],
  [/\b(pizza|flatbread)/, 'pizza'],
  [/\b(cookie|biscuit|brownie)/, 'cookie'],
  [/\b(cake|cupcake|muffin|cheesecake|torte|birthday)/, 'cake'],
  [/\b(bread|loaf|baguette|brioche|focaccia|sourdough|bun|roll|bagel)/, 'bread'],
  [/\b(pasta|spaghetti|noodle|lasagn|ramen|macaroni|penne|linguine|risotto)/, 'pasta'],
  [/\b(soup|stew|curry|chili|chowder|broth|dal|pho)/, 'soup'],
  [/\b(salad|slaw|bowl)/, 'salad'],
];

function draw(key: DishKey) {
  switch (key) {
    case 'pancakes': return <Pancakes />;
    case 'pizza': return <Pizza />;
    case 'cookie': return <Cookie />;
    case 'cake': return <Cake />;
    case 'bread': return <Bread />;
    case 'pasta': return <Pasta />;
    case 'soup': return <Soup />;
    case 'salad': return <Salad />;
    default: return <Cloche />;
  }
}

// still: no animation (small thumbnails in lists).
export function DishArt({ title, width, still }: { title: string; width: number; still?: boolean }) {
  const t = title.toLowerCase();
  const key = DISHES.find(([re]) => re.test(t))?.[1] ?? 'cloche';
  return (
    <Scene width={width} active={!still}>
      {draw(key)}
    </Scene>
  );
}
