// Shared bits for chat lists: the long-press menu (Rename / Pin / Delete), the rename dialog,
// and search snippets.
import { useEffect, useState } from 'react';
import { Animated, Pressable, TextInput, View } from 'react-native';
import type { Chat } from '../../lib/chat-store';
import { useTheme } from '../../lib/theme';
import { Icon, Txt, type IconName } from '../ui';
export { timeAgo } from '../../lib/time';

export type Menu = { chat: Chat; y: number };

// A few words around the match, for search results.
export function snippet(text: string, q: string) {
  const flat = text.replace(/\s+/g, ' ');
  const i = flat.toLowerCase().indexOf(q);
  if (i < 0) return flat;
  const start = Math.max(0, i - 24);
  return (start > 0 ? '…' : '') + flat.slice(start, i + q.length + 60);
}

// The long-press menu: the chat, lifted, with Rename / Pin / Delete under it (iOS context-menu style).
export function ChatMenu({ menu, screenHeight, left, width, onClose, onRename, onPin, onDelete }: {
  menu: Menu; screenHeight: number; left: number; width: number; onClose: () => void; onRename: () => void; onPin: () => void; onDelete: () => void;
}) {
  const th = useTheme();
  const [pop] = useState(() => new Animated.Value(0));
  useEffect(() => { Animated.spring(pop, { toValue: 1, friction: 7, tension: 140, useNativeDriver: true }).start(); }, [pop]);
  const MENU_H = 56 + 3 * 50 + 12;
  const top = Math.max(60, Math.min(menu.y - 28, screenHeight - MENU_H - 40));
  const item = (label: string, icon: IconName, onPress: () => void, danger = false, last = false) => (
    <Pressable onPress={onPress} accessibilityRole="button"
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', height: 50, paddingHorizontal: 16, backgroundColor: pressed ? th.c.soft : 'transparent', borderBottomWidth: last ? 0 : 1, borderBottomColor: th.c.line })}>
      <Txt weight="bold" size={16} color={danger ? th.c.temp : th.c.text} style={{ flex: 1 }}>{label}</Txt>
      <Icon name={icon} size={19} color={danger ? th.c.temp : th.c.text} />
    </Pressable>
  );
  return (
    <View style={{ flex: 1 }}>
      <Animated.View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', opacity: pop }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close menu" />
      </Animated.View>
      <Animated.View style={{ position: 'absolute', top, left, width, gap: 10, opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, height: 56, paddingHorizontal: 16, borderRadius: 16, backgroundColor: th.c.surface }}>
          <Icon name={menu.chat.pinned ? 'pin-outline' : 'chatbubble-outline'} size={20} color={th.c.text} />
          <Txt weight="bold" size={16} numberOfLines={1} style={{ flex: 1 }}>{menu.chat.title}</Txt>
        </View>
        <View style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: th.c.surface }}>
          {item('Rename', 'pencil-outline', onRename)}
          {item(menu.chat.pinned ? 'Unpin' : 'Pin', menu.chat.pinned ? 'pin' : 'pin-outline', onPin)}
          {item('Delete', 'trash-outline', onDelete, true, true)}
        </View>
      </Animated.View>
    </View>
  );
}

export function RenameDialog({ value, onChange, onCancel, onSave }: { value: { title: string } | null; onChange: (t: string) => void; onCancel: () => void; onSave: () => void }) {
  const th = useTheme();
  if (!value) return null;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: 24 }}>
      <View style={{ alignSelf: 'stretch', maxWidth: 360, padding: 20, gap: 14, borderRadius: 22, backgroundColor: th.c.surface }}>
        <Txt kind="head" weight="bold" size={20}>Rename chat</Txt>
        <TextInput value={value.title} onChangeText={onChange} autoFocus selectTextOnFocus maxLength={60} returnKeyType="done" onSubmitEditing={onSave}
          style={[{ height: 48, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderColor: th.c.line, backgroundColor: th.c.bg, color: th.c.text, fontSize: th.fs(16) }, th.f('body')]} />
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
          <Pressable onPress={onCancel} style={{ paddingHorizontal: 16, height: 42, justifyContent: 'center', borderRadius: 21 }}><Txt weight="bold" muted>Cancel</Txt></Pressable>
          <Pressable onPress={onSave} disabled={!value.title.trim()} style={{ paddingHorizontal: 20, height: 42, justifyContent: 'center', borderRadius: 21, backgroundColor: th.c.accent, opacity: value.title.trim() ? 1 : 0.5 }}>
            <Txt weight="black" color={th.c.onAccent}>Save</Txt>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
