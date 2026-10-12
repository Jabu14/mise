// Library: all saved recipes.
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { Btn, Card, Dock, Icon, IconBtn, Screen, TopBar, Txt } from '../components/ui';
import { SAMPLE_RECIPE } from '../shared/content';
import { parseRecipe } from '../shared/parser';
import { useApp, type Recipe } from '../lib/store';
import { artColor, useTheme } from '../lib/theme';

export default function Library() {
  const th = useTheme();
  const { recipes, saveParsed } = useApp();
  const [query, setQuery] = useState('');
  const [dockH, setDockH] = useState(0);

  const sorted = useMemo(
    () => [...recipes].sort((a, b) => (b.lastOpened || b.updatedAt) - (a.lastOpened || a.updatedAt)),
    [recipes],
  );
  const shown = sorted.filter(r => r.title.toLowerCase().includes(query.trim().toLowerCase()));

  const addSample = () => {
    const id = saveParsed(parseRecipe(SAMPLE_RECIPE)!, SAMPLE_RECIPE);
    router.push(`/recipe/${id}`);
  };

  return (
    <Screen>
      <TopBar>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 8, flex: 1 }}>
          <Icon name="restaurant-outline" size={24} color={th.c.accent} />
          <Txt kind="head" weight="bold" size={24}>Mise</Txt>
        </View>
        <IconBtn name="color-palette-outline" label="Look and settings" onPress={() => router.push('/settings')} />
      </TopBar>

      {recipes.length ? (
        <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: dockH + 24, gap: 12 }} keyboardShouldPersistTaps="handled">
          <Txt kind="head" weight="bold" size={32} style={{ marginBottom: 4 }}>Your recipes</Txt>
          {recipes.length > 4 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingHorizontal: 16, borderRadius: 999, backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line }}>
              <Icon name="search" size={18} color={th.c.muted} />
              <TextInput value={query} onChangeText={setQuery} placeholder="Search recipes" placeholderTextColor={th.c.muted} style={[{ flex: 1, color: th.c.text, fontSize: th.fs(16) }, th.f('body')]} />
            </View>
          )}
          {shown.map(r => <RecipeCard key={r.id} recipe={r} />)}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ alignItems: 'center', gap: 14, padding: 24, paddingTop: 70 }}>
          <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: th.c.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <Txt size={64} style={{ lineHeight: 80 }}>🍞</Txt>
          </View>
          <Txt kind="head" weight="bold" size={30} style={{ textAlign: 'center', maxWidth: 280 }}>Cook without scrolling back</Txt>
          <Txt muted style={{ textAlign: 'center', maxWidth: 300 }}>
            Paste a recipe from Gemini (or anywhere) and get big, simple steps with built-in timers.
          </Txt>
          <Btn title="Add your first recipe" icon="add" size="big" onPress={() => router.push('/new')} style={{ marginTop: 8 }} />
          <Btn title="Try a sample bread recipe" variant="ghost" onPress={addSample} />
        </ScrollView>
      )}

      <Dock onHeight={setDockH}>
        {recipes.length ? <Btn title="Add recipe" icon="add" size="big" onPress={() => router.push('/new')} /> : null}
      </Dock>
    </Screen>
  );
}

function RecipeCard({ recipe: r }: { recipe: Recipe }) {
  const th = useTheme();
  const total = (r.times.find(t => t.label === 'Total') || r.times[0])?.value;
  const meta = [`${r.steps.length} steps`, total].filter(Boolean).join(' · ');
  const inProgress = r.progress.step > 0 && r.progress.step < r.steps.length;
  return (
    <Pressable onPress={() => router.push(`/recipe/${r.id}`)} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12 }}>
        <View style={{ width: 64, height: 64, borderRadius: th.radius - 6, backgroundColor: artColor(r.title, th.dark), alignItems: 'center', justifyContent: 'center' }}>
          <Txt size={32} style={{ lineHeight: 42 }}>{r.emoji}</Txt>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt kind="head" weight="bold" size={18} numberOfLines={2}>{r.title}</Txt>
          <Txt muted size={14}>{meta}</Txt>
          {inProgress && (
            <View style={{ alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 999, backgroundColor: th.c.accentSoft }}>
              <Txt weight="black" size={12} color={th.c.accent}>On step {r.progress.step + 1} of {r.steps.length}</Txt>
            </View>
          )}
        </View>
        <Icon name="chevron-forward" size={20} color={th.c.muted} />
      </Card>
    </Pressable>
  );
}
