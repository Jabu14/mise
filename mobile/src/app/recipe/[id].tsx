// Recipe overview: servings, ingredient checklist, steps, notes.
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { DishArt } from '../../components/art/dish-art';
import { LinearGradient } from 'expo-linear-gradient';
import { CookEntryRow } from '../../components/cook-log-ui';
import { CollectionSheet } from '../../components/collection-sheet';
import { PlanSheet } from '../../components/plan-sheet';
import { ReadyBySheet } from '../../components/ready-by-sheet';
import { EditableTitle, IngredientList, MakesValue, ingCountText, scaleBy } from '../../components/recipe';
import { Btn, Card, Chip, Dock, Icon, IconBtn, Label, RichText, Screen, TopBar, Txt } from '../../components/ui';
import { formatDuration, plainText } from '../../shared/parser';
import { useCookLog } from '../../lib/cook-log';
import { useShopping } from '../../lib/shopping';
import { useApp } from '../../lib/store';
import { artColor, useTheme } from '../../lib/theme';
import { UNIT_CHOICES, convertUnits, type UnitMode } from '../../lib/units';
import { SlidingChoice } from '../../components/sliding-choice';
import { showAlert } from '../../components/sheet';

export default function RecipeScreen() {
  const th = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getRecipe, patchRecipe, setProgress, deleteRecipe, settings, updateSettings } = useApp();
  const units = settings.units as UnitMode;
  const r = getRecipe(id);
  const [dockH, setDockH] = useState(0);
  const { addFromRecipe } = useShopping();
  const [planning, setPlanning] = useState(false);
  const [readyBy, setReadyBy] = useState(false);
  const [folders, setFolders] = useState(false);
  const cooks = useCookLog().entries.filter(e => e.recipeId === id);

  useEffect(() => { if (id) patchRecipe(id, { lastOpened: Date.now() }); }, [id, patchRecipe]);

  if (!r) return <Screen><TopBar><IconBtn name="arrow-back" label="Back" onPress={() => router.back()} /></TopBar></Screen>;

  const p = r.progress;
  const started = p.step > 0 && p.step < r.steps.length;

  const addToList = () => {
    const n = addFromRecipe(r);
    showAlert('Added to your shopping list', `${n} ${n === 1 ? 'ingredient' : 'ingredients'} from ${r.title}. Matching items are combined.`, [
      { text: 'OK', style: 'cancel' },
      { text: 'View list', onPress: () => router.push('/shopping') },
    ]);
  };

  const confirmDelete = () =>
    showAlert('Delete this recipe?', `“${r.title}” will be removed from this phone.`, [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteRecipe(r.id); router.back(); } },
    ]);

  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="All recipes" onPress={() => router.back()} />
        <View style={{ flex: 1 }} />
        <IconBtn name="calendar-outline" label="Add to meal plan" onPress={() => setPlanning(true)} />
        <IconBtn name="create-outline" label="Edit recipe" onPress={() => router.push(`/edit/${r.id}`)} />
        <IconBtn name="trash-outline" label="Delete recipe" onPress={confirmDelete} />
      </TopBar>

      <ScrollView contentContainerStyle={{ paddingBottom: dockH + 24 }}>
        {/* Full-width colour band with the dish, melting into the page below. */}
        <LinearGradient
          colors={[artColor(r.title, th.dark), artColor(r.title, th.dark), th.c.bg]}
          locations={[0, 0.5, 1]}
          style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 28 }}
        >
          <DishArt title={`${r.title} ${r.description}`} width={240} />
        </LinearGradient>
        <View style={{ alignItems: 'center', gap: 10, paddingHorizontal: 16, marginTop: -8 }}>
          <EditableTitle recipe={r} />
          {r.description ? <Txt muted style={{ textAlign: 'center' }}>{plainText(r.description)}</Txt> : null}
          {r.times.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>
              {r.times.map(t => (
                <Chip key={t.label} icon="time-outline">
                  <Txt size={14}><Txt weight="black" size={14}>{t.label}</Txt> {t.value}</Txt>
                </Chip>
              ))}
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
            {r.steps.length > 1 ? (
              <Pressable onPress={() => setReadyBy(true)} accessibilityRole="button"
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: th.c.accentSoft, opacity: pressed ? 0.7 : 1 })}>
                <Icon name="alarm-outline" size={16} color={th.c.accent} />
                <Txt weight="black" size={14} color={th.c.accent}>Ready by…</Txt>
              </Pressable>
            ) : null}
            <Pressable onPress={() => setFolders(true)} accessibilityRole="button" accessibilityLabel="Collections"
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: 260, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: th.c.soft, opacity: pressed ? 0.7 : 1 })}>
              <Icon name={r.collections?.length ? 'folder' : 'folder-outline'} size={16} color={th.c.accent} />
              <Txt weight="black" size={14} numberOfLines={1} style={{ flexShrink: 1 }}>{r.collections?.length ? r.collections.join(', ') : 'Add to collection'}</Txt>
            </Pressable>
          </View>
        </View>

        <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, paddingVertical: 10, paddingLeft: 18, paddingRight: 10 }}>
          <View>
            <Label color={th.c.muted}>{r.servings?.count ? 'Makes' : 'Recipe size'}</Label>
            <MakesValue recipe={r} />
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <IconBtn tinted name="remove" label="Make less" onPress={() => setProgress(r.id, { scale: scaleBy(r, -1) })} />
            <IconBtn tinted name="add" label="Make more" onPress={() => setProgress(r.id, { scale: scaleBy(r, 1) })} />
          </View>
        </Card>

        {r.ingredients.length ? (
          <Section title="Ingredients" aside={ingCountText(r)}>
            <SlidingChoice options={UNIT_CHOICES} value={units} onChange={v => updateSettings({ units: v })} height={34} />
            <IngredientList recipe={r} />
            <Pressable onPress={addToList} accessibilityRole="button"
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: th.c.accent, backgroundColor: pressed ? th.c.accentSoft : 'transparent' })}>
              <Icon name="cart-outline" size={20} color={th.c.accent} />
              <Txt weight="black" color={th.c.accent}>Add to shopping list</Txt>
            </Pressable>
          </Section>
        ) : null}

        {r.equipment.length ? (
          <Section title="Equipment">
            <RichText text={r.equipment.map(e => `• ${e}`).join('\n')} />
          </Section>
        ) : null}

        <Section title="Steps" aside={`${r.steps.length} steps`}>
          <View style={{ gap: 8 }}>
            {r.steps.map((s, i) => {
              const showPhase = s.phase && s.phase !== r.steps[i - 1]?.phase;
              const done = i < p.step;
              return (
                <View key={i} style={{ gap: 8 }}>
                  {showPhase ? <View style={{ marginTop: 8, marginLeft: 4 }}><Label>{s.phase}</Label></View> : null}
                  <Pressable onPress={() => router.push({ pathname: '/cook/[id]', params: { id: r.id, step: String(i) } })}>
                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 12, borderRadius: th.radiusSm, backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line }}>
                      <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? th.c.accent : th.c.accentSoft }}>
                        {done ? <Icon name="checkmark" size={16} color={th.c.onAccent} /> : <Txt weight="black" size={14} color={th.c.accent}>{i + 1}</Txt>}
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Txt weight="black" size={16}>{s.title || convertUnits(plainText(s.text), units)}</Txt>
                        {s.title && s.text ? <Txt muted size={14} numberOfLines={2}>{convertUnits(plainText(s.text), units)}</Txt> : null}
                      </View>
                      {s.timers.length ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, backgroundColor: th.c.accentSoft }}>
                          <Icon name="timer-outline" size={13} color={th.c.accent} />
                          <Txt weight="black" size={12} color={th.c.accent}>{formatDuration(s.timers[0].minutes)}</Txt>
                        </View>
                      ) : null}
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </Section>

        {cooks.length ? (
          <Section title="Your cooks" aside={cooks.length > 3 ? `See all ${cooks.length}` : undefined} onAside={() => router.push({ pathname: '/journal', params: { recipe: r.id } })}>
            <View style={{ gap: 8 }}>
              {cooks.slice(0, 3).map(e => (
                <CookEntryRow key={e.id} entry={e} onPress={() => router.push({ pathname: '/journal', params: { recipe: r.id } })} />
              ))}
            </View>
          </Section>
        ) : null}

        {r.notes.length ? (
          <Section title="Notes & tips">
            <View style={{ gap: 8 }}>
              {r.notes.map((n, i) => (
                <View key={i} style={{ padding: 14, borderRadius: th.radiusSm, backgroundColor: th.c.soft }}><RichText text={n} size={15} /></View>
              ))}
            </View>
          </Section>
        ) : null}
      </ScrollView>

      <Dock onHeight={setDockH}>
        {!started ? <Btn variant="secondary" size="big" icon="basket-outline" title="Prep" onPress={() => router.push(`/prep/${r.id}`)} accessibilityLabel="Mise en place: get everything ready first" /> : null}
        <Btn
          grow
          size="big"
          icon="play"
          title={started ? `Continue · step ${p.step + 1} of ${r.steps.length}` : 'Start cooking'}
          onPress={() => router.push({ pathname: '/cook/[id]', params: { id: r.id, step: String(started ? p.step : 0) } })}
        />
      </Dock>
      {folders ? <CollectionSheet recipe={r} visible onClose={() => setFolders(false)} /> : null}
      {readyBy ? <ReadyBySheet recipe={r} visible onClose={() => setReadyBy(false)} /> : null}
      <PlanSheet recipeId={r.id} title={r.title} visible={planning} onClose={() => setPlanning(false)} />
    </Screen>
  );
}

function Section({ title, aside, onAside, children }: { title: string; aside?: string; onAside?: () => void; children: React.ReactNode }) {
  const th = useTheme();
  return (
    <View style={{ marginTop: 28, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Txt kind="head" weight="bold" size={23}>{title}</Txt>
        {aside ? (onAside ? <Pressable onPress={onAside} hitSlop={8}><Txt weight="bold" size={14} color={th.c.accent}>{aside}</Txt></Pressable> : <Txt muted size={14}>{aside}</Txt>) : null}
      </View>
      {children}
    </View>
  );
}
