// Developer tools: switches for trying out design ideas while Mise is being built.
// Remove this page (and its row in Account) before launch.
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Pressable, ScrollView, Switch, View } from 'react-native';
import { Group } from '../components/settings-ui';
import { Card, Icon, IconBtn, Screen, TopBar, Txt, type IconName } from '../components/ui';
import { AUTH_MODE } from '../lib/auth';
import { AI_NAME } from '../lib/chat-store';
import { useApp } from '../lib/store';
import { useTheme } from '../lib/theme';

export const NAV_TABS: [string, string, IconName][] = [
  ['index', 'Recipes', 'book-outline'],
  ['chat', AI_NAME, 'chatbubble-outline'],
  ['add', 'Add', 'add-circle-outline'],
  ['timers', 'Timers', 'timer-outline'],
  ['account', 'Account', 'person-circle-outline'],
];

export default function DeveloperScreen() {
  const th = useTheme();
  const { settings, updateSettings } = useApp();
  const hidden = new Set(settings.navHideLabels.split(',').filter(Boolean));
  const set = (next: Set<string>) => updateSettings({ navHideLabels: [...next].join(',') });
  const toggle = (tab: string) => {
    const next = new Set(hidden);
    if (next.has(tab)) next.delete(tab);
    else next.add(tab);
    set(next);
  };

  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <Txt kind="head" weight="bold" size={19} style={{ flex: 1, paddingLeft: 4 }}>Developer</Txt>
      </TopBar>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 60, gap: 28 }}>
        <Card style={{ padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Icon name="construct-outline" size={22} color={th.c.accent} />
          <Txt muted size={14} style={{ flex: 1 }}>Tools for building Mise. This section will be removed before launch.</Txt>
        </Card>

        <Group title="Navbar labels">
          <Card style={{ paddingHorizontal: 16, paddingVertical: 2 }}>
            {NAV_TABS.map(([key, label, icon], i) => (
              <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: i === NAV_TABS.length - 1 ? 0 : 1, borderBottomColor: th.c.line }}>
                <Icon name={icon} size={20} color={th.c.accent} />
                <Txt weight="bold" style={{ flex: 1 }}>{label}</Txt>
                <Switch value={!hidden.has(key)} onValueChange={() => toggle(key)} trackColor={{ true: th.c.accent, false: th.c.line }} thumbColor="#fff" accessibilityLabel={`Show the ${label} label`} />
              </View>
            ))}
          </Card>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[['Show all', () => set(new Set())], ['Hide all', () => set(new Set(NAV_TABS.map(t => t[0])))]].map(([label, fn]) => (
              <Pressable key={label as string} onPress={fn as () => void} style={({ pressed }) => ({ flex: 1, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.soft, opacity: pressed ? 0.7 : 1 })}>
                <Txt weight="bold">{label as string}</Txt>
              </Pressable>
            ))}
          </View>
          <Txt muted size={13}>Turn a tab’s text off to show only its icon in the navigation bar.</Txt>
        </Group>

        <Group title="Build info">
          <Card style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
            {[
              ['Version', Constants.expoConfig?.version ?? '?'],
              ['Accounts', AUTH_MODE === 'supabase' ? 'Supabase (online)' : 'Demo (this phone only)'],
              ['Sous AI', process.env.EXPO_PUBLIC_AI_URL ? 'Server set' : 'Not connected'],
            ].map(([k, v], i, all) => (
              <View key={k} style={{ flexDirection: 'row', paddingVertical: 12, borderBottomWidth: i === all.length - 1 ? 0 : 1, borderBottomColor: th.c.line }}>
                <Txt weight="bold" style={{ flex: 1 }}>{k}</Txt>
                <Txt muted>{v}</Txt>
              </View>
            ))}
          </Card>
        </Group>
      </ScrollView>
    </Screen>
  );
}
