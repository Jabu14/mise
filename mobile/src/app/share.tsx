// Share with a QR code: pick what to share (a recipe, a cookbook, your shopping list, a Sous chat or
// your kitchen setup) and show the code to someone. They scan it in Mise (Account → QR → Scan, or
// the scanner) and get a copy. Everything is inside the code, so no account or internet is needed.
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { allCollections } from '../components/collection-sheet';
import { Btn, Icon, IconBtn, Screen, TopBar, Txt, type IconName } from '../components/ui';
import { AI_NAME, useChats } from '../lib/chat-store';
import { MAX_CODE, chatForShare, encodeShare, recipeForShare, setupForShare, type Payload } from '../lib/share-code';
import { useShopping, itemLabel } from '../lib/shopping';
import { useApp } from '../lib/store';
import { useTheme } from '../lib/theme';

type Kind = 'recipe' | 'book' | 'list' | 'chat' | 'setup';
const KINDS: [Kind, string, IconName][] = [
  ['recipe', 'Recipe', 'book-outline'],
  ['book', 'Cookbook', 'folder-outline'],
  ['list', 'Shopping list', 'cart-outline'],
  ['chat', `${AI_NAME} chat`, 'chatbubble-outline'],
  ['setup', 'Kitchen setup', 'options-outline'],
];

export default function ShareScreen() {
  const th = useTheme();
  const { width } = useWindowDimensions();
  const { recipes, settings } = useApp();
  const { chats } = useChats();
  const { items } = useShopping();
  const books = allCollections(recipes);
  const [kind, setKind] = useState<Kind>('recipe');
  const [pick, setPick] = useState<Record<Kind, string>>({ recipe: recipes[0]?.id ?? '', book: books[0]?.name ?? '', list: '', chat: chats[0]?.id ?? '', setup: '' });

  // What's being shared, and the options to choose from.
  let payload: Payload | null = null;
  let label = '';
  let choices: { id: string; title: string; sub?: string }[] = [];
  if (kind === 'recipe') {
    choices = recipes.map(r => ({ id: r.id, title: r.title, sub: `${r.steps.length} steps` }));
    const r = recipes.find(x => x.id === pick.recipe);
    if (r) { payload = { v: 1, k: 'recipe', r: recipeForShare(r) }; label = r.title; }
  } else if (kind === 'book') {
    choices = books.map(b => ({ id: b.name, title: b.name, sub: `${b.count} ${b.count === 1 ? 'recipe' : 'recipes'}` }));
    const inBook = recipes.filter(r => r.collections?.includes(pick.book));
    if (inBook.length) { payload = { v: 1, k: 'book', name: pick.book, r: inBook.map(recipeForShare) }; label = pick.book; }
  } else if (kind === 'list') {
    const open = items.filter(i => !i.checked);
    if (open.length) { payload = { v: 1, k: 'list', items: open.slice(0, 80).map(itemLabel) }; label = `${open.length} items to buy`; }
  } else if (kind === 'chat') {
    choices = chats.map(c => ({ id: c.id, title: c.title, sub: `${c.messages.length} messages` }));
    const c = chats.find(x => x.id === pick.chat);
    if (c) { payload = chatForShare(c.title, c.messages); label = c.title; }
  } else {
    payload = setupForShare(settings);
    label = 'Your colours, fonts, units and cook mode';
  }
  const code = payload ? encodeShare(payload) : '';
  const tooBig = code.length > MAX_CODE;
  const size = Math.min(width - 96, 300);

  const empty = {
    recipe: 'Save a recipe first, then share it here.',
    book: 'Put recipes in a collection (on a recipe, “Add to collection”) to share them as a cookbook.',
    list: 'Your shopping list is empty.',
    chat: `Chat with ${AI_NAME} first, then share the conversation here.`,
    setup: '',
  }[kind];

  return (
    <Screen>
      <TopBar>
        <IconBtn name="close" label="Close" onPress={() => router.back()} />
        <Txt kind="head" weight="bold" size={19} style={{ flex: 1, paddingLeft: 4 }}>Share with a QR code</Txt>
        <IconBtn name="scan-outline" label="Scan a code" onPress={() => router.push('/scan')} />
      </TopBar>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 48, gap: 16 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {KINDS.map(([k, name, icon]) => {
            const on = k === kind;
            return (
              <Pressable key={k} onPress={() => setKind(k)} accessibilityState={{ selected: on }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 40, borderRadius: 20, backgroundColor: on ? th.c.accent : th.c.soft }}>
                <Icon name={icon} size={17} color={on ? th.c.onAccent : th.c.muted} />
                <Txt weight="bold" size={14} color={on ? th.c.onAccent : th.c.text}>{name}</Txt>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* The code */}
        <View style={{ alignItems: 'center', gap: 12, padding: 20, borderRadius: 28, backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line }}>
          {payload && !tooBig ? (
            <>
              <View style={{ padding: 14, borderRadius: 20, backgroundColor: '#FFFFFF' }}>
                <QRCode value={code} size={size} ecl="L" color="#141414" backgroundColor="#FFFFFF" />
              </View>
              <Txt weight="black" size={17} numberOfLines={2} style={{ textAlign: 'center' }}>{label}</Txt>
              <Txt muted size={13} style={{ textAlign: 'center' }}>Ask them to scan it in Mise: Account → QR → Scan.</Txt>
            </>
          ) : payload ? (
            <View style={{ alignItems: 'center', gap: 8, paddingVertical: 30 }}>
              <Icon name="alert-circle-outline" size={36} color={th.c.temp} />
              <Txt weight="black" style={{ textAlign: 'center' }}>Too much for one code</Txt>
              <Txt muted size={14} style={{ textAlign: 'center' }}>{kind === 'book' ? 'This cookbook is too big to fit. Share its recipes one at a time.' : 'This is too long to fit in a QR code. Try something shorter.'}</Txt>
            </View>
          ) : (
            <View style={{ alignItems: 'center', gap: 8, paddingVertical: 30 }}>
              <Icon name="qr-code-outline" size={40} color={th.c.muted} />
              <Txt muted style={{ textAlign: 'center' }}>{empty}</Txt>
            </View>
          )}
        </View>

        {choices.length ? (
          <View style={{ gap: 8 }}>
            <Txt muted weight="black" size={13} style={{ letterSpacing: 0.5, marginLeft: 4 }}>CHOOSE</Txt>
            {choices.map(c => {
              const on = pick[kind] === c.id;
              return (
                <Pressable key={c.id} onPress={() => setPick(p => ({ ...p, [kind]: c.id }))} accessibilityRole="radio" accessibilityState={{ checked: on }}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: pressed ? th.c.soft : th.c.surface, borderWidth: 1.5, borderColor: on ? th.c.accent : th.c.line })}>
                  <View style={{ flex: 1 }}>
                    <Txt weight="bold" numberOfLines={1}>{c.title}</Txt>
                    {c.sub ? <Txt muted size={13}>{c.sub}</Txt> : null}
                  </View>
                  <Icon name={on ? 'radio-button-on' : 'radio-button-off'} size={22} color={on ? th.c.accent : th.c.muted} />
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <Btn title="Scan someone’s code" icon="scan-outline" variant="secondary" onPress={() => router.push('/scan')} />
      </ScrollView>
    </Screen>
  );
}
