// Chats with Sous, the in-app assistant: stored on the phone, with history and voice messages.
// The AI isn't connected yet, so Sous answers with a short placeholder until it is.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { File } from 'expo-file-system';
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
export type Chat = { id: string; title: string; createdAt: number; updatedAt: number; messages: ChatMessage[] };

const KEY = 'mise.chats.v1';
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const PLACEHOLDER = `I'm not connected yet, but soon I'll be able to answer questions about your recipes, help with substitutions, and keep an eye on your timers.`;

type ChatValue = {
  chats: Chat[];
  getChat: (id: string | null) => Chat | undefined;
  send: (chatId: string | null, message: Pick<ChatMessage, 'kind' | 'text' | 'audioUri' | 'durationMs' | 'attachment'>) => string;
  renameChat: (id: string, title: string) => void;
  deleteChats: (ids: string[]) => void;
};

const ChatContext = createContext<ChatValue | null>(null);
export const useChats = () => useContext(ChatContext)!;

function titleFrom(m: Pick<ChatMessage, 'kind' | 'text'>) {
  if (m.kind === 'voice') return 'Voice message';
  const t = m.text.replace(/\s+/g, ' ').trim();
  return t.length > 40 ? `${t.slice(0, 39)}…` : t || 'New chat';
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
      const chat: Chat = existing
        ? { ...existing, updatedAt: time, messages: [...existing.messages, userMsg] }
        : { id, title: titleFrom(message), createdAt: time, updatedAt: time, messages: [userMsg] };
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
    const clean = title.trim().slice(0, 60);
    if (clean) setChats(list => list.map(c => (c.id === id ? { ...c, title: clean } : c)));
  }, []);

  const deleteChats = useCallback((ids: string[]) => {
    const gone = new Set(ids);
    setChats(list => {
      list.filter(c => gone.has(c.id)).forEach(deleteAudio);
      return list.filter(c => !gone.has(c.id));
    });
  }, []);

  const value = useMemo(() => ({ chats, getChat, send, renameChat, deleteChats }), [chats, getChat, send, renameChat, deleteChats]);
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
