// Meal planner: a week at a time (Monday to Sunday), breakfast / lunch / dinner for each day.
// Fill a slot with a saved recipe or a note, then send the whole week's ingredients to the
// shopping list in one go. Sous can suggest a plan once it's connected.
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { DishArt } from '../components/art/dish-art';
import { Btn, Card, Icon, IconBtn, Screen, TopBar, Txt } from '../components/ui';
import { AI_NAME } from '../lib/chat-store';
import { MEALS, dayKey, usePlanner, weekDays, type Meal } from '../lib/planner';
import { useShopping } from '../lib/shopping';
import { useApp } from '../lib/store';
import { artColor, useTheme } from '../lib/theme';

const QUICK = ['Leftovers', 'Eating out', 'Takeaway', 'Something simple'];

export default function PlannerScreen() {
  const th = useTheme();
  const { recipes, getRecipe, settings } = useApp();
  const { entries, add, remove, clearWeek } = usePlanner();
  const { addFromRecipe } = useShopping();
  const [today] = useState(() => new Date());
  const [offset, setOffset] = useState(0);
  const [slot, setSlot] = useState<{ date: string; meal: Meal } | null>(null);
  const [note, setNote] = useState('');
  const list = useRef<ScrollView>(null);
  const scrolled = useRef(false);

  const days = weekDays(today, offset);
  const keys = days.map(dayKey);
  const todayKey = dayKey(today);
  const week = entries.filter(e => keys.includes(e.date));
  const weekRecipes = week.map(e => (e.recipeId ? getRecipe(e.recipeId) : undefined)).filter((r): r is NonNullable<typeof r> => !!r);
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString([], opts);
  const range = `${fmt(days[0], { month: 'short', day: 'numeric' })} – ${fmt(days[6], { month: 'short', day: 'numeric' })}`;

  const pick = (item: { recipeId?: string; text?: string }) => {
    if (!slot) return;
    if (settings.haptics) Haptics.selectionAsync().catch(() => {});
    add(slot.date, slot.meal, item);
    setSlot(null);
    setNote('');
  };

  const toShopping = () => {
    if (!weekRecipes.length) return;
    const n = weekRecipes.reduce((sum, r) => sum + addFromRecipe(r), 0);
    Alert.alert('Added to your shopping list', `${n} ingredients from ${weekRecipes.length} ${weekRecipes.length === 1 ? 'recipe' : 'recipes'}. Matching items are combined.`, [
      { text: 'OK', style: 'cancel' },
      { text: 'View list', onPress: () => router.push('/shopping') },
    ]);
  };

  const askSous = () => {
    const names = recipes.slice(0, 12).map(r => r.title).join(', ');
    router.navigate({ pathname: '/chat', params: { draft: `Plan my meals for the week of ${range}.${names ? ` I have these recipes saved: ${names}.` : ''} ` } });
  };

  const more = () =>
    Alert.alert('This week', range, [
      { text: 'Clear this week', style: 'destructive', onPress: () => clearWeek(keys) },
      { text: 'Cancel', style: 'cancel' },
    ]);

  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <Txt kind="head" weight="bold" size={19} style={{ flex: 1, paddingLeft: 4 }}>Meal plan</Txt>
        {week.length ? <IconBtn name="ellipsis-horizontal" label="More" onPress={more} /> : null}
      </TopBar>

      <ScrollView ref={list} contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 48, gap: 12 }}>
        {/* Week switcher */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <IconBtn name="chevron-back" label="Previous week" onPress={() => setOffset(o => o - 1)} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Txt weight="black" size={17}>{offset === 0 ? 'This week' : offset === 1 ? 'Next week' : offset === -1 ? 'Last week' : range}</Txt>
            <Txt muted size={13}>{range}</Txt>
          </View>
          <IconBtn name="chevron-forward" label="Next week" onPress={() => setOffset(o => o + 1)} />
        </View>

        {days.map((d, i) => {
          const key = keys[i];
          const isToday = key === todayKey;
          return (
            <Card key={key} onLayout={isToday ? e => {
              // Open on today rather than Monday.
              if (scrolled.current) return;
              scrolled.current = true;
              list.current?.scrollTo({ y: Math.max(0, e.nativeEvent.layout.y - 70), animated: false });
            } : undefined} style={[{ padding: 14, gap: 6 }, isToday && { borderColor: th.c.accent, borderWidth: 2 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <Txt weight="black" size={16}>{fmt(d, { weekday: 'long' })}</Txt>
                <Txt muted size={14}>{fmt(d, { month: 'short', day: 'numeric' })}</Txt>
                {isToday ? <View style={{ paddingHorizontal: 8, paddingVertical: 1, borderRadius: 999, backgroundColor: th.c.accent }}><Txt weight="black" size={11} color={th.c.onAccent}>TODAY</Txt></View> : null}
              </View>
              {MEALS.map(([meal, label]) => {
                const here = entries.filter(e => e.date === key && e.meal === meal);
                return (
                  <View key={meal} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 40 }}>
                    <Txt muted weight="bold" size={13} style={{ width: 74 }}>{label}</Txt>
                    <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                      {here.map(e => {
                        const r = e.recipeId ? getRecipe(e.recipeId) : undefined;
                        const title = r?.title ?? e.text ?? 'Removed recipe';
                        return (
                          <Pressable key={e.id} onPress={() => r && router.push(`/recipe/${r.id}`)} onLongPress={() => remove(e.id)}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: r ? 3 : 12, paddingRight: 4, height: 34, borderRadius: 17, backgroundColor: r ? th.c.accentSoft : th.c.soft, maxWidth: '100%' }}>
                            {r ? <View style={{ width: 28, height: 28, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: artColor(r.title, th.dark) }}><DishArt title={r.title} width={30} still /></View> : null}
                            <Txt weight="bold" size={14} numberOfLines={1} style={{ flexShrink: 1 }}>{title}</Txt>
                            <Pressable onPress={() => remove(e.id)} hitSlop={8} accessibilityLabel={`Remove ${title}`}><Icon name="close-circle" size={18} color={th.c.muted} /></Pressable>
                          </Pressable>
                        );
                      })}
                      <Pressable onPress={() => setSlot({ date: key, meal })} accessibilityLabel={`Add ${label.toLowerCase()} on ${fmt(d, { weekday: 'long' })}`} hitSlop={4}
                        style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderStyle: 'dashed', borderColor: th.c.line }}>
                        <Icon name="add" size={18} color={th.c.muted} />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </Card>
          );
        })}

        <Btn title={weekRecipes.length ? `Add the week to my shopping list` : 'Plan some recipes to shop for them'} icon="cart-outline" disabled={!weekRecipes.length} onPress={toShopping} />
        <Btn title={`Plan my week with ${AI_NAME}`} icon="sparkles-outline" variant="secondary" onPress={askSous} />
        <Txt muted size={12} style={{ textAlign: 'center' }}>Tip: long-press a meal to remove it.</Txt>
      </ScrollView>

      {/* Pick what goes in a slot */}
      <Modal visible={!!slot} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSlot(null)}>
        <View style={{ flex: 1, backgroundColor: th.c.bg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
            <Txt kind="head" weight="bold" size={22} style={{ flex: 1 }}>
              {slot ? `${MEALS.find(([m]) => m === slot.meal)?.[1]} · ${new Date(`${slot.date}T12:00:00`).toLocaleDateString([], { weekday: 'long' })}` : ''}
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
