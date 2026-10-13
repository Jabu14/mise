// Appearance: colours, light/dark, font, text size and card style, with a live cook-mode step on top.
import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { Group, Segmented } from '../components/settings-ui';
import { Btn, Card, Icon, IconBtn, Screen, StepBody, TopBar, Txt } from '../components/ui';
import { useApp } from '../lib/store';
import { FONTS, THEMES, useTheme } from '../lib/theme';

const SAMPLE_STEP = {
  phase: 'Shaping',
  title: 'Shape the loaf',
  text: 'Tip the dough onto a floured surface, fold the edges in and let it rest for 10 minutes. Bake at 230°C (450°F).',
  tip: '',
  timers: [],
};

export default function AppearanceScreen() {
  const th = useTheme();
  const { settings, updateSettings, resetLook } = useApp();

  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <Txt kind="head" weight="bold" size={19} style={{ flex: 1, paddingLeft: 4 }}>Appearance</Txt>
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

        <Btn title="Reset appearance to default" icon="refresh" variant="ghost" size="small" onPress={resetLook} />
      </ScrollView>
    </Screen>
  );
}
