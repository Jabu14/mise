// Account tab: your profile and stats, then Make it yours, Recipes, Support and About.
// Sign-in / cloud sync will live here once there is a backend; for now everything stays on this phone.
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { ScrollView, TextInput, View } from 'react-native';
import { Row } from '../../components/settings-ui';
import { Card, Icon, Label, Screen, TopBar, Txt, type IconName } from '../../components/ui';
import { useApp, useTimers } from '../../lib/store';
import { FONTS, THEMES, useTheme } from '../../lib/theme';
import { LIMITS } from '../../lib/validate';

export default function AccountTab() {
  const th = useTheme();
  const { settings, updateSettings, recipes } = useApp();
  const { timersStarted } = useTimers();
  const cooked = recipes.reduce((n, r) => n + (r.cookCount || 0), 0);
  const initial = settings.name.trim().charAt(0).toUpperCase();
  const appearanceSummary = [THEMES[settings.theme as keyof typeof THEMES]?.name, FONTS[settings.font as keyof typeof FONTS]?.name].filter(Boolean).join(' · ');


  return (
    <Screen>
      <TopBar>
        <Txt kind="head" weight="bold" size={30} style={{ flex: 1, paddingLeft: 8 }}>Account</Txt>
      </TopBar>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 32, gap: 16 }} keyboardShouldPersistTaps="handled">
        <Card style={{ padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accent }}>
            {initial ? <Txt kind="head" weight="bold" size={26} color={th.c.onAccent}>{initial}</Txt> : <Icon name="person" size={28} color={th.c.onAccent} />}
          </View>
          <View style={{ flex: 1 }}>
            <TextInput
              value={settings.name}
              onChangeText={name => updateSettings({ name })}
              placeholder="Add your name"
              placeholderTextColor={th.c.muted}
              maxLength={LIMITS.name}
              autoCorrect={false}
              style={[{ color: th.c.text, fontSize: th.fs(20), paddingVertical: 2 }, th.f('head', 'bold')]}
              accessibilityLabel="Your name"
            />
            <Txt muted size={13}>Your recipes are saved on this phone</Txt>
          </View>
        </Card>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Stat value={recipes.length} label="Recipes" icon="book-outline" />
          <Stat value={cooked} label="Cooked" icon="restaurant-outline" />
          <Stat value={timersStarted} label="Timers" icon="timer-outline" />
        </View>

        <Card style={{ padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accentSoft }}>
            <Icon name="cloud-outline" size={22} color={th.c.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Txt weight="black">Sign in & sync</Txt>
              <View style={{ paddingHorizontal: 8, paddingVertical: 1, borderRadius: 999, backgroundColor: th.c.soft }}>
                <Txt weight="black" size={11} muted>SOON</Txt>
              </View>
            </View>
          </View>
        </Card>

        <Section title="Make it yours">
          <Row icon="color-palette-outline" title="Appearance" value={appearanceSummary} onPress={() => router.push('/appearance')} />
          <Row icon="settings-outline" title="Settings" onPress={() => router.push('/settings')} last />
        </Section>

        <Section title="Recipes">
          <Row icon="document-text-outline" title="Recipe prompt" onPress={() => router.push('/recipe-prompt')} last />
        </Section>

        <Section title="Support">
          <Row icon="help-circle-outline" title="Help center" onPress={() => router.push('/help')} />
          <Row icon="bug-outline" title="Report an issue" onPress={() => router.push('/feedback?mode=issue')} />
          <Row icon="chatbox-ellipses-outline" title="Send feedback" onPress={() => router.push('/feedback')} last />
        </Section>

        <Section title="About">
          <Row icon="information-circle-outline" title="About" value={`v${Constants.expoConfig?.version ?? '1.0.0'}`} onPress={() => router.push('/about')} last />
        </Section>
      </ScrollView>
    </Screen>
  );
}

function Stat({ value, label, icon }: { value: number; label: string; icon: IconName }) {
  const th = useTheme();
  return (
    <Card style={{ flex: 1, paddingVertical: 14, alignItems: 'center', gap: 2 }}>
      <Icon name={icon} size={18} color={th.c.accent} />
      <Txt kind="head" weight="bold" size={24}>{value}</Txt>
      <Txt muted size={12} weight="bold">{label}</Txt>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const th = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <View style={{ marginLeft: 4 }}><Label color={th.c.muted}>{title}</Label></View>
      <Card style={{ paddingHorizontal: 6 }}>{children}</Card>
    </View>
  );
}
