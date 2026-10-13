// A little animated scene at the top of each cooking step: one of Mise's cooks acting out what the
// step says (stirring, kneading, waiting for dough to rise, baking, boiling, chopping, frying,
// whisking, pouring, seasoning, cooling, serving), or waving hello for anything else.
// The cook changes from step to step, so a recipe feels like a little team effort.
import type { ReactNode } from 'react';
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { Step } from '../../lib/store';
import { Arm, BowlBack, BowlFront, CAST, Character, Counter, HipArm, type Cook } from './characters';
import { C, ClosedEyes, Layer, Scene, lerp, sparkle, squiggle, turn, useLoop } from './kit';

// ---------- shared bits ----------

// Floats up (or falls, with a positive dy) and fades, again and again: steam, Zs, flour, salt.
function Rising({ delay = 0, ms = 2200, dy = -24, children }: { delay?: number; ms?: number; dy?: number; children: ReactNode }) {
  const v = useLoop(ms, { pingpong: false, delay, ease: 'linear' });
  return (
    <Layer style={{ opacity: v.interpolate({ inputRange: [0, 0.25, 0.7, 1], outputRange: [0, 1, 1, 0] }), transform: [{ translateY: lerp(v, 0, dy) }] }}>
      {children}
    </Layer>
  );
}

function Twinkle({ x, y, r, delay = 0 }: { x: number; y: number; r: number; delay?: number }) {
  const v = useLoop(700, { delay });
  return (
    <Layer origin={[x, y]} style={{ opacity: lerp(v, 0.3, 1), transform: [{ scale: lerp(v, 0.5, 1.1) }] }}>
      <Path d={sparkle(x, y, r)} fill={C.flame} />
    </Layer>
  );
}

function SmallFlames({ x, y }: { x: number; y: number }) {
  const v = useLoop(240);
  return (
    <Layer origin={[x, y]} style={{ transform: [{ scaleY: lerp(v, 0.8, 1.15) }] }}>
      {[-10, 0, 10].map(dx => (
        <G key={dx}>
          <Path d={`M${x + dx} ${y} c-6 0 -7 -7 -2 -13 c1 4 3 4 3 0 c5 5 5 13 -1 13 Z`} fill={C.flame} />
          <Path d={`M${x + dx} ${y - 1} c-3 0 -3 -3 -1 -6 c1 2 2 2 2 0 c2 2 2 6 -1 6 Z`} fill={C.flameIn} />
        </G>
      ))}
    </Layer>
  );
}

const steam = (x: number, y: number, i: number, color: string = C.steelShade) => (
  <Rising key={`${x}-${i}`} delay={i * 800} ms={2000} dy={-14}>
    <Path d={squiggle(x, y, 22)} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" />
  </Rising>
);

// ---------- scenes ----------

type SceneProps = { who: Cook };

function Mix({ who }: SceneProps) {
  const v = useLoop(600);
  const cx = 104;
  return (
    <>
      <Counter />
      <Layer><BowlBack x={176} /></Layer>
      <Character who={who} cx={cx}
        back={<Layer><HipArm who={who} cx={cx} side="left" /></Layer>}
        front={
          <Layer origin={[cx + 16, 98]} style={{ transform: [{ rotate: turn(v, -7, 7) }] }}>
            <Path d="M150 90 L178 106" fill="none" stroke={C.woodShade} strokeWidth={5} strokeLinecap="round" />
            <Arm who={who} s={[cx + 16, 98]} c={[136, 86]} h={[150, 90]} />
          </Layer>
        }
      />
      <Layer><BowlFront x={176} /></Layer>
      <Rising delay={200}><Circle cx={162} cy={80} r={3.5} fill={C.cream} /></Rising>
      <Rising delay={1200}><Circle cx={194} cy={76} r={2.5} fill={C.cream} /></Rising>
    </>
  );
}

function Knead({ who }: SceneProps) {
  const v = useLoop(520);
  const cx = 108;
  const press = { transform: [{ translateY: lerp(v, 0, 6) }] };
  return (
    <>
      <Counter />
      <Character who={who} cx={cx} eyes="happy" mouth="grin"
        back={<Layer style={press}><Arm who={who} s={[cx - 16, 98]} c={[128, 84]} h={[158, 96]} /></Layer>}
      />
      <Layer origin={[168, 118]} style={{ transform: [{ scaleY: lerp(v, 1, 0.84) }, { scaleX: lerp(v, 1, 1.1) }] }}>
        <Path d="M142 118 Q142 93 168 91 Q194 93 194 118 Z" fill={C.dough} />
        <Path d="M150 114 Q152 102 162 97" fill="none" stroke={C.white} strokeOpacity={0.5} strokeWidth={3.5} strokeLinecap="round" />
        <ClosedEyes cx={168} cy={104} gap={7} />
      </Layer>
      <Layer style={press}><Arm who={who} s={[cx + 16, 98]} c={[150, 104]} h={[176, 96]} /></Layer>
    </>
  );
}

function Rise({ who }: SceneProps) {
  const v = useLoop(1800);
  const sway = useLoop(1400);
  const cx = 80;
  return (
    <>
      <Counter />
      <Layer><BowlBack x={186} /></Layer>
      <Layer origin={[186, 92]} style={{ transform: [{ scale: lerp(v, 0.88, 1.06) }] }}>
        <Path d="M160 92 Q162 60 186 58 Q210 60 212 92 Z" fill={C.dough} />
        <Path d="M168 86 Q170 72 180 66" fill="none" stroke={C.white} strokeOpacity={0.55} strokeWidth={4} strokeLinecap="round" />
        <ClosedEyes cx={186} cy={74} gap={7} sleepy />
      </Layer>
      <Layer><BowlFront x={186} /></Layer>
      <Character who={who} cx={cx} eyes="sleepy" mouth="o" style={{ transform: [{ rotate: turn(sway, -3, 3) }] }}
        back={<Layer><HipArm who={who} cx={cx} side="left" /></Layer>}
        front={<Layer><HipArm who={who} cx={cx} side="right" /></Layer>}
      />
      {[0, 900, 1800].map((d, i) => (
        <Rising key={d} delay={d} ms={2700} dy={-16}>
          <Path d={`M${208 + i * 9} ${54 - i * 11} h${8 - i} l${-(8 - i)} ${9 - i} h${8 - i}`} fill="none" stroke={C.ink} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
        </Rising>
      ))}
    </>
  );
}

function Bake({ who }: SceneProps) {
  const glow = useLoop(900);
  const wave = useLoop(700);
  const cx = 100;
  return (
    <>
      <Layer>
        <Ellipse cx={186} cy={163} rx={52} ry={5} fill={C.ink} opacity={0.12} />
        <Rect x={144} y={154} width={12} height={9} rx={3} fill={C.steelShade} />
        <Rect x={216} y={154} width={12} height={9} rx={3} fill={C.steelShade} />
        <Rect x={136} y={56} width={100} height={102} rx={12} fill={C.steel} />
        <Rect x={136} y={56} width={100} height={24} rx={12} fill={C.steelShade} />
        <Rect x={136} y={70} width={100} height={10} fill={C.steelShade} />
        <Circle cx={208} cy={68} r={4.5} fill={C.white} />
        <Circle cx={223} cy={68} r={4.5} fill={C.white} />
        <Rect x={152} y={86} width={68} height={5} rx={2.5} fill={C.steelShade} />
        <Rect x={148} y={96} width={76} height={50} rx={8} fill={C.glass} />
      </Layer>
      <Layer style={{ opacity: lerp(glow, 0.35, 0.85) }}><Rect x={152} y={100} width={68} height={42} rx={6} fill={C.flameIn} /></Layer>
      <Layer>
        <Path d="M164 140 Q164 118 186 116 Q208 118 208 140 Z" fill={C.crust} />
        <Path d="M176 121 l5 7 M186 119 l5 7 M196 121 l5 7" fill="none" stroke={C.crustShade} strokeWidth={2.6} strokeLinecap="round" />
      </Layer>
      {[160, 186, 212].map((x, i) => steam(x, 50, i, C.flameIn))}
      <Character who={who} cx={cx}
        back={<Layer><HipArm who={who} cx={cx} side="left" /></Layer>}
        front={
          <Layer origin={[cx + 16, 98]} style={{ transform: [{ rotate: turn(wave, -6, 6) }] }}>
            <Arm who={who} s={[cx + 16, 98]} c={[126, 82]} h={[140, 88]} hand={C.tomato} />
          </Layer>
        }
      />
    </>
  );
}

function Boil({ who }: SceneProps) {
  const lid = useLoop(420);
  const bubble = useLoop(380);
  const cx = 100;
  return (
    <>
      <Counter />
      <Layer>
        <Rect x={136} y={94} width={14} height={7} rx={3.5} fill={C.potShade} />
        <Rect x={202} y={94} width={14} height={7} rx={3.5} fill={C.potShade} />
        <Path d="M148 88 H204 V108 Q204 118 194 118 H158 Q148 118 148 108 Z" fill={C.pot} />
        <Path d="M156 94 V110" fill="none" stroke={C.white} strokeOpacity={0.4} strokeWidth={4} strokeLinecap="round" />
        <Rect x={144} y={84} width={64} height={8} rx={4} fill={C.potShade} />
      </Layer>
      <Layer style={{ transform: [{ translateY: lerp(bubble, 0, -4) }] }}>
        <Circle cx={162} cy={80} r={5} fill={C.water} />
        <Circle cx={186} cy={78} r={6} fill={C.water} />
        <Circle cx={174} cy={74} r={3.5} fill={C.water} />
      </Layer>
      {[166, 188].map((x, i) => steam(x, 66, i))}
      <Character who={who} cx={cx} mouth="o"
        back={<Layer><HipArm who={who} cx={cx} side="left" /></Layer>}
        front={
          <Layer style={{ transform: [{ translateY: lerp(lid, 0, -6) }] }}>
            <Ellipse cx={178} cy={62} rx={30} ry={5} fill={C.potShade} />
            <Rect x={173} y={53} width={10} height={6} rx={3} fill={C.panShade} />
            <Arm who={who} s={[cx + 16, 98]} c={[134, 80]} h={[148, 64]} />
          </Layer>
        }
      />
    </>
  );
}

function Chop({ who }: SceneProps) {
  const knife = useLoop(240);
  const hop = useLoop(240, { delay: 120 });
  const cx = 104;
  return (
    <>
      <Counter />
      <Layer>
        <Rect x={142} y={109} width={92} height={7} rx={3.5} fill={C.woodShade} />
        <Path d="M184 102 Q180 106 184 109 L224 109 Q230 104 224 100 Z" fill={C.carrot} />
        <Path d="M225 102 l8 -7 M226 105 l10 -1" fill="none" stroke={C.leaf} strokeWidth={3.5} strokeLinecap="round" />
      </Layer>
      <Layer style={{ transform: [{ translateY: lerp(hop, 0, -5) }] }}>
        <Ellipse cx={160} cy={104} rx={5} ry={4} fill={C.carrot} />
        <Ellipse cx={170} cy={105} rx={5} ry={4} fill={C.carrot} />
      </Layer>
      <Character who={who} cx={cx} look={[2, 1.5]}
        back={<Layer><HipArm who={who} cx={cx} side="left" /></Layer>}
        front={
          <Layer origin={[cx + 16, 98]} style={{ transform: [{ rotate: turn(knife, -5, 4) }] }}>
            <Path d="M156 86 H186 Q184 100 160 100 Z" fill={C.steel} />
            <Rect x={142} y={86} width={18} height={7} rx={3.5} fill={C.woodShade} />
            <Arm who={who} s={[cx + 16, 98]} c={[132, 90]} h={[146, 90]} />
          </Layer>
        }
      />
    </>
  );
}

function Fry({ who }: SceneProps) {
  const tilt = useLoop(700);
  const a = useLoop(520, { ease: 'out' });
  const b = useLoop(520, { ease: 'out', delay: 260 });
  const cx = 100;
  return (
    <>
      <Counter />
      <Layer><Ellipse cx={184} cy={117} rx={26} ry={4} fill={C.panShade} /></Layer>
      <SmallFlames x={184} y={116} />
      <Layer style={{ transform: [{ translateY: lerp(a, 0, -26) }] }}>
        <Path d="M168 94 Q166 86 176 85 Q184 83 186 90 Q188 96 180 97 Q170 99 168 94 Z" fill={C.white} />
        <Circle cx={177} cy={91} r={3.6} fill={C.flame} />
      </Layer>
      <Layer style={{ transform: [{ translateY: lerp(b, 0, -20) }] }}>
        <Rect x={190} y={88} width={8} height={8} rx={2.5} fill={C.green} />
        <Rect x={199} y={91} width={7} height={7} rx={2.5} fill={C.tomato} />
      </Layer>
      <Character who={who} cx={cx}
        back={<Layer><HipArm who={who} cx={cx} side="left" /></Layer>}
        front={
          <Layer origin={[cx + 16, 98]} style={{ transform: [{ rotate: turn(tilt, -4, 4) }] }}>
            <Rect x={136} y={98} width={28} height={6} rx={3} fill={C.panShade} />
            <Path d="M160 96 H208 Q206 108 194 110 H174 Q162 108 160 96 Z" fill={C.pan} />
            <Rect x={158} y={94} width={52} height={5} rx={2.5} fill={C.panShade} />
            <Arm who={who} s={[cx + 16, 98]} c={[128, 104]} h={[138, 101]} />
          </Layer>
        }
      />
    </>
  );
}

function Whisk({ who }: SceneProps) {
  const v = useLoop(180);
  const cx = 96;
  return (
    <>
      <Twinkle x={190} y={60} r={8} />
      <Character who={who} cx={cx} mouth="o" look={[1.5, 2]}
        front={
          <>
            <Layer><BowlBack x={124} y={112} r={22} fill={C.cream} /></Layer>
            <Layer origin={[cx + 16, 98]} style={{ transform: [{ rotate: turn(v, -10, 10) }] }}>
              <Path d="M138 98 L126 110" fill="none" stroke={C.steelShade} strokeWidth={3} strokeLinecap="round" />
              <Path d="M120 114 Q116 102 126 98 Q134 104 130 114" fill="none" stroke={C.steel} strokeWidth={3} strokeLinecap="round" />
              <Arm who={who} s={[cx + 16, 98]} c={[140, 86]} h={[138, 98]} />
            </Layer>
            <Layer>
              <BowlFront x={124} y={112} r={22} />
              <Circle cx={112} cy={108} r={3} fill={C.white} />
              <Circle cx={136} cy={108} r={2.5} fill={C.white} />
              <Arm who={who} s={[cx - 16, 98]} c={[86, 128]} h={[108, 130]} />
            </Layer>
          </>
        }
      />
    </>
  );
}

function Pour({ who }: SceneProps) {
  const tip = useLoop(900);
  const flow = useLoop(160);
  const cx = 100;
  return (
    <>
      <Counter />
      <Layer><BowlBack x={194} fill={C.water} /></Layer>
      <Layer origin={[180, 72]} style={{ transform: [{ scaleY: lerp(flow, 0.95, 1.05) }] }}>
        <Path d="M180 72 Q190 80 192 92" fill="none" stroke={C.water} strokeWidth={4.5} strokeLinecap="round" />
      </Layer>
      <Layer><BowlFront x={194} /></Layer>
      <Character who={who} cx={cx}
        back={<Layer><HipArm who={who} cx={cx} side="left" /></Layer>}
        front={
          <Layer origin={[cx + 16, 98]} style={{ transform: [{ rotate: turn(tip, -3, 3) }] }}>
            <G transform="translate(-4 2) rotate(35 160 70)">
              <Path d="M150 62 Q138 66 150 80" fill="none" stroke="#EAF6FF" strokeWidth={4} strokeLinecap="round" />
              <Rect x={150} y={56} width={24} height={30} rx={6} fill="#EAF6FF" />
              <Rect x={151} y={70} width={22} height={15} rx={5} fill={C.water} />
              <Path d="M172 57 L182 54 L175 64 Z" fill="#EAF6FF" />
            </G>
            <Arm who={who} s={[cx + 16, 98]} c={[132, 82]} h={[144, 74]} />
          </Layer>
        }
      />
    </>
  );
}

function Season({ who }: SceneProps) {
  const shake = useLoop(170);
  const cx = 104;
  return (
    <>
      <Counter />
      <Layer><BowlBack x={180} fill={C.sauce} /></Layer>
      {[0, 350, 700].map((d, i) => (
        <Rising key={d} delay={d} ms={900} dy={18}>
          <Circle cx={168 + i * 4} cy={74} r={1.8} fill={C.ink} />
          <Circle cx={174 - i * 3} cy={78} r={1.6} fill={C.ink} />
        </Rising>
      ))}
      <Layer><BowlFront x={180} /></Layer>
      <Character who={who} cx={cx} look={[2, -1]}
        back={<Layer><HipArm who={who} cx={cx} side="left" /></Layer>}
        front={
          <>
            <Layer origin={[164, 62]} style={{ transform: [{ rotate: turn(shake, -9, 9) }, { translateX: lerp(shake, -2, 2) }] }}>
              <Rect x={158} y={42} width={16} height={24} rx={5} fill={C.white} />
              <Rect x={156} y={64} width={20} height={7} rx={3} fill={C.steel} />
              <Rect x={160} y={50} width={12} height={5} fill={C.bowl} />
            </Layer>
            <Layer><Arm who={who} s={[cx + 16, 98]} c={[136, 80]} h={[154, 60]} /></Layer>
          </>
        }
      />
    </>
  );
}

function Cool({ who }: SceneProps) {
  const fan = useLoop(420);
  const cx = 104;
  return (
    <>
      <Counter />
      <Layer>
        <Path d="M164 112 V117 M222 112 V117" fill="none" stroke={C.steelShade} strokeWidth={3} strokeLinecap="round" />
        <Path d="M158 111 H228" fill="none" stroke={C.steelShade} strokeWidth={3} strokeLinecap="round" />
        <Path d="M168 110 Q168 86 194 84 Q220 86 220 110 Z" fill={C.crust} />
        <Path d="M182 90 l5 7 M194 88 l5 7 M206 90 l5 7" fill="none" stroke={C.crustShade} strokeWidth={2.6} strokeLinecap="round" />
        <ClosedEyes cx={194} cy={100} gap={7} />
      </Layer>
      {[0, 600, 1200].map((d, i) => (
        <Rising key={d} delay={d} ms={1400} dy={0}>
          <Path d={'M156 ' + (76 + i * 10) + ' h8 q4 0 4 -3'} fill="none" stroke={C.bowl} strokeWidth={2.6} strokeLinecap="round" />
        </Rising>
      ))}
      <Character who={who} cx={cx}
        back={<Layer><HipArm who={who} cx={cx} side="left" /></Layer>}
        front={
          <Layer origin={[cx + 16, 98]} style={{ transform: [{ rotate: turn(fan, -12, 12) }] }}>
            <Path d="M140 78 L156 66 Q164 78 154 90 Z" fill={C.tomato} />
            <Path d="M140 78 L158 72 M140 78 L159 80 M140 78 L155 87" fill="none" stroke={C.white} strokeWidth={1.8} strokeLinecap="round" />
            <Arm who={who} s={[cx + 16, 98]} c={[132, 86]} h={[140, 78]} />
          </Layer>
        }
      />
    </>
  );
}

function Serve({ who }: SceneProps) {
  const hop = useLoop(500, { ease: 'out' });
  const cx = 116;
  return (
    <>
      <Twinkle x={56} y={62} r={9} />
      <Twinkle x={184} y={54} r={11} delay={350} />
      <Twinkle x={190} y={110} r={7} delay={700} />
      <Character who={who} cx={cx} eyes="happy" mouth="smile" style={{ transform: [{ translateY: lerp(hop, 0, -6) }] }}
        front={
          <Layer>
            <Ellipse cx={cx} cy={116} rx={36} ry={7} fill={C.white} />
            <Ellipse cx={cx} cy={117} rx={27} ry={4.5} fill="#EEE6DA" />
            <Path d={`M${cx - 20} 114 Q${cx - 18} 94 ${cx} 92 Q${cx + 18} 94 ${cx + 20} 114 Z`} fill={C.crust} />
            <Path d={`M${cx - 4} 93 q-4 -8 4 -10 q2 6 -4 10 Z M${cx + 3} 93 q6 -8 11 -4 q-4 7 -11 4 Z`} fill={C.green} />
            <Arm who={who} s={[cx - 16, 98]} c={[cx - 34, 106]} h={[cx - 36, 115]} />
            <Arm who={who} s={[cx + 16, 98]} c={[cx + 34, 106]} h={[cx + 36, 115]} />
          </Layer>
        }
      />
      {[cx - 8, cx + 10].map((x, i) => steam(x, 84, i))}
    </>
  );
}

function Hello({ who }: SceneProps) {
  const wave = useLoop(450);
  const cx = 104;
  return (
    <>
      <Twinkle x={54} y={66} r={9} />
      <Twinkle x={186} y={58} r={8} delay={400} />
      <Character who={who} cx={cx} mouth="smile" look={[0.5, 0]}
        back={<Layer><HipArm who={who} cx={cx} side="left" /></Layer>}
        front={
          <Layer origin={[cx + 16, 98]} style={{ transform: [{ rotate: turn(wave, -12, 14) }] }}>
            <Arm who={who} s={[cx + 16, 98]} c={[cx + 38, 86]} h={[cx + 36, 60]} />
          </Layer>
        }
      />
    </>
  );
}

// ---------- choosing a scene ----------

type SceneKey = 'knead' | 'rise' | 'bake' | 'boil' | 'chop' | 'fry' | 'whisk' | 'season' | 'pour' | 'mix' | 'cool' | 'serve' | 'hello';

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
function pick(step: Pick<Step, 'title' | 'text'>): SceneKey {
  for (const source of [step.title, step.text]) {
    const s = (source || '').toLowerCase();
    let best: { at: number; scene: SceneKey } | null = null;
    for (const [re, scene] of RULES) {
      const m = s.match(re);
      if (m && m.index != null && (!best || m.index < best.at)) best = { at: m.index, scene };
    }
    if (best) return best.scene;
  }
  return 'hello';
}

function draw(key: SceneKey, who: Cook) {
  switch (key) {
    case 'knead': return <Knead who={who} />;
    case 'rise': return <Rise who={who} />;
    case 'bake': return <Bake who={who} />;
    case 'boil': return <Boil who={who} />;
    case 'chop': return <Chop who={who} />;
    case 'fry': return <Fry who={who} />;
    case 'whisk': return <Whisk who={who} />;
    case 'season': return <Season who={who} />;
    case 'pour': return <Pour who={who} />;
    case 'mix': return <Mix who={who} />;
    case 'cool': return <Cool who={who} />;
    case 'serve': return <Serve who={who} />;
    default: return <Hello who={who} />;
  }
}

export function StepScene({ step, index = 0, width, active = true }: { step: Pick<Step, 'title' | 'text'>; index?: number; width: number; active?: boolean }) {
  return (
    <Scene width={width} active={active}>
      {draw(pick(step), CAST[index % CAST.length])}
    </Scene>
  );
}
