// Something shared with a Mise QR code (mise://s/<code>): see what it is, then save it.
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Btn, Card, Icon, IconBtn, Screen, TopBar, Txt, type IconName } from '../../components/ui';
import { AI_NAME, useChats } from '../../lib/chat-store';
import { SETUP_KEYS, decodeShare, type SharedRecipe } from '../../lib/share-code';
import { useShopping } from '../../lib/shopping';
import { useApp, type Settings } from '../../lib/store';
import { useTheme } from '../../lib/theme';
import { parseRecipe } from '../../shared/parser';

const titleOf = (r: SharedRecipe) => (typeof r.title === 'string' ? r.title : 'Recipe');
const countOf = (r: SharedRecipe, k: string) => (Array.isArray(r[k]) ? (r[k] as unknown[]).length : 0);

export default function ReceivedScreen() {
  const th = useTheme();
  const { code } = useLocalSearchParams<{ code: string }>();
  const { saveParsed, patchRecipe, updateSettings, settings } = useApp();
  const { addText } = useShopping();
  const { importChat } = useChats();
  const [payload] = useState(() => decodeShare(String(code ?? '')));
  const [done, setDone] = useState('');

  const success = (message: string) => {
    if (settings.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setDone(message);
  };

  // Recipes come as the JSON the recipe parser reads, so they're checked like any pasted recipe.
  const saveRecipe = (r: SharedRecipe, collection?: string) => {
    const text = JSON.stringify(r);
    const parsed = parseRecipe(text);
    if (!parsed) return null;
    const id = saveParsed(parsed, text);
    if (collection) patchRecipe(id, { collections: [collection.slice(0, 30)] });
    return id;
  };

  let icon: IconName = 'alert-circle-outline';
  let heading = 'This code isn’t from Mise';
  let sub = 'Ask them to share it again from Mise: Account → QR.';
  let body: React.ReactNode = null;
  let action: { title: string; run: () => void } | null = null;

  if (payload?.k === 'recipe') {
    icon = 'book-outline'; heading = titleOf(payload.r); sub = 'A recipe was shared with you';
    body = <Txt muted>{countOf(payload.r, 'ingredients') ? `${payload.r.ingredients && (payload.r.ingredients as { items?: unknown[] }[]).reduce((n, g) => n + (g.items?.length ?? 0), 0)} ingredients · ` : ''}{countOf(payload.r, 'steps')} steps</Txt>;
    action = { title: 'Save to my recipes', run: () => { const id = saveRecipe(payload.r); if (id) router.replace(`/recipe/${id}`); else setDone('This recipe couldn’t be read.'); } };
  } else if (payload?.k === 'book') {
    icon = 'folder-outline'; heading = payload.name; sub = `A cookbook with ${payload.r.length} ${payload.r.length === 1 ? 'recipe' : 'recipes'}`;
    body = <View style={{ gap: 6 }}>{payload.r.map((r, i) => <Txt key={i}>• {titleOf(r)}</Txt>)}</View>;
    action = { title: `Save ${payload.r.length === 1 ? 'the recipe' : `all ${payload.r.length} recipes`}`, run: () => { const n = payload.r.map(r => saveRecipe(r, payload.name)).filter(Boolean).length; success(`Saved ${n} ${n === 1 ? 'recipe' : 'recipes'} in “${payload.name}”.`); } };
  } else if (payload?.k === 'list') {
    icon = 'cart-outline'; heading = 'A shopping list'; sub = `${payload.items.length} items`;
    body = <View style={{ gap: 6 }}>{payload.items.slice(0, 30).map((t, i) => <Txt key={i}>• {t}</Txt>)}{payload.items.length > 30 ? <Txt muted>and {payload.items.length - 30} more</Txt> : null}</View>;
    action = { title: 'Add to my shopping list', run: () => { payload.items.forEach(t => addText(String(t))); success(`Added ${payload.items.length} items to your shopping list.`); } };
  } else if (payload?.k === 'chat') {
    icon = 'chatbubble-outline'; heading = payload.title || `${AI_NAME} chat`; sub = `A ${AI_NAME} chat, ${payload.m.length} messages`;
    body = (
      <View style={{ gap: 8 }}>
        {payload.m.slice(0, 6).map(([who, text], i) => (
          <View key={i} style={{ alignSelf: who === 'u' ? 'flex-end' : 'flex-start', maxWidth: '85%', padding: 10, borderRadius: 16, backgroundColor: who === 'u' ? th.c.accentSoft : th.c.soft }}>
            <Txt size={14} numberOfLines={4}>{text}</Txt>
          </View>
        ))}
      </View>
    );
    action = { title: 'Save this chat', run: () => { importChat(payload.title, payload.m.map(([who, text]) => ({ role: who === 'u' ? 'user' : 'assistant', text: String(text) }))); success(`Saved. Find it in your ${AI_NAME} chat history.`); } };
  } else if (payload?.k === 'setup') {
    icon = 'options-outline'; heading = 'A kitchen setup'; sub = 'Colours, fonts, units and cook mode';
    const s = payload.s as Record<string, unknown>;
    body = <View style={{ gap: 4 }}>{SETUP_KEYS.filter(k => s[k] !== undefined).slice(0, 6).map(k => <Txt key={k} muted size={14}>{k}: {String(s[k])}</Txt>)}</View>;
    action = { title: 'Use this setup', run: () => {
      const patch: Partial<Settings> = {};
      SETUP_KEYS.forEach(k => { if (s[k] !== undefined) (patch as Record<string, unknown>)[k] = s[k]; });
      updateSettings(patch); // checked against the allowed values like any setting
      success('Done! Your app now uses this setup.');
    } };
  }

  return (
    <Screen>
      <TopBar>
        <IconBtn name="close" label="Close" onPress={() => router.back()} />
        <Txt kind="head" weight="bold" size={19} style={{ flex: 1, paddingLeft: 4 }}>Shared with you</Txt>
      </TopBar>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 48, gap: 16 }}>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <View style={{ width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: payload ? th.c.accentSoft : th.c.soft }}>
            <Icon name={icon} size={34} color={payload ? th.c.accent : th.c.temp} />
          </View>
          <Txt kind="head" weight="bold" size={24} style={{ textAlign: 'center' }}>{heading}</Txt>
          <Txt muted style={{ textAlign: 'center' }}>{sub}</Txt>
        </View>
        {body ? <Card style={{ padding: 16 }}>{body}</Card> : null}
        {done ? (
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', padding: 14, borderRadius: 16, backgroundColor: th.c.accentSoft }}>
            <Icon name="checkmark-circle" size={22} color={th.c.accent} />
            <Txt weight="bold" style={{ flex: 1 }}>{done}</Txt>
          </View>
        ) : action ? <Btn size="big" title={action.title} icon="download-outline" onPress={action.run} /> : null}
        <Btn title={done ? 'Done' : 'Not now'} variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}
