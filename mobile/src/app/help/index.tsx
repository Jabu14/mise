// Help center home: "How can we help?" with a search across every article, the help topics, popular
// articles and a way to contact us. Topics open sections, sections open articles.
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { HelpHeader, ListCard, NeedMoreHelp } from '../../components/help-ui';
import { Icon, Screen, Txt } from '../../components/ui';
import { ALL_ARTICLES, HELP, POPULAR, articleText, findArticle } from '../../lib/help-content';
import { useTheme } from '../../lib/theme';

export default function HelpHome() {
  const th = useTheme();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const results = q ? ALL_ARTICLES.filter(a => a.title.toLowerCase().includes(q) || articleText(a).toLowerCase().includes(q)).slice(0, 30) : [];

  return (
    <Screen>
      <HelpHeader title="Help center" share="Mise Help center: answers about recipes, cook mode, timers, planning and more." />
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40, gap: 22 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', gap: 14, paddingTop: 8 }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accent }}>
            <Icon name="restaurant" size={32} color={th.c.onAccent} />
          </View>
          <Txt kind="head" weight="bold" size={30} style={{ textAlign: 'center' }}>How can we help?</Txt>
          <View style={{ alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, paddingHorizontal: 16, borderRadius: 26, backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line }}>
            <Icon name="search" size={19} color={th.c.muted} />
            <TextInput value={query} onChangeText={setQuery} placeholder="Search Help center" placeholderTextColor={th.c.muted} maxLength={80} returnKeyType="search"
              style={[{ flex: 1, minWidth: 0, color: th.c.text, fontSize: th.fs(16), paddingVertical: 0 }, th.f('body')]} />
            {query ? <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search"><Icon name="close-circle" size={19} color={th.c.muted} /></Pressable> : null}
          </View>
        </View>

        {q ? (
          <View style={{ gap: 10 }}>
            <Txt kind="head" weight="bold" size={20} style={{ paddingHorizontal: 4 }}>{results.length ? `${results.length} ${results.length === 1 ? 'result' : 'results'}` : 'No results'}</Txt>
            {results.length ? (
              <ListCard rows={results.map(a => ({ key: a.id, title: a.title, sub: `${a.topic.title} · ${a.section.title}`, icon: 'document-text-outline', onPress: () => router.push(`/help/article/${a.id}`) }))} />
            ) : <Txt muted style={{ paddingHorizontal: 4 }}>Try other words, or contact us below.</Txt>}
          </View>
        ) : (
          <>
            <View style={{ gap: 10 }}>
              <Txt kind="head" weight="bold" size={20} style={{ paddingHorizontal: 4 }}>Help topics</Txt>
              <ListCard rows={HELP.map(t => ({ key: t.id, title: t.title, icon: t.icon, onPress: () => router.push(`/help/topic/${t.id}`) }))} />
            </View>
            <View style={{ gap: 10 }}>
              <Txt kind="head" weight="bold" size={20} style={{ paddingHorizontal: 4 }}>Popular articles</Txt>
              <ListCard rows={POPULAR.map(findArticle).filter(a => !!a).map(a => ({ key: a!.id, title: a!.title, icon: 'document-text-outline', onPress: () => router.push(`/help/article/${a!.id}`) }))} />
            </View>
          </>
        )}

        <NeedMoreHelp />
      </ScrollView>
    </Screen>
  );
}
