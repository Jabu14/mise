// Notifications: whether timer alerts can reach you (with a way to turn them on), plus what's coming.
import * as Notifications from 'expo-notifications';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { Group, Row } from '../components/settings-ui';
import { Btn, Card, Icon, IconBtn, Screen, TopBar, Txt } from '../components/ui';
import { useTheme } from '../lib/theme';

type Status = 'loading' | 'on' | 'off' | 'blocked';

export default function NotificationsScreen() {
  const th = useTheme();
  const [status, setStatus] = useState<Status>('loading');

  // Re-check whenever you come back (e.g. from the phone's Settings).
  useFocusEffect(useCallback(() => {
    let alive = true;
    Notifications.getPermissionsAsync()
      .then(p => alive && setStatus(p.granted ? 'on' : p.canAskAgain ? 'off' : 'blocked'))
      .catch(() => alive && setStatus('off'));
    return () => { alive = false; };
  }, []));

  const turnOn = async () => {
    const p = await Notifications.requestPermissionsAsync().catch(() => null);
    if (p?.granted) setStatus('on');
    else Linking.openSettings().catch(() => {});
  };

  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <Txt kind="head" weight="bold" size={19} style={{ flex: 1, paddingLeft: 4 }}>Notifications</Txt>
      </TopBar>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 48, gap: 28 }}>
        <Group title="Timers">
          <Card style={{ padding: 16, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon name="notifications-outline" size={24} color={th.c.accent} />
              <View style={{ flex: 1 }}>
                <Txt weight="bold">Timer alerts</Txt>
                <Txt muted size={14}>{status === 'on' ? 'On. You’ll be alerted when a timer ends, even with the phone locked.' : status === 'loading' ? 'Checking…' : 'Off. Timers can’t alert you when Mise is closed.'}</Txt>
              </View>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: status === 'on' ? th.c.accent : th.c.line }} />
            </View>
            {status === 'off' || status === 'blocked' ? (
              <Btn title={status === 'blocked' ? 'Open phone Settings' : 'Turn on'} icon="notifications-outline" size="small" onPress={status === 'blocked' ? () => Linking.openSettings() : turnOn} style={{ alignSelf: 'flex-start' }} />
            ) : null}
          </Card>
        </Group>

        <Group title="Coming soon">
          <Card style={{ paddingHorizontal: 6 }}>
            <Row icon="calendar-outline" title="Cooking reminders" badge="SOON" />
            <Row icon="sparkles-outline" title="New recipe ideas" badge="SOON" last />
          </Card>
        </Group>
      </ScrollView>
    </Screen>
  );
}
