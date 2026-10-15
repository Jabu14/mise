// Library: recipes still to cook, then the ones you've already made (Completed).
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, TextInput, View } from 'react-native';
import { AddFab } from '../../components/add-fab';
import { DishArt } from '../../components/art/dish-art';
import { allCollections } from '../../components/collection-sheet';
import { Btn, Card, Dock, Icon, IconBtn, Screen, TopBar, Txt } from '../../components/ui';
import { SAMPLE_RECIPE } from '../../shared/content';
import { parseRecipe } from '../../shared/parser';
import { useCookLog } from '../../lib/cook-log';
import { useShopping } from '../../lib/shopping';
import { useApp, type Recipe } from '../../lib/store';
import { artColor, useTheme } from '../../lib/theme';
import { timeAgo } from '../../lib/time';

export default function Library() {
  const th = useTheme();
  const { recipes, saveParsed } = useApp();
  const toBuy = useShopping().items.filter(i => !i.checked).length;
  const cooks = useCookLog().entries;
  const [query, setQuery] = useState('');
  const [folder, setFolder] = useState<string | null>(null);
  const folders = allCollections(recipes);
  const inFolder = folder && folders.some(f => f.name === folder) ? folder : null;
  const [dockH, setDockH] = useState(0);

  const sorted = useMemo(
    () => [...recipes].sort((a, b) => (b.lastOpened || b.updatedAt) - (a.lastOpened || a.updatedAt)),
    [recipes],
  );
  const shown = sorted.filter(r => r.title.toLowerCase().includes(query.trim().toLowerCase()) && (!inFolder || r.collections?.includes(inFolder)));
  // Cooked at least once (and not halfway through another go) = completed, newest first.
  const isDone = (r: Recipe) => (r.cookCount || 0) > 0 && !(r.progress.step > 0 && r.progress.step < r.steps.length);
  const toCook = shown.filter(r => !isDone(r));
  const completed = shown.filter(isDone).sort((a, b) => (b.lastCooked || 0) - (a.lastCooked || 0));
  const [now] = useState(() => Date.now());

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
        <IconBtn name="calendar-outline" label="Meal plan" onPress={() => router.push('/planner')} />
        <View>
          <IconBtn name="cart-outline" label={toBuy ? `Shopping list, ${toBuy} to buy` : 'Shopping list'} onPress={() => router.push('/shopping')} />
          {toBuy ? (
            <View pointerEvents="none" style={{ position: 'absolute', top: 4, right: 2, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accent }}>
              <Txt weight="black" size={10} color={th.c.onAccent}>{toBuy > 99 ? '99+' : toBuy}</Txt>
            </View>
          ) : null}
        </View>
        <IconBtn name="settings-outline" label="Settings" onPress={() => router.push('/settings')} />
      </TopBar>

      {recipes.length ? (
        <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: dockH + 24, gap: 12 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Txt kind="head" weight="bold" size={32} style={{ flex: 1 }}>Your recipes</Txt>
            <Pressable onPress={() => router.push('/pantry')} accessibilityRole="button"
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: th.c.accentSoft, opacity: pressed ? 0.7 : 1 })}>
              <Icon name="nutrition-outline" size={16} color={th.c.accent} />
              <Txt weight="black" size={13} color={th.c.accent}>What can I make?</Txt>
            </Pressable>
          </View>
          {recipes.length > 4 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingHorizontal: 16, borderRadius: 999, backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line }}>
              <Icon name="search" size={18} color={th.c.muted} />
              <TextInput value={query} onChangeText={setQuery} placeholder="Search recipes" placeholderTextColor={th.c.muted} style={[{ flex: 1, color: th.c.text, fontSize: th.fs(16) }, th.f('body')]} />
            </View>
          )}
          {folders.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
              {[{ name: '', count: recipes.length }, ...folders].map(f => {
                const on = (inFolder ?? '') === f.name;
                return (
                  <Pressable key={f.name || 'all'} onPress={() => setFolder(f.name || null)} accessibilityState={{ selected: on }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: on ? th.c.accent : th.c.soft }}>
                    {f.name ? <Icon name={on ? 'folder-open' : 'folder-outline'} size={15} color={on ? th.c.onAccent : th.c.muted} /> : null}
                    <Txt weight="bold" size={14} color={on ? th.c.onAccent : th.c.text}>{f.name || 'All'}</Txt>
                    <Txt weight="bold" size={12} color={on ? th.c.onAccent : th.c.muted}>{f.count}</Txt>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}
          {toCook.map(r => <RecipeCard key={r.id} recipe={r} />)}
          {!toCook.length && !query.trim() && !inFolder ? <Txt muted style={{ paddingHorizontal: 4 }}>Everything here is cooked. Time for something new!</Txt> : null}
          {completed.length ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, marginBottom: 2 }}>
                <Txt kind="head" weight="bold" size={24}>Completed</Txt>
                <View style={{ paddingHorizontal: 9, paddingVertical: 1, borderRadius: 999, backgroundColor: th.c.accentSoft }}>
                  <Txt weight="black" size={13} color={th.c.accent}>{completed.length}</Txt>
                </View>
                <View style={{ flex: 1 }} />
                <Pressable onPress={() => router.push('/journal')} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Icon name="book-outline" size={16} color={th.c.accent} />
                  <Txt weight="bold" size={14} color={th.c.accent}>Journal</Txt>
                </Pressable>
              </View>
              {completed.map(r => <RecipeCard key={r.id} recipe={r} photo={cooks.find(e => e.recipeId === r.id && e.photo)?.photo} done={`Cooked ${r.cookCount === 1 ? 'once' : `${r.cookCount} times`}${r.lastCooked ? ` · ${timeAgo(r.lastCooked, now)}` : ''}`} />)}
            </>
          ) : null}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ alignItems: 'center', gap: 14, padding: 24, paddingTop: 70 }}>
          <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: th.c.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <DishArt title="bread" width={110} />
          </View>
          <Txt kind="head" weight="bold" size={30} style={{ textAlign: 'center', maxWidth: 280 }}>Cook without scrolling back</Txt>
          <Txt muted style={{ textAlign: 'center', maxWidth: 300 }}>
            Paste any recipe and get big, simple steps with built-in timers.
          </Txt>
          <Btn title="Add your first recipe" icon="add" size="big" onPress={() => router.navigate('/add')} style={{ marginTop: 8 }} />
          <Btn title="Try a sample bread recipe" variant="ghost" textSize={14.5} onPress={addSample} />
        </ScrollView>
      )}

      <Dock onHeight={setDockH}>
        {recipes.length ? <AddFab onPress={() => router.navigate('/add')} /> : null}
      </Dock>
    </Screen>
  );
}

function RecipeCard({ recipe: r, done, photo }: { recipe: Recipe; done?: string; photo?: string }) {
  const th = useTheme();
  const total = (r.times.find(t => t.label === 'Total') || r.times[0])?.value;
  const meta = [`${r.steps.length} steps`, total].filter(Boolean).join(' · ');
  const inProgress = r.progress.step > 0 && r.progress.step < r.steps.length;
  return (
    <Pressable onPress={() => router.push(`/recipe/${r.id}`)} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12 }}>
        <View style={{ width: 64, height: 64, borderRadius: th.radius - 6, backgroundColor: artColor(r.title, th.dark), alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {photo ? <Image source={{ uri: photo }} style={{ width: 64, height: 64 }} /> : <DishArt title={`${r.title} ${r.description}`} width={60} still />}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt kind="head" weight="bold" size={18} numberOfLines={2}>{r.title}</Txt>
          <Txt muted size={14}>{done ?? meta}</Txt>
          {inProgress && (
            <View style={{ alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 999, backgroundColor: th.c.accentSoft }}>
              <Txt weight="black" size={12} color={th.c.accent}>On step {r.progress.step + 1} of {r.steps.length}</Txt>
            </View>
          )}
        </View>
        {done ? (
          <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accent }}>
            <Icon name="checkmark" size={16} color={th.c.onAccent} />
          </View>
        ) : <Icon name="chevron-forward" size={20} color={th.c.muted} />}
      </Card>
    </Pressable>
  );
}
