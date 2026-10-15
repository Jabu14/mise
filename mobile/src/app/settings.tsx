// Settings: how cook mode behaves, and timers and their alarm.
// (The Mise Prompt has its own page, reached from Account.)
// (Colours and fonts live on their own Appearance page.)
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { Group, Segmented, Toggle } from '../components/settings-ui';
import { UNIT_CHOICES } from '../lib/units';
import { ToneRow, ToneSheet } from '../components/tone-sheet';
import { Card, IconBtn, Screen, TopBar, Txt } from '../components/ui';

export default function SettingsScreen() {
  const [tones, setTones] = useState(false);

  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <Txt kind="head" weight="bold" size={19} style={{ flex: 1, paddingLeft: 4 }}>Settings</Txt>
      </TopBar>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 60, gap: 28 }}>
        <Group title="Cook mode">
          <Segmented label="Layout" k="cookLayout" options={[['cards', 'One step at a time'], ['list', 'All steps in a list']]} />
          <Segmented label="Units" k="units" options={UNIT_CHOICES} />
          <Card style={{ paddingHorizontal: 16, paddingVertical: 2 }}>
            <Toggle k="stepArt" label="Step animations" />
            <Toggle k="handsFreeWake" label="Hands-free: wait for “Hey Mise”" hint="Only acts on commands that start with “Hey Mise”, so kitchen chatter doesn’t skip steps" />
            <Toggle k="stepIngredients" label="Show what each step needs" hint="Lists the ingredients mentioned in the step" />
            <Toggle k="highlightTimes" label="Highlight times & temperatures" />
            <Toggle k="keepAwake" label="Keep the screen on while cooking" />
            <Toggle k="haptics" label="Vibration feedback" last />
          </Card>
        </Group>

        <Group title="Timers">
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <ToneRow onPress={() => setTones(true)} />
          </Card>
        </Group>

      </ScrollView>
      <ToneSheet visible={tones} onClose={() => setTones(false)} />
    </Screen>
  );
}
