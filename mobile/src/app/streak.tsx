// Your cooking streak: weeks in a row with at least one cook. A big flame card, this week day by day,
// the last 12 weeks, your best run, and a share button.
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Share, View } from 'react-native';
import { Btn, Card, Icon, IconBtn, Screen, TopBar, Txt } from '../components/ui';
import { bestStreak, useCookLog, weekNumber, weekStreak } from '../lib/cook-log';
import { useTheme } from '../lib/theme';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function StreakScreen() {
  const th = useTheme();
  const { entries } = useCookLog();
  const [now] = useState(() => Date.now());
  const streak = weekStreak(entries, now);
  const best = Math.max(streak, bestStreak(entries));
  const thisWeek = weekNumber(now);
  const cookedThisWeek = entries.some(e => weekNumber(e.at) === thisWeek);

  // This week, Monday to Sunday: which days had a cook.
  const today = new Date(now);
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
  const week = DAYS.map((_, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const n = entries.filter(e => new Date(e.at).toDateString() === d.toDateString()).length;
    return { d, n, future: d.getTime() > today.getTime(), isToday: d.toDateString() === today.toDateString() };
  });

  // The last 12 weeks, oldest first, with how many cooks each.
  const weeks = Array.from({ length: 12 }, (_, i) => {
    const w = thisWeek - 11 + i;
    return { w, n: entries.filter(e => weekNumber(e.at) === w).length };
  });
  const most = Math.max(1, ...weeks.map(w => w.n));
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).getTime();

  const share = () => Share.share({
    message: streak
      ? `I’m on a ${streak}-week cooking streak with Mise 🔥 ${entries.length} cooks so far!`
      : `I’ve cooked ${entries.length} ${entries.length === 1 ? 'meal' : 'meals'} with Mise 🍳`,
  }).catch(() => {});

  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <Txt kind="head" weight="bold" size={19} style={{ flex: 1, paddingLeft: 4 }}>Cooking streak</Txt>
        <IconBtn name="share-outline" label="Share your streak" onPress={share} />
      </TopBar>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 48, gap: 16 }}>
        {/* The flame */}
        <View style={{ borderRadius: 32, overflow: 'hidden', backgroundColor: th.c.accent, padding: 24, alignItems: 'center', gap: 6 }}>
          <View style={{ position: 'absolute', width: 260, height: 260, borderRadius: 130, top: -90, right: -80, backgroundColor: '#FFFFFF', opacity: 0.08 }} />
          <View style={{ position: 'absolute', width: 180, height: 180, borderRadius: 90, bottom: -70, left: -50, backgroundColor: '#FFFFFF', opacity: 0.06 }} />
          <Txt size={84} style={{ lineHeight: 100 }}>{streak ? '🔥' : '🍳'}</Txt>
          <Txt kind="head" weight="bold" size={56} color={th.c.onAccent} style={{ lineHeight: 62 }}>{streak}</Txt>
          <Txt weight="black" size={18} color={th.c.onAccent}>{streak === 1 ? 'week streak' : 'week streak'}</Txt>
          <Txt size={14} color={th.c.onAccent} style={{ opacity: 0.85, textAlign: 'center', marginTop: 4 }}>
            {streak
              ? cookedThisWeek ? 'You’ve cooked this week. See you next week!' : 'Cook something this week to keep it going.'
              : 'Cook once this week to start a streak.'}
          </Txt>
        </View>

        {/* This week */}
        <Card style={{ padding: 16, gap: 12 }}>
          <Txt weight="black" size={16}>This week</Txt>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {week.map(({ d, n, future, isToday }, i) => (
              <View key={i} style={{ alignItems: 'center', gap: 6 }}>
                <Txt muted weight="bold" size={12}>{DAYS[i]}</Txt>
                <View style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: n ? th.c.accent : future ? 'transparent' : th.c.soft,
                  borderWidth: isToday && !n ? 2 : future ? 1.5 : 0, borderColor: isToday ? th.c.accent : th.c.line, borderStyle: future ? 'dashed' : 'solid' }}>
                  {n ? <Icon name="flame" size={18} color={th.c.onAccent} /> : <Txt weight="bold" size={13} muted>{d.getDate()}</Txt>}
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[['Best streak', `${best} ${best === 1 ? 'week' : 'weeks'}`, 'trophy-outline'], ['Total cooks', String(entries.length), 'restaurant-outline'], ['This month', String(entries.filter(e => e.at >= monthStart).length), 'calendar-outline']].map(([label, value, icon]) => (
            <Card key={label} style={{ flex: 1, padding: 12, gap: 6 }}>
              <Icon name={icon as 'trophy-outline'} size={18} color={th.c.accent} />
              <Txt kind="head" weight="bold" size={20}>{value}</Txt>
              <Txt muted weight="bold" size={12}>{label}</Txt>
            </Card>
          ))}
        </View>

        {/* Last 12 weeks */}
        <Card style={{ padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Txt weight="black" size={16} style={{ flex: 1 }}>Last 12 weeks</Txt>
            <Txt muted size={12}>cooks per week</Txt>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 90 }}>
            {weeks.map(({ w, n }) => (
              <View key={w} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                {n ? <Txt weight="bold" size={10} muted>{n}</Txt> : null}
                <View style={{ width: '100%', height: n ? 12 + (n / most) * 56 : 6, borderRadius: 6, backgroundColor: n ? th.c.accent : th.c.soft, opacity: w === thisWeek ? 1 : n ? 0.8 : 1 }} />
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Txt muted size={11}>12 weeks ago</Txt>
            <Txt muted size={11}>This week</Txt>
          </View>
        </Card>

        <Card style={{ padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Icon name="bulb-outline" size={22} color={th.c.accent} />
          <Txt muted size={14} style={{ flex: 1 }}>A streak counts weeks, not days: cook at least once each week (finish a recipe in cook mode) to keep it.</Txt>
        </Card>

        <Btn size="big" icon="share-outline" title="Share my streak" onPress={share} />
      </ScrollView>
    </Screen>
  );
}
