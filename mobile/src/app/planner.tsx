// Meal planner as a normal calendar: a month grid (swipe or use the arrows to change month), dots on
// days with something planned, and tapping a day shows its breakfast / lunch / dinner below. Fill a
// meal with a saved recipe or a note, then send that week's ingredients to the shopping list.
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, PanResponder, Pressable, ScrollView, TextInput, View } from 'react-native';
import { DishArt } from '../components/art/dish-art';
import { Btn, Card, Icon, IconBtn, Screen, TopBar, Txt } from '../components/ui';
import { AI_NAME } from '../lib/chat-store';
import { MEALS, dayKey, usePlanner, weekDays, type Meal } from '../lib/planner';
import { useShopping } from '../lib/shopping';
import { useApp } from '../lib/store';
import { artColor, useTheme } from '../lib/theme';
import { showAlert } from '../components/sheet';

const QUICK = ['Leftovers', 'Eating out', 'Takeaway', 'Something simple'];
const MEAL_ICON = { breakfast: 'sunny-outline', lunch: 'partly-sunny-outline', dinner: 'moon-outline' } as const;
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// The 6 weeks (Monday first) that show a month, including the spill-over days around it.
function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - ((first.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

export default function PlannerScreen() {
  const th = useTheme();
  const { recipes, getRecipe, settings } = useApp();
  const { entries, add, remove, clearWeek } = usePlanner();
  const { addFromRecipe } = useShopping();
  const [today] = useState(() => new Date());
  const [view, setView] = useState(() => ({ y: today.getFullYear(), m: today.getMonth() }));
  const [selected, setSelected] = useState(() => dayKey(today));
  const [slot, setSlot] = useState<Meal | null>(null);
  const [note, setNote] = useState('');

  const todayKey = dayKey(today);
  const sel = new Date(`${selected}T12:00:00`);
  const grid = monthGrid(view.y, view.m);
  const rows = grid.slice(35).every(d => d.getMonth() !== view.m) ? 5 : 6;
  const planned = new Map<string, Set<Meal>>();
  entries.forEach(e => { if (!planned.has(e.date)) planned.set(e.date, new Set()); planned.get(e.date)!.add(e.meal); });

  const week = weekDays(sel).map(dayKey);
  const weekRecipes = entries.filter(e => week.includes(e.date)).map(e => (e.recipeId ? getRecipe(e.recipeId) : undefined)).filter((r): r is NonNullable<typeof r> => !!r);
  const dayEntries = entries.filter(e => e.date === selected);
  const monthTitle = new Date(view.y, view.m, 1).toLocaleDateString([], { month: 'long', year: 'numeric' });

  const tick = () => { if (settings.haptics) Haptics.selectionAsync().catch(() => {}); };
  const shiftMonth = (n: number) => { tick(); setView(v => { const d = new Date(v.y, v.m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; }); };
  const choose = (d: Date) => {
    tick();
    setSelected(dayKey(d));
    if (d.getMonth() !== view.m) setView({ y: d.getFullYear(), m: d.getMonth() });
  };
  const goToday = () => { tick(); setSelected(todayKey); setView({ y: today.getFullYear(), m: today.getMonth() }); };

  // Swipe the grid left / right for the next / previous month.
  const swipe = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 18 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
    onPanResponderRelease: (_, g) => { if (Math.abs(g.dx) > 50) shiftMonth(g.dx < 0 ? 1 : -1); },
  });

  const pick = (item: { recipeId?: string; text?: string }) => {
    if (!slot) return;
    tick();
    add(selected, slot, item);
    setSlot(null);
    setNote('');
  };

  const toShopping = () => {
    if (!weekRecipes.length) return;
    const n = weekRecipes.reduce((sum, r) => sum + addFromRecipe(r), 0);
    showAlert('Added to your shopping list', `${n} ingredients from ${weekRecipes.length} ${weekRecipes.length === 1 ? 'recipe' : 'recipes'}. Matching items are combined.`, [
      { text: 'OK', style: 'cancel' },
      { text: 'View list', onPress: () => router.push('/shopping') },
    ]);
  };

  const askSous = () => {
    const names = recipes.slice(0, 12).map(r => r.title).join(', ');
    const from = new Date(`${week[0]}T12:00:00`).toLocaleDateString([], { month: 'short', day: 'numeric' });
    router.navigate({ pathname: '/chat', params: { draft: `Plan my meals for the week of ${from}.${names ? ` I have these recipes saved: ${names}.` : ''} ` } });
  };

  const more = () =>
    showAlert(sel.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }), undefined, [
      ...(dayEntries.length ? [{ text: 'Clear this day', style: 'destructive' as const, onPress: () => clearWeek([selected]) }] : []),
      { text: 'Clear this week', style: 'destructive', onPress: () => clearWeek(week) },
      { text: 'Cancel', style: 'cancel' },
    ]);

  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <Txt kind="head" weight="bold" size={19} style={{ flex: 1, paddingLeft: 4 }}>Meal plan</Txt>
        {selected !== todayKey || view.m !== today.getMonth() || view.y !== today.getFullYear() ? (
          <Pressable onPress={goToday} hitSlop={6} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: th.c.accentSoft, marginRight: 4 }}>
            <Txt weight="black" size={13} color={th.c.accent}>Today</Txt>
          </Pressable>
        ) : null}
        <IconBtn name="ellipsis-horizontal" label="More" onPress={more} />
      </TopBar>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 48, gap: 14 }}>
        {/* Month */}
        <Card style={{ padding: 12, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Txt weight="black" size={18} style={{ flex: 1, paddingLeft: 6 }}>{monthTitle}</Txt>
            <IconBtn name="chevron-back" label="Previous month" size={38} onPress={() => shiftMonth(-1)} />
            <IconBtn name="chevron-forward" label="Next month" size={38} onPress={() => shiftMonth(1)} />
          </View>
          <View {...swipe.panHandlers}>
            <View style={{ flexDirection: 'row' }}>
              {WEEKDAYS.map((w, i) => (
                <Txt key={i} muted weight="bold" size={12} style={{ flex: 1, textAlign: 'center', paddingVertical: 4 }}>{w}</Txt>
              ))}
            </View>
            {Array.from({ length: rows }, (_, row) => (
              <View key={row} style={{ flexDirection: 'row' }}>
                {grid.slice(row * 7, row * 7 + 7).map(d => {
                  const key = dayKey(d);
                  const inMonth = d.getMonth() === view.m;
                  const isSel = key === selected;
                  const isToday = key === todayKey;
                  const meals = planned.get(key);
                  return (
                    <Pressable key={key} onPress={() => choose(d)} accessibilityRole="button" accessibilityState={{ selected: isSel }}
                      accessibilityLabel={`${d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}${meals ? `, ${meals.size} planned` : ''}`}
                      style={{ flex: 1, height: 48, alignItems: 'center', justifyContent: 'center' }}>
                      <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: isSel ? th.c.accent : 'transparent', borderWidth: isToday && !isSel ? 1.5 : 0, borderColor: th.c.accent }}>
                        <Txt weight={isSel || isToday ? 'black' : 'bold'} size={15} color={isSel ? th.c.onAccent : isToday ? th.c.accent : inMonth ? th.c.text : th.c.muted} style={{ opacity: inMonth || isSel ? 1 : 0.45 }}>{d.getDate()}</Txt>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 2, height: 5, marginTop: 1 }}>
                        {MEALS.filter(([m]) => meals?.has(m)).map(([m]) => (
                          <View key={m} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: th.c.accent, opacity: inMonth ? 1 : 0.45 }} />
                        ))}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </Card>

        {/* The chosen day */}
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
          <Txt kind="head" weight="bold" size={22}>{selected === todayKey ? 'Today' : sel.toLocaleDateString([], { weekday: 'long' })}</Txt>
          <Txt muted size={15}>{sel.toLocaleDateString([], { month: 'long', day: 'numeric' })}</Txt>
        </View>
        {MEALS.map(([meal, label]) => {
          const here = dayEntries.filter(e => e.meal === meal);
          return (
            <Card key={meal} style={{ padding: 12, gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon name={MEAL_ICON[meal]} size={20} color={th.c.accent} />
                <Txt weight="black" size={16} style={{ flex: 1 }}>{label}</Txt>
                <Pressable onPress={() => setSlot(meal)} accessibilityLabel={`Add ${label.toLowerCase()}`} hitSlop={6}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: th.c.accentSoft }}>
                  <Icon name="add" size={16} color={th.c.accent} />
                  <Txt weight="black" size={13} color={th.c.accent}>Add</Txt>
                </Pressable>
              </View>
              {here.length ? here.map(e => {
                const r = e.recipeId ? getRecipe(e.recipeId) : undefined;
                const title = r?.title ?? e.text ?? 'Removed recipe';
                return (
                  <Pressable key={e.id} onPress={() => r && router.push(`/recipe/${r.id}`)} onLongPress={() => remove(e.id)}
                    style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: th.radiusSm, backgroundColor: pressed ? th.c.soft : th.c.bg })}>
                    {r ? (
                      <View style={{ width: 40, height: 40, borderRadius: 10, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: artColor(r.title, th.dark) }}>
                        <DishArt title={r.title} width={40} still />
                      </View>
                    ) : (
                      <View style={{ width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.soft }}>
                        <Icon name="create-outline" size={18} color={th.c.muted} />
                      </View>
                    )}
                    <Txt weight="bold" size={15} numberOfLines={1} style={{ flex: 1 }}>{title}</Txt>
                    {r ? <Icon name="chevron-forward" size={16} color={th.c.muted} /> : null}
                    <Pressable onPress={() => remove(e.id)} hitSlop={8} accessibilityLabel={`Remove ${title}`}><Icon name="close-circle" size={20} color={th.c.muted} /></Pressable>
                  </Pressable>
                );
              }) : <Txt muted size={14} style={{ paddingLeft: 30 }}>Nothing planned</Txt>}
            </Card>
          );
        })}

        <Btn title={weekRecipes.length ? 'Add this week to my shopping list' : 'Plan recipes to shop for them'} icon="cart-outline" disabled={!weekRecipes.length} onPress={toShopping} style={{ marginTop: 6 }} />
        <Btn title={`Plan my week with ${AI_NAME}`} icon="sparkles-outline" variant="secondary" onPress={askSous} />
      </ScrollView>

      {/* Pick what goes in a meal */}
      <Modal visible={!!slot} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSlot(null)}>
        <View style={{ flex: 1, backgroundColor: th.c.bg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
            <Txt kind="head" weight="bold" size={22} style={{ flex: 1 }}>
              {slot ? `${MEALS.find(([m]) => m === slot)?.[1]} · ${sel.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}` : ''}
            </Txt>
            <IconBtn name="close" label="Close" onPress={() => setSlot(null)} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 14 }} keyboardShouldPersistTaps="handled">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 50, paddingLeft: 16, paddingRight: 6, borderRadius: 25, backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line }}>
              <TextInput value={note} onChangeText={setNote} placeholder="Type something, e.g. Pasta night" placeholderTextColor={th.c.muted} maxLength={80} returnKeyType="done" onSubmitEditing={() => pick({ text: note })}
                style={[{ flex: 1, minWidth: 0, color: th.c.text, fontSize: th.fs(16), paddingVertical: 0 }, th.f('body')]} />
              <Pressable onPress={() => pick({ text: note })} disabled={!note.trim()} style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: note.trim() ? th.c.accent : th.c.soft }}>
                <Icon name="checkmark" size={20} color={note.trim() ? th.c.onAccent : th.c.muted} />
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {QUICK.map(q => (
                <Pressable key={q} onPress={() => pick({ text: q })} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: th.c.soft }}>
                  <Txt weight="bold" size={14}>{q}</Txt>
                </Pressable>
              ))}
            </View>
            <Txt muted weight="black" size={13} style={{ letterSpacing: 0.5, marginTop: 6 }}>YOUR RECIPES</Txt>
            {recipes.length ? recipes.map(r => (
              <Pressable key={r.id} onPress={() => pick({ recipeId: r.id })}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 16, backgroundColor: pressed ? th.c.soft : th.c.surface, borderWidth: 1, borderColor: th.c.line })}>
                <View style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: artColor(r.title, th.dark) }}>
                  <DishArt title={r.title} width={46} still />
                </View>
                <Txt weight="bold" style={{ flex: 1 }} numberOfLines={1}>{r.title}</Txt>
                <Icon name="add-circle-outline" size={22} color={th.c.accent} />
              </Pressable>
            )) : <Txt muted>No saved recipes yet. Add one first, or type something above.</Txt>}
          </ScrollView>
        </View>
      </Modal>
    </Screen>
  );
}
