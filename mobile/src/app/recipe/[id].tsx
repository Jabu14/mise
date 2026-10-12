// Recipe overview: servings, ingredient checklist, steps, notes.
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { IngredientList, ingCountText, servingsLabel, scaleBy } from '../../components/recipe';
import { Btn, Card, Chip, Dock, Icon, IconBtn, Label, RichText, Screen, TopBar, Txt } from '../../components/ui';
import { formatDuration, plainText } from '../../shared/parser';
import { useApp } from '../../lib/store';
import { artColor, useTheme } from '../../lib/theme';

export default function RecipeScreen() {
  const th = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getRecipe, patchRecipe, setProgress, deleteRecipe } = useApp();
  const r = getRecipe(id);
  const [dockH, setDockH] = useState(0);

  useEffect(() => { if (id) patchRecipe(id, { lastOpened: Date.now() }); }, [id, patchRecipe]);

  if (!r) return <Screen><TopBar><IconBtn name="arrow-back" label="Back" onPress={() => router.back()} /></TopBar></Screen>;

  const p = r.progress;
  const started = p.step > 0 && p.step < r.steps.length;

  const confirmDelete = () =>
    Alert.alert('Delete this recipe?', `“${r.title}” will be removed from this phone.`, [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteRecipe(r.id); router.back(); } },
    ]);

  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="All recipes" onPress={() => router.back()} />
        <View style={{ flex: 1 }} />
        <IconBtn name="create-outline" label="Edit recipe" onPress={() => router.push(`/edit/${r.id}`)} />
        <IconBtn name="trash-outline" label="Delete recipe" onPress={confirmDelete} />
      </TopBar>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: dockH + 24 }}>
        <View style={{ alignItems: 'center', gap: 10 }}>
          <View style={{ width: 96, height: 96, borderRadius: 30, backgroundColor: artColor(r.title, th.dark), alignItems: 'center', justifyContent: 'center' }}>
            <Txt size={50} style={{ lineHeight: 62 }}>{r.emoji}</Txt>
          </View>
          <Txt kind="head" weight="bold" size={32} style={{ textAlign: 'center' }}>{r.title}</Txt>
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
        </View>

        <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, paddingVertical: 10, paddingLeft: 18, paddingRight: 10 }}>
          <View>
            <Label color={th.c.muted}>{r.servings?.count ? 'Makes' : 'Recipe size'}</Label>
            <Txt weight="black" size={18}>{servingsLabel(r)}</Txt>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <IconBtn tinted name="remove" label="Make less" onPress={() => setProgress(r.id, { scale: scaleBy(r, -1) })} />
            <IconBtn tinted name="add" label="Make more" onPress={() => setProgress(r.id, { scale: scaleBy(r, 1) })} />
          </View>
        </Card>

        {r.ingredients.length ? (
          <Section title="Ingredients" aside={ingCountText(r)}>
            <IngredientList recipe={r} />
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
                        <Txt weight="black" size={16}>{s.title || plainText(s.text)}</Txt>
                        {s.title && s.text ? <Txt muted size={14} numberOfLines={2}>{plainText(s.text)}</Txt> : null}
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
        <Btn
          grow
          size="big"
          icon="play"
          title={started ? `Continue · step ${p.step + 1} of ${r.steps.length}` : 'Start cooking'}
          onPress={() => router.push({ pathname: '/cook/[id]', params: { id: r.id, step: String(started ? p.step : 0) } })}
        />
      </Dock>
    </Screen>
  );
}

function Section({ title, aside, children }: { title: string; aside?: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 28, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Txt kind="head" weight="bold" size={23}>{title}</Txt>
        {aside ? <Txt muted size={14}>{aside}</Txt> : null}
      </View>
      {children}
    </View>
  );
}
