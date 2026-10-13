// Setting a new timer, iPhone Clock style: wheels, Label, When Timer Ends, Cancel / Start.
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { formatDuration } from '../shared/parser';
import { useApp, useTimers } from '../lib/store';
import { useTheme } from '../lib/theme';
import { ToneRow, ToneSheet } from './tone-sheet';
import { Icon, Txt, type IconName } from './ui';
import { DurationPicker } from './wheel-picker';

// Big round buttons like the iPhone Clock app.
export function RoundButton({ label, onPress, primary, disabled, icon }: { label: string; onPress: () => void; primary?: boolean; disabled?: boolean; icon?: IconName }) {
  const th = useTheme();
  const bg = primary ? th.c.accent : th.c.soft;
  const fg = primary ? th.c.onAccent : th.c.text;
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label}
      style={({ pressed }) => ({ width: 84, height: 84, borderRadius: 42, padding: 3, borderWidth: 2, borderColor: bg, opacity: disabled ? 0.4 : pressed ? 0.75 : 1 })}>
      <View style={{ flex: 1, borderRadius: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: bg, gap: 2 }}>
        {icon ? <Icon name={icon} size={22} color={fg} /> : null}
        <Txt weight="black" size={icon ? 13 : 15} color={fg}>{label}</Txt>
      </View>
    </Pressable>
  );
}

export function TimerPicker({ onStarted, onCancel, onWheelActive }: { onStarted?: () => void; onCancel?: () => void; onWheelActive?: (active: boolean) => void }) {
  const th = useTheme();
  const { settings } = useApp();
  const { startTimer } = useTimers();
  const [duration, setDuration] = useState({ hours: 0, minutes: 5, seconds: 0 });
  const [label, setLabel] = useState('');
  const [tones, setTones] = useState(false);
  const minutes = duration.hours * 60 + duration.minutes + duration.seconds / 60;

  const start = () => {
    if (!(minutes > 0)) return;
    if (settings.haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    startTimer({ minutes, label: label.trim() || `${formatDuration(minutes)} timer` });
    setLabel('');
    onStarted?.();
  };

  return (
    <View style={{ gap: 16 }}>
      <View style={{ paddingVertical: 4 }}>
        <DurationPicker {...duration} haptics={settings.haptics} onChange={setDuration} onActive={a => onWheelActive?.(a)} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
        <RoundButton label="Cancel" onPress={() => onCancel?.()} disabled={!onCancel} />
        <RoundButton label="Start" primary onPress={start} disabled={!(minutes > 0)} />
      </View>
      <View style={{ borderRadius: 18, backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 }}>
          <Txt weight="bold">Label</Txt>
          <TextInput value={label} onChangeText={setLabel} placeholder="Timer" placeholderTextColor={th.c.muted} maxLength={60} returnKeyType="done"
            style={[{ flex: 1, textAlign: 'right', color: th.c.text, fontSize: th.fs(16), paddingVertical: 15 }, th.f('body')]} />
        </View>
        <ToneRow onPress={() => setTones(true)} last />
      </View>
      <ToneSheet visible={tones} onClose={() => setTones(false)} />
    </View>
  );
}
