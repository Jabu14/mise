// Mise en place: get everything out and ready before the first step. Preheat, gather the
// equipment, do the chopping and softening, and tick off each ingredient as it's on the counter.
// Ticks are shared with the recipe page's ingredient list.
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { IngredientList } from '../../components/recipe';
import { Btn, Dock, Icon, IconBtn, Screen, TopBar, Txt } from '../../components/ui';
import { plainText } from '../../shared/parser';
import { useApp, type Recipe } from '../../lib/store';
import { useTheme } from '../../lib/theme';
import { convertUnits, type UnitMode } from '../../lib/units';

// "finely chopped" → "Chop". The first prep word in a line wins.
const PREP: [RegExp, string][] = [
  [/room temperature/i, 'Bring to room temperature'],
  [/\bsoft(en)?ed\b/i, 'Soften'],
  [/\bmelted\b/i, 'Melt'],
  [/\b(finely |roughly |coarsely )?chopped\b/i, 'Chop'],
  [/\bdiced\b/i, 'Dice'],
  [/\b(minced|crushed)\b/i, 'Mince'],
  [/\bsliced\b/i, 'Slice'],
  [/\bgrated\b/i, 'Grate'],
  [/\bzest(ed)?\b/i, 'Zest'],
  [/\bjuiced\b|\bjuice of\b/i, 'Juice'],
  [/\bpeeled\b/i, 'Peel'],
  [/\bbeaten\b|\bwhisked\b/i, 'Beat'],
  [/\bsifted\b/i, 'Sift'],
  [/\bsoaked\b/i, 'Soak'],
  [/\bdrained\b/i, 'Drain'],
  [/\btoasted\b/i, 'Toast'],
  [/\bshredded\b/i, 'Shred'],
  [/\bcubed\b/i, 'Cube'],
];

function prepTasks(r: Recipe) {
  return r.ingredients.flatMap(g => g.items).flatMap(line => {
    const text = plainText(line);
    const hit = PREP.find(([re]) => re.test(text));
    return hit ? [{ verb: hit[1], line: text }] : [];
  }).slice(0, 30);
}

// "Preheat the oven to 220°C" from the first step that mentions the oven and a temperature.
function ovenTemp(r: Recipe): string | null {
  for (const s of r.steps) {
    const text = plainText(`${s.title} ${s.text}`);
    if (!/\boven\b|\bbake\b|\broast\b/i.test(text)) continue;
    const m = text.match(/\d{2,3}\s*(?:°|º|degrees?\s*)\s*(?:C|F|Celsius|Fahrenheit)\b(?:\s*\(?\s*\d{2,3}\s*°?\s*(?:C|F)?\s*fan\)?)?/i);
    if (m) return m[0];
  }
  return null;
}

export default function PrepScreen() {
  const th = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getRecipe, setProgress, settings } = useApp();
  const r = getRecipe(id);
  const [dockH, setDockH] = useState(0);

  if (!r) return <Screen><TopBar><IconBtn name="arrow-back" label="Back" onPress={() => router.back()} /></TopBar></Screen>;

  const units = settings.units as UnitMode;
  const checked = new Set(r.progress.checked);
  const tasks = prepTasks(r);
  const oven = ovenTemp(r);
  const ingredientKeys = r.ingredients.flatMap((g, gi) => g.items.map((_, ii) => `${gi}.${ii}`));
  const allKeys = [...(oven ? ['oven'] : []), ...r.equipment.map((_, i) => `eq.${i}`), ...tasks.map((_, i) => `prep.${i}`), ...ingredientKeys];
  const done = allKeys.filter(k => checked.has(k)).length;
  const ready = allKeys.length > 0 && done === allKeys.length;

  const toggle = (key: string) => {
    if (settings.haptics) Haptics.selectionAsync().catch(() => {});
    const next = new Set(checked);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setProgress(r.id, { checked: [...next] });
  };

  const start = () => router.replace({ pathname: '/cook/[id]', params: { id: r.id, step: '0' } });

  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <View style={{ flex: 1, paddingLeft: 4 }}>
          <Txt kind="head" weight="bold" size={19}>Mise en place</Txt>
          <Txt muted size={13} numberOfLines={1}>{r.title}</Txt>
        </View>
        {done ? <IconBtn name="refresh" label="Untick everything" onPress={() => setProgress(r.id, { checked: [] })} /> : null}
      </TopBar>

      <View style={{ paddingHorizontal: 16, gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Txt muted size={14}>Get everything ready, then cook without stopping.</Txt>
          <Txt weight="black" size={14} color={th.c.accent}>{done}/{allKeys.length}</Txt>
        </View>
        <View style={{ height: 6, borderRadius: 999, backgroundColor: th.c.soft, overflow: 'hidden' }}>
          <View style={{ height: '100%', width: `${allKeys.length ? (done / allKeys.length) * 100 : 0}%`, borderRadius: 999, backgroundColor: th.c.accent }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: dockH + 24, gap: 22 }}>
        {oven || r.equipment.length ? (
          <Section title="First">
            {oven ? <Task on={checked.has('oven')} onPress={() => toggle('oven')} label="Preheat" text={`Turn the oven on to ${convertUnits(oven, units)}`} icon="flame-outline" /> : null}
            {r.equipment.map((e, i) => <Task key={i} on={checked.has(`eq.${i}`)} onPress={() => toggle(`eq.${i}`)} label="Get out" text={plainText(e)} icon="cube-outline" />)}
          </Section>
        ) : null}

        {tasks.length ? (
          <Section title="Prep">
            {tasks.map((t, i) => <Task key={i} on={checked.has(`prep.${i}`)} onPress={() => toggle(`prep.${i}`)} label={t.verb} text={convertUnits(t.line, units)} icon="cut-outline" />)}
          </Section>
        ) : null}

        <Section title="On the counter">
          <IngredientList recipe={r} />
        </Section>
      </ScrollView>

      <Dock onHeight={setDockH}>
        <Btn grow size="big" icon="play" title={ready ? 'All set: start cooking' : 'Start cooking'} onPress={start} />
      </Dock>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Txt kind="head" weight="bold" size={22}>{title}</Txt>
      <View style={{ gap: 6 }}>{children}</View>
    </View>
  );
}

function Task({ on, onPress, label, text, icon }: { on: boolean; onPress: () => void; label: string; text: string; icon: 'flame-outline' | 'cube-outline' | 'cut-outline' }) {
  const th = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: th.radiusSm, backgroundColor: pressed ? th.c.soft : th.c.surface, borderWidth: 1, borderColor: on ? th.c.accent : th.c.line })}>
      <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? th.c.accent : th.c.accentSoft }}>
        <Icon name={on ? 'checkmark' : icon} size={18} color={on ? th.c.onAccent : th.c.accent} />
      </View>
      <View style={{ flex: 1, opacity: on ? 0.5 : 1 }}>
        <Txt weight="black" size={13} color={th.c.accent}>{label.toUpperCase()}</Txt>
        <Txt size={15} style={on ? { textDecorationLine: 'line-through' } : undefined}>{text}</Txt>
      </View>
    </Pressable>
  );
}
