// "When Timer Ends": choose the alarm tone (each plays when tapped).
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { previewTone, TONES, type Tone } from '../lib/alarm';
import { useApp } from '../lib/store';
import { useTheme } from '../lib/theme';
import { Icon, IconBtn, Txt } from './ui';

export function ToneRow({ onPress, last }: { onPress: () => void; last?: boolean }) {
  const th = useTheme();
  const { settings } = useApp();
  const name = settings.alarmSound ? TONES[settings.alarmTone as Tone]?.name ?? 'Chime' : 'Vibrate only';
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15, opacity: pressed ? 0.6 : 1, borderTopWidth: last ? 1 : 0, borderTopColor: th.c.line })}>
      <Txt weight="bold" style={{ flex: 1 }}>When Timer Ends</Txt>
      <Txt muted>{name}</Txt>
      <Icon name="chevron-forward" size={18} color={th.c.muted} />
    </Pressable>
  );
}

export function ToneSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const th = useTheme();
  const { settings, updateSettings } = useApp();
  const options: { key: Tone | 'none'; name: string }[] = [...(Object.keys(TONES) as Tone[]).map(k => ({ key: k, name: TONES[k].name })), { key: 'none', name: 'Vibrate only' }];
  const selected = settings.alarmSound ? settings.alarmTone : 'none';

  const choose = (key: Tone | 'none') => {
    if (key === 'none') updateSettings({ alarmSound: false });
    else {
      updateSettings({ alarmSound: true, alarmTone: key });
      previewTone(key);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: th.c.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
          <Txt kind="head" weight="bold" size={22} style={{ flex: 1 }}>When Timer Ends</Txt>
          <IconBtn name="close" label="Done" onPress={onClose} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={{ borderRadius: 18, backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line, overflow: 'hidden' }}>
            {options.map((o, i) => (
              <Pressable key={o.key} onPress={() => choose(o.key)} accessibilityRole="radio" accessibilityState={{ selected: selected === o.key }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 15, borderTopWidth: i ? 1 : 0, borderTopColor: th.c.line }}>
                <Icon name={o.key === 'none' ? 'phone-portrait-outline' : 'musical-notes-outline'} size={20} color={th.c.accent} />
                <Txt weight="bold" style={{ flex: 1 }}>{o.name}</Txt>
                {selected === o.key ? <Icon name="checkmark" size={20} color={th.c.accent} /> : null}
              </Pressable>
            ))}
          </View>
          <Txt muted size={13} style={{ marginTop: 10, paddingHorizontal: 4 }}>Plays while Mise is open, even on silent. When your phone is locked, the timer notification uses your phone’s sound.</Txt>
        </ScrollView>
      </View>
    </Modal>
  );
}
