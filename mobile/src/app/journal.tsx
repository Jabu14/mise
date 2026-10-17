// Cooking journal: everything you've cooked, newest first, with your stars, photos and notes.
// Opened with ?recipe=<id> it shows just that recipe's cooks.
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { CookEntryEditor, CookEntryRow } from '../components/cook-log-ui';
import { Btn, Card, Icon, IconBtn, Screen, TopBar, Txt } from '../components/ui';
import { useCookLog, weekStreak } from '../lib/cook-log';
import { useApp } from '../lib/store';
import { useTheme } from '../lib/theme';
import { showAlert } from '../components/sheet';

export default function JournalScreen() {
  const th = useTheme();
  const { recipe } = useLocalSearchParams<{ recipe?: string }>();
  const { getRecipe } = useApp();
  const { entries, remove } = useCookLog();
  const [editing, setEditing] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  const r = recipe ? getRecipe(recipe) : undefined;
  const shown = recipe ? entries.filter(e => e.recipeId === recipe) : entries;
  const month = new Date(now);
  const thisMonth = shown.filter(e => { const d = new Date(e.at); return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear(); }).length;
  const rated = shown.filter(e => e.rating);
  const avg = rated.length ? rated.reduce((s, e) => s + e.rating, 0) / rated.length : 0;
  const streak = weekStreak(entries, now);
  const entry = entries.find(e => e.id === editing);

  const options = (id: string) =>
    showAlert('This cook', undefined, [
      { text: 'Edit', onPress: () => setEditing(id) },
      { text: 'Delete', style: 'destructive', onPress: () => remove(id) },
      { text: 'Cancel', style: 'cancel' },
    ]);

  const stats: [string, string][] = recipe
    ? [['Cooked', String(shown.length)], ['This month', String(thisMonth)], ['Average', avg ? `${avg.toFixed(1)} ★` : '–']]
    : [['Cooks', String(shown.length)], ['This month', String(thisMonth)], ['Week streak', streak ? `${streak} 🔥` : '0']];

  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <Txt kind="head" weight="bold" size={19} numberOfLines={1} style={{ flex: 1, paddingLeft: 4 }}>{r ? r.title : 'Cooking journal'}</Txt>
      </TopBar>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 48, gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 6 }}>
          {stats.map(([label, value]) => (
            <Card key={label} style={{ flex: 1, padding: 12, alignItems: 'center', gap: 2 }}>
              <Txt weight="black" size={22}>{value}</Txt>
              <Txt muted size={12} weight="bold">{label}</Txt>
            </Card>
          ))}
        </View>
        {!recipe && streak ? (
          <Txt muted size={13} style={{ textAlign: 'center', marginBottom: 4 }}>
            You’ve cooked something {streak === 1 ? 'this week' : `${streak} weeks in a row`}. Keep it going!
          </Txt>
        ) : null}

        {shown.length ? shown.map(e => (
          <CookEntryRow key={e.id} entry={e} showTitle={!recipe}
            onPress={() => setEditing(e.id)} onLongPress={() => options(e.id)} />
        )) : (
          <View style={{ alignItems: 'center', gap: 10, paddingVertical: 48 }}>
            <Icon name="book-outline" size={44} color={th.c.muted} />
            <Txt weight="black" size={18}>Nothing here yet</Txt>
            <Txt muted style={{ textAlign: 'center', maxWidth: 280 }}>Finish a recipe in cook mode and it shows up here. Add stars, a photo and notes for next time.</Txt>
          </View>
        )}
        {shown.length ? <Txt muted size={12} style={{ textAlign: 'center', marginTop: 4 }}>Tap a cook to edit it, long-press to delete.</Txt> : null}
      </ScrollView>

      <Modal visible={!!entry} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditing(null)}>
        <View style={{ flex: 1, backgroundColor: th.c.bg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
            <View style={{ flex: 1 }}>
              <Txt kind="head" weight="bold" size={22} numberOfLines={1}>{entry?.title}</Txt>
              {entry ? <Txt muted>{new Date(entry.at).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</Txt> : null}
            </View>
            <IconBtn name="close" label="Close" onPress={() => setEditing(null)} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 16 }} keyboardShouldPersistTaps="handled">
            {entry ? <CookEntryEditor key={entry.id} entry={entry} /> : null}
            <Btn title="Done" onPress={() => setEditing(null)} />
            {entry && getRecipe(entry.recipeId) && !recipe ? (
              <Btn title="Open recipe" variant="secondary" onPress={() => { const id = entry.recipeId; setEditing(null); router.push(`/recipe/${id}`); }} />
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </Screen>
  );
}
