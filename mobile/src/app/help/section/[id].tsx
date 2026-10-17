// A help section: its articles.
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView } from 'react-native';
import { HelpHeader, ListCard } from '../../../components/help-ui';
import { Screen } from '../../../components/ui';
import { findSection } from '../../../lib/help-content';

export default function HelpSection() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const section = findSection(id);
  return (
    <Screen>
      <HelpHeader title={section?.title ?? 'Help'} share={section ? `Mise Help: ${section.title}` : undefined} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 12, paddingBottom: 40 }}>
        {section ? (
          <ListCard rows={section.articles.map(a => ({ key: a.id, title: a.title, icon: 'document-text-outline', onPress: () => router.push(`/help/article/${a.id}`) }))} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
