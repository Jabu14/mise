// Look & settings, with a live preview of a cook-mode step at the top.
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, Switch, TextInput, View } from 'react-native';
import { Btn, Card, Icon, IconBtn, Screen, StepBody, TopBar, Txt } from '../components/ui';
import { GEMINI_PROMPT } from '../shared/content';
import { scheduleAlarm } from '../lib/notifications';
import { useApp, type Settings } from '../lib/store';
import { FONTS, THEMES, useTheme } from '../lib/theme';

const SAMPLE_STEP = {
  phase: 'Shaping',
  title: 'Shape the loaf',
  text: 'Tip the dough onto a floured surface, fold the edges in and let it rest for 10 minutes. Bake at 230°C (450°F).',
  tip: '',
  timers: [],
};

export default function SettingsScreen() {
  const th = useTheme();
  const { settings, updateSettings, resetLook } = useApp();
  const prompt = settings.geminiPrompt || GEMINI_PROMPT;

  const testAlarm = async () => {
    const id = await scheduleAlarm('Test timer', 'Mise', 5000);
    Alert.alert(
      id ? 'Alarm in 5 seconds' : 'Notifications are off',
      id ? 'Lock your phone now to check the alarm works with the screen off.' : 'Turn on notifications for this app in your phone settings so timers can ring.',
    );
  };

  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <Txt kind="head" weight="bold" size={19} style={{ flex: 1, paddingLeft: 4 }}>Look & settings</Txt>
      </TopBar>

      <View style={{ paddingHorizontal: 16, paddingBottom: 12, backgroundColor: th.c.bg }}>
        <Card style={{ padding: 16 }}>
          <StepBody step={SAMPLE_STEP} number={3} compact>
            <View style={{ flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: th.c.accentSoft }}>
              <Icon name="timer-outline" size={18} color={th.c.accent} />
              <Txt weight="black" size={15} color={th.c.accent}>Start 10 min</Txt>
            </View>
          </StepBody>
        </Card>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 60, gap: 28 }}>
        <Group title="Colour">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {Object.entries(THEMES).map(([key, t]) => {
              const on = settings.theme === key;
              return (
                <Pressable key={key} onPress={() => updateSettings({ theme: key })} style={{ width: '23.5%', alignItems: 'center', gap: 6, paddingVertical: 10, borderRadius: th.radiusSm, backgroundColor: on ? th.c.soft : 'transparent' }} accessibilityLabel={t.name} accessibilityState={{ selected: on }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.accent, borderWidth: on ? 3 : 0, borderColor: th.c.surface, outlineColor: t.accent, outlineWidth: on ? 2 : 0 }} />
                  <Txt weight="bold" size={12} muted={!on}>{t.name}</Txt>
                </Pressable>
              );
            })}
          </View>
        </Group>

        <Group title="Style">
          <Segmented label="Light or dark" k="mode" options={[['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']]} />
          <Segmented label="Font" k="font" columns={2} options={Object.entries(FONTS).map(([k, f]) => [k, f.name])} fontFor={k => FONTS[k].head?.bold} />
          <Segmented label="Text size" k="textSize" options={[['s', 'S'], ['m', 'M'], ['l', 'L'], ['xl', 'XL']]} />
          <Segmented label="Cards" k="cards" options={[['soft', 'Soft & rounded'], ['flat', 'Flat & crisp']]} />
        </Group>

        <Group title="Cook mode">
          <Segmented label="Layout" k="cookLayout" options={[['cards', 'One step at a time'], ['list', 'All steps in a list']]} />
          <Card style={{ paddingHorizontal: 16, paddingVertical: 2 }}>
            <Toggle k="stepIngredients" label="Show what each step needs" hint="Lists the ingredients mentioned in the step" />
            <Toggle k="highlightTimes" label="Highlight times & temperatures" />
            <Toggle k="keepAwake" label="Keep the screen on while cooking" />
            <Toggle k="haptics" label="Vibration feedback" last />
          </Card>
          <Btn title="Test the alarm" icon="timer-outline" variant="ghost" size="small" onPress={testAlarm} style={{ alignSelf: 'flex-start' }} />
        </Group>

        <Group title="Gemini prompt">
          <Txt muted size={14}>This is what “Copy prompt for Gemini” copies. You can change it, for example to ask for metric units only.</Txt>
          <TextInput
            multiline
            value={prompt}
            onChangeText={text => updateSettings({ geminiPrompt: text.trim() === GEMINI_PROMPT.trim() ? '' : text })}
            textAlignVertical="top"
            style={{ minHeight: 200, maxHeight: 320, padding: 14, borderRadius: th.radius, borderWidth: 1.5, borderColor: th.c.line, backgroundColor: th.c.surface, color: th.c.text, fontSize: 13, fontFamily: 'monospace' }}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Btn title="Copy" icon="copy-outline" variant="secondary" size="small" onPress={() => Clipboard.setStringAsync(prompt)} />
            <Btn title="Restore original" icon="refresh" variant="ghost" size="small" onPress={() => updateSettings({ geminiPrompt: '' })} />
          </View>
        </Group>

        <Btn title="Reset the look to default" icon="refresh" variant="ghost" size="small" onPress={resetLook} />
      </ScrollView>
    </Screen>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 14 }}>
      <Txt kind="head" weight="bold" size={21}>{title}</Txt>
      {children}
    </View>
  );
}

function Segmented({ label, k, options, columns, fontFor }: { label: string; k: keyof Settings; options: string[][]; columns?: number; fontFor?: (value: string) => string | undefined }) {
  const th = useTheme();
  const { settings, updateSettings } = useApp();
  return (
    <View style={{ gap: 8 }}>
      <Txt weight="black" size={14}>{label}</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, padding: 4, borderRadius: th.flat ? 10 : 24, backgroundColor: th.c.soft }}>
        {options.map(([value, text]) => {
          const on = settings[k] === value;
          return (
            <Pressable
              key={value}
              onPress={() => updateSettings({ [k]: value } as Partial<Settings>)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              style={{ flexGrow: 1, flexBasis: columns ? `${100 / columns - 3}%` : 0, minHeight: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, borderRadius: th.flat ? 8 : 20, backgroundColor: on ? th.c.surface : 'transparent' }}
            >
              <Txt weight="bold" size={14} muted={!on} style={fontFor?.(value) ? { fontFamily: fontFor(value) } : undefined}>{text}</Txt>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Toggle({ k, label, hint, last }: { k: keyof Settings; label: string; hint?: string; last?: boolean }) {
  const th = useTheme();
  const { settings, updateSettings } = useApp();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: th.c.line }}>
      <View style={{ flex: 1 }}>
        <Txt weight="bold">{label}</Txt>
        {hint ? <Txt muted size={13}>{hint}</Txt> : null}
      </View>
      <Switch value={!!settings[k]} onValueChange={v => updateSettings({ [k]: v } as Partial<Settings>)} trackColor={{ true: th.c.accent, false: th.c.line }} thumbColor="#fff" ios_backgroundColor={th.c.line} />
    </View>
  );
}
