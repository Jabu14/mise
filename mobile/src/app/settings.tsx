// Settings, one page per topic (opened from Account → App): Cook mode, Units, Hands-free,
// Timers & alarms and Vibration. Without a section it shows them all (the gear on Account).
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Group, Segmented, Toggle } from '../components/settings-ui';
import { ToneRow, ToneSheet } from '../components/tone-sheet';
import { Card, Icon, IconBtn, PageTitle, Screen, TopBar, Txt } from '../components/ui';
import { useTheme } from '../lib/theme';
import { SETTINGS_SECTIONS, type SettingsSection } from '../lib/settings-sections';
import { UNIT_CHOICES } from '../lib/units';


export default function SettingsScreen() {
  const th = useTheme();
  const { section } = useLocalSearchParams<{ section?: string }>();
  const [tones, setTones] = useState(false);
  const only = SETTINGS_SECTIONS.find(s => s[0] === section);
  const show = (s: SettingsSection) => !only || only[0] === s;

  const intro = (s: SettingsSection) => {
    const meta = SETTINGS_SECTIONS.find(x => x[0] === s)!;
    return only ? (
      <View style={{ alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <View style={{ width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accentSoft }}>
          <Icon name={meta[2]} size={30} color={th.c.accent} />
        </View>
        <Txt muted style={{ textAlign: 'center' }}>{meta[3]}</Txt>
      </View>
    ) : null;
  };

  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <PageTitle>{only ? only[1] : 'Settings'}</PageTitle>
      </TopBar>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 60, gap: 28 }}>
        {show('cook') ? (
          <Group title={only ? '' : 'Cook mode'}>
            {intro('cook')}
            <Segmented label="Layout" k="cookLayout" options={[['cards', 'One step at a time'], ['list', 'All steps in a list']]} />
            <Card style={{ paddingHorizontal: 16, paddingVertical: 2 }}>
              <Toggle k="stepArt" label="Step animations" />
              <Toggle k="stepIngredients" label="Show what each step needs" hint="Lists the ingredients mentioned in the step" />
              <Toggle k="highlightTimes" label="Highlight times & temperatures" />
              <Toggle k="keepAwake" label="Keep the screen on while cooking" last />
            </Card>
          </Group>
        ) : null}

        {show('units') ? (
          <Group title={only ? '' : 'Units'}>
            {intro('units')}
            <Segmented label="Show amounts in" k="units" options={UNIT_CHOICES} />
            <Txt muted size={13}>Changes ingredients, steps, oven temperatures and what hands-free reads aloud. Teaspoons and tablespoons stay as they are.</Txt>
          </Group>
        ) : null}

        {show('handsfree') ? (
          <Group title={only ? '' : 'Hands-free'}>
            {intro('handsfree')}
            <Card style={{ paddingHorizontal: 16, paddingVertical: 2 }}>
              <Toggle k="handsFree" label="Hands-free in cook mode" hint="Reads each step aloud. You can also switch it with the mic in cook mode." />
              <Toggle k="handsFreeWake" label="Wait for “Hey Mise”" hint="Only acts on commands that start with “Hey Mise”, so kitchen chatter doesn’t skip steps" last />
            </Card>
          </Group>
        ) : null}

        {show('timers') ? (
          <Group title={only ? '' : 'Timers & alarms'}>
            {intro('timers')}
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <ToneRow onPress={() => setTones(true)} />
            </Card>
            <Txt muted size={13}>Notification sounds and previews are in Account → Notifications.</Txt>
          </Group>
        ) : null}

        {show('haptics') ? (
          <Group title={only ? '' : 'Vibration'}>
            {intro('haptics')}
            <Card style={{ paddingHorizontal: 16, paddingVertical: 2 }}>
              <Toggle k="haptics" label="Vibration feedback" last />
            </Card>
          </Group>
        ) : null}
      </ScrollView>
      <ToneSheet visible={tones} onClose={() => setTones(false)} />
    </Screen>
  );
}
