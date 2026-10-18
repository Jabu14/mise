// Share with a QR code: pick what to share (a recipe, a cookbook, your shopping list, a Sous chat or
// your kitchen setup), choose which one on its own page, and show the code. They scan it with Mise's
// QR scanner and get a copy. Everything is inside the code, so no account or internet is needed.
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { allCollections } from '../components/collection-sheet';
import { Btn, Icon, IconBtn, Screen, TopBar, Txt, type IconName, PageTitle } from '../components/ui';
import { AI_NAME, useChats } from '../lib/chat-store';
import { MAX_CODE, chatForShare, encodeShare, recipeForShare, setupForShare, type Payload } from '../lib/share-code';
import { useShopping, itemLabel } from '../lib/shopping';
import { useApp } from '../lib/store';
import { usePicked, type ShareKind } from '../lib/share-pick';
import { useTheme } from '../lib/theme';

type Kind = ShareKind;
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
  // Coming back from the picker page with a choice.
  const picked = usePicked();
  const [seen, setSeen] = useState(picked?.at ?? 0);
  if (picked && picked.at !== seen) {
    setSeen(picked.at);
    setKind(picked.kind);
    setPick(p => ({ ...p, [picked.kind]: picked.id }));
  }

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
      <TopBar sheet>
        <IconBtn name="close" label="Close" onPress={() => router.back()} />
        <PageTitle>Share with a QR code</PageTitle>
        <IconBtn name="scan-outline" label="Scan a code" onPress={() => router.push('/scan-qr')} />
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
          <Pressable onPress={() => router.push({ pathname: '/share-pick', params: { kind, current: pick[kind] } })} accessibilityRole="button"
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20, backgroundColor: pressed ? th.c.soft : th.c.surface, borderWidth: 1, borderColor: th.c.line })}>
            <View style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accentSoft }}>
              <Icon name={KINDS.find(k => k[0] === kind)![2]} size={22} color={th.c.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt muted size={12} weight="bold">{`CHOOSE ${KINDS.find(k => k[0] === kind)![1].toUpperCase()}`}</Txt>
              <Txt weight="black" size={16} numberOfLines={1}>{choices.find(c => c.id === pick[kind])?.title ?? 'Pick one'}</Txt>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: th.c.soft }}>
              <Txt weight="bold" size={13}>Change</Txt>
              <Icon name="chevron-forward" size={14} />
            </View>
          </Pressable>
        ) : null}

        <Btn title="Scan someone’s code" icon="qr-code-outline" variant="secondary" onPress={() => router.push('/scan-qr')} />
      </ScrollView>
    </Screen>
  );
}
