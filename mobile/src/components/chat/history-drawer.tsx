// Chat history, like the sidebar in AI apps: slides in from the left (swipe left to close),
// search, Pinned and Recents, and a long-press menu on each chat to Rename, Pin or Delete.
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Animated, Modal, PanResponder, Pressable, ScrollView, TextInput, View, useWindowDimensions, type GestureResponderEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AI_NAME, useChats, type Chat } from '../../lib/chat-store';
import { useApp } from '../../lib/store';
import { useTheme } from '../../lib/theme';
import { Icon, Txt, type IconName } from '../ui';

type Menu = { chat: Chat; y: number };

export function HistoryDrawer({ visible, currentId, onClose, onSelect, onNewChat }: {
  visible: boolean; currentId: string | null; onClose: () => void; onSelect: (id: string) => void; onNewChat: () => void;
}) {
  const th = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { settings } = useApp();
  const { chats, renameChat, togglePin, deleteChats } = useChats();
  const panel = Math.min(width * 0.86, 380);
  const [slide] = useState(() => new Animated.Value(0));
  const [shown, setShown] = useState(visible);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [menu, setMenu] = useState<Menu | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null);

  // Stay mounted while the closing slide plays.
  if (visible && !shown) setShown(true);

  useEffect(() => {
    if (visible) Animated.spring(slide, { toValue: 1, friction: 11, tension: 75, useNativeDriver: true }).start();
    else Animated.timing(slide, { toValue: 0, duration: 200, useNativeDriver: true }).start(({ finished }) => finished && setShown(false));
  }, [visible, slide]);

  const close = () => { setSearching(false); setQuery(''); setMenu(null); onClose(); };

  // Swipe the panel left to close it; it follows your finger.
  const pan = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => g.dx < -10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
    onPanResponderMove: (_, g) => slide.setValue(Math.max(0, Math.min(1, 1 + g.dx / panel))),
    onPanResponderRelease: (_, g) => {
      if (g.dx < -panel * 0.3 || g.vx < -0.5) close();
      else Animated.spring(slide, { toValue: 1, friction: 11, tension: 75, useNativeDriver: true }).start();
    },
    onPanResponderTerminate: () => Animated.spring(slide, { toValue: 1, useNativeDriver: true }).start(),
  });

  const q = query.trim().toLowerCase();
  const results = q
    ? chats.filter(c => c.title.toLowerCase().includes(q) || c.messages.some(m => m.text.toLowerCase().includes(q)))
    : chats;
  const pinned = q ? [] : chats.filter(c => c.pinned);
  const recents = q ? results : chats.filter(c => !c.pinned);

  const openMenu = (chat: Chat, e: GestureResponderEvent) => {
    if (settings.haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setMenu({ chat, y: e.nativeEvent.pageY });
  };

  const confirmDelete = (chat: Chat) => {
    setMenu(null);
    Alert.alert('Delete chat?', `“${chat.title}” and its voice messages will be deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteChats([chat.id]) },
    ]);
  };

  const row = (c: Chat) => {
    const active = c.id === currentId;
    const match = q && !c.title.toLowerCase().includes(q) ? c.messages.find(m => m.text.toLowerCase().includes(q))?.text : undefined;
    return (
      <Pressable
        key={c.id}
        onPress={() => { close(); onSelect(c.id); }}
        onLongPress={e => openMenu(c, e)}
        delayLongPress={350}
        accessibilityHint="Long press for rename, pin and delete"
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 10, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 14, backgroundColor: active ? th.c.soft : pressed ? th.c.soft : 'transparent' })}
      >
        <Icon name={c.pinned ? 'pin-outline' : 'chatbubble-outline'} size={21} color={th.c.text} />
        <View style={{ flex: 1 }}>
          <Txt weight={active ? 'black' : 'bold'} size={17} numberOfLines={1}>{c.title}</Txt>
          {match ? <Txt muted size={13} numberOfLines={1}>{snippet(match, q)}</Txt> : null}
        </View>
      </Pressable>
    );
  };

  if (!shown) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      <Animated.View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', opacity: slide }}>
        <Pressable style={{ flex: 1 }} onPress={close} accessibilityLabel="Close chat history" />
      </Animated.View>

      <Animated.View {...pan.panHandlers} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: panel, backgroundColor: th.c.bg, borderTopRightRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden', paddingTop: insets.top + 8, transform: [{ translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [-panel - 20, 0] }) }] }}>
        {searching ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 12 }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 14, borderRadius: 22, backgroundColor: th.c.soft }}>
              <Icon name="search" size={18} color={th.c.muted} />
              <TextInput value={query} onChangeText={setQuery} autoFocus placeholder="Search chats" placeholderTextColor={th.c.muted} returnKeyType="search" maxLength={80}
                style={[{ flex: 1, minWidth: 0, color: th.c.text, fontSize: th.fs(16), paddingVertical: 0 }, th.f('body')]} />
              {query ? <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search"><Icon name="close-circle" size={18} color={th.c.muted} /></Pressable> : null}
            </View>
            <Pressable onPress={() => { setSearching(false); setQuery(''); }} hitSlop={8}><Txt weight="bold" color={th.c.accent}>Cancel</Txt></Pressable>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingBottom: 14 }}>
            <Txt kind="head" weight="bold" size={32} style={{ flex: 1 }}>{AI_NAME}</Txt>
            <CircleBtn icon="search" label="Search chats" onPress={() => setSearching(true)} />
          </View>
        )}

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}>
          {!chats.length && <Txt muted size={15} style={{ paddingHorizontal: 22, paddingTop: 8 }}>{`Your chats with ${AI_NAME} will show up here.`}</Txt>}
          {q && !results.length ? <Txt muted size={15} style={{ paddingHorizontal: 22, paddingTop: 8 }}>{`No chats match “${query.trim()}”.`}</Txt> : null}
          {pinned.length ? <Section title="Pinned">{pinned.map(row)}</Section> : null}
          {recents.length ? <Section title={q ? 'Results' : 'Recents'}>{recents.map(row)}</Section> : null}
        </ScrollView>

        <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, gap: 12 }}>
          <Pressable onPress={() => { close(); router.navigate('/account'); }} accessibilityLabel="Account"
            style={{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.soft, borderWidth: 1, borderColor: th.c.line }}>
            {settings.name.trim()
              ? <Txt weight="black" size={19}>{settings.name.trim().charAt(0).toUpperCase()}</Txt>
              : <Icon name="person" size={22} color={th.c.text} />}
          </Pressable>
          <Pressable onPress={() => { close(); onNewChat(); }} accessibilityRole="button"
            style={({ pressed }) => ({ flex: 1, height: 52, borderRadius: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: th.c.accent, opacity: pressed ? 0.85 : 1, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } })}>
            <Icon name="add" size={22} color={th.c.onAccent} />
            <Txt weight="black" size={17} color={th.c.onAccent}>New chat</Txt>
          </Pressable>
        </View>
      </Animated.View>

      {menu ? (
        <ChatMenu
          menu={menu}
          screenHeight={height}
          left={20}
          width={Math.min(panel - 40, 280)}
          onClose={() => setMenu(null)}
          onRename={() => { setRenaming({ id: menu.chat.id, title: menu.chat.title }); setMenu(null); }}
          onPin={() => { togglePin(menu.chat.id); setMenu(null); }}
          onDelete={() => confirmDelete(menu.chat)}
        />
      ) : null}

      <RenameDialog value={renaming} onChange={title => setRenaming(r => (r ? { ...r, title } : r))} onCancel={() => setRenaming(null)}
        onSave={() => { if (renaming) renameChat(renaming.id, renaming.title); setRenaming(null); }} />
    </Modal>
  );
}

// A few words around the match, for search results.
function snippet(text: string, q: string) {
  const flat = text.replace(/\s+/g, ' ');
  const i = flat.toLowerCase().indexOf(q);
  if (i < 0) return flat;
  const start = Math.max(0, i - 24);
  return (start > 0 ? '…' : '') + flat.slice(start, i + q.length + 60);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Txt muted weight="bold" size={15} style={{ paddingHorizontal: 22, paddingVertical: 6 }}>{title}</Txt>
      {children}
    </View>
  );
}

function CircleBtn({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const th = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}
      style={({ pressed }) => ({ width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.soft, borderWidth: 1, borderColor: th.c.line, opacity: pressed ? 0.7 : 1 })}>
      <Icon name={icon} size={21} color={th.c.text} />
    </Pressable>
  );
}

// The long-press menu: the chat, lifted, with Rename / Pin / Delete under it (iOS context-menu style).
function ChatMenu({ menu, screenHeight, left, width, onClose, onRename, onPin, onDelete }: {
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
    <View style={{ position: 'absolute', inset: 0 }}>
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

function RenameDialog({ value, onChange, onCancel, onSave }: { value: { title: string } | null; onChange: (t: string) => void; onCancel: () => void; onSave: () => void }) {
  const th = useTheme();
  if (!value) return null;
  return (
    <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: 24 }}>
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
