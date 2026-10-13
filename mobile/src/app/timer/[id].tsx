// One timer, big: the face (tap to switch Ring / Clock / Sand), when it ends,
// Cancel / Pause, and its Label and alarm tone.
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View, useWindowDimensions } from 'react-native';
import { ToneRow, ToneSheet } from '../../components/tone-sheet';
import { RoundButton } from '../../components/timer-picker';
import { IconBtn, Icon, Screen, TopBar, Txt } from '../../components/ui';
import { useApp, useTimers } from '../../lib/store';
import { useTheme } from '../../lib/theme';
import { NEXT_STYLE, TimerFace, durationWords, type TimerStyle } from '../../components/timer-face';

export default function TimerDetail() {
  const th = useTheme();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { settings, updateSettings } = useApp();
  const { timers, togglePause, removeTimer, addTime, renameTimer } = useTimers();
  const [tones, setTones] = useState(false);
  const t = timers.find(x => x.id === id);
  const [label, setLabel] = useState(t?.label ?? '');

  if (!t) {
    return (
      <Screen>
        <TopBar><IconBtn name="chevron-back" label="Back" onPress={() => router.back()} /></TopBar>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Txt muted>This timer has finished.</Txt></View>
      </Screen>
    );
  }

  const paused = t.pausedLeft != null;
  const style = settings.timerStyle as TimerStyle;
  const endsAt = new Date(t.endAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return (
    <Screen>
      <TopBar>
        <IconBtn name="chevron-back" label="Back" tinted onPress={() => router.back()} />
        <Txt weight="black" size={17} style={{ flex: 1, textAlign: 'center' }} numberOfLines={1}>{durationWords(t.total)}</Txt>
        <View style={{ width: 44 }} />
      </TopBar>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 22, alignItems: 'center' }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <Pressable onPress={() => { if (settings.haptics) Haptics.selectionAsync().catch(() => {}); updateSettings({ timerStyle: NEXT_STYLE[style] }); }} accessibilityLabel="Switch timer style" style={{ alignItems: 'center' }}>
          <TimerFace t={t} size={Math.min(width - 72, 300)} style={style} />
        </Pressable>
        {!t.done && !paused ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -8 }}>
            <Icon name="notifications" size={15} color={th.c.muted} />
            <Txt muted weight="bold">Ends at {endsAt}</Txt>
          </View>
        ) : null}
        <Txt muted size={12}>Tap the timer to switch between Ring, Clock and Sand</Txt>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', alignSelf: 'stretch', paddingHorizontal: 4 }}>
          <RoundButton label={t.done ? 'Stop' : 'Cancel'} onPress={() => { removeTimer(t.id); router.back(); }} primary={t.done} />
          <Pressable onPress={() => addTime(t.id, 1)} style={({ pressed }) => ({ paddingHorizontal: 18, height: 40, borderRadius: 999, justifyContent: 'center', backgroundColor: th.c.soft, opacity: pressed ? 0.7 : 1 })}>
            <Txt weight="black" size={14}>+1 min</Txt>
          </Pressable>
          {t.done
            ? <RoundButton label="+5 min" onPress={() => addTime(t.id, 5)} />
            : <RoundButton label={paused ? 'Resume' : 'Pause'} icon={paused ? 'play' : 'pause'} primary onPress={() => togglePause(t.id)} />}
        </View>

        <View style={{ alignSelf: 'stretch', borderRadius: 18, backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 }}>
            <Txt weight="bold">Label</Txt>
            <TextInput value={label} onChangeText={setLabel} onEndEditing={() => renameTimer(t.id, label)} placeholder="Timer" placeholderTextColor={th.c.muted} maxLength={60} returnKeyType="done"
              style={[{ flex: 1, textAlign: 'right', color: th.c.text, fontSize: th.fs(16), paddingVertical: 15 }, th.f('body')]} />
          </View>
          <ToneRow onPress={() => setTones(true)} last />
        </View>
        {t.recipeId ? (
          <Pressable onPress={() => router.push(`/recipe/${t.recipeId}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="book-outline" size={16} color={th.c.accent} />
            <Txt weight="bold" color={th.c.accent}>Open {t.recipeTitle}</Txt>
          </Pressable>
        ) : null}
      </ScrollView>
      <ToneSheet visible={tones} onClose={() => setTones(false)} />
    </Screen>
  );
}
