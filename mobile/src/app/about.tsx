// About: version, what's new, where your data lives, and the legal terms.
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { Row } from '../components/settings-ui';
import { Card, Icon, IconBtn, Label, Screen, TopBar, Txt } from '../components/ui';
import { AI_NAME } from '../lib/chat-store';
import { useTheme } from '../lib/theme';

// Keep in step with CHANGELOG.md at the project root.
const WHATS_NEW = [
  'Swipe between tabs: the page follows your finger and glides into the next',
  'New Account section with Profile, Notifications and Usage',
  `Pick ${AI_NAME}'s voice, and a new Light / Dark / System picker`,
  'The cooks stand right at the counter now',
];

export default function AboutScreen() {
  const th = useTheme();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <Txt kind="head" weight="bold" size={19} style={{ flex: 1, paddingLeft: 4 }}>About</Txt>
      </TopBar>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 48, gap: 18 }}>
        <View style={{ alignItems: 'center', gap: 8, paddingVertical: 12 }}>
          <View style={{ width: 84, height: 84, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accent }}>
            <Icon name="restaurant" size={40} color={th.c.onAccent} />
          </View>
          <Txt kind="head" weight="bold" size={28}>Mise</Txt>
          <Txt muted weight="bold">Version {version}</Txt>
          <Txt muted style={{ textAlign: 'center', maxWidth: 300 }}>Paste a recipe and get big, simple steps with timers, made for cooking with messy hands.</Txt>
        </View>

        <View style={{ gap: 8 }}>
          <View style={{ marginLeft: 4 }}><Label color={th.c.muted}>{`What's new in ${version}`}</Label></View>
          <Card style={{ padding: 16, gap: 10 }}>
            {WHATS_NEW.map(line => (
              <View key={line} style={{ flexDirection: 'row', gap: 10 }}>
                <Icon name="sparkles" size={16} color={th.c.accent} />
                <Txt size={15} style={{ flex: 1 }}>{line}</Txt>
              </View>
            ))}
          </Card>
        </View>

        <View style={{ gap: 8 }}>
          <View style={{ marginLeft: 4 }}><Label color={th.c.muted}>Your data</Label></View>
          <Card style={{ padding: 16, gap: 8 }}>
            <Txt size={15}>Your recipes, chats, voice messages and settings are saved on this phone only. There is no account yet.</Txt>
            <Txt size={15}>When you use “Import with AI”, the link, photo or text you choose is sent to Mise’s server, which asks an AI to turn it into steps. Mise doesn’t keep a copy.</Txt>
          </Card>
        </View>

        <Card style={{ paddingHorizontal: 6 }}>
          <Row icon="document-text-outline" title="Terms of Use" onPress={() => router.push('/legal?doc=terms')} />
          <Row icon="shield-checkmark-outline" title="Privacy Policy" onPress={() => router.push('/legal?doc=privacy')} last />
        </Card>
      </ScrollView>
    </Screen>
  );
}
