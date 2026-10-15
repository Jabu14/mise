// Sous, the in-app cooking assistant: chat, voice messages, voice mode and chat history.
// Not connected to the AI yet: Sous replies with a short placeholder for now.
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Composer } from '../../components/chat/composer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AttachSheet, type AttachChoice } from '../../components/chat/attach-sheet';
import { ChatActions } from '../../components/chat/chat-actions';
import { useChatDrawer } from '../../components/chat/chat-drawer';
import { VoiceMessage } from '../../components/chat/voice-message';
import { Glass } from '../../components/glass';
import { ChatSparkIcon, NewChatIcon } from '../../components/icons';
import { Icon, IconBtn, Screen, Txt } from '../../components/ui';
import { useChats, type ChatAttachment, type ChatMessage } from '../../lib/chat-store';
import { useIslandSpace } from '../../lib/island';
import { useApp } from '../../lib/store';
import { useTheme } from '../../lib/theme';

const SUGGESTIONS = [
  { icon: 'restaurant-outline' as const, text: 'What can I cook with eggs, flour and milk?' },
  { icon: 'swap-horizontal-outline' as const, text: 'What can I use instead of buttermilk?' },
  { icon: 'help-buoy-outline' as const, text: 'My bread dough is too sticky. What should I do?' },
  { icon: 'calendar-outline' as const, text: 'Plan three easy dinners for this week' },
];

// "Good evening, Sam" and a matching nudge, by time of day.
function greeting(hour: number, name: string) {
  const first = name.trim().split(/s+/)[0];
  const [hello, nudge] =
    hour >= 5 && hour < 12 ? ['Good morning', 'What’s for breakfast?']
    : hour >= 12 && hour < 17 ? ['Good afternoon', 'What are we cooking today?']
    : hour >= 17 && hour < 22 ? ['Good evening', 'What’s for dinner tonight?']
    : ['Hi', 'Craving a late-night snack?'];
  return { title: first ? `${hello}, ${first}` : hello, nudge };
}

export default function ChatTab() {
  const th = useTheme();
  const { recipes, settings } = useApp();
  const { getChat, send } = useChats();
  const drawer = useChatDrawer();
  const { chatId, setChatId } = drawer;
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [pickingRecipe, setPickingRecipe] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [actions, setActions] = useState(false);
  const [draft, setDraft] = useState<{ text: string; n: number } | undefined>();
  // A question handed over from elsewhere (e.g. "Ask Sous about it" on a scanned product).
  const { draft: incoming } = useLocalSearchParams<{ draft?: string }>();
  const [seenIncoming, setSeenIncoming] = useState<string | undefined>();
  if (incoming && incoming !== seenIncoming) {
    setSeenIncoming(incoming);
    setDraft(d => ({ text: incoming.slice(0, 1000), n: (d?.n ?? 0) + 1 }));
  }
  const scroll = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const island = useIslandSpace();
  // The header and message box float over the chat; leave room for them at the ends.
  const [headerH, setHeaderH] = useState(0);
  const [composerH, setComposerH] = useState(0);
  // Scrolled up away from the newest message: show the round "back down" button.
  const [awayFromEnd, setAwayFromEnd] = useState(false);
  const [downBtn] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.spring(downBtn, { toValue: awayFromEnd ? 1 : 0, friction: 8, tension: 120, useNativeDriver: true }).start();
  }, [awayFromEnd, downBtn]);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const away = contentSize.height - (contentOffset.y + layoutMeasurement.height) > 160;
    if (away !== awayFromEnd) setAwayFromEnd(away);
  };
  const chat = getChat(chatId);
  const hi = greeting(drawer.greetHour, settings.name);

  // A different chat (or a new one, from here or the history): drop the unsent attachment.
  const [shownId, setShownId] = useState(chatId);
  if (shownId !== chatId) { setShownId(chatId); setAttachment(null); }

  const sendText = (text: string) => {
    const id = send(chatId, { kind: 'text', text, ...(attachment ? { attachment } : {}) });
    setChatId(id);
    setAttachment(null);
  };

  const sendVoice = (uri: string, durationMs: number) => setChatId(send(chatId, { kind: 'voice', text: '', audioUri: uri, durationMs }));

  const pickPhoto = async (camera: boolean) => {
    const permission = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = camera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled && result.assets?.[0]) setAttachment({ type: 'photo', uri: result.assets[0].uri });
  };

  // From the ＋ sheet. The picker opens once the sheet has slid away.
  const choose = (c: AttachChoice) => {
    setSheet(false);
    if (typeof c === 'object') setDraft(d => ({ text: c.draft, n: (d?.n ?? 0) + 1 }));
    else if (c === 'scan') router.push('/scan');
    else setTimeout(() => (c === 'recipe' ? setPickingRecipe(true) : pickPhoto(c === 'camera')), 350);
  };

  return (
    <Screen>
      <View {...drawer.openSwipe.panHandlers} style={{ flex: 1 }}>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1 }}>
        <ScrollView ref={scroll} contentContainerStyle={{ flexGrow: 1, padding: 16, paddingTop: headerH + 8, paddingBottom: composerH + 16, gap: 12 }} keyboardShouldPersistTaps="handled" onScroll={onScroll} scrollEventThrottle={64}
          onContentSizeChange={() => { if (!awayFromEnd) scroll.current?.scrollToEnd({ animated: true }); }}>
          {chat?.messages.length ? (
            chat.messages.map(m => <Bubble key={m.id} m={m} />)
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 20 }}>
              <View style={{ width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accentSoft }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accent }}>
                  <ChatSparkIcon size={32} color={th.c.onAccent} active />
                </View>
              </View>
              <Txt kind="head" weight="bold" size={30} style={{ textAlign: 'center' }}>{hi.title}</Txt>
              <Txt muted size={17} style={{ textAlign: 'center', maxWidth: 300 }}>{hi.nudge}</Txt>
              <View style={{ alignSelf: 'stretch', gap: 8, marginTop: 10 }}>
                {SUGGESTIONS.map(s => (
                  <Pressable key={s.text} onPress={() => sendText(s.text)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line, opacity: pressed ? 0.7 : 1 })}>
                    <Icon name={s.icon} size={20} color={th.c.accent} />
                    <Txt size={15} style={{ flex: 1 }}>{s.text}</Txt>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
        <Animated.View pointerEvents={awayFromEnd ? 'auto' : 'none'} style={{ position: 'absolute', bottom: composerH + 10, alignSelf: 'center', opacity: downBtn, transform: [{ scale: downBtn.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }}>
          <Pressable onPress={() => scroll.current?.scrollToEnd({ animated: true })} accessibilityRole="button" accessibilityLabel="Scroll to the newest message"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <Glass style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="arrow-down" size={20} color={th.c.text} />
            </Glass>
          </Pressable>
        </Animated.View>
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }} onLayout={e => setComposerH(e.nativeEvent.layout.height)}>
        <Composer
          attachment={attachment}
          onClearAttachment={() => setAttachment(null)}
          onAttach={() => setSheet(true)}
          onSendText={sendText}
          onSendVoice={sendVoice}
          onVoiceMode={() => router.push('/voice')}
          draft={draft}
        />
        </View>
        </View>
      </KeyboardAvoidingView>
      {/* Floating header: the chat scrolls underneath, seen through the frosted buttons. */}
      <View pointerEvents="box-none" onLayout={e => setHeaderH(e.nativeEvent.layout.height)}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: insets.top + island + 6, paddingBottom: 6, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center' }}>
        <HeaderBtn label="Chat history" onPress={drawer.open}><Icon name="menu" size={22} color={th.c.text} /></HeaderBtn>
        <View style={{ flex: 1 }} />
        <Glass style={{ flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 24, marginRight: 8 }}>
          <Pressable onPress={drawer.newChat} accessibilityRole="button" accessibilityLabel="New chat" hitSlop={4} style={({ pressed }) => ({ width: 52, height: 48, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
            <NewChatIcon size={22} color={th.c.text} />
          </Pressable>
          {chat ? (
            <Pressable onPress={() => setActions(true)} accessibilityRole="button" accessibilityLabel="Chat options" hitSlop={4} style={({ pressed }) => ({ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
              <Icon name="ellipsis-horizontal" size={22} color={th.c.text} />
            </Pressable>
          ) : null}
        </Glass>
      </View>
      </View>

      <AttachSheet visible={sheet} hasRecipes={recipes.length > 0} onClose={() => setSheet(false)} onChoose={choose} />
      {chat ? <ChatActions chat={chat} visible={actions} onClose={() => setActions(false)} onDeleted={drawer.newChat} /> : null}

      <Modal visible={pickingRecipe} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPickingRecipe(false)}>
        <View style={{ flex: 1, backgroundColor: th.c.bg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
            <Txt kind="head" weight="bold" size={22} style={{ flex: 1 }}>Attach a recipe</Txt>
            <IconBtn name="close" label="Close" onPress={() => setPickingRecipe(false)} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
            {recipes.map(r => (
              <Pressable key={r.id} onPress={() => { setAttachment({ type: 'recipe', recipeId: r.id, title: r.title }); setPickingRecipe(false); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line }}>
                <Txt size={26} style={{ lineHeight: 34 }}>{r.emoji}</Txt>
                <Txt weight="bold" style={{ flex: 1 }} numberOfLines={1}>{r.title}</Txt>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </Screen>
  );
}

// Round header button, like the AI apps' top bar.
function HeaderBtn({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={4} style={({ pressed }) => ({ marginLeft: 8, opacity: pressed ? 0.7 : 1 })}>
      <Glass style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}>{children}</Glass>
    </Pressable>
  );
}

// Your messages are bubbles; Sous's answers are plain text across the page, like Claude's.
function Bubble({ m }: { m: ChatMessage }) {
  const th = useTheme();
  const mine = m.role === 'user';
  const recipe = m.attachment?.type === 'recipe' ? m.attachment : null;
  const content = (
    <>
      {m.attachment?.type === 'photo' && <Image source={{ uri: m.attachment.uri }} style={{ width: 200, height: 150, borderRadius: 12 }} />}
      {recipe && (
        <Pressable onPress={() => router.push(`/recipe/${recipe.recipeId}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: mine ? 'rgba(255,255,255,0.2)' : th.c.accentSoft }}>
          <Icon name="book-outline" size={15} color={mine ? th.c.onAccent : th.c.accent} />
          <Txt weight="bold" size={13} color={mine ? th.c.onAccent : th.c.accent} numberOfLines={1}>{recipe.title}</Txt>
        </Pressable>
      )}
      {m.kind === 'voice' && m.audioUri
        ? <VoiceMessage id={m.id} uri={m.audioUri} durationMs={m.durationMs ?? 0} mine={mine} />
        : m.text ? <Txt size={mine ? 16 : 17} color={mine ? th.c.onAccent : th.c.text} style={mine ? undefined : { lineHeight: th.fs(17) * 1.5 }}>{m.text}</Txt> : null}
    </>
  );
  if (!mine) return <View style={{ gap: 8, paddingHorizontal: 4, paddingVertical: 4 }}>{content}</View>;
  return (
    <View style={{ alignSelf: 'flex-end', maxWidth: '82%', gap: 6, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 22, borderBottomRightRadius: 6, backgroundColor: th.c.accent }}>
      {content}
    </View>
  );
}
