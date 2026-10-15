// "Ready by…": pick when you want to eat and see when to start each step, with an optional
// reminder when it's time to begin.
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { scheduleStartReminder } from '../lib/reminders';
import { useApp, type Recipe } from '../lib/store';
import { useTheme } from '../lib/theme';
import { clockTime, schedule } from '../lib/timeline';
import { formatDuration } from '../shared/parser';
import { Btn, Icon, IconBtn, Txt } from './ui';

const STEP = 15 * 60_000;

// The next "nice" dinner time: 7 PM today, or an hour after the earliest possible finish.
function firstGuess(totalMin: number) {
  const now = new Date();
  const seven = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0);
  const earliest = Math.ceil((now.getTime() + totalMin * 60_000) / STEP) * STEP;
  return seven.getTime() >= earliest ? seven : new Date(Math.ceil((earliest + 30 * 60_000) / STEP) * STEP);
}

export function ReadyBySheet({ recipe: r, visible, onClose }: { recipe: Recipe; visible: boolean; onClose: () => void }) {
  const th = useTheme();
  const { settings } = useApp();
  const total = schedule(r, new Date()).total;
  const [readyAt, setReadyAt] = useState(() => firstGuess(total));
  const plan = schedule(r, readyAt);
  const [now] = useState(() => Date.now());
  const late = plan.start.getTime() < now;
  const day = (d: Date) => {
    const today = new Date(now);
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    if (d.toDateString() === today.toDateString()) return 'today';
    if (d.toDateString() === tomorrow.toDateString()) return 'tomorrow';
    return d.toLocaleDateString([], { weekday: 'long' });
  };

  const shift = (ms: number) => {
    if (settings.haptics) Haptics.selectionAsync().catch(() => {});
    setReadyAt(d => new Date(Math.max(Math.ceil((now + total * 60_000) / STEP) * STEP, d.getTime() + ms)));
  };

  const remind = async () => {
    const ok = await scheduleStartReminder(r.id, r.title, plan.start, clockTime(readyAt));
    if (ok) Alert.alert('Reminder set', `We’ll remind you at ${clockTime(plan.start)} ${day(plan.start)}.`);
    else Alert.alert(Platform.OS === 'web' ? 'Reminders need the phone app' : 'Couldn’t set a reminder', Platform.OS === 'web' ? 'Open Mise on your phone to get a reminder.' : 'Allow notifications for Mise in your phone’s Settings, then try again.');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: th.c.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 8 }}>
          <View style={{ flex: 1 }}>
            <Txt kind="head" weight="bold" size={22}>Ready by…</Txt>
            <Txt muted numberOfLines={1}>{r.title} · about {formatDuration(total)}</Txt>
          </View>
          <IconBtn name="close" label="Close" onPress={onClose} />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 10 }}>
          <IconBtn tinted name="remove" label="15 minutes earlier" onPress={() => shift(-STEP)} />
          <View style={{ alignItems: 'center', minWidth: 150 }}>
            <Txt weight="black" size={40}>{clockTime(readyAt)}</Txt>
            <Txt muted weight="bold" size={14}>{day(readyAt)}</Txt>
          </View>
          <IconBtn tinted name="add" label="15 minutes later" onPress={() => shift(STEP)} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, paddingBottom: 8 }}>
          {[['−1 h', -4 * STEP], ['+1 h', 4 * STEP], ['+1 day', 96 * STEP]].map(([label, ms]) => (
            <Pressable key={label} onPress={() => shift(ms as number)} style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: th.c.soft }}>
              <Txt weight="bold" size={14}>{label}</Txt>
            </Pressable>
          ))}
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 0 }}>
          <View style={{ padding: 14, borderRadius: th.radiusSm, backgroundColor: late ? th.c.soft : th.c.accentSoft, marginBottom: 14, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Icon name={late ? 'alert-circle-outline' : 'alarm-outline'} size={22} color={late ? th.c.temp : th.c.accent} />
            <Txt weight="bold" style={{ flex: 1 }}>{late ? 'That’s too soon. Move the time later.' : `Start at ${clockTime(plan.start)} ${day(plan.start)}`}</Txt>
          </View>
          {plan.slots.map(s => (
            <View key={s.index} style={{ flexDirection: 'row', gap: 12 }}>
              <Txt weight="black" size={14} style={{ width: 74, textAlign: 'right', paddingTop: 1 }}>{clockTime(s.at)}</Txt>
              <View style={{ alignItems: 'center' }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, marginTop: 5, backgroundColor: th.c.accent }} />
                <View style={{ flex: 1, width: 2, backgroundColor: th.c.line }} />
              </View>
              <View style={{ flex: 1, paddingBottom: 16 }}>
                <Txt weight="bold" size={15}>{s.index + 1}. {s.title}</Txt>
                <Txt muted size={13}>{formatDuration(s.minutes)}</Txt>
              </View>
            </View>
          ))}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Txt weight="black" size={14} color={th.c.accent} style={{ width: 74, textAlign: 'right' }}>{clockTime(readyAt)}</Txt>
            <View style={{ marginTop: 2 }}><Icon name="restaurant" size={14} color={th.c.accent} /></View>
            <Txt weight="black" size={15} color={th.c.accent}>Ready to eat</Txt>
          </View>
          <Txt muted size={12} style={{ marginTop: 16 }}>Times are estimates from the recipe’s timers, with about 5 minutes for each hands-on step.</Txt>
        </ScrollView>

        <View style={{ padding: 16, paddingTop: 8 }}>
          <Btn size="big" icon="notifications-outline" title={`Remind me at ${clockTime(plan.start)}`} disabled={late} onPress={remind} />
        </View>
      </View>
    </Modal>
  );
}
