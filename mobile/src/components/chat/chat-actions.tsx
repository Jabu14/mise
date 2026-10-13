// The "…" menu at the top right of an open chat (like ChatGPT): Share, Rename, Pin and Delete.
// It grows out of the button when it opens and shrinks back into it when it closes.
import { useEffect, useState } from 'react';
import { Alert, Animated, Modal, Pressable, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AI_NAME, useChats, type Chat } from '../../lib/chat-store';
import { useIslandSpace } from '../../lib/island';
import { useTheme } from '../../lib/theme';
import { Icon, Txt, type IconName } from '../ui';
import { RenameDialog } from './chat-menus';

function transcript(chat: Chat) {
  const lines = chat.messages.map(m => `${m.role === 'user' ? 'Me' : AI_NAME}: ${m.kind === 'voice' ? '[Voice message]' : m.text}`);
  return `${chat.title}\n\n${lines.join('\n\n')}\n\nShared from Mise`;
}

export function ChatActions({ chat, visible, onClose, onDeleted }: { chat: Chat; visible: boolean; onClose: () => void; onDeleted: () => void }) {
  const th = useTheme();
  const insets = useSafeAreaInsets();
  const island = useIslandSpace();
  const { renameChat, togglePin, deleteChats } = useChats();
  const [pop] = useState(() => new Animated.Value(0));
  const [renaming, setRenaming] = useState<{ title: string } | null>(null);
  // Stays mounted while the closing animation plays.
  const [shown, setShown] = useState(visible);
  if (visible && !shown) setShown(true);

  useEffect(() => {
    if (visible) Animated.spring(pop, { toValue: 1, friction: 8, tension: 160, useNativeDriver: true }).start();
    else Animated.timing(pop, { toValue: 0, duration: 140, useNativeDriver: true }).start(({ finished }) => finished && setShown(false));
  }, [visible, pop]);

  const item = (label: string, icon: IconName, onPress: () => void, danger = false) => (
    <Pressable key={label} onPress={onPress} accessibilityRole="button"
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 16, height: 50, paddingHorizontal: 20, backgroundColor: pressed ? th.c.soft : 'transparent' })}>
      <Icon name={icon} size={21} color={danger ? th.c.temp : th.c.text} />
      <Txt weight="bold" size={17} color={danger ? th.c.temp : th.c.text}>{label}</Txt>
    </Pressable>
  );

  // Close the menu first; open the next sheet once it has gone (iOS shows one sheet at a time).
  const after = (fn: () => void) => { onClose(); setTimeout(fn, 220); };

  const confirmDelete = () => after(() =>
    Alert.alert('Delete chat?', `“${chat.title}” and its voice messages will be deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteChats([chat.id]); onDeleted(); } },
    ]));

  return (
    <>
      <Modal visible={shown} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close menu" />
        <Animated.View
          style={{
            position: 'absolute', top: insets.top + island + 4, right: 12, width: 270, paddingVertical: 8, borderRadius: 26,
            backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line,
            shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 12,
            opacity: pop, transformOrigin: 'top right',
            transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }, { translateY: pop.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
          }}
        >
          {item('Share', 'share-outline', () => after(() => { Share.share({ title: chat.title, message: transcript(chat) }).catch(() => {}); }))}
          {item('Rename', 'pencil-outline', () => after(() => setRenaming({ title: chat.title })))}
          {item(chat.pinned ? 'Unpin' : 'Pin', chat.pinned ? 'pin' : 'pin-outline', () => { togglePin(chat.id); onClose(); })}
          <View style={{ height: 1, marginVertical: 4, marginHorizontal: 20, backgroundColor: th.c.line }} />
          {item('Delete', 'trash-outline', confirmDelete, true)}
        </Animated.View>
      </Modal>

      <Modal visible={!!renaming} transparent animationType="fade" onRequestClose={() => setRenaming(null)} statusBarTranslucent>
        <RenameDialog value={renaming} onChange={title => setRenaming({ title })} onCancel={() => setRenaming(null)}
          onSave={() => { if (renaming) renameChat(chat.id, renaming.title); setRenaming(null); }} />
      </Modal>
    </>
  );
}
