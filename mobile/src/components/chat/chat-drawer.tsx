// Chat history, opened like the Claude app: the whole app (tab bar included) slides right and
// follows your finger, uncovering the history underneath. Swipe right on the chat to open,
// swipe left (or tap the strip on the right) to close.
// The history has search, Pinned and Recents, and a long-press menu to Rename, Pin or Delete.
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Alert, Animated, BackHandler, Dimensions, Keyboard, Modal, PanResponder, Pressable, ScrollView, TextInput, View,
  useWindowDimensions, type GestureResponderEvent, type PanResponderInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AI_NAME, useChats, type Chat } from '../../lib/chat-store';
import { useIslandSpace } from '../../lib/island';
import { useApp } from '../../lib/store';
import { useTheme } from '../../lib/theme';
import { Icon, Txt, type IconName } from '../ui';

const panelWidth = () => Math.min(Dimensions.get('window').width * 0.82, 340);
const SPRING = { friction: 12, tension: 80, useNativeDriver: true } as const;

type DrawerValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  // Put on the chat screen: a rightward swipe drags the app open.
  openSwipe: PanResponderInstance;
  chatId: string | null;
  setChatId: (id: string | null) => void;
  newChat: () => void;
  // The hour the current new chat was started, for "Good evening".
  greetHour: number;
};

const DrawerContext = createContext<DrawerValue | null>(null);
export const useChatDrawer = () => useContext(DrawerContext)!;

export function ChatDrawerShell({ children }: { children: ReactNode }) {
  const th = useTheme();
  const { width } = useWindowDimensions();
  const panel = Math.min(width * 0.82, 340);
  const [progress] = useState(() => new Animated.Value(0));
  const [isOpen, setIsOpen] = useState(false);
  // True from the first drag until the app has slid fully back (rounds the app's corners meanwhile).
  const [moving, setMoving] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [greetHour, setGreetHour] = useState(() => new Date().getHours());

  const open = useCallback(() => {
    Keyboard.dismiss();
    setMoving(true);
    setIsOpen(true);
    Animated.spring(progress, { toValue: 1, ...SPRING }).start();
  }, [progress]);

  const close = useCallback(() => {
    setIsOpen(false);
    Animated.spring(progress, { toValue: 0, ...SPRING }).start(({ finished }) => finished && setMoving(false));
  }, [progress]);

  const newChat = useCallback(() => { setChatId(null); setGreetHour(new Date().getHours()); }, []);

  // Swipe right on the chat: the app follows your finger.
  const [openSwipe] = useState(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, g) => g.dx > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.8,
    onPanResponderGrant: () => { Keyboard.dismiss(); setMoving(true); },
    // Once you're swiping, the chat's scroll view can't take the gesture away.
    onPanResponderTerminationRequest: () => false,
    onPanResponderMove: (_, g) => progress.setValue(Math.max(0, Math.min(1, g.dx / panelWidth()))),
    onPanResponderRelease: (_, g) => (g.dx > panelWidth() * 0.35 || g.vx > 0.5 ? open() : close()),
    onPanResponderTerminate: () => close(),
  }));

  // Swipe left on the history or the app strip: it follows your finger back.
  const [closeSwipe] = useState(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => g.dx < -10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
    onPanResponderTerminationRequest: () => false,
    onPanResponderMove: (_, g) => progress.setValue(Math.max(0, Math.min(1, 1 + g.dx / panelWidth()))),
    onPanResponderRelease: (_, g) => (g.dx < -panelWidth() * 0.3 || g.vx < -0.5 ? close() : open()),
    onPanResponderTerminate: () => open(),
  }));

  // Android back button closes the history first.
  useEffect(() => {
    if (!isOpen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { close(); return true; });
    return () => sub.remove();
  }, [isOpen, close]);

  const value = useMemo(() => ({ isOpen, open, close, openSwipe, chatId, setChatId, newChat, greetHour }), [isOpen, open, close, openSwipe, chatId, newChat, greetHour]);

  return (
    <DrawerContext.Provider value={value}>
      <View style={{ flex: 1, backgroundColor: th.c.bg }}>
        {moving ? <ChatSidebar panel={panel} closeSwipe={closeSwipe} /> : null}
        <Animated.View
          style={{
            flex: 1,
            transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, panel] }) }],
            ...(moving ? { borderRadius: 34, shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: -4, height: 0 }, elevation: 12 } : null),
          }}
        >
          <View style={{ flex: 1, borderRadius: moving ? 34 : 0, overflow: 'hidden', borderWidth: moving ? 1 : 0, borderColor: th.c.line }}>
            {children}
            {isOpen ? (
              <Animated.View {...closeSwipe.panHandlers} style={{ position: 'absolute', inset: 0, backgroundColor: '#000', opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.18] }) }}>
                <Pressable style={{ flex: 1 }} onPress={close} accessibilityRole="button" accessibilityLabel="Close chat history" />
              </Animated.View>
            ) : null}
          </View>
        </Animated.View>
      </View>
    </DrawerContext.Provider>
  );
}

type Menu = { chat: Chat; y: number };

function ChatSidebar({ panel, closeSwipe }: { panel: number; closeSwipe: PanResponderInstance }) {
  const th = useTheme();
  const insets = useSafeAreaInsets();
  const island = useIslandSpace();
  const { height } = useWindowDimensions();
  const { settings } = useApp();
  const { chats, renameChat, togglePin, deleteChats } = useChats();
  const { chatId, setChatId, newChat, close } = useChatDrawer();
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [menu, setMenu] = useState<Menu | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null);

  const q = query.trim().toLowerCase();
  const results = q
    ? chats.filter(c => c.title.toLowerCase().includes(q) || c.messages.some(m => m.text.toLowerCase().includes(q)))
    : chats;
  const pinned = q ? [] : chats.filter(c => c.pinned);
  const recents = q ? results : chats.filter(c => !c.pinned);

  const go = (fn: () => void) => { setSearching(false); setQuery(''); fn(); close(); };

  const openMenu = (chat: Chat, e: GestureResponderEvent) => {
    if (settings.haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setMenu({ chat, y: e.nativeEvent.pageY });
  };

  const confirmDelete = (chat: Chat) => {
    setMenu(null);
    Alert.alert('Delete chat?', `“${chat.title}” and its voice messages will be deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteChats([chat.id]); if (chat.id === chatId) newChat(); } },
    ]);
  };

  const row = (c: Chat) => {
    const active = c.id === chatId;
    const match = q && !c.title.toLowerCase().includes(q) ? c.messages.find(m => m.text.toLowerCase().includes(q))?.text : undefined;
    return (
      <Pressable
        key={c.id}
        onPress={() => go(() => setChatId(c.id))}
        onLongPress={e => openMenu(c, e)}
        delayLongPress={350}
        accessibilityHint="Long press for rename, pin and delete"
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 10, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 14, backgroundColor: active || pressed ? th.c.soft : 'transparent' })}
      >
        <Icon name={c.pinned ? 'pin-outline' : 'chatbubble-outline'} size={21} color={th.c.text} />
        <View style={{ flex: 1 }}>
          <Txt weight={active ? 'black' : 'bold'} size={17} numberOfLines={1}>{c.title}</Txt>
          {match ? <Txt muted size={13} numberOfLines={1}>{snippet(match, q)}</Txt> : null}
        </View>
      </Pressable>
    );
  };

  return (
    <View {...closeSwipe.panHandlers} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: panel, paddingTop: insets.top + 8 + island }}>
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
        <Pressable onPress={() => go(() => router.navigate('/account'))} accessibilityLabel="Account"
          style={{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.soft, borderWidth: 1, borderColor: th.c.line }}>
          {settings.name.trim()
            ? <Txt weight="black" size={19}>{settings.name.trim().charAt(0).toUpperCase()}</Txt>
            : <Icon name="person" size={22} color={th.c.text} />}
        </Pressable>
        <Pressable onPress={() => go(newChat)} accessibilityRole="button"
          style={({ pressed }) => ({ flex: 1, height: 52, borderRadius: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: th.c.accent, opacity: pressed ? 0.85 : 1, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } })}>
          <Icon name="add" size={22} color={th.c.onAccent} />
          <Txt weight="black" size={17} color={th.c.onAccent}>New chat</Txt>
        </Pressable>
      </View>

      <Modal visible={!!menu} transparent animationType="none" onRequestClose={() => setMenu(null)} statusBarTranslucent>
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
      </Modal>

      <Modal visible={!!renaming} transparent animationType="fade" onRequestClose={() => setRenaming(null)} statusBarTranslucent>
        <RenameDialog value={renaming} onChange={title => setRenaming(r => (r ? { ...r, title } : r))} onCancel={() => setRenaming(null)}
          onSave={() => { if (renaming) renameChat(renaming.id, renaming.title); setRenaming(null); }} />
      </Modal>
    </View>
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

function Section({ title, children }: { title: string; children: ReactNode }) {
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

function RenameDialog({ value, onChange, onCancel, onSave }: { value: { title: string } | null; onChange: (t: string) => void; onCancel: () => void; onSave: () => void }) {
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
