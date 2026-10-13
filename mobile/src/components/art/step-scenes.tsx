// A little animated scene at the top of each cooking step, picked from what the step says:
// stirring, kneading, rising, baking, boiling, chopping, frying, whisking, pouring, seasoning,
// cooling or serving (and a bouncing chef's hat for anything else).
import type { ReactNode } from 'react';
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { Step } from '../../lib/store';
import { C, ClosedEyes, Eyes, Layer, Scene, Shadow, Smile, lerp, sparkle, squiggle, turn, useLoop } from './kit';

// ---------- shared parts ----------

// Floats up and fades out, again and again (steam, sleepy Zs, flour puffs).
function Rising({ delay = 0, ms = 2200, dy = -24, children }: { delay?: number; ms?: number; dy?: number; children: ReactNode }) {
  const v = useLoop(ms, { pingpong: false, delay, ease: 'linear' });
  return (
    <Layer style={{ opacity: v.interpolate({ inputRange: [0, 0.25, 0.7, 1], outputRange: [0, 1, 1, 0] }), transform: [{ translateY: lerp(v, 0, dy) }] }}>
      {children}
    </Layer>
  );
}

function BowlBack({ fill = C.dough }: { fill?: string }) {
  return (
    <>
      <Ellipse cx={120} cy={92} rx={74} ry={14} fill={C.bowlShade} />
      <Ellipse cx={120} cy={93} rx={63} ry={9} fill={fill} strokeWidth={2.5} />
    </>
  );
}

function BowlFront() {
  return (
    <>
      <Path d="M46 92 A74 14 0 0 0 194 92 Q192 152 120 154 Q48 152 46 92 Z" fill={C.bowl} />
      <Path d="M62 110 Q66 134 86 144" fill="none" stroke={C.white} strokeOpacity={0.45} strokeWidth={5} />
    </>
  );
}

function Flames({ y = 156, xs = [98, 120, 142] }: { y?: number; xs?: number[] }) {
  const v = useLoop(240);
  return (
    <Layer origin={[120, y]} style={{ transform: [{ scaleY: lerp(v, 0.85, 1.1) }] }}>
      {xs.map(x => (
        <G key={x}>
          <Path d={`M${x} ${y} c-11 0 -13 -13 -4 -24 c2 7 6 7 6 0 c9 9 9 24 -2 24 Z`} fill={C.flame} />
          <Path d={`M${x} ${y - 2} c-5 0 -6 -6 -2 -11 c1 3 3 3 3 0 c4 4 4 11 -1 11 Z`} fill={C.flameIn} stroke="none" />
        </G>
      ))}
    </Layer>
  );
}

function Sparkles({ points }: { points: [number, number, number][] }) {
  return (
    <>
      {points.map(([x, y, r], i) => <Twinkle key={i} x={x} y={y} r={r} delay={i * 350} />)}
    </>
  );
}

function Twinkle({ x, y, r, delay }: { x: number; y: number; r: number; delay: number }) {
  const v = useLoop(700, { delay });
  return (
    <Layer origin={[x, y]} style={{ opacity: lerp(v, 0.3, 1), transform: [{ scale: lerp(v, 0.5, 1.1) }] }}>
      <Path d={sparkle(x, y, r)} fill={C.flame} strokeWidth={2.5} />
    </Layer>
  );
}

// ---------- scenes ----------

function Mix() {
  const v = useLoop(650);
  return (
    <>
      <Layer><Shadow /><BowlBack /></Layer>
      <Layer origin={[120, 96]} style={{ transform: [{ rotate: turn(v, -26, 26) }] }}>
        <Path d="M120 96 L150 20" stroke={C.ink} strokeWidth={13} />
        <Path d="M120 96 L150 20" stroke={C.wood} strokeWidth={7} />
        <Ellipse cx={120} cy={95} rx={14} ry={5} fill={C.dough} stroke="none" />
      </Layer>
      <Rising delay={300}><Circle cx={84} cy={80} r={4} fill={C.cream} strokeWidth={2.5} /></Rising>
      <Rising delay={1300}><Circle cx={158} cy={76} r={3} fill={C.cream} strokeWidth={2.5} /></Rising>
      <Layer><BowlFront /><Smile cx={120} cy={132} /></Layer>
      <Eyes cx={120} cy={120} />
    </>
  );
}

function Knead() {
  const v = useLoop(520);
  return (
    <>
      <Layer><Shadow cy={150} rx={80} /><Rect x={36} y={130} width={168} height={18} rx={9} fill={C.wood} /></Layer>
      <Layer origin={[120, 131]} style={{ transform: [{ scaleY: lerp(v, 1, 0.82) }, { scaleX: lerp(v, 1, 1.12) }] }}>
        <Path d="M68 131 Q66 90 120 86 Q174 90 172 131 Z" fill={C.dough} />
        <Path d="M84 126 Q86 108 100 100" fill="none" stroke={C.doughShade} strokeWidth={4} />
        <ClosedEyes cx={120} cy={110} />
        <Smile cx={120} cy={118} open />
      </Layer>
      <Layer style={{ transform: [{ translateY: lerp(v, 0, 15) }] }}>
        <Rect x={76} y={52} width={38} height={24} rx={12} fill={C.skin} />
        <Rect x={126} y={52} width={38} height={24} rx={12} fill={C.skin} />
        <Path d="M88 66v6 M96 66v6 M104 66v6 M138 66v6 M146 66v6 M154 66v6" fill="none" strokeWidth={2.4} />
      </Layer>
    </>
  );
}

function Rise() {
  const v = useLoop(1800);
  return (
    <>
      <Layer><Shadow /><BowlBack /></Layer>
      <Layer origin={[120, 93]} style={{ transform: [{ scale: lerp(v, 0.9, 1.06) }] }}>
        <Path d="M56 93 Q58 46 120 42 Q182 46 184 93 Z" fill={C.dough} />
        <Path d="M72 86 Q74 64 92 56" fill="none" stroke={C.white} strokeOpacity={0.55} strokeWidth={5} />
        <ClosedEyes cx={120} cy={70} sleepy />
        <Smile cx={120} cy={78} />
      </Layer>
      <Layer><BowlFront /></Layer>
      {[0, 900, 1800].map((d, i) => (
        <Rising key={d} delay={d} ms={2700} dy={-18}>
          <Path d={`M${172 + i * 13} ${50 - i * 12} h${9 - i} l${-(9 - i)} ${10 - i} h${9 - i}`} fill="none" strokeWidth={3} />
        </Rising>
      ))}
    </>
  );
}

function Bake() {
  const glow = useLoop(900);
  return (
    <>
      <Layer>
        <Shadow cy={158} rx={76} />
        <Rect x={60} y={148} width={14} height={10} rx={3} fill={C.steelShade} />
        <Rect x={166} y={148} width={14} height={10} rx={3} fill={C.steelShade} />
        <Rect x={52} y={44} width={136} height={108} rx={16} fill={C.steel} />
        <Path d="M52 70 H188" fill="none" />
        <Circle cx={152} cy={57} r={5.5} fill={C.white} />
        <Circle cx={171} cy={57} r={5.5} fill={C.white} />
        <Rect x={68} y={82} width={104} height={56} rx={10} fill={C.glass} />
      </Layer>
      <Layer style={{ opacity: lerp(glow, 0.35, 0.85) }}>
        <Rect x={72} y={86} width={96} height={48} rx={8} fill={C.flameIn} stroke="none" />
      </Layer>
      <Layer>
        <Path d="M88 130 Q88 104 120 102 Q152 104 152 130 Z" fill={C.crust} />
        <Path d="M106 108 l6 8 M120 106 l6 8 M134 108 l6 8" fill="none" stroke={C.crustShade} strokeWidth={3} />
        <Smile cx={86} cy={60} size={0.7} />
      </Layer>
      <Eyes cx={86} cy={54} gap={9} size={0.8} />
      {[78, 120, 162].map((x, i) => (
        <Rising key={x} delay={i * 600} ms={1800} dy={-14}>
          <Path d={squiggle(x, 38, 22)} fill="none" stroke={C.flameIn} strokeWidth={3} />
        </Rising>
      ))}
    </>
  );
}

function Boil() {
  const bubble = useLoop(380);
  return (
    <>
      <Layer><Shadow cy={160} rx={70} /></Layer>
      <Flames y={160} />
      <Layer>
        <Rect x={34} y={84} width={20} height={12} rx={6} fill={C.potShade} />
        <Rect x={186} y={84} width={20} height={12} rx={6} fill={C.potShade} />
        <Path d="M58 72 H182 V126 Q182 144 164 144 H76 Q58 144 58 126 Z" fill={C.pot} />
        <Path d="M70 84 V122" fill="none" stroke={C.white} strokeOpacity={0.4} strokeWidth={5} />
        <Smile cx={120} cy={116} open />
      </Layer>
      <Eyes cx={120} cy={102} />
      <Layer style={{ transform: [{ translateY: lerp(bubble, 0, -5) }] }}>
        <Circle cx={92} cy={62} r={7} fill={C.water} strokeWidth={2.5} />
        <Circle cx={146} cy={60} r={6} fill={C.water} strokeWidth={2.5} />
      </Layer>
      <Layer style={{ transform: [{ translateY: lerp(bubble, -4, 2) }] }}>
        <Circle cx={118} cy={56} r={9} fill={C.water} strokeWidth={2.5} />
        <Circle cx={134} cy={48} r={4} fill={C.water} strokeWidth={2.2} />
      </Layer>
      <Layer><Rect x={50} y={64} width={140} height={14} rx={7} fill={C.potShade} /></Layer>
      {[100, 140].map((x, i) => (
        <Rising key={x} delay={i * 900} ms={2000} dy={-16}>
          <Path d={squiggle(x, 40, 26)} fill="none" stroke={C.steelShade} strokeWidth={3} />
        </Rising>
      ))}
    </>
  );
}

function Chop() {
  const knife = useLoop(260);
  const hop = useLoop(260, { delay: 120 });
  return (
    <>
      <Layer>
        <Shadow cy={150} rx={86} />
        <Rect x={32} y={112} width={176} height={30} rx={10} fill={C.wood} />
        <Circle cx={192} cy={127} r={4} fill={C.woodShade} strokeWidth={2.5} />
        <Path d="M124 100 L196 106 Q200 110 196 114 L124 120 Z" fill={C.carrot} />
        <Path d="M196 106 l12 -8 M198 110 l14 -2 M196 114 l12 6" fill="none" stroke={C.leaf} strokeWidth={4} />
        <Path d="M140 104 l0 12 M158 105 l0 10 M176 107 l0 6" fill="none" stroke={C.crustShade} strokeWidth={2.4} />
      </Layer>
      <Layer style={{ transform: [{ translateY: lerp(hop, 0, -6) }] }}>
        {[64, 82, 100].map(x => <Ellipse key={x} cx={x} cy={108} rx={7} ry={9} fill={C.carrot} strokeWidth={3} />)}
      </Layer>
      <Layer origin={[188, 82]} style={{ transform: [{ rotate: turn(knife, -14, 0) }] }}>
        <Path d="M96 104 L150 104 L150 76 Q114 74 96 104 Z" fill={C.steel} />
        <Rect x={150} y={78} width={44} height={16} rx={6} fill={C.woodShade} />
        <Circle cx={164} cy={86} r={2} fill={C.white} stroke="none" />
        <Circle cx={180} cy={86} r={2} fill={C.white} stroke="none" />
      </Layer>
    </>
  );
}

function Fry() {
  const tilt = useLoop(700);
  const a = useLoop(520, { ease: 'out' });
  const b = useLoop(520, { ease: 'out', delay: 260 });
  return (
    <>
      <Layer><Shadow cy={160} rx={66} /></Layer>
      <Flames y={160} xs={[100, 120, 140]} />
      <Layer style={{ transform: [{ translateY: lerp(a, 0, -30) }] }}>
        <Path d="M84 108 Q80 94 96 92 Q110 88 114 100 Q118 110 104 112 Q88 116 84 108 Z" fill={C.white} />
        <Circle cx={99} cy={102} r={6} fill={C.flame} strokeWidth={2.5} />
      </Layer>
      <Layer style={{ transform: [{ translateY: lerp(b, 0, -24) }] }}>
        <Rect x={128} y={96} width={14} height={14} rx={4} fill={C.green} strokeWidth={3} />
        <Rect x={148} y={100} width={12} height={12} rx={4} fill={C.tomato} strokeWidth={3} />
      </Layer>
      <Layer origin={[120, 120]} style={{ transform: [{ rotate: turn(tilt, -4, 4) }] }}>
        <Path d="M58 112 H172 Q168 138 142 140 H88 Q62 138 58 112 Z" fill={C.pan} />
        <Path d="M58 112 H172" fill="none" stroke={C.panShade} strokeWidth={6} />
        <Rect x={170} y={107} width={56} height={11} rx={5.5} fill={C.panShade} />
        <Rect x={206} y={107} width={20} height={11} rx={5.5} fill={C.wood} />
      </Layer>
    </>
  );
}

function Whisk() {
  const v = useLoop(190);
  return (
    <>
      <Layer><Shadow /><BowlBack fill={C.cream} /></Layer>
      <Layer origin={[120, 96]} style={{ transform: [{ rotate: turn(v, -16, 16) }] }}>
        <Path d="M120 94 L150 24" stroke={C.ink} strokeWidth={12} />
        <Path d="M120 94 L150 24" stroke={C.steelShade} strokeWidth={6} />
        <Path d="M112 96 Q100 66 122 56 Q140 68 128 96" fill="none" stroke={C.ink} strokeWidth={7} />
        <Path d="M112 96 Q100 66 122 56 Q140 68 128 96" fill="none" stroke={C.steel} strokeWidth={3} />
        <Ellipse cx={120} cy={94} rx={16} ry={5} fill={C.cream} stroke="none" />
      </Layer>
      <Layer>
        <Circle cx={92} cy={88} r={5} fill={C.white} strokeWidth={2.5} />
        <Circle cx={150} cy={88} r={4} fill={C.white} strokeWidth={2.5} />
        <BowlFront />
        <Smile cx={120} cy={132} open />
      </Layer>
      <Eyes cx={120} cy={120} />
    </>
  );
}

function Pour() {
  const tip = useLoop(900);
  const flow = useLoop(160);
  return (
    <>
      <Layer><Shadow /><BowlBack fill={C.water} /></Layer>
      <Layer origin={[136, 36]} style={{ transform: [{ scaleY: lerp(flow, 0.96, 1.04) }] }}>
        <Path d="M136 38 Q128 60 124 92" fill="none" stroke={C.ink} strokeWidth={11} />
        <Path d="M136 38 Q128 60 124 92" fill="none" stroke={C.water} strokeWidth={5} />
      </Layer>
      <Layer origin={[176, 74]} style={{ transform: [{ rotate: turn(tip, -4, 4) }] }}>
        <Path d="M196 32 Q214 36 210 50 Q206 60 196 58" fill="none" strokeWidth={4.5} />
        <Path d="M150 18 H196 V64 Q196 74 186 74 H160 Q150 74 150 64 Z" fill={C.white} />
        <Path d="M151 44 H195 V64 Q195 73 186 73 H160 Q151 73 151 64 Z" fill={C.water} stroke="none" />
        <Path d="M150 22 L136 32 L150 34" fill={C.white} />
        <Path d="M160 28 h10 M160 38 h6" fill="none" strokeWidth={2.4} />
      </Layer>
      <Layer>
        <BowlFront />
        <Smile cx={120} cy={132} open />
      </Layer>
      <Eyes cx={120} cy={120} />
    </>
  );
}

function Season() {
  const shake = useLoop(170);
  return (
    <>
      <Layer><Shadow /><BowlBack fill={C.sauce} /></Layer>
      {[0, 400, 800].map((d, i) => (
        <Rising key={d} delay={d} ms={1000} dy={34}>
          <Circle cx={140 + i * 8} cy={60} r={2.2} fill={C.ink} stroke="none" />
          <Circle cx={148 - i * 6} cy={66} r={2} fill={C.ink} stroke="none" />
        </Rising>
      ))}
      <Layer origin={[156, 40]} style={{ transform: [{ rotate: turn(shake, 150, 162) }, { translateX: lerp(shake, -3, 3) }] }}>
        <Rect x={141} y={10} width={30} height={42} rx={9} fill={C.white} />
        <Rect x={139} y={4} width={34} height={12} rx={5} fill={C.steel} />
        <Path d="M146 30 h20" fill="none" stroke={C.bowl} strokeWidth={6} />
      </Layer>
      <Layer>
        <BowlFront />
        <Smile cx={120} cy={132} open />
      </Layer>
      <Eyes cx={120} cy={120} />
    </>
  );
}

function Cool() {
  return (
    <>
      <Layer>
        <Shadow cy={152} rx={80} />
        <Path d="M54 132 V148 M186 132 V148" fill="none" strokeWidth={4} />
        <Path d="M44 130 H196" fill="none" strokeWidth={5} />
        <Path d="M68 128 Q68 86 120 84 Q172 86 172 128 Z" fill={C.crust} />
        <Path d="M96 92 l8 10 M118 88 l8 10 M140 92 l8 10" fill="none" stroke={C.crustShade} strokeWidth={3} />
        <Smile cx={120} cy={116} />
      </Layer>
      <Eyes cx={120} cy={104} every={4200} />
      {[0, 700, 1400].map((d, i) => (
        <Breeze key={d} delay={d} y={60 + i * 20} />
      ))}
    </>
  );
}

function Breeze({ delay, y }: { delay: number; y: number }) {
  const v = useLoop(2100, { pingpong: false, delay, ease: 'linear' });
  return (
    <Layer style={{ opacity: v.interpolate({ inputRange: [0, 0.2, 0.7, 1], outputRange: [0, 1, 1, 0] }), transform: [{ translateX: lerp(v, -10, 26) }] }}>
      <Path d={`M10 ${y} h26 q8 0 8 -7 q0 -6 -6 -6`} fill="none" stroke={C.bowl} strokeWidth={3} />
    </Layer>
  );
}

function Serve() {
  return (
    <>
      <Layer>
        <Shadow cy={146} rx={84} />
        <Ellipse cx={120} cy={130} rx={86} ry={17} fill={C.white} />
        <Ellipse cx={120} cy={128} rx={60} ry={10} fill="none" stroke={C.steel} strokeWidth={2.5} />
        <Path d="M78 128 Q82 90 120 88 Q158 90 162 128 Z" fill={C.crust} />
        <Path d="M112 88 q-6 -12 6 -16 q4 10 -6 16 Z M122 88 q8 -12 16 -6 q-6 10 -16 6 Z" fill={C.green} strokeWidth={2.5} />
        <ClosedEyes cx={120} cy={106} />
        <Smile cx={120} cy={114} open />
      </Layer>
      <Sparkles points={[[60, 66, 9], [186, 58, 11], [176, 100, 7]]} />
      {[104, 136].map((x, i) => (
        <Rising key={x} delay={i * 1000} ms={2200} dy={-14}>
          <Path d={squiggle(x, 72, 22)} fill="none" stroke={C.steelShade} strokeWidth={3} />
        </Rising>
      ))}
    </>
  );
}

function Chef() {
  const v = useLoop(600, { ease: 'out' });
  return (
    <>
      <Layer origin={[120, 150]} style={{ transform: [{ scaleX: lerp(v, 1, 0.85) }] }}><Shadow cy={150} rx={56} /></Layer>
      <Layer style={{ transform: [{ translateY: lerp(v, 0, -12) }] }}>
        <Path d="M78 96 Q62 62 92 58 Q100 30 126 38 Q150 26 162 54 Q190 58 170 96 Z" fill={C.white} />
        <Path d="M100 70 Q104 60 114 58" fill="none" stroke={C.steel} strokeWidth={4} />
        <Rect x={80} y={92} width={88} height={40} rx={10} fill={C.white} />
        <Smile cx={124} cy={118} />
      </Layer>
      <Layer style={{ transform: [{ translateY: lerp(v, 0, -12) }] }}><EyesStill cx={124} cy={106} /></Layer>
      <Sparkles points={[[56, 60, 9], [190, 70, 8]]} />
    </>
  );
}

// Eyes without their own blink layer (used inside a layer that moves).
function EyesStill({ cx, cy }: { cx: number; cy: number }) {
  return (
    <>
      {[-12, 12].map(dx => (
        <G key={dx}>
          <Ellipse cx={cx + dx} cy={cy} rx={3.8} ry={4.8} fill={C.ink} stroke="none" />
          <Ellipse cx={cx + dx + 1.3} cy={cy - 1.7} rx={1.4} ry={1.4} fill={C.white} stroke="none" />
        </G>
      ))}
    </>
  );
}

// ---------- choosing a scene ----------

type SceneKey = 'knead' | 'rise' | 'bake' | 'boil' | 'chop' | 'fry' | 'whisk' | 'season' | 'pour' | 'mix' | 'cool' | 'serve' | 'chef';

const RULES: [RegExp, SceneKey][] = [
  [/\b(knead|fold the edges|shape|form into|roll out|stretch)/, 'knead'],
  [/\b(rise|rising|rest|proof|prove|double|ferment|let (it )?sit|leave (it )?(for|to)|overnight|marinate|soak|foamy)/, 'rise'],
  [/\b(preheat|oven|bake|baking|roast|broil)/, 'bake'],
  [/\b(boil|simmer|poach|blanch|saucepan|pot\b|stock|broth)/, 'boil'],
  [/\b(chop|dice|slice|mince|cut|julienne|grate|peel)/, 'chop'],
  [/\b(fry|frying|saut|sear|brown|skillet|toast|griddle|pan\b)/, 'fry'],
  [/\b(whisk|beat|whip|cream together|froth)/, 'whisk'],
  [/\b(season|salt\b|pepper|sprinkle|spice|taste and)/, 'season'],
  [/\b(pour|drizzle|add the|add in|transfer|fill)/, 'pour'],
  [/\b(mix|stir|fold in|toss|blend|combine)/, 'mix'],
  [/\b(cool|chill|refrigerat|freez|set aside)/, 'cool'],
  [/\b(serve|plate|garnish|enjoy|dish up)/, 'serve'],
];

// The scene whose words come first: the step's title wins, then its text.
function pick(step: Pick<Step, 'title' | 'text'>) {
  for (const source of [step.title, step.text]) {
    const s = (source || '').toLowerCase();
    let best: { at: number; scene: SceneKey } | null = null;
    for (const [re, scene] of RULES) {
      const m = s.match(re);
      if (m && m.index != null && (!best || m.index < best.at)) best = { at: m.index, scene };
    }
    if (best) return best.scene;
  }
  return 'chef' as SceneKey;
}

function draw(key: SceneKey) {
  switch (key) {
    case 'knead': return <Knead />;
    case 'rise': return <Rise />;
    case 'bake': return <Bake />;
    case 'boil': return <Boil />;
    case 'chop': return <Chop />;
    case 'fry': return <Fry />;
    case 'whisk': return <Whisk />;
    case 'season': return <Season />;
    case 'pour': return <Pour />;
    case 'mix': return <Mix />;
    case 'cool': return <Cool />;
    case 'serve': return <Serve />;
    default: return <Chef />;
  }
}

export function StepScene({ step, width, active = true }: { step: Pick<Step, 'title' | 'text'>; width: number; active?: boolean }) {
  return (
    <Scene width={width} active={active}>
      {draw(pick(step))}
    </Scene>
  );
}
