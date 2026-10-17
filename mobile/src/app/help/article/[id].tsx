// A help article: title, the text (with links), related articles, "Does this answer your question?"
// and a way to contact us. Your Yes / No is remembered on the phone.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { ArticleBlocks, HelpHeader, NeedMoreHelp } from '../../../components/help-ui';
import { Icon, Screen, Txt } from '../../../components/ui';
import { articleText, findArticle } from '../../../lib/help-content';
import { useApp } from '../../../lib/store';
import { useTheme } from '../../../lib/theme';

const VOTES = 'mise.helpVotes.v1';

export default function HelpArticle() {
  const th = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { settings } = useApp();
  const article = findArticle(id);
  const [vote, setVote] = useState<'yes' | 'no' | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(VOTES).then(raw => {
      const v = (raw ? JSON.parse(raw) : {}) as Record<string, string>;
      if (v[id] === 'yes' || v[id] === 'no') setVote(v[id] as 'yes' | 'no');
    }).catch(() => {});
  }, [id]);

  const answer = (v: 'yes' | 'no') => {
    if (settings.haptics) Haptics.selectionAsync().catch(() => {});
    setVote(v);
    AsyncStorage.getItem(VOTES).then(raw => {
      const all = (raw ? JSON.parse(raw) : {}) as Record<string, string>;
      return AsyncStorage.setItem(VOTES, JSON.stringify({ ...all, [id]: v }));
    }).catch(() => {});
  };

  if (!article) return <Screen><HelpHeader title="Help article" /></Screen>;
  const related = (article.related ?? []).map(findArticle).filter(a => !!a);

  return (
    <Screen>
      <HelpHeader title="Help article" share={`${article.title}\n\n${articleText(article)}`} />
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={{ padding: 20, paddingTop: 12, gap: 18 }}>
          <Txt muted weight="bold" size={13}>{article.topic.title} › {article.section.title}</Txt>
          <Txt kind="head" weight="bold" size={30} style={{ lineHeight: 36, marginTop: -8 }}>{article.title}</Txt>
          <ArticleBlocks blocks={article.blocks} />
          {related.length ? (
            <View style={{ gap: 10, marginTop: 10, paddingTop: 20, borderTopWidth: 1, borderTopColor: th.c.line }}>
              <Txt kind="head" weight="bold" size={22}>Related articles</Txt>
              {related.map(r => (
                <Pressable key={r!.id} onPress={() => router.push(`/help/article/${r!.id}`)} style={{ flexDirection: 'row', gap: 12 }}>
                  <Txt size={16} style={{ lineHeight: 24 }}>•</Txt>
                  <Txt weight="black" size={16} color={th.c.accent} style={{ flex: 1, lineHeight: 24 }}>{r!.title}</Txt>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <View style={{ marginHorizontal: 16, padding: 20, gap: 16, borderRadius: 24, backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line, alignItems: 'center' }}>
          {vote ? (
            <>
              <Icon name={vote === 'yes' ? 'happy-outline' : 'chatbox-ellipses-outline'} size={28} color={th.c.accent} />
              <Txt weight="black" size={17} style={{ textAlign: 'center' }}>{vote === 'yes' ? 'Glad it helped!' : 'Thanks for telling us.'}</Txt>
              {vote === 'no' ? (
                <Pressable onPress={() => router.push('/feedback?mode=issue')} hitSlop={8}>
                  <Txt weight="black" color={th.c.accent}>Tell us what was missing</Txt>
                </Pressable>
              ) : null}
            </>
          ) : (
            <>
              <Txt weight="black" size={17} style={{ textAlign: 'center' }}>Does this answer your question?</Txt>
              <View style={{ flexDirection: 'row', gap: 12, alignSelf: 'stretch' }}>
                {([['yes', 'Yes', 'thumbs-up'], ['no', 'No', 'thumbs-down']] as const).map(([v, label, icon]) => (
                  <Pressable key={v} onPress={() => answer(v)} accessibilityRole="button"
                    style={({ pressed }) => ({ flex: 1, flexDirection: 'row', height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: th.c.accentSoft, opacity: pressed ? 0.75 : 1 })}>
                    <Icon name={icon} size={20} color={th.c.accent} />
                    <Txt weight="black" size={16} color={th.c.accent}>{label}</Txt>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </View>

        <NeedMoreHelp />
      </ScrollView>
    </Screen>
  );
}
