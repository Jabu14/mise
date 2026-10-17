// Your kitchen history (from Account → Your kitchen): when you added each recipe, everything you've
// cooked, or the timers you've used, grouped by month with dates and details.
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { DishArt } from '../../components/art/dish-art';
import { Stars } from '../../components/cook-log-ui';
import { Card, Icon, IconBtn, Screen, TopBar, Txt, type IconName, PageTitle } from '../../components/ui';
import { useCookLog } from '../../lib/cook-log';
import { useApp, useTimers } from '../../lib/store';
import { artColor, useTheme } from '../../lib/theme';
import { formatDuration } from '../../shared/parser';

type Item = { key: string; at: number; title: string; lines: string[]; art?: string; photo?: string; rating?: number; icon?: IconName; onPress?: () => void };

const month = (t: number) => new Date(t).toLocaleDateString([], { month: 'long', year: 'numeric' });
const when = (t: number) => new Date(t).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) + ' · ' + new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export default function ActivityScreen() {
  const th = useTheme();
  const { kind } = useLocalSearchParams<{ kind: string }>();
  const { recipes } = useApp();
  const { history, timersStarted } = useTimers();
  const cooks = useCookLog().entries;
  const [now] = useState(() => Date.now());
  const monthStart = new Date(new Date(now).getFullYear(), new Date(now).getMonth(), 1).getTime();

  let title = 'History';
  let stats: [string, string][] = [];
  let items: Item[] = [];
  let empty = '';

  if (kind === 'recipes') {
    title = 'Recipes';
    const sorted = [...recipes].sort((a, b) => b.createdAt - a.createdAt);
    stats = [['Saved', String(recipes.length)], ['This month', String(recipes.filter(r => r.createdAt >= monthStart).length)], ['Cooked', String(recipes.filter(r => (r.cookCount || 0) > 0).length)]];
    items = sorted.map(r => ({
      key: r.id, at: r.createdAt, title: r.title, art: r.title,
      lines: [`Added ${when(r.createdAt)}`, [`${r.steps.length} steps`, r.cookCount ? `cooked ${r.cookCount === 1 ? 'once' : `${r.cookCount} times`}` : 'not cooked yet'].join(' · ')],
      onPress: () => router.push(`/recipe/${r.id}`),
    }));
    empty = 'Recipes you add show up here with the date you saved them.';
  } else if (kind === 'cooked') {
    title = 'Cooked';
    const rated = cooks.filter(c => c.rating);
    const counts = new Map<string, number>();
    cooks.forEach(c => counts.set(c.title, (counts.get(c.title) || 0) + 1));
    const fav = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    stats = [['Cooks', String(cooks.length)], ['This month', String(cooks.filter(c => c.at >= monthStart).length)], ['Average', rated.length ? `${(rated.reduce((s, c) => s + c.rating, 0) / rated.length).toFixed(1)} ★` : '–']];
    if (fav && fav[1] > 1) stats.push(['Most cooked', fav[0]]);
    items = cooks.map(c => ({
      key: c.id, at: c.at, title: c.title, art: c.title, photo: c.photo, rating: c.rating,
      lines: [when(c.at), ...(c.note ? [`“${c.note}”`] : [])],
      onPress: () => router.push({ pathname: '/journal', params: { recipe: c.recipeId } }),
    }));
    empty = 'Finish a recipe in cook mode and it shows up here with the date, your stars and notes.';
  } else if (kind === 'timers') {
    title = 'Timers';
    stats = [['Started', String(timersStarted)], ['Different timers', String(history.length)]];
    items = history.map((h, i) => ({
      key: `${i}-${h.at}`, at: h.at, title: h.label || 'Timer', icon: 'timer-outline',
      lines: [`${formatDuration(h.minutes)} · last used ${when(h.at)}`],
    }));
    empty = 'Timers you start show up here.';
  }

  // Group by month, newest first.
  const groups: { label: string; items: Item[] }[] = [];
  [...items].sort((a, b) => b.at - a.at).forEach(it => {
    const label = month(it.at);
    const g = groups[groups.length - 1];
    if (g?.label === label) g.items.push(it);
    else groups.push({ label, items: [it] });
  });

  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <PageTitle>{title}</PageTitle>
      </TopBar>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 48, gap: 16 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {stats.map(([label, value]) => (
            <Card key={label} style={{ flexGrow: 1, flexBasis: '30%', padding: 12, gap: 2 }}>
              <Txt kind="head" weight="bold" size={value.length > 8 ? 15 : 22} numberOfLines={1}>{value}</Txt>
              <Txt muted weight="bold" size={12}>{label}</Txt>
            </Card>
          ))}
        </View>

        {groups.length ? groups.map(g => (
          <View key={g.label} style={{ gap: 8 }}>
            <Txt muted weight="black" size={13} style={{ letterSpacing: 0.5, marginLeft: 4 }}>{g.label.toUpperCase()}</Txt>
            <Card style={{ paddingVertical: 4, paddingHorizontal: 0, overflow: 'hidden' }}>
              {g.items.map((it, i) => (
                <Pressable key={it.key} onPress={it.onPress} disabled={!it.onPress}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: pressed ? th.c.soft : 'transparent', borderTopWidth: i ? 1 : 0, borderTopColor: th.c.line })}>
                  <View style={{ width: 48, height: 48, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: it.art ? artColor(it.art, th.dark) : th.c.accentSoft }}>
                    {it.photo ? <Image source={{ uri: it.photo }} style={{ width: 48, height: 48 }} />
                      : it.art ? <DishArt title={it.art} width={46} still />
                      : <Icon name={it.icon ?? 'time-outline'} size={22} color={th.c.accent} />}
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Txt weight="black" size={15} numberOfLines={1} style={{ flexShrink: 1 }}>{it.title}</Txt>
                      {it.rating ? <Stars value={it.rating} size={11} /> : null}
                    </View>
                    {it.lines.map((l, j) => <Txt key={j} muted size={13} numberOfLines={2}>{l}</Txt>)}
                  </View>
                  {it.onPress ? <Icon name="chevron-forward" size={16} color={th.c.muted} /> : null}
                </Pressable>
              ))}
            </Card>
          </View>
        )) : (
          <View style={{ alignItems: 'center', gap: 10, paddingVertical: 40 }}>
            <Icon name="time-outline" size={40} color={th.c.muted} />
            <Txt muted style={{ textAlign: 'center', maxWidth: 280 }}>{empty}</Txt>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
