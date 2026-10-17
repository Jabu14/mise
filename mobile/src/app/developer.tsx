// Developer tools: a hub of pages for trying out ideas and testing while Mise is being built.
// Remove this page, app/dev/, and the Developer row in Account before launch.
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { Card, Icon, IconBtn, PageTitle, Screen, TopBar, Txt, type IconName } from '../components/ui';
import { AUTH_MODE } from '../lib/auth';
import { useTheme } from '../lib/theme';

const DEV_TOOLS: [string, string, IconName, string][] = [
  ['features', 'Feature switches', 'toggle-outline', 'Turn parts of the app on or off, like the status bubble'],
  ['layout', 'Account layout', 'reorder-four-outline', 'Reorder or hide the sections on the Account tab'],
  ['navbar', 'Navigation bar', 'apps-outline', 'Show or hide each tab’s text'],
  ['data', 'Test data', 'flask-outline', 'Add sample recipes and cooks, test a notification, clear things'],
  ['storage', 'Storage', 'server-outline', 'See what’s saved on this phone, and erase it'],
];

export default function DeveloperScreen() {
  const th = useTheme();
  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <PageTitle>Developer</PageTitle>
      </TopBar>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 60, gap: 16 }}>
        <View style={{ borderRadius: 28, padding: 20, gap: 10, backgroundColor: th.dark ? '#1F2430' : '#22263A', overflow: 'hidden' }}>
          <View style={{ position: 'absolute', width: 180, height: 180, borderRadius: 90, top: -60, right: -50, backgroundColor: th.c.accent, opacity: 0.35 }} />
          <View style={{ width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' }}>
            <Icon name="construct-outline" size={24} color="#FFFFFF" />
          </View>
          <Txt kind="head" weight="bold" size={24} color="#FFFFFF">Developer tools</Txt>
          <Txt size={14} color="#FFFFFF" style={{ opacity: 0.75 }}>For building and testing Mise. This whole section is removed before launch.</Txt>
        </View>

        <View style={{ gap: 10 }}>
          {DEV_TOOLS.map(([key, title, icon, desc]) => (
            <Pressable key={key} onPress={() => router.push({ pathname: '/dev/[tool]', params: { tool: key } })} accessibilityRole="button"
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 22, backgroundColor: pressed ? th.c.soft : th.c.surface, borderWidth: 1, borderColor: th.c.line })}>
              <View style={{ width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accentSoft }}>
                <Icon name={icon} size={22} color={th.c.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt weight="black" size={16}>{title}</Txt>
                <Txt muted size={13}>{desc}</Txt>
              </View>
              <Icon name="chevron-forward" size={18} color={th.c.muted} />
            </Pressable>
          ))}
        </View>

        <Card style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
          {[
            ['Version', Constants.expoConfig?.version ?? '?'],
            ['Accounts', AUTH_MODE === 'supabase' ? 'Supabase (online)' : 'Demo (this phone only)'],
            ['Sous AI', process.env.EXPO_PUBLIC_AI_URL ? 'Server set' : 'Not connected'],
            ['Runtime', Constants.appOwnership === 'expo' ? 'Expo Go' : 'App build'],
          ].map(([k, v], i, all) => (
            <View key={k} style={{ flexDirection: 'row', paddingVertical: 12, borderBottomWidth: i === all.length - 1 ? 0 : 1, borderBottomColor: th.c.line }}>
              <Txt weight="bold" style={{ flex: 1 }}>{k}</Txt>
              <Txt muted>{v}</Txt>
            </View>
          ))}
        </Card>
      </ScrollView>
    </Screen>
  );
}
