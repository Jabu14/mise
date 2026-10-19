// Recipe-specific pieces shared by the recipe page and cook mode.
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { scaleText } from '../shared/parser';
import { AI_NAME } from '../lib/chat-store';
import { useApp, type Recipe } from '../lib/store';
import { swapsFor } from '../lib/swaps';
import { convertUnits } from '../lib/units';
import { useTheme } from '../lib/theme';
import { Icon, Label, RichText, Txt } from './ui';

export function ingCountText(r: Recipe) {
  const total = r.ingredients.reduce((n, g) => n + g.items.length, 0);
  const done = r.progress.checked.filter(k => /^\d+\.\d+$/.test(k)).length;
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

// "1 loaf" on the recipe page: tap it to type an amount (e.g. 3 loaves, or ×1.5 when the recipe
// doesn't say how much it makes). The ingredients rescale to match.
// The recipe's name at the top of its page: tap it to rename.
export function EditableTitle({ recipe: r }: { recipe: Recipe }) {
  const th = useTheme();
  const { patchRecipe } = useApp();
  const [draft, setDraft] = useState<string | null>(null);
  const save = () => {
    const t = (draft ?? '').replace(/\s+/g, ' ').trim().slice(0, 120);
    if (t && t !== r.title) patchRecipe(r.id, { title: t });
    setDraft(null);
  };
  if (draft !== null) {
    return (
      <TextInput
        value={draft}
        onChangeText={setDraft}
        autoFocus
        selectTextOnFocus
        multiline
        blurOnSubmit
        maxLength={120}
        returnKeyType="done"
        onBlur={save}
        onSubmitEditing={save}
        accessibilityLabel="Recipe name"
        style={[{ alignSelf: 'stretch', textAlign: 'center', color: th.c.text, fontSize: th.fs(30), paddingVertical: 6, paddingHorizontal: 4, borderBottomWidth: 2, borderColor: th.c.accent }, th.f('head', 'bold')]}
      />
    );
  }
  return (
    <Pressable onPress={() => setDraft(r.title)} accessibilityRole="button" accessibilityHint="Tap to rename the recipe" hitSlop={6}>
      <Txt kind="head" weight="bold" size={32} style={{ textAlign: 'center' }}>
        {r.title}{'  '}<Icon name="pencil-outline" size={18} color={th.c.muted} />
      </Txt>
    </Pressable>
  );
}

export function MakesValue({ recipe: r }: { recipe: Recipe }) {
  const th = useTheme();
  const { setProgress } = useApp();
  const [draft, setDraft] = useState<string | null>(null);
  const count = r.servings?.count;
  const scale = r.progress.scale || 1;
  const current = count ? +(count * scale).toFixed(2) : +scale.toFixed(2);
  const label = servingsLabel(r);
  const unit = count ? label.replace(String(current), '').trim() : '× the recipe';

  const commit = () => {
    const v = parseFloat((draft ?? '').replace(',', '.'));
    if (v > 0) setProgress(r.id, { scale: Math.min(50, Math.max(0.25, count ? v / count : v)) });
    setDraft(null);
  };

  if (draft !== null) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TextInput
          value={draft}
          onChangeText={t => setDraft(t.replace(/[^0-9.,]/g, '').slice(0, 5))}
          keyboardType="decimal-pad"
          autoFocus
          selectTextOnFocus
          onBlur={commit}
          onSubmitEditing={commit}
          returnKeyType="done"
          accessibilityLabel="How much to make"
          style={[{ minWidth: 56, height: 36, paddingHorizontal: 6, borderBottomWidth: 2, borderColor: th.c.accent, color: th.c.text, fontSize: th.fs(18), textAlign: 'center' }, th.f('body', 'black')]}
        />
        <Txt weight="black" size={18}>{unit}</Txt>
      </View>
    );
  }
  return (
    <Pressable onPress={() => setDraft(String(current))} accessibilityRole="button" accessibilityLabel={`Makes ${label}. Tap to type an amount`} hitSlop={6}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Txt weight="black" size={18}>{label}</Txt>
      <Icon name="pencil-outline" size={14} color={th.c.muted} />
    </Pressable>
  );
}

// Ingredient line as shown: scaled to the amount you're making, in your units.
export function shownLine(r: Recipe, line: string, units: string) {
  return convertUnits(scaleText(line, r.progress.scale || 1), units as 'original');
}

// inSheet: shown inside another sheet (cook mode), where "Ask Sous" can't open the chat.
export function IngredientList({ recipe: r, inSheet }: { recipe: Recipe; inSheet?: boolean }) {
  const th = useTheme();
  const { setProgress, settings } = useApp();
  const checked = new Set(r.progress.checked);
  const [open, setOpen] = useState<string | null>(null);
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
            const swaps = swapsFor(item);
            const line = shownLine(r, item, settings.units);
            return (
              <View key={key}>
              <Pressable
                onPress={() => toggle(key)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                style={({ pressed }) => ({ flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 10, paddingHorizontal: 12, borderRadius: th.radiusSm, backgroundColor: pressed ? th.c.soft : 'transparent' })}
              >
                <View style={{ width: 24, height: 24, marginTop: 1, borderRadius: 7, borderWidth: 2, alignItems: 'center', justifyContent: 'center', borderColor: on ? th.c.accent : th.c.line, backgroundColor: on ? th.c.accent : 'transparent' }}>
                  {on ? <Icon name="checkmark" size={16} color={th.c.onAccent} /> : null}
                </View>
                <View style={{ flex: 1, opacity: on ? 0.5 : 1 }}>
                  <RichText text={line} strike={on} />
                </View>
                {swaps ? (
                  <Pressable onPress={() => setOpen(open === key ? null : key)} hitSlop={8} accessibilityLabel={`Swaps for ${swaps.name.toLowerCase()}`} accessibilityState={{ expanded: open === key }}
                    style={{ width: 30, height: 30, marginTop: -3, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: open === key ? th.c.accentSoft : 'transparent' }}>
                    <Icon name="swap-horizontal" size={18} color={open === key ? th.c.accent : th.c.muted} />
                  </Pressable>
                ) : null}
              </Pressable>
              {swaps && open === key ? (
                <View style={{ marginLeft: 48, marginRight: 8, marginBottom: 8, padding: 12, gap: 8, borderRadius: th.radiusSm, backgroundColor: th.c.soft }}>
                  <Txt weight="black" size={13} color={th.c.accent}>{`NO ${swaps.name.toUpperCase()}? TRY`}</Txt>
                  {swaps.options.map(o => (
                    <View key={o} style={{ flexDirection: 'row', gap: 8 }}>
                      <Txt size={14} color={th.c.accent}>•</Txt>
                      <Txt size={14} style={{ flex: 1 }}>{o}</Txt>
                    </View>
                  ))}
                  {!inSheet ? (
                    <Pressable hitSlop={6} onPress={() => router.navigate({ pathname: '/chat', params: { draft: `I'm making ${r.title} and I don't have ${swaps.name.toLowerCase()} (${plainLine(line)}). What can I use instead? ` } })}>
                      <Txt weight="bold" size={14} color={th.c.accent}>{`Ask ${AI_NAME} about it ›`}</Txt>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const plainLine = (s: string) => s.replace(/\*\*/g, '').trim();
