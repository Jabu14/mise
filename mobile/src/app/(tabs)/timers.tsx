// Timers tab: set a timer with iPhone-style wheels, watch it as a ring, clock or hourglass,
// and restart recent timers from the history at the bottom.
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View, useWindowDimensions } from 'react-native';
import { SwipeRow } from '../../components/swipe-row';
import { ClockFace, RingFace, SandFace, useSmoothNow, type FaceProps } from '../../components/timer-faces';
import { Card, Icon, Label, Screen, TopBar, Txt, clock, type IconName } from '../../components/ui';
import { DurationPicker } from '../../components/wheel-picker';
import { formatDuration } from '../../shared/parser';
import { useApp, useTimers, type KitchenTimer, type Settings, type TimerHistoryItem } from '../../lib/store';
import { useTheme } from '../../lib/theme';

const STYLES: { key: Settings['timerStyle']; label: string; icon: IconName }[] = [
  { key: 'ring', label: 'Ring', icon: 'ellipse-outline' },
  { key: 'clock', label: 'Clock', icon: 'time-outline' },
  { key: 'sand', label: 'Sand', icon: 'hourglass-outline' },
];

export default function TimersTab() {
  const { width } = useWindowDimensions();
  const { settings } = useApp();
  const { timers, startTimer } = useTimers();
  const [focusId, setFocusId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [duration, setDuration] = useState({ hours: 0, minutes: 5, seconds: 0 });
  const [label, setLabel] = useState('');
  const th = useTheme();

  const focused = timers.find(t => t.id === focusId) || timers[timers.length - 1];
  const showPicker = picking || !focused;
  const totalMinutes = duration.hours * 60 + duration.minutes + duration.seconds / 60;
  const faceSize = Math.min(width - 64, 300);

  const start = (minutes: number, name?: string) => {
    if (!(minutes > 0)) return;
    if (settings.haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    startTimer({ minutes, label: name?.trim() || `${formatDuration(minutes)} timer` });
    setFocusId(null);
    setPicking(false);
    setLabel('');
  };

  return (
    <Screen>
      <TopBar>
        <Txt kind="head" weight="bold" size={30} style={{ flex: 1, paddingLeft: 8 }}>Timers</Txt>
      </TopBar>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 18 }} keyboardShouldPersistTaps="handled">
        {timers.length > 1 || (timers.length && showPicker) ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
            {timers.map(t => (
              <MiniTimer key={t.id} t={t} active={!showPicker && t.id === focused?.id} onPress={() => { setFocusId(t.id); setPicking(false); }} />
            ))}
            {!showPicker && (
              <Pressable onPress={() => setPicking(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, height: 40, borderRadius: 999, borderWidth: 1.5, borderStyle: 'dashed', borderColor: th.c.line }}>
                <Icon name="add" size={18} color={th.c.accent} />
                <Txt weight="black" size={14} color={th.c.accent}>New</Txt>
              </Pressable>
            )}
          </ScrollView>
        ) : null}

        {showPicker ? (
          <View style={{ gap: 14 }}>
            <View style={{ paddingVertical: 8 }}>
              <DurationPicker {...duration} haptics={settings.haptics} onChange={setDuration} />
            </View>
            <Card style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12, borderRadius: 18 }}>
              <Txt weight="bold">Label</Txt>
              <TextInput
                value={label}
                onChangeText={setLabel}
                placeholder="Timer"
                placeholderTextColor={th.c.muted}
                maxLength={60}
                style={[{ flex: 1, textAlign: 'right', color: th.c.text, fontSize: th.fs(16), paddingVertical: 14 }, th.f('body')]}
              />
            </Card>
            <StyleSwitch />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, marginTop: 4 }}>
              <RoundButton label="Cancel" onPress={() => setPicking(false)} disabled={!focused} />
              <RoundButton label="Start" primary onPress={() => start(totalMinutes, label)} disabled={!(totalMinutes > 0)} />
            </View>
          </View>
        ) : (
          focused && <RunningTimer t={focused} size={faceSize} styleKey={settings.timerStyle} />
        )}

        <RecentTimers onStart={start} />
      </ScrollView>
    </Screen>
  );
}

// Ring / Clock / Sand switch.
function StyleSwitch() {
  const th = useTheme();
  const { settings, updateSettings } = useApp();
  return (
    <View style={{ flexDirection: 'row', padding: 4, gap: 4, borderRadius: 999, backgroundColor: th.c.soft }}>
      {STYLES.map(s => {
        const on = settings.timerStyle === s.key;
        return (
          <Pressable
            key={s.key}
            onPress={() => {
              if (settings.haptics) Haptics.selectionAsync().catch(() => {});
              updateSettings({ timerStyle: s.key });
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${s.label} style`}
            style={{ flex: 1, flexDirection: 'row', gap: 6, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? th.c.surface : 'transparent' }}
          >
            <Icon name={s.icon} size={17} color={on ? th.c.accent : th.c.muted} />
            <Txt weight="bold" size={14} color={on ? th.c.text : th.c.muted}>{s.label}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

function RunningTimer({ t, size, styleKey }: { t: KitchenTimer; size: number; styleKey: Settings['timerStyle'] }) {
  const th = useTheme();
  const { togglePause, addTime, removeTimer } = useTimers();
  const paused = t.pausedLeft != null;
  const now = useSmoothNow(!paused && !t.done);
  const remaining = paused ? (t.pausedLeft as number) : Math.max(0, t.endAt - now);
  const props: FaceProps = { remaining, total: t.total || 60000, paused, done: t.done, size, now };

  return (
    <View style={{ alignItems: 'center', gap: 16 }}>
      <Pressable onPress={() => t.recipeId && router.push(`/recipe/${t.recipeId}`)} disabled={!t.recipeId} style={{ alignItems: 'center' }}>
        {t.recipeTitle ? <Txt muted size={13} numberOfLines={1}>{t.recipeTitle}</Txt> : null}
        <Txt weight="black" size={18} numberOfLines={1}>{t.label}</Txt>
      </Pressable>
      <View style={{ alignSelf: 'stretch' }}><StyleSwitch /></View>

      {styleKey === 'clock' ? <ClockFace {...props} /> : styleKey === 'sand' ? <SandFace {...props} /> : <RingFace {...props} />}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', paddingHorizontal: 8 }}>
        <RoundButton label={t.done ? 'Stop' : 'Cancel'} onPress={() => removeTimer(t.id)} primary={t.done} />
        <Pressable onPress={() => addTime(t.id, 1)} style={({ pressed }) => ({ paddingHorizontal: 18, height: 40, borderRadius: 999, justifyContent: 'center', backgroundColor: th.c.soft, opacity: pressed ? 0.7 : 1 })} accessibilityLabel="Add one minute">
          <Txt weight="black" size={14}>+1 min</Txt>
        </Pressable>
        {t.done ? (
          <RoundButton label="+5 min" onPress={() => addTime(t.id, 5)} />
        ) : (
          <RoundButton label={paused ? 'Resume' : 'Pause'} icon={paused ? 'play' : 'pause'} primary onPress={() => togglePause(t.id)} />
        )}
      </View>
    </View>
  );
}

// Recent timers: swipe a row left or right to delete it, or tap Clear to pick several.
function RecentTimers({ onStart }: { onStart: (minutes: number, label: string) => void }) {
  const th = useTheme();
  const { settings } = useApp();
  const { history, removeHistory } = useTimers();
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = (at: number) => {
    const next = new Set(selected);
    if (next.has(at)) next.delete(at);
    else next.add(at);
    setSelected(next);
  };
  const allSelected = history.length > 0 && selected.size === history.length;
  const done = () => {
    setSelecting(false);
    setSelected(new Set());
  };
  const deleteSelected = () => {
    const count = selected.size;
    Alert.alert(`Delete ${count} timer${count === 1 ? '' : 's'}?`, 'They will be removed from your recent timers.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { removeHistory([...selected]); done(); } },
    ]);
  };

  return (
    <View style={{ gap: 8, marginTop: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, minHeight: 24 }}>
        <Label color={th.c.muted}>Recent</Label>
        {history.length ? (
          selecting ? (
            <View style={{ flexDirection: 'row', gap: 18 }}>
              <Pressable onPress={() => setSelected(allSelected ? new Set() : new Set(history.map(h => h.at)))} hitSlop={8}>
                <Txt weight="bold" size={14} color={th.c.accent}>{allSelected ? 'Select none' : 'Select all'}</Txt>
              </Pressable>
              <Pressable onPress={done} hitSlop={8}><Txt weight="black" size={14} color={th.c.accent}>Done</Txt></Pressable>
            </View>
          ) : (
            <Pressable onPress={() => setSelecting(true)} hitSlop={8}><Txt weight="bold" size={14} color={th.c.accent}>Clear</Txt></Pressable>
          )
        ) : null}
      </View>

      {history.length ? (
        <Card style={{ overflow: 'hidden', borderRadius: 22 }}>
          {history.map((h, i) => (
            <SwipeRow key={h.at} enabled={!selecting} haptics={settings.haptics} onDelete={() => removeHistory([h.at])}>
              <RecentRow h={h} last={i === history.length - 1} selecting={selecting} selected={selected.has(h.at)} onToggle={() => toggle(h.at)} onStart={() => onStart(h.minutes, h.label)} />
            </SwipeRow>
          ))}
        </Card>
      ) : (
        <Txt muted size={14} style={{ paddingHorizontal: 4 }}>Timers you start will show up here so you can run them again with one tap.</Txt>
      )}

      {selecting && history.length ? (
        <Pressable
          onPress={deleteSelected}
          disabled={!selected.size}
          style={({ pressed }) => ({ marginTop: 4, height: 50, borderRadius: 999, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.temp, opacity: !selected.size ? 0.4 : pressed ? 0.8 : 1 })}
        >
          <Icon name="trash" size={18} color="#fff" />
          <Txt weight="black" color="#fff">{selected.size ? `Delete ${selected.size}` : 'Select timers to delete'}</Txt>
        </Pressable>
      ) : history.length ? (
        <Txt muted size={12} style={{ textAlign: 'center' }}>Swipe a timer left or right to remove it</Txt>
      ) : null}
    </View>
  );
}

function RecentRow({ h, last, selecting, selected, onToggle, onStart }: { h: TimerHistoryItem; last: boolean; selecting: boolean; selected: boolean; onToggle: () => void; onStart: () => void }) {
  const th = useTheme();
  return (
    <Pressable onPress={selecting ? onToggle : undefined} disabled={!selecting} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: last ? 0 : 1, borderBottomColor: th.c.line }}>
      {selecting && (
        <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center', borderColor: selected ? th.c.accent : th.c.line, backgroundColor: selected ? th.c.accent : 'transparent' }}>
          {selected ? <Icon name="checkmark" size={16} color={th.c.onAccent} /> : null}
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Txt kind="head" size={30} style={{ fontVariant: ['tabular-nums'], lineHeight: 36 }}>{clock(h.minutes * 60000)}</Txt>
        <Txt muted size={13} numberOfLines={1}>{h.label}</Txt>
      </View>
      {!selecting && (
        <Pressable onPress={onStart} accessibilityLabel={`Start ${h.label} again`} style={({ pressed }) => ({ width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accentSoft, opacity: pressed ? 0.7 : 1 })}>
          <Icon name="play" size={20} color={th.c.accent} />
        </Pressable>
      )}
    </Pressable>
  );
}

// Big round buttons like the iPhone Clock app.
function RoundButton({ label, onPress, primary, disabled, icon }: { label: string; onPress: () => void; primary?: boolean; disabled?: boolean; icon?: IconName }) {
  const th = useTheme();
  const bg = primary ? th.c.accent : th.c.soft;
  const fg = primary ? th.c.onAccent : th.c.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({ width: 84, height: 84, borderRadius: 42, padding: 3, borderWidth: 2, borderColor: bg, opacity: disabled ? 0.4 : pressed ? 0.75 : 1 })}
    >
      <View style={{ flex: 1, borderRadius: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: bg, gap: 2 }}>
        {icon ? <Icon name={icon} size={22} color={fg} /> : null}
        <Txt weight="black" size={icon ? 13 : 15} color={fg}>{label}</Txt>
      </View>
    </Pressable>
  );
}

function MiniTimer({ t, active, onPress }: { t: KitchenTimer; active: boolean; onPress: () => void }) {
  const th = useTheme();
  const { remaining } = useTimers();
  const paused = t.pausedLeft != null;
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, height: 40, borderRadius: 999, backgroundColor: active ? th.c.accent : t.done ? th.c.temp : th.c.surface, borderWidth: 1, borderColor: active ? th.c.accent : th.c.line }}>
      <Icon name={t.done ? 'alarm' : paused ? 'pause' : 'timer-outline'} size={16} color={active || t.done ? th.c.onAccent : th.c.accent} />
      <Txt weight="black" size={14} color={active || t.done ? th.c.onAccent : th.c.text} style={{ fontVariant: ['tabular-nums'] }}>
        {t.done ? 'Done' : clock(remaining(t))}
      </Txt>
      <Txt size={13} color={active || t.done ? th.c.onAccent : th.c.muted} numberOfLines={1} style={{ maxWidth: 110 }}>{t.label}</Txt>
    </Pressable>
  );
}
