// Usage: how much you've used the AI features and the app, counted on this phone.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Group } from '../components/settings-ui';
import { Card, Icon, IconBtn, Screen, TopBar, Txt, type IconName } from '../components/ui';
import { AI_NAME, useChats } from '../lib/chat-store';
import { useApp, useTimers } from '../lib/store';
import { useTheme } from '../lib/theme';
import { AI_IMPORTS_PER_DAY, readUsage, type Usage } from '../lib/usage';

export default function UsageScreen() {
  const th = useTheme();
  const { recipes } = useApp();
  const { timersStarted } = useTimers();
  const { chats } = useChats();
  const [usage, setUsage] = useState<Usage | null>(null);

  useFocusEffect(useCallback(() => {
    let alive = true;
    readUsage().then(u => alive && setUsage(u)).catch(() => {});
    return () => { alive = false; };
  }, []));

  const messages = chats.flatMap(c => c.messages.filter(m => m.role === 'user'));
  const voice = messages.filter(m => m.kind === 'voice').length;
  const cooked = recipes.reduce((n, r) => n + (r.cookCount || 0), 0);
  const today = usage?.importsToday ?? 0;
  const share = Math.min(1, today / AI_IMPORTS_PER_DAY);

  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <Txt kind="head" weight="bold" size={19} style={{ flex: 1, paddingLeft: 4 }}>Usage</Txt>
      </TopBar>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 48, gap: 28 }}>
        <Group title="AI">
          <Card style={{ padding: 16, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Txt weight="bold" style={{ flex: 1 }}>Import with AI today</Txt>
              <Txt weight="black" size={18}>{today}<Txt muted size={14}>{` / ${AI_IMPORTS_PER_DAY}`}</Txt></Txt>
            </View>
            <View style={{ height: 10, borderRadius: 5, backgroundColor: th.c.soft, overflow: 'hidden' }}>
              <View style={{ width: `${share * 100}%`, height: '100%', borderRadius: 5, backgroundColor: share >= 1 ? th.c.temp : th.c.accent }} />
            </View>
            <Txt muted size={13}>Resets every day.</Txt>
          </Card>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Tile icon="sparkles-outline" value={usage?.importsMonth ?? 0} label="Imports this month" />
            <Tile icon="chatbubble-outline" value={messages.length} label={`Messages to ${AI_NAME}`} />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Tile icon="mic-outline" value={voice} label="Voice messages" />
            <Tile icon="chatbox-ellipses-outline" value={chats.length} label="Chats" />
          </View>
        </Group>

        <Group title="Cooking">
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Tile icon="book-outline" value={recipes.length} label="Recipes saved" />
            <Tile icon="restaurant-outline" value={cooked} label="Times cooked" />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Tile icon="timer-outline" value={timersStarted} label="Timers started" />
            <Tile icon="sparkles-outline" value={usage?.importsTotal ?? 0} label="AI imports, all time" />
          </View>
        </Group>
        <Txt muted size={13} style={{ textAlign: 'center' }}>Counted on this phone only.</Txt>
      </ScrollView>
    </Screen>
  );
}

function Tile({ icon, value, label }: { icon: IconName; value: number; label: string }) {
  const th = useTheme();
  return (
    <Card style={{ flex: 1, padding: 14, gap: 4 }}>
      <Icon name={icon} size={20} color={th.c.accent} />
      <Txt kind="head" weight="bold" size={26}>{value.toLocaleString()}</Txt>
      <Txt muted size={13} weight="bold">{label}</Txt>
    </Card>
  );
}
