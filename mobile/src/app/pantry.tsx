// "What can I make?": add what's in your fridge and cupboards, and your saved recipes are sorted
// by how little you're missing. Salt, pepper, oil and water count as always there. Your list is
// remembered on the phone.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { DishArt } from '../components/art/dish-art';
import { Btn, Card, Icon, IconBtn, Screen, TopBar, Txt } from '../components/ui';
import { AI_NAME } from '../lib/chat-store';
import { parseLine } from '../lib/shopping';
import { useApp, type Recipe } from '../lib/store';
import { artColor, useTheme } from '../lib/theme';

const KEY = 'mise.pantry.v1';
const STAPLES = /^(water|salt|(black |ground )?pepper|salt and pepper|(olive |vegetable |sunflower |neutral |cooking )?oil|ice)$/;
const FILLER = /\b(fine|coarse|fresh(ly)?|large|small|medium|warm|cold|hot|lukewarm|instant|active|dry|dried|ground|chopped|minced|diced|sliced|grated|softened|melted|unsalted|salted|plain|all[- ]purpose|extra[- ]virgin|ripe|whole|full[- ]fat|low[- ]fat|organic|optional|plus extra.*|to taste|or honey)\b/g;

const singular = (w: string) => w.replace(/(ies)$/, 'y').replace(/(oes)$/, 'o').replace(/([^s])s$/, '$1');
// "2 large eggs, beaten" → "egg"; "500 g bread flour" → "bread flour".
function core(line: string) {
  return parseLine(line).name.toLowerCase().replace(FILLER, ' ').replace(/[^a-z\s-]/g, ' ').replace(/\s+/g, ' ').trim().split(' ').map(singular).join(' ');
}

function match(r: Recipe, have: string[]) {
  const needs = r.ingredients.flatMap(g => g.items).map(core).filter(n => n && !STAPLES.test(n));
  const haveCore = have.map(h => h.toLowerCase().split(' ').map(singular).join(' '));
  const ok = (n: string) => haveCore.some(h => ` ${n} `.includes(` ${h} `) || ` ${h} `.includes(` ${n} `));
  const missing = [...new Set(needs.filter(n => !ok(n)))];
  return { total: needs.length, got: needs.length - needs.filter(n => !ok(n)).length, missing };
}

export default function PantryScreen() {
  const th = useTheme();
  const { recipes } = useApp();
  const [have, setHave] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [text, setText] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(raw => { const v = raw ? JSON.parse(raw) : []; setHave(Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').map(x => x.slice(0, 40)).slice(0, 60) : []); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  useEffect(() => { if (ready) AsyncStorage.setItem(KEY, JSON.stringify(have)).catch(() => {}); }, [ready, have]);

  const add = (raw: string) => {
    const items = raw.split(',').map(s => s.trim().toLowerCase().slice(0, 40)).filter(Boolean);
    if (items.length) setHave(h => [...new Set([...h, ...items])].slice(0, 60));
    setText('');
  };
  const remove = (item: string) => setHave(h => h.filter(x => x !== item));

  // Quick picks: the most common ingredients across your recipes that aren't on your list yet.
  const counts = new Map<string, number>();
  recipes.forEach(r => new Set(r.ingredients.flatMap(g => g.items).map(core)).forEach(n => { if (n && !STAPLES.test(n) && n.length <= 24) counts.set(n, (counts.get(n) || 0) + 1); }));
  const picks = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n).filter(n => !have.includes(n)).slice(0, 12);

  const results = have.length
    ? recipes.map(r => ({ r, ...match(r, have) })).filter(x => x.got > 0).sort((a, b) => a.missing.length - b.missing.length || b.got - a.got)
    : [];

  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <Txt kind="head" weight="bold" size={19} style={{ flex: 1, paddingLeft: 4 }}>What can I make?</Txt>
        {have.length ? <IconBtn name="refresh" label="Clear my list" onPress={() => setHave([])} /> : null}
      </TopBar>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 48, gap: 14 }} keyboardShouldPersistTaps="handled">
        <Txt muted>Add what you have. Salt, pepper, oil and water are always counted.</Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 50, paddingLeft: 16, paddingRight: 6, borderRadius: 25, backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line }}>
          <Icon name="nutrition-outline" size={18} color={th.c.muted} />
          <TextInput value={text} onChangeText={setText} placeholder="e.g. eggs, flour, spinach" placeholderTextColor={th.c.muted} returnKeyType="done" blurOnSubmit={false}
            onSubmitEditing={() => add(text)} autoCapitalize="none" style={[{ flex: 1, minWidth: 0, color: th.c.text, fontSize: th.fs(16), paddingVertical: 0 }, th.f('body')]} />
          <Pressable onPress={() => add(text)} disabled={!text.trim()} accessibilityLabel="Add"
            style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: text.trim() ? th.c.accent : th.c.soft }}>
            <Icon name="add" size={22} color={text.trim() ? th.c.onAccent : th.c.muted} />
          </Pressable>
        </View>

        {have.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {have.map(h => (
              <Pressable key={h} onPress={() => remove(h)} accessibilityLabel={`Remove ${h}`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 12, paddingRight: 8, paddingVertical: 7, borderRadius: 999, backgroundColor: th.c.accent }}>
                <Txt weight="bold" size={14} color={th.c.onAccent}>{h}</Txt>
                <Icon name="close" size={14} color={th.c.onAccent} />
              </Pressable>
            ))}
          </View>
        ) : null}

        {picks.length ? (
          <View style={{ gap: 8 }}>
            <Txt muted weight="black" size={13} style={{ letterSpacing: 0.5 }}>FROM YOUR RECIPES</Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {picks.map(p => (
                <Pressable key={p} onPress={() => add(p)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: th.c.soft }}>
                  <Icon name="add" size={14} color={th.c.muted} />
                  <Txt weight="bold" size={14}>{p}</Txt>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {have.length ? (
          <View style={{ gap: 10, marginTop: 6 }}>
            <Txt kind="head" weight="bold" size={22}>{results.length ? 'You can make' : 'No matches yet'}</Txt>
            {results.map(({ r, got, total, missing }) => (
              <Pressable key={r.id} onPress={() => router.push(`/recipe/${r.id}`)} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}>
                <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }}>
                  <View style={{ width: 56, height: 56, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: artColor(r.title, th.dark) }}>
                    <DishArt title={r.title} width={54} still />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt weight="black" size={16} numberOfLines={1}>{r.title}</Txt>
                    {missing.length ? (
                      <Txt muted size={13} numberOfLines={2}>Missing: {missing.join(', ')}</Txt>
                    ) : <Txt weight="bold" size={13} color={th.c.accent}>You have everything!</Txt>}
                  </View>
                  <View style={{ alignItems: 'center', minWidth: 44 }}>
                    <Txt weight="black" size={15} color={missing.length ? th.c.text : th.c.accent}>{got}/{total}</Txt>
                  </View>
                </Card>
              </Pressable>
            ))}
            {!results.length ? <Txt muted>None of your saved recipes use these yet.</Txt> : null}
            <Btn title={`Ask ${AI_NAME} for ideas`} icon="sparkles-outline" variant="secondary"
              onPress={() => router.navigate({ pathname: '/chat', params: { draft: `I have ${have.join(', ')}. What can I make with these? ` } })} />
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
