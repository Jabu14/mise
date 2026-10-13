// Profile: your name and cooking level. Email and a photo arrive with sign-in.
import { router } from 'expo-router';
import { ScrollView, TextInput, View } from 'react-native';
import { Group, Row, Segmented } from '../components/settings-ui';
import { Card, Icon, IconBtn, Screen, TopBar, Txt } from '../components/ui';
import { AI_NAME } from '../lib/chat-store';
import { useApp } from '../lib/store';
import { useTheme } from '../lib/theme';
import { LIMITS } from '../lib/validate';

export default function ProfileScreen() {
  const th = useTheme();
  const { settings, updateSettings } = useApp();
  const initial = settings.name.trim().charAt(0).toUpperCase();
  const diets = settings.aiDiet.split(',').filter(Boolean);

  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <Txt kind="head" weight="bold" size={19} style={{ flex: 1, paddingLeft: 4 }}>Profile</Txt>
      </TopBar>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 48, gap: 28 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', gap: 10 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accent }}>
            {initial ? <Txt kind="head" weight="bold" size={42} color={th.c.onAccent}>{initial}</Txt> : <Icon name="person" size={44} color={th.c.onAccent} />}
          </View>
        </View>

        <Group title="About you">
          <View style={{ gap: 8 }}>
            <Txt weight="black" size={14}>Name</Txt>
            <TextInput value={settings.name} onChangeText={name => updateSettings({ name })} placeholder="Your name" placeholderTextColor={th.c.muted} maxLength={LIMITS.name} autoCorrect={false}
              style={[{ height: 50, paddingHorizontal: 16, borderRadius: th.radius, borderWidth: 1.5, borderColor: th.c.line, backgroundColor: th.c.surface, color: th.c.text, fontSize: th.fs(16) }, th.f('body')]} />
          </View>
          <Card style={{ paddingHorizontal: 6 }}>
            <Row icon="mail-outline" title="Email" badge="WITH SIGN-IN" last />
          </Card>
          <Segmented label="Cooking level" k="aiSkill" options={[['beginner', 'Beginner'], ['home', 'Home cook'], ['confident', 'Confident']]} />
        </Group>

        <Group title="Food">
          <Card style={{ paddingHorizontal: 6 }}>
            <Row icon="leaf-outline" title="Diet and allergies" value={diets.length ? diets.join(', ') : 'None set'} onPress={() => router.push('/sous-settings')} last />
          </Card>
          <Txt muted size={13}>{`Shared with ${AI_NAME} settings, so answers fit how you eat.`}</Txt>
        </Group>
      </ScrollView>
    </Screen>
  );
}
