// Appearance: colours, light/dark, font and text size. Changes show right away across the app.
import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Group, Segmented } from '../components/settings-ui';
import { Btn, IconBtn, Screen, TopBar, Txt } from '../components/ui';
import { useApp } from '../lib/store';
import { FONTS, THEMES, useTheme } from '../lib/theme';

export default function AppearanceScreen() {
  const th = useTheme();
  const { settings, updateSettings, resetLook } = useApp();

  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <Txt kind="head" weight="bold" size={19} style={{ flex: 1, paddingLeft: 4 }}>Appearance</Txt>
      </TopBar>

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

        <Group title="Light or dark">
          <ModePicker />
        </Group>

        <Group title="Style">
          <Segmented label="Font" k="font" columns={2} options={Object.entries(FONTS).map(([k, f]) => [k, f.name])} fontFor={k => FONTS[k].head?.bold} />
          <Segmented label="Text size" k="textSize" options={[['s', 'S'], ['m', 'M'], ['l', 'L'], ['xl', 'XL']]} />
        </Group>

        <Btn title="Reset appearance to default" icon="refresh" variant="ghost" size="small" onPress={resetLook} />
      </ScrollView>
    </Screen>
  );
}

const LIGHT = { bg: '#FFFFFF', card: '#FFFFFF', line: '#E2DED8', text: '#8C857C', frame: '#F4F2EF' };
const DARK = { bg: '#1E1E1E', card: '#262626', line: '#3A3A3A', text: '#A39E97', frame: '#141414' };

// Light / Dark / System as three little phone-screen previews; the chosen one is outlined.
function ModePicker() {
  const th = useTheme();
  const { settings, updateSettings } = useApp();
  const options: [string, string][] = [['light', 'Light'], ['dark', 'Dark'], ['auto', 'System']];
  return (
    <View style={{ flexDirection: 'row', gap: 10, padding: 10, borderRadius: 24, backgroundColor: th.c.soft }}>
      {options.map(([key, label]) => {
        const on = settings.mode === key;
        return (
          <Pressable key={key} onPress={() => updateSettings({ mode: key })} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={label}
            style={{ flex: 1, alignItems: 'center', gap: 8 }}>
            <View style={{ alignSelf: 'stretch', aspectRatio: 1.35, borderRadius: 18, padding: 3, borderWidth: 2.5, borderColor: on ? th.c.accent : 'transparent' }}>
              <View style={{ flex: 1, borderRadius: 14, overflow: 'hidden' }}>
                <Svg width="100%" height="100%" viewBox="0 0 120 88" preserveAspectRatio="none">
                  <Rect x={0} y={0} width={120} height={88} fill={key === 'dark' ? DARK.frame : LIGHT.frame} />
                  {key === 'auto' ? <Path d="M120 0 V88 H0 Z" fill={DARK.frame} /> : null}
                  <Rect x={10} y={10} width={100} height={68} rx={10} fill={key === 'dark' ? DARK.card : LIGHT.card} stroke={key === 'dark' ? DARK.line : LIGHT.line} strokeWidth={1.5} />
                  {key === 'auto' ? <Path d="M110 10 V68 Q110 78 100 78 H10 Z" fill={DARK.card} /> : null}
                  <Rect x={20} y={22} width={44} height={6} rx={3} fill={key === 'dark' ? DARK.text : LIGHT.text} />
                  <Rect x={20} y={34} width={30} height={6} rx={3} fill={key === 'dark' ? DARK.text : LIGHT.text} />
                  <Circle cx={94} cy={62} r={8} fill={th.c.accent} />
                </Svg>
              </View>
            </View>
            <Txt weight="bold" size={15} color={on ? th.c.accent : th.c.muted}>{label}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
