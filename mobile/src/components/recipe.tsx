// Recipe-specific pieces shared by the recipe page and cook mode.
import { Pressable, View } from 'react-native';
import { scaleText } from '../shared/parser';
import { useApp, type Recipe } from '../lib/store';
import { useTheme } from '../lib/theme';
import { Icon, Label, RichText } from './ui';

export function ingCountText(r: Recipe) {
  const total = r.ingredients.reduce((n, g) => n + g.items.length, 0);
  const done = r.progress.checked.length;
  return done ? `${done} of ${total} ready` : `${total} items`;
}

const PLURALS: Record<string, string> = { loaf: 'loaves', batch: 'batches', dish: 'dishes', person: 'people' };
const COUNTABLE = /^(serving|portion|pizza|cake|tray|pan|bowl|cookie|muffin|roll|bun|baguette|pie|tart|bagel|pancake|waffle|slice|piece|cup|jar|burger|taco|sandwich|ball|boule)$/i;

function plural(word: string) {
  const w = word.toLowerCase();
  if (PLURALS[w]) return PLURALS[w];
  return COUNTABLE.test(w) ? `${word}s` : word;
}

function singular(word: string) {
  const w = word.toLowerCase();
  const back = Object.entries(PLURALS).find(([, pl]) => pl === w);
  if (back) return back[0];
  return /s$/i.test(w) && COUNTABLE.test(w.slice(0, -1)) ? word.slice(0, -1) : word;
}

export function servingsLabel(r: Recipe) {
  const scale = r.progress.scale || 1;
  const s = r.servings;
  if (!s?.count) return `×${+scale.toFixed(2)}`;
  const n = +(s.count * scale).toFixed(2);
  return s.label.replace(/(\d+(?:[.,]\d+)?)(\s*)([A-Za-z]+)?/, (_m, _num, space: string, word = '') => `${n}${space}${n > 1 ? plural(word) : singular(word)}`);
}

// Next scale factor when tapping − / +.
export function scaleBy(r: Recipe, dir: number) {
  const scale = r.progress.scale || 1;
  const count = r.servings?.count;
  if (!count) return Math.max(0.5, scale + dir * 0.5);
  const stepSize = count <= 2 ? 0.5 : 1;
  const n = Math.max(stepSize, Math.round((count * scale) / stepSize) * stepSize + dir * stepSize);
  return n / count;
}

export function IngredientList({ recipe: r }: { recipe: Recipe }) {
  const th = useTheme();
  const { setProgress } = useApp();
  const checked = new Set(r.progress.checked);
  const toggle = (key: string) => {
    const next = new Set(checked);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setProgress(r.id, { checked: [...next] });
  };
  return (
    <View style={{ gap: 2 }}>
      {r.ingredients.map((g, gi) => (
        <View key={gi} style={{ gap: 2 }}>
          {g.name ? <View style={{ marginTop: 14, marginBottom: 2, marginLeft: 12 }}><Label>{g.name}</Label></View> : null}
          {g.items.map((item, ii) => {
            const key = `${gi}.${ii}`;
            const on = checked.has(key);
            return (
              <Pressable
                key={key}
                onPress={() => toggle(key)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                style={({ pressed }) => ({ flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 10, paddingHorizontal: 12, borderRadius: th.radiusSm, backgroundColor: pressed ? th.c.soft : 'transparent' })}
              >
                <View style={{ width: 24, height: 24, marginTop: 1, borderRadius: 7, borderWidth: 2, alignItems: 'center', justifyContent: 'center', borderColor: on ? th.c.accent : th.c.line, backgroundColor: on ? th.c.accent : 'transparent' }}>
                  {on ? <Icon name="checkmark" size={16} color={th.c.onAccent} /> : null}
                </View>
                <View style={{ flex: 1, opacity: on ? 0.5 : 1 }}>
                  <RichText text={scaleText(item, r.progress.scale || 1)} />
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
