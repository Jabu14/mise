// Chat history: slides in from the left with New chat, past chats by day, swipe or Edit to delete.
import { useEffect, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChats, type Chat } from '../../lib/chat-store';
import { useApp } from '../../lib/store';
import { useTheme } from '../../lib/theme';
import { EditMinus, SwipeRow } from '../swipe-row';
import { Icon, Label, Txt } from '../ui';

function groupLabel(time: number) {
  const day = 24 * 60 * 60 * 1000;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (time >= start.getTime()) return 'Today';
  if (time >= start.getTime() - day) return 'Yesterday';
  if (time >= start.getTime() - 6 * day) return 'This week';
  return 'Earlier';
}

export function HistoryDrawer({ visible, currentId, onClose, onSelect, onNewChat }: {
  visible: boolean; currentId: string | null; onClose: () => void; onSelect: (id: string) => void; onNewChat: () => void;
}) {
  const th = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { settings } = useApp();
  const { chats, deleteChats } = useChats();
  const panel = Math.min(width * 0.84, 360);
  const [slide] = useState(() => new Animated.Value(0));
  const [editing, setEditing] = useState(false);
  const [revealed, setRevealed] = useState<string | null>(null);

  useEffect(() => {
    Animated.spring(slide, { toValue: visible ? 1 : 0, friction: 10, tension: 70, useNativeDriver: true }).start();
  }, [visible, slide]);

  const groups: { label: string; items: Chat[] }[] = [];
  for (const c of chats) {
    const label = groupLabel(c.updatedAt);
    const g = groups.find(x => x.label === label);
    if (g) g.items.push(c);
    else groups.push({ label, items: [c] });
  }

  const close = () => { setEditing(false); setRevealed(null); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
      <Animated.View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', opacity: slide }}>
        <Pressable style={{ flex: 1 }} onPress={close} accessibilityLabel="Close chat history" />
      </Animated.View>
      <Animated.View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: panel, backgroundColor: th.c.bg, paddingTop: insets.top + 10, transform: [{ translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [-panel, 0] }) }] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10 }}>
          <Txt kind="head" weight="bold" size={26} style={{ flex: 1 }}>Chats</Txt>
          {chats.length ? (
            <Pressable onPress={() => { setEditing(e => !e); setRevealed(null); }} hitSlop={8} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: th.c.soft }}>
              <Txt weight="black" size={14}>{editing ? 'Done' : 'Edit'}</Txt>
            </Pressable>
          ) : null}
        </View>

        <Pressable onPress={() => { close(); onNewChat(); }} style={({ pressed }) => ({ marginHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, height: 48, borderRadius: 999, backgroundColor: th.c.accent, opacity: pressed ? 0.85 : 1 })}>
          <Icon name="create-outline" size={20} color={th.c.onAccent} />
          <Txt weight="black" color={th.c.onAccent}>New chat</Txt>
        </Pressable>

        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
          {!chats.length && <Txt muted size={14} style={{ paddingHorizontal: 20, paddingTop: 8 }}>Your conversations with Sous will show up here.</Txt>}
          {groups.map(g => (
            <View key={g.label} style={{ marginTop: 6 }}>
              <View style={{ paddingHorizontal: 20, paddingVertical: 6 }}><Label color={th.c.muted}>{g.label}</Label></View>
              {g.items.map(c => {
                const active = c.id === currentId;
                const last = c.messages[c.messages.length - 1];
                return (
                  <SwipeRow key={c.id} haptics={settings.haptics} onDelete={() => deleteChats([c.id])} revealed={revealed === c.id} onRevealChange={open => setRevealed(open ? c.id : null)}>
                    <Pressable onPress={() => { if (!editing) { close(); onSelect(c.id); } }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, backgroundColor: active ? th.c.accentSoft : 'transparent' }}>
                      {editing && <EditMinus onPress={() => setRevealed(c.id)} />}
                      <View style={{ flex: 1 }}>
                        <Txt weight="bold" numberOfLines={1} color={active ? th.c.accent : th.c.text}>{c.title}</Txt>
                        <Txt muted size={13} numberOfLines={1}>{last?.kind === 'voice' ? '🎤 Voice message' : last?.text ?? ''}</Txt>
                      </View>
                    </Pressable>
                  </SwipeRow>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}
