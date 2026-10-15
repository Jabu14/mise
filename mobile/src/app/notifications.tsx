// Notifications: whether timer alerts can reach you, and how they look and sound (in the style of
// WhatsApp's settings: small section titles, rounded groups of switches, a reset at the bottom).
import * as Notifications from 'expo-notifications';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { Alert, Linking, Pressable, ScrollView, View } from 'react-native';
import { Segmented, Toggle } from '../components/settings-ui';
import { ToneRow, ToneSheet } from '../components/tone-sheet';
import { Btn, Card, Icon, IconBtn, Screen, TopBar, Txt } from '../components/ui';
import { useApp } from '../lib/store';
import { useTheme } from '../lib/theme';

type Status = 'loading' | 'on' | 'off' | 'blocked';

const DEFAULTS = { notifyTimers: true, notifySound: true, notifyPreview: true, badgeTimers: false, alarmSound: true, remindPlan: true, remindPlanTime: '9', remindFinish: true };

export default function NotificationsScreen() {
  const th = useTheme();
  const { settings, updateSettings } = useApp();
  const [status, setStatus] = useState<Status>('loading');
  const [tones, setTones] = useState(false);

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

  const reset = () =>
    Alert.alert('Reset notification settings?', 'Timer notifications, sounds, previews, reminders and the app icon badge go back to how they were.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => updateSettings(DEFAULTS) },
    ]);

  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <Txt kind="head" weight="bold" size={19} style={{ flex: 1, paddingLeft: 4 }}>Notifications</Txt>
      </TopBar>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 48, gap: 10 }}>
        {status === 'off' || status === 'blocked' ? (
          <Card style={{ padding: 16, gap: 12, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon name="notifications-outline" size={24} color={th.c.temp} />
              <View style={{ flex: 1 }}>
                <Txt weight="bold">Notifications are off for Mise</Txt>
                <Txt muted size={14}>Timers can’t alert you when Mise is closed.</Txt>
              </View>
            </View>
            <Btn title={status === 'blocked' ? 'Open phone Settings' : 'Turn on'} icon="notifications-outline" size="small" onPress={status === 'blocked' ? () => Linking.openSettings() : turnOn} style={{ alignSelf: 'flex-start' }} />
          </Card>
        ) : null}

        <Heading>Timer notifications</Heading>
        <Group>
          <Toggle k="notifyTimers" label="Show notifications" />
          <Toggle k="notifySound" label="Play a sound" />
          <Toggle k="notifyPreview" label="Show preview" last />
        </Group>
        <Note>Show preview puts the timer and recipe name in the notification.</Note>

        <Heading>In the app</Heading>
        <Group padded={false}>
          <ToneRow onPress={() => setTones(true)} />
          <View style={{ paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: th.c.line }}>
            <Toggle k="haptics" label="Vibrate" last />
          </View>
        </Group>

        <Heading>Reminders</Heading>
        <Group>
          <Toggle k="remindPlan" label="Meal plan" hint="On days you’ve planned, see what’s on" last={!settings.remindPlan} />
          {settings.remindPlan ? (
            <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: th.c.line }}>
              <Segmented label="Remind me at" k="remindPlanTime" options={[['9', '9 AM'], ['12', 'Noon'], ['16', '4 PM']]} />
            </View>
          ) : null}
          <Toggle k="remindFinish" label="Finish what you started" hint="A nudge a few hours after you leave a recipe halfway" last />
        </Group>
        <Note>Reminders follow your timer settings for sound and preview.</Note>

        <Heading>Home screen</Heading>
        <Group>
          <Toggle k="badgeTimers" label="App icon badge" hint="Shows how many timers are running" last />
        </Group>

        <Pressable onPress={reset} accessibilityRole="button" style={({ pressed }) => ({ marginTop: 18, opacity: pressed ? 0.6 : 1 })}>
          <Card style={{ paddingHorizontal: 16, paddingVertical: 15 }}>
            <Txt weight="bold" color={th.c.temp}>Reset notification settings</Txt>
          </Card>
        </Pressable>
        <Note>Puts all notification settings back to how they were.</Note>
      </ScrollView>
      <ToneSheet visible={tones} onClose={() => setTones(false)} />
    </Screen>
  );
}

function Heading({ children }: { children: ReactNode }) {
  return <Txt muted weight="black" size={15} style={{ marginTop: 14, marginLeft: 4 }}>{children}</Txt>;
}

function Note({ children }: { children: ReactNode }) {
  return <Txt muted size={13} style={{ marginHorizontal: 4 }}>{children}</Txt>;
}

function Group({ children, padded = true }: { children: ReactNode; padded?: boolean }) {
  return <Card style={{ paddingHorizontal: padded ? 16 : 0, paddingVertical: padded ? 2 : 0, overflow: 'hidden' }}>{children}</Card>;
}

