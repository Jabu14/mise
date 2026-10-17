// A help topic: its sections, each opening a list of articles.
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView } from 'react-native';
import { HelpHeader, ListCard } from '../../../components/help-ui';
import { Screen } from '../../../components/ui';
import { HELP } from '../../../lib/help-content';

export default function HelpTopic() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const topic = HELP.find(t => t.id === id);
  return (
    <Screen>
      <HelpHeader title={topic?.title ?? 'Help'} share={topic ? `Mise Help: ${topic.title}` : undefined} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 12, paddingBottom: 40 }}>
        {topic ? (
          <ListCard rows={topic.sections.map(s => ({
            key: s.id, title: s.title, icon: s.icon, sub: `${s.articles.length} ${s.articles.length === 1 ? 'article' : 'articles'}`,
            onPress: () => router.push(`/help/section/${s.id}`),
          }))} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
