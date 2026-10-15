// "Add to meal plan" from a recipe: pick a day in the next two weeks and a meal.
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, View } from 'react-native';
import { MEALS, dayKey, usePlanner, type Meal } from '../lib/planner';
import { useApp } from '../lib/store';
import { useTheme } from '../lib/theme';
import { SlidingChoice } from './sliding-choice';
import { Btn, IconBtn, Txt } from './ui';

export function PlanSheet({ recipeId, title, visible, onClose }: { recipeId: string; title: string; visible: boolean; onClose: () => void }) {
  const th = useTheme();
  const { settings } = useApp();
  const { add } = usePlanner();
  const [days] = useState(() => {
    const now = new Date();
    return Array.from({ length: 14 }, (_, i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + i));
  });
  const [day, setDay] = useState(() => dayKey(days[0]));
  const [meal, setMeal] = useState<Meal>(() => (new Date().getHours() < 11 ? 'breakfast' : new Date().getHours() < 15 ? 'lunch' : 'dinner'));

  const save = () => {
    if (settings.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    add(day, meal, { recipeId });
    onClose();
    const d = days.find(x => dayKey(x) === day) ?? days[0];
    const when = day === dayKey(days[0]) ? 'today' : day === dayKey(days[1]) ? 'tomorrow' : d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    Alert.alert('Added to your meal plan', `${title} for ${MEALS.find(([m]) => m === meal)?.[1].toLowerCase()} ${when}.`, [
      { text: 'OK', style: 'cancel' },
      { text: 'View plan', onPress: () => router.push('/planner') },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: th.c.bg, padding: 16, gap: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Txt kind="head" weight="bold" size={22}>Add to meal plan</Txt>
            <Txt muted numberOfLines={1}>{title}</Txt>
          </View>
          <IconBtn name="close" label="Close" onPress={onClose} />
        </View>

        <View style={{ gap: 10 }}>
          <Txt muted weight="black" size={13} style={{ letterSpacing: 0.5 }}>DAY</Txt>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {days.map((d, i) => {
              const key = dayKey(d);
              const on = key === day;
              return (
                <Pressable key={key} onPress={() => setDay(key)} accessibilityState={{ selected: on }}
                  style={{ width: 62, paddingVertical: 10, borderRadius: 18, alignItems: 'center', gap: 2, backgroundColor: on ? th.c.accent : th.c.surface, borderWidth: 1, borderColor: on ? th.c.accent : th.c.line }}>
                  <Txt weight="bold" size={12} color={on ? th.c.onAccent : th.c.muted}>{i === 0 ? 'Today' : d.toLocaleDateString([], { weekday: 'short' })}</Txt>
                  <Txt weight="black" size={20} color={on ? th.c.onAccent : th.c.text}>{d.getDate()}</Txt>
                  <Txt size={11} color={on ? th.c.onAccent : th.c.muted}>{d.toLocaleDateString([], { month: 'short' })}</Txt>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={{ gap: 10 }}>
          <Txt muted weight="black" size={13} style={{ letterSpacing: 0.5 }}>MEAL</Txt>
          <SlidingChoice options={MEALS} value={meal} onChange={v => setMeal(v as Meal)} height={44} />
        </View>

        <View style={{ flex: 1 }} />
        <Btn size="big" icon="calendar-outline" title="Add to plan" onPress={save} />
      </View>
    </Modal>
  );
}
