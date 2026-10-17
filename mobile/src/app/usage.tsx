// Usage, in the style of Claude's usage page: how much of today's AI allowance you've used (with
// when it resets), Sous, and your cooking activity. Everything is counted on this phone.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Card, Icon, Screen, TopBar, Txt, PageTitle } from '../components/ui';
import { AI_NAME, useChats } from '../lib/chat-store';
import { useApp, useTimers } from '../lib/store';
import { useTheme } from '../lib/theme';
import { AI_IMPORTS_PER_DAY, readUsage, type Usage } from '../lib/usage';
import { showAlert } from '../components/sheet';

// "5 hr 12 min" until local midnight.
function untilMidnight(now: number) {
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  const mins = Math.max(1, Math.round((end.getTime() - now) / 60000));
  const h = Math.floor(mins / 60), m = mins % 60;
  return h ? `${h} hr ${m} min` : `${m} min`;
}

export default function UsageScreen() {
  const th = useTheme();
  const { recipes } = useApp();
  const { timersStarted } = useTimers();
  const { chats } = useChats();
  const [usage, setUsage] = useState<Usage | null>(null);
  const [now, setNow] = useState(0);

  const refresh = useCallback(() => {
    setNow(Date.now());
    readUsage().then(setUsage).catch(() => {});
  }, []);
  useFocusEffect(refresh);

  const messages = chats.flatMap(c => c.messages.filter(m => m.role === 'user'));
  const voice = messages.filter(m => m.kind === 'voice').length;
  const cooked = recipes.reduce((n, r) => n + (r.cookCount || 0), 0);
  const today = usage?.importsToday ?? 0;
  const share = Math.min(1, today / AI_IMPORTS_PER_DAY);

  const info = () => showAlert('About usage', `On the free plan you can use Import with AI ${AI_IMPORTS_PER_DAY} times a day; it resets at midnight. ${AI_NAME} is a free preview for now. Mise Plus removes the limits.`);

  return (
    <Screen>
      <TopBar>
        <CircleBtn icon="chevron-back" label="Back" onPress={() => router.back()} />
        <PageTitle>Usage</PageTitle>
        <View style={{ flexDirection: 'row', height: 46, borderRadius: 23, marginRight: 8, backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line }}>
          <Pressable onPress={refresh} accessibilityLabel="Refresh" hitSlop={4} style={{ width: 46, alignItems: 'center', justifyContent: 'center' }}><Icon name="refresh" size={20} color={th.c.text} /></Pressable>
          <Pressable onPress={info} accessibilityLabel="About usage" hitSlop={4} style={{ width: 46, alignItems: 'center', justifyContent: 'center' }}><Icon name="information-circle-outline" size={21} color={th.c.text} /></Pressable>
        </View>
      </TopBar>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 48, gap: 12 }}>
        <Meter title="Import with AI" used={share} note={now ? `Resets in ${untilMidnight(now)}` : ' '} />

        <Heading>This month</Heading>
        <Card style={{ paddingHorizontal: 18, paddingVertical: 4 }}>
          <Line label="AI imports" value={`${usage?.importsMonth ?? 0}`} />
          <Line label="AI imports, all time" value={`${usage?.importsTotal ?? 0}`} last />
        </Card>

        <Heading>{AI_NAME}</Heading>
        <Card style={{ paddingHorizontal: 18, paddingVertical: 4 }}>
          <Line label="Messages" value={`${messages.length}`} />
          <Line label="Voice messages" value={`${voice}`} />
          <Line label="Chats" value={`${chats.length}`} />
          <Line label="Plan" value="Free preview" last />
        </Card>

        <Heading>Cooking</Heading>
        <Card style={{ paddingHorizontal: 18, paddingVertical: 4 }}>
          <Line label="Recipes saved" value={`${recipes.length}`} />
          <Line label="Times cooked" value={`${cooked}`} />
          <Line label="Timers started" value={`${timersStarted}`} last />
        </Card>

        <Txt muted size={14} style={{ marginHorizontal: 4, marginTop: 4 }}>
          Counted on this phone. Want no limits?{' '}
          <Txt size={14} color={th.c.accent} style={{ textDecorationLine: 'underline' }} onPress={() => router.push('/plus')}>Upgrade to Mise Plus</Txt>
        </Txt>
      </ScrollView>
    </Screen>
  );
}

function Meter({ title, used, note }: { title: string; used: number; note: string }) {
  const th = useTheme();
  const pct = Math.round(used * 100);
  return (
    <Card style={{ padding: 18, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Txt weight="black" size={18} style={{ flex: 1 }}>{title}</Txt>
        <Txt muted size={15}>{pct}% used</Txt>
      </View>
      <View style={{ height: 10, borderRadius: 5, backgroundColor: th.c.soft, overflow: 'hidden' }}>
        <View style={{ width: `${Math.max(pct, used > 0 ? 3 : 0)}%`, height: '100%', borderRadius: 5, backgroundColor: used >= 1 ? th.c.temp : th.c.accent }} />
      </View>
      <Txt muted size={14}>{note}</Txt>
    </Card>
  );
}

function Line({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const th = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: last ? 0 : 1, borderBottomColor: th.c.line }}>
      <Txt weight="bold" size={16} style={{ flex: 1 }}>{label}</Txt>
      <Txt muted size={16}>{value}</Txt>
    </View>
  );
}

function Heading({ children }: { children: ReactNode }) {
  return <Txt muted weight="bold" size={15} style={{ marginTop: 14, marginLeft: 4 }}>{children}</Txt>;
}

function CircleBtn({ icon, label, onPress }: { icon: 'chevron-back'; label: string; onPress: () => void }) {
  const th = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={4}
      style={({ pressed }) => ({ marginLeft: 8, width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line, opacity: pressed ? 0.7 : 1 })}>
      <Icon name={icon} size={22} color={th.c.text} />
    </Pressable>
  );
}
