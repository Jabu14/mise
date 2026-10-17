// All your chats on one page (like the Claude app's Recents): each with how long ago it was used,
// a search bar at the bottom, and New chat on the right. Long-press a chat to Rename, Pin or Delete.
import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AI_NAME, useChats, type Chat } from '../../lib/chat-store';
import { useApp } from '../../lib/store';
import { useTheme } from '../../lib/theme';
import { Icon, Txt } from '../ui';
import { ChatMenu, RenameDialog, snippet, timeAgo, type Menu } from './chat-menus';
import { showAlert } from '../sheet';

export function ChatSearch({ visible, openedAt, onClose, onSelect, onNewChat }: {
  visible: boolean; openedAt: number; onClose: () => void; onSelect: (id: string) => void; onNewChat: () => void;
}) {
  const th = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { settings } = useApp();
  const { chats, renameChat, togglePin, deleteChats } = useChats();
  const input = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null);

  const q = query.trim().toLowerCase();
  const list = q ? chats.filter(c => c.title.toLowerCase().includes(q) || c.messages.some(m => m.text.toLowerCase().includes(q))) : chats;
  // Pinned first, then most recently used.
  const sorted = [...list].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);

  const close = () => { setQuery(''); setFocused(false); setMenu(null); onClose(); };

  const confirmDelete = (chat: Chat) => {
    setMenu(null);
    setTimeout(() => showAlert('Delete chat?', `“${chat.title}” and its voice messages will be deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteChats([chat.id]) },
    ]), 200);
  };

  const row = ({ item: c }: { item: Chat }) => {
    const match = q && !c.title.toLowerCase().includes(q) ? c.messages.find(m => m.text.toLowerCase().includes(q))?.text : undefined;
    return (
      <Pressable
        onPress={() => { close(); onSelect(c.id); }}
        onLongPress={e => { if (settings.haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); setMenu({ chat: c, y: e.nativeEvent.pageY }); }}
        delayLongPress={350}
        style={({ pressed }) => ({ flexDirection: 'row', gap: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: pressed ? th.c.soft : 'transparent' })}
      >
        <View style={{ paddingTop: 2 }}><Icon name={c.pinned ? 'pin-outline' : 'chatbubble-outline'} size={22} color={th.c.muted} /></View>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt weight="bold" size={17} numberOfLines={1}>{c.title}</Txt>
          <Txt muted size={14} numberOfLines={1}>{match ? snippet(match, q) : timeAgo(c.updatedAt, openedAt)}</Txt>
        </View>
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={close} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: th.c.bg, paddingTop: insets.top }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', height: 64, paddingHorizontal: 12 }}>
          <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Close" hitSlop={4}
            style={({ pressed }) => ({ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line, opacity: pressed ? 0.7 : 1 })}>
            <Icon name="chevron-down" size={22} color={th.c.text} />
          </Pressable>
          <Txt weight="black" size={18} style={{ flex: 1, textAlign: 'center' }}>{q ? 'Results' : 'Recents'}</Txt>
          <View style={{ width: 48 }} />
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <FlatList
            data={sorted}
            keyExtractor={c => c.id}
            renderItem={row}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{ paddingTop: 4, paddingBottom: 150 }}
            ListEmptyComponent={<Txt muted size={15} style={{ paddingHorizontal: 24, paddingTop: 12 }}>{q ? `No chats match “${query.trim()}”.` : `Your chats with ${AI_NAME} will show up here.`}</Txt>}
          />

          <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingBottom: focused ? 10 : insets.bottom + 10, gap: 12 }}>
            {!focused ? (
              <Pressable onPress={() => { close(); onNewChat(); }} accessibilityRole="button"
                style={({ pressed }) => ({ alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 8, height: 50, paddingHorizontal: 22, borderRadius: 25, backgroundColor: th.c.accent, opacity: pressed ? 0.85 : 1, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } })}>
                <Icon name="add" size={21} color={th.c.onAccent} />
                <Txt weight="black" size={16} color={th.c.onAccent}>New chat</Txt>
              </Pressable>
            ) : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Pressable onPress={() => input.current?.focus()} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, paddingHorizontal: 18, borderRadius: 26, backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line }}>
                <Icon name="search" size={20} color={th.c.text} />
                <TextInput ref={input} value={query} onChangeText={setQuery} placeholder="Search" placeholderTextColor={th.c.muted} returnKeyType="search" maxLength={80}
                  onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                  style={[{ flex: 1, minWidth: 0, color: th.c.text, fontSize: th.fs(17), paddingVertical: 0 }, th.f('body')]} />
              </Pressable>
              {focused ? (
                <Pressable onPress={() => { setQuery(''); input.current?.blur(); }} accessibilityRole="button" accessibilityLabel="Stop searching"
                  style={({ pressed }) => ({ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line, opacity: pressed ? 0.7 : 1 })}>
                  <Icon name="close" size={22} color={th.c.text} />
                </Pressable>
              ) : null}
            </View>
          </View>
        </KeyboardAvoidingView>

        {menu ? (
          <View style={{ position: 'absolute', inset: 0 }}>
            <ChatMenu menu={menu} screenHeight={height} left={24} width={280} onClose={() => setMenu(null)}
              onRename={() => { setRenaming({ id: menu.chat.id, title: menu.chat.title }); setMenu(null); }}
              onPin={() => { togglePin(menu.chat.id); setMenu(null); }}
              onDelete={() => confirmDelete(menu.chat)} />
          </View>
        ) : null}
        {renaming ? (
          <View style={{ position: 'absolute', inset: 0 }}>
            <RenameDialog value={renaming} onChange={title => setRenaming(r => (r ? { ...r, title } : r))} onCancel={() => setRenaming(null)}
              onSave={() => { renameChat(renaming.id, renaming.title); setRenaming(null); }} />
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
