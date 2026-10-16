// Timers tab, iPhone Clock style: running timers as a list (＋ to add another), each with a small
// Ring / Clock / Sand face (tap it to switch style) and its own pause button. Tap a timer for details.
// With no timers running, the picker shows right here.
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useBottomTabBarHeight } from 'expo-router/js-tabs';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { EditMinus, SwipeRow } from '../../components/swipe-row';
import { NEXT_STYLE, TimerFace, type TimerStyle } from '../../components/timer-face';
import { TimerPicker } from '../../components/timer-picker';
import { Icon, IconBtn, Screen, TopBar, Txt, clock } from '../../components/ui';
import { useApp, useTimers, type KitchenTimer } from '../../lib/store';
import { useTheme } from '../../lib/theme';

export default function TimersTab() {
  const th = useTheme();
  const tabBarH = useBottomTabBarHeight();
  const { settings } = useApp();
  const { timers, removeTimer } = useTimers();
  const [editing, setEditing] = useState(false);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [wheelActive, setWheelActive] = useState(false);
  const running = timers.length > 0;

  return (
    <Screen>
      <TopBar>
        {running ? (
          <Pressable onPress={() => { setEditing(e => !e); setRevealed(null); }} hitSlop={8} style={{ marginLeft: 8, paddingHorizontal: 16, height: 38, borderRadius: 19, justifyContent: 'center', backgroundColor: th.c.soft }}>
            <Txt weight="black">{editing ? 'Done' : 'Edit'}</Txt>
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }} />
        {running ? <IconBtn name="add" label="Add another timer" tinted onPress={() => router.push('/timer-new')} /> : null}
      </TopBar>

      <ScrollView scrollEnabled={!wheelActive} contentContainerStyle={{ paddingBottom: tabBarH + 24 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <Txt kind="head" weight="bold" size={34} style={{ paddingHorizontal: 16, paddingBottom: 8 }}>Timers</Txt>
        {running ? (
          <View style={{ borderTopWidth: 1, borderTopColor: th.c.line }}>
            {timers.map(t => (
              <SwipeRow key={t.id} haptics={settings.haptics} onDelete={() => removeTimer(t.id)} revealed={revealed === t.id} onRevealChange={open => setRevealed(open ? t.id : null)}>
                <TimerRow t={t} editing={editing} onMinus={() => setRevealed(t.id)} />
              </SwipeRow>
            ))}
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16 }}>
            <TimerPicker onWheelActive={setWheelActive} />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function TimerRow({ t, editing, onMinus }: { t: KitchenTimer; editing: boolean; onMinus: () => void }) {
  const th = useTheme();
  const { settings, updateSettings } = useApp();
  const { remaining, togglePause, removeTimer } = useTimers();
  const paused = t.pausedLeft != null;
  const style = settings.timerStyle as TimerStyle;

  const cycleStyle = () => {
    if (settings.haptics) Haptics.selectionAsync().catch(() => {});
    updateSettings({ timerStyle: NEXT_STYLE[style] });
  };

  return (
    <Pressable onPress={() => !editing && router.push(`/timer/${t.id}`)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: th.c.line, backgroundColor: pressed ? th.c.soft : th.c.bg })}>
      {editing && <EditMinus onPress={onMinus} />}
      <View style={{ flex: 1 }}>
        <Txt kind="head" size={t.done ? 34 : 50} color={t.done ? th.c.accent : paused ? th.c.muted : th.c.text} style={{ fontVariant: ['tabular-nums'], lineHeight: t.done ? 44 : 58 }} numberOfLines={1} adjustsFontSizeToFit>
          {t.done ? "Time's up!" : clock(remaining(t))}
        </Txt>
        <Txt muted weight="bold" numberOfLines={1}>{t.recipeTitle ? `${t.label} · ${t.recipeTitle}` : t.label}</Txt>
      </View>
      {!editing && (
        <>
          <Pressable onPress={cycleStyle} accessibilityRole="button" accessibilityLabel="Switch timer style" hitSlop={4}>
            <TimerFace t={t} size={62} mini style={style} />
          </Pressable>
          {t.done ? (
            <Pressable onPress={() => removeTimer(t.id)} accessibilityRole="button" accessibilityLabel="Stop timer" style={{ width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accent }}>
              <Icon name="stop" size={22} color={th.c.onAccent} />
            </Pressable>
          ) : (
            <Pressable onPress={() => togglePause(t.id)} accessibilityRole="button" accessibilityLabel={paused ? 'Resume timer' : 'Pause timer'} style={({ pressed }) => ({ width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accentSoft, opacity: pressed ? 0.7 : 1 })}>
              <Icon name={paused ? 'play' : 'pause'} size={24} color={th.c.accent} />
            </Pressable>
          )}
        </>
      )}
    </Pressable>
  );
}
