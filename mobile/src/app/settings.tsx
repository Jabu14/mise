// Settings: how cook mode behaves, timers and their alarm, and the recipe prompt.
// (Colours and fonts live on their own Appearance page.)
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, TextInput, View } from 'react-native';
import { Group, Segmented, Toggle } from '../components/settings-ui';
import { ToneRow, ToneSheet } from '../components/tone-sheet';
import { Btn, Card, IconBtn, Screen, TopBar, Txt } from '../components/ui';
import { RECIPE_PROMPT } from '../shared/content';
import { useApp, useTimers } from '../lib/store';
import { useTheme } from '../lib/theme';

export default function SettingsScreen() {
  const th = useTheme();
  const { settings, updateSettings } = useApp();
  const { startTimer } = useTimers();
  const [tones, setTones] = useState(false);
  const prompt = settings.recipePrompt || RECIPE_PROMPT;

  // A real 5-second timer: tests the in-app sound, and the notification if you lock the phone.
  const testAlarm = () => {
    startTimer({ minutes: 5 / 60, label: 'Test alarm' });
    Alert.alert('Alarm in 5 seconds', 'Keep the app open to hear the alarm sound, or lock your phone to check the notification.');
  };

  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <Txt kind="head" weight="bold" size={19} style={{ flex: 1, paddingLeft: 4 }}>Settings</Txt>
      </TopBar>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 60, gap: 28 }}>
        <Group title="Cook mode">
          <Segmented label="Layout" k="cookLayout" options={[['cards', 'One step at a time'], ['list', 'All steps in a list']]} />
          <Card style={{ paddingHorizontal: 16, paddingVertical: 2 }}>
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
          <Txt muted size={13} style={{ marginTop: -6 }}>The alarm rings until you stop it, even on silent.</Txt>
          <Btn title="Test the alarm" icon="timer-outline" variant="ghost" size="small" onPress={testAlarm} style={{ alignSelf: 'flex-start' }} />
        </Group>

        <Group title="Recipe prompt">
          <Txt muted size={14}>This is what “Copy recipe prompt” copies. You can change it, for example to ask for metric units only.</Txt>
          <TextInput
            multiline
            value={prompt}
            onChangeText={text => updateSettings({ recipePrompt: text.trim() === RECIPE_PROMPT.trim() ? '' : text })}
            maxLength={8000}
            textAlignVertical="top"
            style={{ minHeight: 200, maxHeight: 320, padding: 14, borderRadius: th.radius, borderWidth: 1.5, borderColor: th.c.line, backgroundColor: th.c.surface, color: th.c.text, fontSize: 13, fontFamily: 'monospace' }}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Btn title="Copy" icon="copy-outline" variant="secondary" size="small" onPress={() => Clipboard.setStringAsync(prompt)} />
            <Btn title="Restore original" icon="refresh" variant="ghost" size="small" onPress={() => updateSettings({ recipePrompt: '' })} />
          </View>
        </Group>
      </ScrollView>
      <ToneSheet visible={tones} onClose={() => setTones(false)} />
    </Screen>
  );
}
