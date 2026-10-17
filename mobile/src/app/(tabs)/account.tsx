// Account tab: a profile header (photo, a floating emoji status, your name with the account sheet),
// your kitchen history, then Plan, Account, Sous (the AI), App, Help & legal, Developer, and Sign out.
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useBottomTabBarHeight } from 'expo-router/js-tabs';
import { useEffect, useState } from 'react';
import { Animated, Easing, Image, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Row } from '../../components/settings-ui';
import { useSheet } from '../../components/sheet';
import { Card, Icon, Label, Screen, Txt, type IconName } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { AI_NAME } from '../../lib/chat-store';
import { useCookLog, weekStreak } from '../../lib/cook-log';
import { useIslandSpace } from '../../lib/island';
import { useApp, useTimers } from '../../lib/store';
import { FONTS, THEMES, useTheme } from '../../lib/theme';
import { voiceLabel } from '../../lib/voices';

const STATUSES = ['🍞', '🍝', '🥗', '🍰', '🍳', '🍜', '🌮', '🍕', '🥘', '🧁', '🔥', '👩‍🍳', '🧑‍🍳', '😋', '🛒', '💪', '🥐', '🍲'];
const AVATAR = 132;

export default function AccountTab() {
  const th = useTheme();
  const insets = useSafeAreaInsets();
  const island = useIslandSpace();
  const tabBarH = useBottomTabBarHeight();
  const sheet = useSheet();
  const { settings, updateSettings, recipes } = useApp();
  const { user, signOut } = useAuth();
  const { timersStarted } = useTimers();
  const cooks = useCookLog().entries;
  const [now] = useState(() => Date.now());

  const name = settings.name.trim() || user?.name || '';
  const initial = name.charAt(0).toUpperCase();
  const cooked = Math.max(cooks.length, recipes.reduce((n, r) => n + (r.cookCount || 0), 0));
  const monthStart = new Date(new Date(now).getFullYear(), new Date(now).getMonth(), 1).getTime();
  const cookedThisMonth = cooks.filter(c => c.at >= monthStart).length;
  const streak = weekStreak(cooks, now);
  const appearanceSummary = [THEMES[settings.theme as keyof typeof THEMES]?.name, FONTS[settings.font as keyof typeof FONTS]?.name].filter(Boolean).join(' · ');
  const tick = () => { if (settings.haptics) Haptics.selectionAsync().catch(() => {}); };

  const avatar = (size: number) => (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accentSoft }}>
      {settings.avatar ? <Image source={{ uri: settings.avatar }} style={{ width: size, height: size }} />
        : initial ? <Txt kind="head" weight="bold" size={size * 0.42} color={th.c.accent}>{initial}</Txt>
        : <Icon name="person" size={size * 0.46} color={th.c.accent} />}
    </View>
  );

  const confirmSignOut = async () => {
    if (await sheet.confirm({ title: 'Sign out?', message: 'Your recipes, plans and journal stay on this phone.', confirm: 'Sign out', destructive: true, icon: 'log-out-outline' })) signOut();
  };

  // Like WhatsApp's account switcher: who you're signed in as, add another account, then actions.
  const accountSheet = () => {
    if (!user) return router.push('/sign-in');
    tick();
    sheet.open({
      content: close => (
        <View style={{ gap: 14 }}>
          <Txt muted size={15} style={{ paddingHorizontal: 4 }}>Add another account to switch between them easily.</Txt>
          <View style={{ borderRadius: 20, overflow: 'hidden', backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 }}>
              {avatar(52)}
              <View style={{ flex: 1 }}>
                <Txt weight="black" size={17} numberOfLines={1}>{name || 'You'}</Txt>
                <Txt muted size={14} numberOfLines={1}>{user.email}</Txt>
              </View>
              <Icon name="checkmark-circle" size={28} color={th.c.accent} />
            </View>
            <Pressable onPress={() => { close(); setTimeout(() => router.push({ pathname: '/sign-in', params: { switch: '1' } }), 260); }}
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderTopWidth: 1, borderTopColor: th.c.line, backgroundColor: pressed ? th.c.soft : 'transparent' })}>
              <View style={{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.soft }}>
                <Icon name="add" size={26} />
              </View>
              <Txt weight="bold" size={16}>Add another account</Txt>
            </Pressable>
          </View>
          <View style={{ borderRadius: 20, overflow: 'hidden', backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line }}>
            {([['person-outline', 'Edit profile', () => router.push('/profile'), false], ['log-out-outline', 'Sign out', confirmSignOut, true]] as const).map(([icon, label, run, danger], i) => (
              <Pressable key={label} onPress={() => { close(); setTimeout(run, 260); }}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, height: 56, borderTopWidth: i ? 1 : 0, borderTopColor: th.c.line, backgroundColor: pressed ? th.c.soft : 'transparent' })}>
                <Icon name={icon} size={22} color={danger ? th.c.temp : th.c.text} />
                <Txt weight="bold" size={16} color={danger ? th.c.temp : th.c.text}>{label}</Txt>
              </Pressable>
            ))}
          </View>
        </View>
      ),
    });
  };

  const statusSheet = () => {
    tick();
    sheet.open({
      title: 'What’s cooking?',
      message: 'Pick an emoji to show above your picture.',
      content: close => (
        <View style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
            {STATUSES.map(s => {
              const on = settings.status === s;
              return (
                <Pressable key={s} onPress={() => { tick(); updateSettings({ status: s }); close(); }} accessibilityLabel={`Set status ${s}`}
                  style={({ pressed }) => ({ width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? th.c.accentSoft : th.c.surface, borderWidth: on ? 2 : 1, borderColor: on ? th.c.accent : th.c.line, transform: [{ scale: pressed ? 0.9 : 1 }] })}>
                  <Txt size={28}>{s}</Txt>
                </Pressable>
              );
            })}
          </View>
          {settings.status ? (
            <Pressable onPress={() => { updateSettings({ status: '' }); close(); }} style={({ pressed }) => ({ height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? th.c.line : th.c.soft })}>
              <Txt weight="black" color={th.c.temp}>Clear status</Txt>
            </Pressable>
          ) : null}
        </View>
      ),
    });
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: tabBarH + 24, gap: 16 }} keyboardShouldPersistTaps="handled">
        {/* Profile header */}
        <View style={{ paddingHorizontal: 16, paddingTop: insets.top + island + 8, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
            <HeaderButton icon="settings-outline" label="Settings" onPress={() => router.push('/settings')} />
            <View style={{ flexDirection: 'row', height: 52, borderRadius: 26, borderWidth: 1, borderColor: th.c.line, backgroundColor: th.c.surface, overflow: 'hidden' }}>
              <Pressable onPress={() => router.push('/share')} accessibilityLabel="Share with a QR code" style={({ pressed }) => ({ width: 60, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? th.c.soft : 'transparent' })}>
                <Icon name="qr-code-outline" size={23} />
              </Pressable>
              <Pressable onPress={() => router.push('/profile')} accessibilityLabel="Edit profile" style={({ pressed }) => ({ width: 60, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? th.c.soft : 'transparent' })}>
                <Icon name="pencil-outline" size={23} />
              </Pressable>
            </View>
          </View>

          <View style={{ marginTop: 44, alignItems: 'center' }}>
            <Pressable onPress={() => router.push('/profile')} accessibilityLabel="Profile picture" style={{ borderRadius: AVATAR / 2, borderWidth: 1, borderColor: th.c.line }}>
              {avatar(AVATAR)}
            </Pressable>
            <StatusBubble status={settings.status} onPress={statusSheet} />
          </View>

          <Pressable onPress={accountSheet} accessibilityRole="button" accessibilityLabel={user ? 'Your account' : 'Sign in'} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 }}>
            <Txt kind="head" weight="bold" size={30} numberOfLines={1} style={{ maxWidth: 280 }}>{name || 'Your name'}</Txt>
            <Icon name="chevron-down" size={22} />
          </Pressable>
          {user ? <Txt muted size={14}>{user.email}</Txt> : null}
        </View>

        <View style={{ paddingHorizontal: 16, gap: 16 }}>
          <Section title="Your kitchen">
            <Row icon="book-outline" title="Recipes" value={`${recipes.length} saved`} onPress={() => router.push('/activity/recipes')} />
            <Row icon="restaurant-outline" title="Cooked" value={cookedThisMonth ? `${cooked} · ${cookedThisMonth} this month` : String(cooked)} onPress={() => router.push('/activity/cooked')} />
            <Row icon="flame-outline" title="Cooking streak" value={streak ? `${streak} ${streak === 1 ? 'week' : 'weeks'} 🔥` : 'Start one'} onPress={() => router.push('/streak')} />
            <Row icon="timer-outline" title="Timers" value={`${timersStarted} started`} onPress={() => router.push('/activity/timers')} last />
          </Section>

          <Section title="Plan">
            <Row icon="sparkles" title="Upgrade to Mise Plus" onPress={() => router.push('/plus')} last />
          </Section>

          <Section title="Account">
            <Row icon="person-outline" title="Profile" onPress={() => router.push('/profile')} />
            <Row icon="notifications-outline" title="Notifications" onPress={() => router.push('/notifications')} />
            <Row icon="cloud-outline" title="Sync across devices" badge="SOON" onPress={() => sheet.open({ title: 'Coming soon', message: 'Soon your recipes, plans and journal will follow you to all your devices when you’re signed in.', cancel: 'OK' })} last />
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
    </Screen>
  );
}

// The status above your picture: a soft thought bubble that floats gently and pops when it changes.
function StatusBubble({ status, onPress }: { status: string; onPress: () => void }) {
  const th = useTheme();
  const [float] = useState(() => new Animated.Value(0));
  const [pop] = useState(() => new Animated.Value(1));
  const [shown, setShown] = useState(status);
  if (shown !== status) setShown(status);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(float, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [float]);

  useEffect(() => {
    pop.setValue(0.7);
    Animated.spring(pop, { toValue: 1, friction: 4, tension: 160, useNativeDriver: true }).start();
  }, [shown, pop]);

  const y = float.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
  const bubble = { backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line, shadowColor: '#000', shadowOpacity: th.dark ? 0.35 : 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 };

  return (
    <Animated.View style={{ position: 'absolute', top: -38, left: -46, transform: [{ translateY: y }] }}>
      <Pressable onPress={onPress} accessibilityLabel={status ? `Status ${status}, change it` : 'Add a status emoji'} hitSlop={6}>
        <Animated.View style={[{ minWidth: 64, height: 46, paddingHorizontal: status ? 14 : 16, borderRadius: 23, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, transform: [{ scale: pop }] }, bubble]}>
          {status ? <Txt size={24} style={{ lineHeight: 30 }}>{status}</Txt> : (
            <>
              <Icon name="happy-outline" size={18} color={th.c.muted} />
              <Txt weight="bold" size={14} muted>What’s cooking?</Txt>
            </>
          )}
        </Animated.View>
        <View style={[{ width: 15, height: 15, borderRadius: 8, marginLeft: 54, marginTop: 3 }, bubble]} />
        <View style={[{ width: 8, height: 8, borderRadius: 4, marginLeft: 70, marginTop: 2 }, bubble]} />
      </Pressable>
    </Animated.View>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const th = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <View style={{ marginLeft: 4 }}><Label color={th.c.muted}>{title}</Label></View>
      <Card style={{ paddingHorizontal: 6 }}>{children}</Card>
    </View>
  );
}
