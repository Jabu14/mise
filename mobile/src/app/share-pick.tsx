// Choose what to share with a QR code: a search and filter chips on top (like the share page's
// kinds), then the list. Picking one goes back to the QR code with it selected.
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { DishArt } from '../components/art/dish-art';
import { allCollections } from '../components/collection-sheet';
import { Icon, IconBtn, PageTitle, Screen, TopBar, Txt, type IconName } from '../components/ui';
import { AI_NAME, useChats } from '../lib/chat-store';
import { setPicked, type ShareKind } from '../lib/share-pick';
import { useApp } from '../lib/store';
import { artColor, useTheme } from '../lib/theme';

type Item = { id: string; title: string; sub: string; art?: string; icon?: IconName; tags: string[] };

export default function SharePickScreen() {
  const th = useTheme();
  const { kind: rawKind, current } = useLocalSearchParams<{ kind: string; current?: string }>();
  const kind = (['recipe', 'book', 'chat'].includes(rawKind) ? rawKind : 'recipe') as ShareKind;
  const { recipes, settings } = useApp();
  const { chats } = useChats();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [weekAgo] = useState(() => Date.now() - 7 * 864e5);

  let title = 'Choose';
  let filters: [string, string][] = [['all', 'All']];
  let items: Item[] = [];
  if (kind === 'recipe') {
    title = 'Choose a recipe';
    filters = [['all', 'All'], ['recent', 'Recently added'], ['cooked', 'Cooked'], ['new', 'Not cooked yet'], ...allCollections(recipes).map(c => [`c:${c.name}`, c.name] as [string, string])];
    items = [...recipes].sort((a, b) => b.createdAt - a.createdAt).map(r => ({
      id: r.id, title: r.title, art: r.title,
      sub: [`${r.steps.length} steps`, r.cookCount ? `cooked ${r.cookCount === 1 ? 'once' : `${r.cookCount}×`}` : 'not cooked yet'].join(' · '),
      tags: ['all', ...(r.createdAt > weekAgo ? ['recent'] : []), (r.cookCount || 0) > 0 ? 'cooked' : 'new', ...(r.collections ?? []).map(c => `c:${c}`)],
    }));
  } else if (kind === 'book') {
    title = 'Choose a cookbook';
    items = allCollections(recipes).map(b => ({ id: b.name, title: b.name, sub: `${b.count} ${b.count === 1 ? 'recipe' : 'recipes'}`, icon: 'folder-outline', tags: ['all'] }));
  } else {
    title = `Choose a ${AI_NAME} chat`;
    filters = [['all', 'All'], ['pinned', 'Pinned'], ['week', 'This week']];
    items = [...chats].sort((a, b) => b.updatedAt - a.updatedAt).map(c => ({
      id: c.id, title: c.title, icon: 'chatbubble-outline',
      sub: `${c.messages.length} messages · ${new Date(c.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}`,
      tags: ['all', ...(c.pinned ? ['pinned'] : []), ...(c.updatedAt > weekAgo ? ['week'] : [])],
    }));
  }
  const q = query.trim().toLowerCase();
  const shown = items.filter(i => i.tags.includes(filter) && (!q || i.title.toLowerCase().includes(q)));

  const choose = (id: string) => {
    if (settings.haptics) Haptics.selectionAsync().catch(() => {});
    setPicked(kind, id);
    router.back();
  };

  return (
    <Screen>
      <TopBar sheet>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <PageTitle>{title}</PageTitle>
      </TopBar>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 48, gap: 14 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingHorizontal: 14, borderRadius: 24, backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line }}>
          <Icon name="search" size={18} color={th.c.muted} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search" placeholderTextColor={th.c.muted} maxLength={60}
            style={[{ flex: 1, minWidth: 0, color: th.c.text, fontSize: th.fs(16), paddingVertical: 0 }, th.f('body')]} />
        </View>

        {filters.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
            {filters.map(([k, label]) => {
              const on = k === filter;
              return (
                <Pressable key={k} onPress={() => setFilter(k)} accessibilityState={{ selected: on }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 38, borderRadius: 19, backgroundColor: on ? th.c.accent : th.c.soft }}>
                  {k.startsWith('c:') ? <Icon name="folder-outline" size={15} color={on ? th.c.onAccent : th.c.muted} /> : null}
                  <Txt weight="bold" size={14} color={on ? th.c.onAccent : th.c.text}>{label}</Txt>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        <View style={{ gap: 8 }}>
          {shown.map(i => {
            const on = i.id === current;
            return (
              <Pressable key={i.id} onPress={() => choose(i.id)} accessibilityRole="button" accessibilityState={{ selected: on }}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 20, backgroundColor: pressed ? th.c.soft : th.c.surface, borderWidth: 1.5, borderColor: on ? th.c.accent : th.c.line })}>
                <View style={{ width: 52, height: 52, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: i.art ? artColor(i.art, th.dark) : th.c.accentSoft }}>
                  {i.art ? <DishArt title={i.art} width={50} still /> : <Icon name={i.icon ?? 'document-outline'} size={24} color={th.c.accent} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Txt weight="black" size={15} numberOfLines={1}>{i.title}</Txt>
                  <Txt muted size={13} numberOfLines={1}>{i.sub}</Txt>
                </View>
                {on ? <Icon name="checkmark-circle" size={24} color={th.c.accent} /> : <Icon name="chevron-forward" size={18} color={th.c.muted} />}
              </Pressable>
            );
          })}
          {!shown.length ? <Txt muted style={{ textAlign: 'center', paddingVertical: 30 }}>Nothing matches.</Txt> : null}
        </View>
      </ScrollView>
    </Screen>
  );
}
