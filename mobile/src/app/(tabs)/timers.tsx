// Timers tab: every running timer in one place, plus quick timers that don't need a recipe.
import { router } from 'expo-router';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { Card, Dock, Icon, IconBtn, Label, Screen, TopBar, Txt, clock } from '../../components/ui';
import { formatDuration } from '../../shared/parser';
import { useTimers, type KitchenTimer } from '../../lib/store';
import { useTheme } from '../../lib/theme';

const QUICK = [1, 3, 5, 10, 15, 20, 30, 45, 60, 90];

export default function TimersTab() {
  const th = useTheme();
  const { timers, startTimer } = useTimers();
  const { width } = useWindowDimensions();
  const tile = Math.floor((Math.min(width, 680) - 32 - 4 * 8) / 5);

  const quick = (minutes: number) =>
    startTimer({ minutes, label: `${formatDuration(minutes)} timer` });

  return (
    <Screen>
      <TopBar>
        <Txt kind="head" weight="bold" size={30} style={{ flex: 1, paddingLeft: 8 }}>Timers</Txt>
      </TopBar>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 32, gap: 12 }}>
        {timers.length ? (
          timers.map(t => <TimerCard key={t.id} t={t} />)
        ) : (
          <Card style={{ padding: 22, alignItems: 'center', gap: 8 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accentSoft }}>
              <Icon name="timer-outline" size={32} color={th.c.accent} />
            </View>
            <Txt weight="black" size={17}>No timers running</Txt>
            <Txt muted size={14} style={{ textAlign: 'center' }}>
              Start one from a recipe step, or tap a quick timer below. Alarms ring even when your phone is locked.
            </Txt>
          </Card>
        )}

        <View style={{ marginTop: 16, gap: 10 }}>
          <Label color={th.c.muted}>Quick timer</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {QUICK.map(m => (
              <Pressable
                key={m}
                onPress={() => quick(m)}
                accessibilityLabel={`Start a ${formatDuration(m)} timer`}
                style={({ pressed }) => ({ width: tile, height: tile, borderRadius: th.radiusSm, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? th.c.accentSoft : th.c.surface, borderWidth: 1, borderColor: th.c.line })}
              >
                <Txt kind="head" weight="bold" size={20} color={th.c.accent}>{m >= 60 ? String(m / 60).replace('.5', '½') : m}</Txt>
                <Txt muted size={11} weight="bold">{m >= 60 ? (m === 60 ? 'hour' : 'hours') : 'min'}</Txt>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <Dock hideTimers />
    </Screen>
  );
}

function TimerCard({ t }: { t: KitchenTimer }) {
  const th = useTheme();
  const { remaining, togglePause, addTime, removeTimer } = useTimers();
  const left = remaining(t);
  const paused = t.pausedLeft != null;
  const progress = t.total ? Math.min(1, Math.max(0, 1 - left / t.total)) : 0;
  const fg = t.done ? th.c.onAccent : th.c.text;

  return (
    <Card style={[{ padding: 18, gap: 14 }, t.done && { backgroundColor: th.c.accent, borderColor: th.c.accent }]}>
      <Pressable onPress={() => t.recipeId && router.push(`/recipe/${t.recipeId}`)} disabled={!t.recipeId}>
        <Txt size={13} color={fg} style={{ opacity: 0.7 }} numberOfLines={1}>{t.recipeTitle || 'Quick timer'}</Txt>
        <Txt weight="black" size={18} color={fg} numberOfLines={2}>{t.label}</Txt>
      </Pressable>

      <Txt kind="head" weight="bold" size={52} color={t.done ? fg : paused ? th.c.muted : th.c.accent} style={{ fontVariant: ['tabular-nums'], lineHeight: 60 }}>
        {t.done ? "Time's up!" : clock(left)}
      </Txt>

      {!t.done && (
        <View style={{ height: 6, borderRadius: 999, backgroundColor: th.c.soft, overflow: 'hidden' }}>
          <View style={{ width: `${progress * 100}%`, height: '100%', borderRadius: 999, backgroundColor: paused ? th.c.muted : th.c.accent }} />
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {t.done ? (
          <>
            <Pill label="Stop" onPress={() => removeTimer(t.id)} solid />
            <Pill label="+1 min" onPress={() => addTime(t.id, 1)} />
            <Pill label="+5 min" onPress={() => addTime(t.id, 5)} />
          </>
        ) : (
          <>
            <IconBtn tinted name={paused ? 'play' : 'pause'} label={paused ? 'Resume' : 'Pause'} onPress={() => togglePause(t.id)} />
            <Pill label="+1 min" onPress={() => addTime(t.id, 1)} />
            <Pill label="+5 min" onPress={() => addTime(t.id, 5)} />
            <View style={{ flex: 1 }} />
            <IconBtn name="trash-outline" label="Cancel timer" color={th.c.muted} onPress={() => removeTimer(t.id)} />
          </>
        )}
      </View>
    </Card>
  );
}

function Pill({ label, onPress, solid }: { label: string; onPress: () => void; solid?: boolean }) {
  const th = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ paddingHorizontal: 16, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: solid ? th.c.onAccent : th.c.accentSoft, opacity: pressed ? 0.7 : 1 })}>
      <Txt weight="black" size={14} color={th.c.accent}>{label}</Txt>
    </Pressable>
  );
}
