// Chats with Sous, the in-app assistant: stored on the phone, with history and voice messages.
// The AI isn't connected yet, so Sous answers with a short placeholder until it is.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { File } from 'expo-file-system';
import { smartTitle } from './chat-title';
import { cleanChats } from './validate';

export const AI_NAME = 'Sous';

export type ChatAttachment = { type: 'recipe'; recipeId: string; title: string } | { type: 'photo'; uri: string };
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  kind: 'text' | 'voice';
  text: string;
  audioUri?: string;
  durationMs?: number;
  attachment?: ChatAttachment;
  at: number;
};
// autoTitle: the name was made from the messages (and can still improve); false once the user renames it.
export type Chat = { id: string; title: string; autoTitle: boolean; pinned: boolean; createdAt: number; updatedAt: number; messages: ChatMessage[] };

const KEY = 'mise.chats.v1';
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const PLACEHOLDER = `I'm not connected yet, but soon I'll be able to answer questions about your recipes, help with substitutions, and keep an eye on your timers.`;

type ChatValue = {
  chats: Chat[];
  getChat: (id: string | null) => Chat | undefined;
  send: (chatId: string | null, message: Pick<ChatMessage, 'kind' | 'text' | 'audioUri' | 'durationMs' | 'attachment'>) => string;
  renameChat: (id: string, title: string) => void;
  togglePin: (id: string) => void;
  deleteChats: (ids: string[]) => void;
};

const ChatContext = createContext<ChatValue | null>(null);
export const useChats = () => useContext(ChatContext)!;

// Named from the first typed message, like AI apps do. A chat that starts with a voice message is
// "Voice chat" until something is typed. (Once Sous is connected, the AI will name chats itself.)
function titleFor(messages: Pick<ChatMessage, 'role' | 'kind' | 'text'>[]) {
  const firstText = messages.find(m => m.role === 'user' && m.kind === 'text' && m.text.trim());
  return firstText ? smartTitle(firstText.text) : 'Voice chat';
}

function deleteAudio(chat: Chat) {
  for (const m of chat.messages) {
    if (!m.audioUri) continue;
    try {
      const f = new File(m.audioUri);
      if (f.exists) f.delete();
    } catch {
      // already gone
    }
  }
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(raw => setChats(cleanChats(raw ? JSON.parse(raw) : [])))
      .catch(() => setChats([]))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(chats)).catch(() => {});
  }, [ready, chats]);

  const getChat = useCallback((id: string | null) => (id ? chats.find(c => c.id === id) : undefined), [chats]);

  const send = useCallback<ChatValue['send']>((chatId, message) => {
    const time = Date.now();
    const id = chatId || newId();
    const userMsg: ChatMessage = { id: newId(), role: 'user', at: time, ...message, text: message.text.slice(0, 8000) };
    setChats(list => {
      const existing = list.find(c => c.id === id);
      const messages = existing ? [...existing.messages, userMsg] : [userMsg];
      const chat: Chat = existing
        ? { ...existing, updatedAt: time, messages, title: existing.autoTitle ? titleFor(messages) : existing.title }
        : { id, title: titleFor(messages), autoTitle: true, pinned: false, createdAt: time, updatedAt: time, messages };
      return [chat, ...list.filter(c => c.id !== id)];
    });
    // Placeholder reply until the AI is connected.
    setTimeout(() => {
      const reply: ChatMessage = { id: newId(), role: 'assistant', kind: 'text', text: PLACEHOLDER, at: Date.now() };
      setChats(list => list.map(c => (c.id === id ? { ...c, updatedAt: reply.at, messages: [...c.messages, reply] } : c)));
    }, 900);
    return id;
  }, []);

  const renameChat = useCallback((id: string, title: string) => {
    const clean = title.replace(/\s+/g, ' ').trim().slice(0, 60);
    if (clean) setChats(list => list.map(c => (c.id === id ? { ...c, title: clean, autoTitle: false } : c)));
  }, []);

  const togglePin = useCallback((id: string) => {
    setChats(list => list.map(c => (c.id === id ? { ...c, pinned: !c.pinned } : c)));
  }, []);

  const deleteChats = useCallback((ids: string[]) => {
    const gone = new Set(ids);
    setChats(list => {
      list.filter(c => gone.has(c.id)).forEach(deleteAudio);
      return list.filter(c => !gone.has(c.id));
    });
  }, []);

  const value = useMemo(() => ({ chats, getChat, send, renameChat, togglePin, deleteChats }), [chats, getChat, send, renameChat, togglePin, deleteChats]);
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
