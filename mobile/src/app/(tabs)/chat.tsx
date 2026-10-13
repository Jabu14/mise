// Sous, the in-app cooking assistant: chat, voice messages, voice mode and chat history.
// Not connected to the AI yet — Sous replies with a short placeholder for now.
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { Composer } from '../../components/chat/composer';
import { useChatDrawer } from '../../components/chat/chat-drawer';
import { VoiceMessage } from '../../components/chat/voice-message';
import { ChatSparkIcon } from '../../components/icons';
import { Icon, IconBtn, Screen, TopBar, Txt } from '../../components/ui';
import { AI_NAME, useChats, type ChatAttachment, type ChatMessage } from '../../lib/chat-store';
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
  const scroll = useRef<ScrollView>(null);
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

  const attach = () =>
    Alert.alert('Add to your message', undefined, [
      { text: 'Take a photo', onPress: () => pickPhoto(true) },
      { text: 'Choose a photo', onPress: () => pickPhoto(false) },
      ...(recipes.length ? [{ text: 'One of my recipes', onPress: () => setPickingRecipe(true) }] : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);

  return (
    <Screen>
      <View {...drawer.openSwipe.panHandlers} style={{ flex: 1 }}>
      <TopBar>
        <IconBtn name="menu" label="Chat history" onPress={drawer.open} />
        <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 4 }}>
          <Txt kind="head" weight="bold" size={chat ? 17 : 20} numberOfLines={1}>{chat ? chat.title : AI_NAME}</Txt>
          <Txt muted size={12} weight="bold">{chat ? `${AI_NAME} · Preview` : 'Your sous-chef · Preview'}</Txt>
        </View>
        <IconBtn name="create-outline" label="New chat" onPress={drawer.newChat} />
      </TopBar>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroll} contentContainerStyle={{ flexGrow: 1, padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled" onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
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
        <Composer
          attachment={attachment}
          onClearAttachment={() => setAttachment(null)}
          onAttach={attach}
          onSendText={sendText}
          onSendVoice={sendVoice}
          onVoiceMode={() => router.push('/voice')}
        />
      </KeyboardAvoidingView>
      </View>

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

function Bubble({ m }: { m: ChatMessage }) {
  const th = useTheme();
  const mine = m.role === 'user';
  return (
    <View style={{ flexDirection: 'row', justifyContent: mine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
      {!mine && (
        <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accent }}>
          <ChatSparkIcon size={16} color={th.c.onAccent} active />
        </View>
      )}
      <View style={{ maxWidth: '80%', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderBottomRightRadius: mine ? 6 : 20, borderBottomLeftRadius: mine ? 20 : 6, backgroundColor: mine ? th.c.accent : th.c.surface, borderWidth: mine ? 0 : 1, borderColor: th.c.line }}>
        {m.attachment?.type === 'photo' && <Image source={{ uri: m.attachment.uri }} style={{ width: 200, height: 150, borderRadius: 12 }} />}
        {m.attachment?.type === 'recipe' && (
          <Pressable onPress={() => m.attachment?.type === 'recipe' && router.push(`/recipe/${m.attachment.recipeId}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: mine ? 'rgba(255,255,255,0.2)' : th.c.accentSoft }}>
            <Icon name="book-outline" size={15} color={mine ? th.c.onAccent : th.c.accent} />
            <Txt weight="bold" size={13} color={mine ? th.c.onAccent : th.c.accent} numberOfLines={1}>{m.attachment.title}</Txt>
          </Pressable>
        )}
        {m.kind === 'voice' && m.audioUri
          ? <VoiceMessage id={m.id} uri={m.audioUri} durationMs={m.durationMs ?? 0} mine={mine} />
          : m.text ? <Txt color={mine ? th.c.onAccent : th.c.text}>{m.text}</Txt> : null}
      </View>
    </View>
  );
}
