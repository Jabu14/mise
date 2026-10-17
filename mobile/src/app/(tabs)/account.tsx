// Account tab: a profile header (photo, an emoji status, your name), your kitchen at a glance, then
// Plan, Account, Sous (the AI), App, Help & legal, Developer, and Sign out.
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useBottomTabBarHeight } from 'expo-router/js-tabs';
import { useState } from 'react';
import { ActionSheetIOS, Alert, Image, Modal, Platform, Pressable, ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Row } from '../../components/settings-ui';
import { Card, Icon, Label, Screen, Txt, type IconName } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { AI_NAME } from '../../lib/chat-store';
import { useCookLog, weekStreak } from '../../lib/cook-log';
import { useApp, useTimers } from '../../lib/store';
import { FONTS, THEMES, useTheme } from '../../lib/theme';
import { useIslandSpace } from '../../lib/island';
import { voiceLabel } from '../../lib/voices';

const STATUSES = ['🍞', '🍝', '🥗', '🍰', '🍳', '🍜', '🌮', '🍕', '🥘', '🧁', '🔥', '👩‍🍳', '🧑‍🍳', '😋', '🛒', '💪'];

export default function AccountTab() {
  const th = useTheme();
  const insets = useSafeAreaInsets();
  const island = useIslandSpace();
  const tabBarH = useBottomTabBarHeight();
  const { settings, updateSettings, recipes } = useApp();
  const { user, signOut } = useAuth();
  const { timersStarted } = useTimers();
  const cooks = useCookLog().entries;
  const [picking, setPicking] = useState(false);
  const [now] = useState(() => Date.now());

  const name = settings.name.trim() || user?.name || '';
  const initial = name.charAt(0).toUpperCase();
  const cooked = Math.max(cooks.length, recipes.reduce((n, r) => n + (r.cookCount || 0), 0));
  const monthStart = new Date(new Date(now).getFullYear(), new Date(now).getMonth(), 1).getTime();
  const cookedThisMonth = cooks.filter(c => c.at >= monthStart).length;
  const streak = weekStreak(cooks, now);
  const appearanceSummary = [THEMES[settings.theme as keyof typeof THEMES]?.name, FONTS[settings.font as keyof typeof FONTS]?.name].filter(Boolean).join(' · ');

  const nameMenu = () => {
    if (!user) return router.push('/sign-in');
    const actions: [string, () => void, boolean?][] = [
      ['Edit profile', () => router.push('/profile')],
      ['Sign out', confirmSignOut, true],
    ];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { title: user.email, options: [...actions.map(a => a[0]), 'Cancel'], cancelButtonIndex: actions.length, destructiveButtonIndex: 1 },
        i => actions[i]?.[1](),
      );
    } else {
      Alert.alert(user.email, undefined, [...actions.map(([text, onPress, danger]) => ({ text, onPress, style: danger ? 'destructive' as const : 'default' as const })), { text: 'Cancel', style: 'cancel' }]);
    }
  };

  const confirmSignOut = () =>
    Alert.alert('Sign out?', 'Your recipes, plans and journal stay on this phone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => { signOut(); } },
    ]);

  const invite = () => Share.share({ message: 'I’m cooking with Mise: big, simple steps with built-in timers. Try it!' }).catch(() => {});

  const chooseStatus = (s: string) => {
    if (settings.haptics) Haptics.selectionAsync().catch(() => {});
    updateSettings({ status: s });
    setPicking(false);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: tabBarH + 24, gap: 16 }} keyboardShouldPersistTaps="handled">
        {/* Profile header */}
        <View style={{ paddingHorizontal: 16, paddingTop: insets.top + island + 8, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
            <HeaderButton icon="settings-outline" label="Settings" onPress={() => router.push('/settings')} />
            <View style={{ flexDirection: 'row', height: 52, borderRadius: 26, borderWidth: 1, borderColor: th.c.line, backgroundColor: th.c.surface, overflow: 'hidden' }}>
              <Pressable onPress={invite} accessibilityLabel="Invite a friend" style={({ pressed }) => ({ width: 60, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? th.c.soft : 'transparent' })}>
                <Icon name="share-outline" size={22} />
              </Pressable>
              <Pressable onPress={() => router.push('/profile')} accessibilityLabel="Edit profile" style={({ pressed }) => ({ width: 60, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? th.c.soft : 'transparent' })}>
                <Icon name="pencil" size={20} />
              </Pressable>
            </View>
          </View>

          <View style={{ marginTop: 34, alignItems: 'center' }}>
            <Pressable onPress={() => router.push('/profile')} accessibilityLabel="Profile picture"
              style={{ width: 132, height: 132, borderRadius: 66, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accentSoft, borderWidth: 1, borderColor: th.c.line }}>
              {settings.avatar ? <Image source={{ uri: settings.avatar }} style={{ width: 132, height: 132 }} />
                : initial ? <Txt kind="head" weight="bold" size={56} color={th.c.accent}>{initial}</Txt>
                : <Icon name="person" size={60} color={th.c.accent} />}
            </Pressable>
            {/* Status bubble, like a thought above your picture */}
            <Pressable onPress={() => setPicking(true)} accessibilityLabel={settings.status ? `Status ${settings.status}, change` : 'Add a status emoji'}
              style={{ position: 'absolute', top: -30, left: -58, alignItems: 'flex-start' }}>
              <View style={{ paddingHorizontal: 16, height: 40, borderRadius: 20, justifyContent: 'center', backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line }}>
                <Txt size={settings.status ? 20 : 14} weight="bold" muted={!settings.status}>{settings.status || 'What’s cooking? 🍳'}</Txt>
              </View>
              <View style={{ width: 14, height: 14, borderRadius: 7, marginLeft: 50, marginTop: -4, backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line }} />
              <View style={{ width: 7, height: 7, borderRadius: 4, marginLeft: 62, marginTop: 1, backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line }} />
            </Pressable>
          </View>

          <Pressable onPress={nameMenu} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 }}>
            <Txt kind="head" weight="bold" size={30} numberOfLines={1} style={{ maxWidth: 280 }}>{name || (user ? 'Your name' : 'Hello, cook')}</Txt>
            <Icon name="chevron-down" size={22} />
          </Pressable>
          {user ? (
            <Txt muted size={14}>{user.email}</Txt>
          ) : (
            <Pressable onPress={() => router.push('/sign-in')} accessibilityRole="button"
              style={({ pressed }) => ({ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, height: 44, borderRadius: 22, backgroundColor: th.c.accent, opacity: pressed ? 0.8 : 1 })}>
              <Icon name="log-in-outline" size={18} color={th.c.onAccent} />
              <Txt weight="black" color={th.c.onAccent}>Sign in or create account</Txt>
            </Pressable>
          )}
        </View>

        <View style={{ paddingHorizontal: 16, gap: 16 }}>
          <View style={{ gap: 8 }}>
            <View style={{ marginLeft: 4 }}><Label color={th.c.muted}>Your kitchen</Label></View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Tile icon="book" value={recipes.length} label="Recipes" sub="saved" onPress={() => router.navigate('/')} />
              <Tile icon="restaurant" value={cooked} label="Cooked" sub={`${cookedThisMonth} this month`} onPress={() => router.push('/journal')} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Tile icon="flame" value={streak} label="Week streak" sub={streak ? 'keep it going' : 'cook this week'} onPress={() => router.push('/journal')} />
              <Tile icon="timer" value={timersStarted} label="Timers" sub="started" onPress={() => router.navigate('/timers')} />
            </View>
          </View>

          <Section title="Plan">
            <Row icon="sparkles" title="Upgrade to Mise Plus" onPress={() => router.push('/plus')} last />
          </Section>

          <Section title="Account">
            <Row icon="person-outline" title="Profile" onPress={() => router.push('/profile')} />
            <Row icon="notifications-outline" title="Notifications" onPress={() => router.push('/notifications')} />
            <Row icon="cloud-outline" title="Sync across devices" badge="SOON" onPress={() => Alert.alert('Coming soon', 'Soon your recipes, plans and journal will follow you to all your devices when you’re signed in.')} last />
          </Section>

          <Section title={AI_NAME}>
            <Row icon="chatbubble-outline" title={`${AI_NAME} settings`} onPress={() => router.push('/sous-settings')} />
            <Row icon="mic-outline" title="Voice" value={voiceLabel(settings.aiVoice)} onPress={() => router.push('/voice-settings')} />
            <Row icon="stats-chart-outline" title="Usage" onPress={() => router.push('/usage')} />
            <Row icon="document-text-outline" title="Mise Prompt" onPress={() => router.push('/recipe-prompt')} last />
          </Section>

          <Section title="App">
            <Row icon="color-palette-outline" title="Appearance" value={appearanceSummary} onPress={() => router.push('/appearance')} />
            <Row icon="settings-outline" title="Settings" onPress={() => router.push('/settings')} last />
          </Section>

          <Section title="Help & legal">
            <Row icon="help-circle-outline" title="Help center" onPress={() => router.push('/help')} />
            <Row icon="bug-outline" title="Report an issue" onPress={() => router.push('/feedback?mode=issue')} />
            <Row icon="chatbox-ellipses-outline" title="Send feedback" onPress={() => router.push('/feedback')} />
            <Row icon="shield-checkmark-outline" title="Terms & privacy" onPress={() => router.push('/legal')} />
            <Row icon="information-circle-outline" title="About Mise" value={`v${Constants.expoConfig?.version ?? '1.0.0'}`} onPress={() => router.push('/about')} last />
          </Section>

          {/* Remove before launch. */}
          <Section title="Developer">
            <Row icon="construct-outline" title="Developer tools" onPress={() => router.push('/developer')} last />
          </Section>

          {user ? (
            <Card style={{ paddingHorizontal: 6 }}>
              <Row icon="log-out-outline" title="Sign out" danger last onPress={confirmSignOut} />
            </Card>
          ) : null}
        </View>
      </ScrollView>

      <Modal visible={picking} transparent animationType="fade" onRequestClose={() => setPicking(false)}>
        <Pressable onPress={() => setPicking(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 24 }}>
          <Pressable onPress={() => {}} style={{ padding: 18, gap: 14, borderRadius: 24, backgroundColor: th.c.surface }}>
            <Txt weight="black" size={18} style={{ textAlign: 'center' }}>What’s cooking?</Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
              {STATUSES.map(s => (
                <Pressable key={s} onPress={() => chooseStatus(s)} accessibilityLabel={`Set status ${s}`}
                  style={{ width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: settings.status === s ? th.c.accentSoft : th.c.soft }}>
                  <Txt size={28}>{s}</Txt>
                </Pressable>
              ))}
            </View>
            {settings.status ? (
              <Pressable onPress={() => chooseStatus('')} style={{ alignSelf: 'center', padding: 6 }}>
                <Txt weight="bold" color={th.c.temp}>Clear status</Txt>
              </Pressable>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

function HeaderButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const th = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityLabel={label}
      style={({ pressed }) => ({ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: th.c.line, backgroundColor: pressed ? th.c.soft : th.c.surface })}>
      <Icon name={icon} size={22} />
    </Pressable>
  );
}

function Tile({ icon, value, label, sub, onPress }: { icon: IconName; value: number; label: string; sub: string; onPress: () => void }) {
  const th = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${value} ${label}, ${sub}`} style={({ pressed }) => ({ flex: 1, transform: [{ scale: pressed ? 0.97 : 1 }] })}>
      <Card style={{ padding: 14, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accentSoft }}>
            <Icon name={icon} size={20} color={th.c.accent} />
          </View>
          <Icon name="chevron-forward" size={16} color={th.c.muted} />
        </View>
        <View>
          <Txt kind="head" weight="bold" size={28} style={{ lineHeight: 34 }}>{value}</Txt>
          <Txt weight="black" size={14}>{label}</Txt>
          <Txt muted size={12}>{sub}</Txt>
        </View>
      </Card>
    </Pressable>
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
