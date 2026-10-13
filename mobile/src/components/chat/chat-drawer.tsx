// Chat history, opened like the Claude app: the whole app (tab bar included) slides right and
// follows your finger, uncovering the history underneath. Swipe right on the chat to open,
// swipe left (or tap the strip on the right) to close.
// The history has Pinned and Recents, a long-press menu to Rename, Pin or Delete, a search button
// that opens every chat on its own page, and at the bottom voice mode and New chat.
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Alert, Animated, BackHandler, Dimensions, Keyboard, Modal, PanResponder, Pressable, ScrollView, View,
  useWindowDimensions, type GestureResponderEvent, type PanResponderInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AI_NAME, useChats, type Chat } from '../../lib/chat-store';
import { useIslandSpace } from '../../lib/island';
import { useApp } from '../../lib/store';
import { useTheme } from '../../lib/theme';
import { VoiceWaveIcon } from '../icons';
import { Icon, Txt, type IconName } from '../ui';
import { ChatMenu, RenameDialog, type Menu } from './chat-menus';
import { ChatSearch } from './chat-search';

const panelWidth = () => Math.min(Dimensions.get('window').width * 0.82, 340);
const SPRING = { friction: 12, tension: 80, useNativeDriver: true } as const;
const RADIUS = 34;

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
  openSearch: () => void;
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
  // When the search page was opened (0 = closed); also the "now" for its "2 hours ago" times.
  const [searchAt, setSearchAt] = useState(0);

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
  const openSearch = useCallback(() => setSearchAt(Date.now()), []);

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

  const value = useMemo(
    () => ({ isOpen, open, close, openSwipe, chatId, setChatId, newChat, greetHour, openSearch }),
    [isOpen, open, close, openSwipe, chatId, newChat, greetHour, openSearch],
  );

  return (
    <DrawerContext.Provider value={value}>
      <View style={{ flex: 1, backgroundColor: th.c.bg }}>
        {moving ? <ChatSidebar panel={panel} closeSwipe={closeSwipe} /> : null}
        <Animated.View
          style={{
            flex: 1,
            transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, panel] }) }],
            ...(moving ? { borderRadius: RADIUS, shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: -4, height: 0 }, elevation: 12 } : null),
          }}
        >
          {/* Only the corner rounding changes while moving: nothing that affects layout, so the
              chat underneath never re-wraps or shifts. The outline is drawn on top as an overlay. */}
          <View style={{ flex: 1, borderRadius: moving ? RADIUS : 0, overflow: 'hidden' }}>
            {children}
            {isOpen ? (
              <Animated.View {...closeSwipe.panHandlers} style={{ position: 'absolute', inset: 0, backgroundColor: '#000', opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.18] }) }}>
                <Pressable style={{ flex: 1 }} onPress={close} accessibilityRole="button" accessibilityLabel="Close chat history" />
              </Animated.View>
            ) : null}
            {moving ? <View pointerEvents="none" style={{ position: 'absolute', inset: 0, borderRadius: RADIUS, borderWidth: 1, borderColor: th.c.line }} /> : null}
          </View>
        </Animated.View>
      </View>

      <ChatSearch
        visible={searchAt > 0}
        openedAt={searchAt}
        onClose={() => setSearchAt(0)}
        onSelect={id => { setChatId(id); close(); }}
        onNewChat={() => { newChat(); close(); }}
      />
    </DrawerContext.Provider>
  );
}

function ChatSidebar({ panel, closeSwipe }: { panel: number; closeSwipe: PanResponderInstance }) {
  const th = useTheme();
  const insets = useSafeAreaInsets();
  const island = useIslandSpace();
  const { height } = useWindowDimensions();
  const { settings } = useApp();
  const { chats, renameChat, togglePin, deleteChats } = useChats();
  const { chatId, setChatId, newChat, close, openSearch } = useChatDrawer();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null);

  const pinned = chats.filter(c => c.pinned);
  const recents = chats.filter(c => !c.pinned);

  const go = (fn: () => void) => { fn(); close(); };

  const openMenu = (chat: Chat, e: GestureResponderEvent) => {
    if (settings.haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setMenu({ chat, y: e.nativeEvent.pageY });
  };

  const confirmDelete = (chat: Chat) => {
    setMenu(null);
    setTimeout(() => Alert.alert('Delete chat?', `“${chat.title}” and its voice messages will be deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteChats([chat.id]); if (chat.id === chatId) newChat(); } },
    ]), 220);
  };

  const row = (c: Chat) => {
    const active = c.id === chatId;
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
        <Txt weight={active ? 'black' : 'bold'} size={17} numberOfLines={1} style={{ flex: 1 }}>{c.title}</Txt>
      </Pressable>
    );
  };

  return (
    <View {...closeSwipe.panHandlers} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: panel, paddingTop: insets.top + 8 + island }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingBottom: 14 }}>
        <Txt kind="head" weight="bold" size={32} style={{ flex: 1 }}>{AI_NAME}</Txt>
        <CircleBtn icon="search" label="Search chats" onPress={openSearch} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}>
        {!chats.length && <Txt muted size={15} style={{ paddingHorizontal: 22, paddingTop: 8 }}>{`Your chats with ${AI_NAME} will show up here.`}</Txt>}
        {pinned.length ? <Section title="Pinned">{pinned.map(row)}</Section> : null}
        {recents.length ? <Section title="Recents">{recents.map(row)}</Section> : null}
      </ScrollView>

      <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 }}>
        <Pressable onPress={() => go(() => router.push('/voice'))} accessibilityRole="button" accessibilityLabel={`Talk to ${AI_NAME}`}
          style={({ pressed }) => ({ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.soft, borderWidth: 1, borderColor: th.c.line, opacity: pressed ? 0.7 : 1 })}>
          <VoiceWaveIcon size={22} color={th.c.text} />
        </Pressable>
        <Pressable onPress={() => go(newChat)} accessibilityRole="button"
          style={({ pressed }) => ({ height: 52, paddingHorizontal: 22, borderRadius: 26, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: th.c.accent, opacity: pressed ? 0.85 : 1, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } })}>
          <Icon name="add" size={21} color={th.c.onAccent} />
          <Txt weight="black" size={16} color={th.c.onAccent}>New chat</Txt>
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
            onRename={() => { const m = menu; setMenu(null); setTimeout(() => setRenaming({ id: m.chat.id, title: m.chat.title }), 220); }}
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
