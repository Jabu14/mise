// The "…" menu at the top right of an open chat (like ChatGPT): the chat's name, then
// Share, Rename, Pin and Delete.
import { useEffect, useState } from 'react';
import { Alert, Animated, Modal, Pressable, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AI_NAME, useChats, type Chat } from '../../lib/chat-store';
import { useIslandSpace } from '../../lib/island';
import { useTheme } from '../../lib/theme';
import { Icon, Txt, type IconName } from '../ui';
import { RenameDialog } from './chat-drawer';

function transcript(chat: Chat) {
  const lines = chat.messages.map(m => `${m.role === 'user' ? 'Me' : AI_NAME}: ${m.kind === 'voice' ? '[Voice message]' : m.text}`);
  return `${chat.title}\n\n${lines.join('\n\n')}\n\n— from Mise`;
}

export function ChatActions({ chat, visible, onClose, onDeleted }: { chat: Chat; visible: boolean; onClose: () => void; onDeleted: () => void }) {
  const th = useTheme();
  const insets = useSafeAreaInsets();
  const island = useIslandSpace();
  const { renameChat, togglePin, deleteChats } = useChats();
  const [pop] = useState(() => new Animated.Value(0));
  const [renaming, setRenaming] = useState<{ title: string } | null>(null);

  useEffect(() => {
    if (visible) { pop.setValue(0); Animated.spring(pop, { toValue: 1, friction: 7, tension: 140, useNativeDriver: true }).start(); }
  }, [visible, pop]);

  const item = (label: string, icon: IconName, onPress: () => void, danger = false) => (
    <Pressable key={label} onPress={onPress} accessibilityRole="button"
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 16, height: 50, paddingHorizontal: 20, backgroundColor: pressed ? th.c.soft : 'transparent' })}>
      <Icon name={icon} size={21} color={danger ? th.c.temp : th.c.text} />
      <Txt weight="bold" size={17} color={danger ? th.c.temp : th.c.text}>{label}</Txt>
    </Pressable>
  );

  const confirmDelete = () => {
    onClose();
    Alert.alert('Delete chat?', `“${chat.title}” and its voice messages will be deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteChats([chat.id]); onDeleted(); } },
    ]);
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close menu" />
        <Animated.View
          style={{
            position: 'absolute', top: insets.top + island + 4, right: 12, width: 270, paddingVertical: 8, borderRadius: 26,
            backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line,
            shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 12,
            opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
          }}
        >
          <Txt muted weight="bold" size={14} numberOfLines={1} style={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 8 }}>{chat.title}</Txt>
          {item('Share', 'share-outline', () => { onClose(); Share.share({ title: chat.title, message: transcript(chat) }).catch(() => {}); })}
          {item('Rename', 'pencil-outline', () => { onClose(); setRenaming({ title: chat.title }); })}
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
