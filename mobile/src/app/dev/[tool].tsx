// One developer tool per page (from Developer): Account layout, Navigation bar, Test data, Storage.
// Remove before launch, with developer.tsx.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { DevSettings, LayoutAnimation, Pressable, ScrollView, Switch, View } from 'react-native';
import { showAlert } from '../../components/sheet';
import { Card, Icon, IconBtn, PageTitle, Screen, TopBar, Txt, type IconName } from '../../components/ui';
import { ACCOUNT_SECTIONS, accountLayout } from '../../lib/account-layout';
import { useAuth } from '../../lib/auth';
import { AI_NAME } from '../../lib/chat-store';
import { useCookLog } from '../../lib/cook-log';
import { scheduleAlarm } from '../../lib/notifications';
import { usePlanner } from '../../lib/planner';
import { useShopping } from '../../lib/shopping';
import { useApp } from '../../lib/store';
import { useTheme } from '../../lib/theme';
import { SAMPLE_RECIPE } from '../../shared/content';
import { parseRecipe } from '../../shared/parser';

const NAV_TABS: [string, string, IconName][] = [
  ['index', 'Recipes', 'book-outline'],
  ['chat', AI_NAME, 'chatbubble-outline'],
  ['add', 'Add', 'add-circle-outline'],
  ['timers', 'Timers', 'timer-outline'],
  ['account', 'Account', 'person-circle-outline'],
];
const TITLES: Record<string, string> = { features: 'Feature switches', layout: 'Account layout', navbar: 'Navigation bar', data: 'Test data', storage: 'Storage' };

export default function DevTool() {
  const { tool } = useLocalSearchParams<{ tool: string }>();
  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <PageTitle>{TITLES[tool] ?? 'Developer'}</PageTitle>
      </TopBar>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 60, gap: 16 }}>
        {tool === 'features' ? <FeaturesTool /> : tool === 'layout' ? <LayoutTool /> : tool === 'navbar' ? <NavbarTool /> : tool === 'data' ? <DataTool /> : tool === 'storage' ? <StorageTool /> : null}
      </ScrollView>
    </Screen>
  );
}

function Hint({ children }: { children: string }) {
  return <Txt muted size={13} style={{ marginHorizontal: 4 }}>{children}</Txt>;
}

function RoundBtn({ icon, label, onPress, disabled, active, small }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean; active?: boolean; small?: boolean }) {
  const th = useTheme();
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityLabel={label} hitSlop={4}
      style={({ pressed }) => ({ width: small ? 34 : 38, height: small ? 26 : 38, borderRadius: small ? 9 : 19, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? th.c.accentSoft : pressed ? th.c.line : th.c.soft, opacity: disabled ? 0.35 : 1 })}>
      <Icon name={icon} size={small ? 16 : 18} color={active ? th.c.accent : th.c.text} />
    </Pressable>
  );
}

// ---------- Feature switches ----------
function FeaturesTool() {
  const th = useTheme();
  const { settings, updateSettings } = useApp();
  const items: ['showStatus' | 'navLens' | 'showMisePrompt', string, string, IconName][] = [
    ['showStatus', 'Status bubble', 'The emoji thought bubble above your picture on Account', 'happy-outline'],
    ['navLens', 'Navbar lens', 'Hold or slide on the navigation bar to get the glass lens', 'scan-circle-outline'],
    ['showMisePrompt', 'Mise Prompt page', 'Show the editable Mise Prompt row in Account → Sous', 'document-text-outline'],
  ];
  return (
    <>
      <Hint>Switch parts of the app on or off to compare designs. Changes show right away.</Hint>
      <View style={{ gap: 10 }}>
        {items.map(([k, title, sub, icon]) => (
          <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 20, backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line }}>
            <View style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accentSoft }}>
              <Icon name={icon} size={20} color={th.c.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt weight="black" size={15}>{title}</Txt>
              <Txt muted size={12}>{sub}</Txt>
            </View>
            <Switch value={settings[k]} onValueChange={v => updateSettings({ [k]: v })} trackColor={{ true: th.c.accent, false: th.c.line }} thumbColor="#fff" accessibilityLabel={title} />
          </View>
        ))}
      </View>
    </>
  );
}

// ---------- Account layout ----------
function LayoutTool() {
  const th = useTheme();
  const { settings, updateSettings } = useApp();
  const { all, hidden } = accountLayout(settings);
  const save = (order: string[], hide: Set<string>) => {
    LayoutAnimation.configureNext(LayoutAnimation.create(220, 'easeInEaseOut', 'opacity'));
    if (settings.haptics) Haptics.selectionAsync().catch(() => {});
    updateSettings({ accountOrder: order.join(','), accountHidden: [...hide].join(',') });
  };
  const move = (i: number, d: number) => {
    const next = [...all];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    save(next, hidden);
  };
  const toggle = (k: string) => {
    const next = new Set(hidden);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    save(all, next);
  };

  return (
    <>
      <Hint>Change the order of the Account tab’s sections, or hide some. Changes show on the Account tab right away. Developer always stays at the bottom.</Hint>
      <View style={{ gap: 10 }}>
        {all.map((k, i) => {
          const meta = ACCOUNT_SECTIONS.find(s => s[0] === k)!;
          const off = hidden.has(k);
          return (
            <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 20, backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line, opacity: off ? 0.55 : 1 }}>
              <View style={{ width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accentSoft }}>
                <Icon name={meta[2]} size={20} color={th.c.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt weight="black" size={15} numberOfLines={1}>{meta[1]}</Txt>
                <Txt muted size={12}>{`Position ${i + 1} · ${off ? 'hidden' : 'shown'}`}</Txt>
              </View>
              <View style={{ gap: 4 }}>
                <RoundBtn small icon="chevron-up" label={`Move ${meta[1]} up`} onPress={() => move(i, -1)} disabled={i === 0} />
                <RoundBtn small icon="chevron-down" label={`Move ${meta[1]} down`} onPress={() => move(i, 1)} disabled={i === all.length - 1} />
              </View>
              <RoundBtn icon={off ? 'eye-off-outline' : 'eye-outline'} label={off ? `Show ${meta[1]}` : `Hide ${meta[1]}`} onPress={() => toggle(k)} active={!off} />
            </View>
          );
        })}
      </View>
      <Pressable onPress={() => save(ACCOUNT_SECTIONS.map(s => s[0]), new Set())} style={({ pressed }) => ({ height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? th.c.line : th.c.soft })}>
        <Txt weight="bold">Reset to default</Txt>
      </Pressable>
    </>
  );
}

// ---------- Navigation bar ----------
function NavbarTool() {
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
    <>
      {/* Live preview */}
      <View style={{ flexDirection: 'row', height: 68, borderRadius: 34, alignItems: 'center', paddingHorizontal: 6, backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line }}>
        {NAV_TABS.map(([key, label, icon]) => {
          const big = hidden.has(key);
          return (
            <View key={key} style={{ flex: 1, alignItems: 'center', gap: 3 }}>
              <Icon name={icon} size={big ? 28 : 22} color={th.c.muted} />
              {big ? null : <Txt weight="bold" size={11} muted>{label}</Txt>}
            </View>
          );
        })}
      </View>
      <Hint>Preview of the navigation bar.</Hint>
      <Card style={{ paddingHorizontal: 16, paddingVertical: 2 }}>
        {NAV_TABS.map(([key, label, icon], i) => (
          <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: i === NAV_TABS.length - 1 ? 0 : 1, borderBottomColor: th.c.line }}>
            <Icon name={icon} size={20} color={th.c.accent} />
            <Txt weight="bold" style={{ flex: 1 }}>{label}</Txt>
            <Switch value={!hidden.has(key)} onValueChange={() => toggle(key)} trackColor={{ true: th.c.accent, false: th.c.line }} thumbColor="#fff" accessibilityLabel={`Show the ${label} text`} />
          </View>
        ))}
      </Card>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {([['Show all text', () => set(new Set())], ['Icons only', () => set(new Set(NAV_TABS.map(t => t[0])))]] as const).map(([label, fn]) => (
          <Pressable key={label} onPress={fn} style={({ pressed }) => ({ flex: 1, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? th.c.line : th.c.soft })}>
            <Txt weight="bold">{label}</Txt>
          </Pressable>
        ))}
      </View>
    </>
  );
}

// ---------- Test data ----------
function DataTool() {
  const th = useTheme();
  const { recipes, saveParsed, settings } = useApp();
  const { log, clearAll: clearCooks, entries } = useCookLog();
  const { clearWeek, entries: plan } = usePlanner();
  const { clearAll: clearList, items } = useShopping();

  const done = (msg: string) => {
    if (settings.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showAlert('Done', msg);
  };
  const confirm = (title: string, run: () => void) => showAlert(title, 'This can’t be undone.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Clear', style: 'destructive', onPress: run }]);

  const actions: [IconName, string, string, () => void, boolean?][] = [
    ['book-outline', 'Add the sample bread recipe', 'Saves the built-in Easy Crusty Bread', () => {
      const parsed = parseRecipe(SAMPLE_RECIPE);
      if (parsed) { saveParsed(parsed, SAMPLE_RECIPE); done('The sample recipe was added to your recipes.'); }
    }],
    ['flame-outline', 'Add 6 weeks of cooks', 'Fills the journal so the streak shows 6 weeks', () => {
      const r = recipes[0];
      if (!r) return showAlert('Add a recipe first', 'Cooks need a recipe to belong to.');
      for (let w = 0; w < 6; w++) log(r.id, r.title, Date.now() - w * 7 * 864e5 - 3600_000);
      done('Added 6 cooks, one per week.');
    }],
    ['notifications-outline', 'Test notification in 5 seconds', 'Lock the phone to see it', () => {
      scheduleAlarm('Test timer', 'Mise', 5000).then(id => showAlert(id ? 'Scheduled' : 'Couldn’t schedule', id ? 'Lock your phone, it rings in 5 seconds.' : 'Allow notifications for Mise first.'));
    }],
    ['trash-outline', `Clear cooking journal (${entries.length})`, 'Removes every cook, photo and note', () => confirm('Clear the cooking journal?', () => { clearCooks(); done('Journal cleared.'); }), true],
    ['trash-outline', `Clear meal plan (${plan.length})`, 'Removes every planned meal', () => confirm('Clear the meal plan?', () => { clearWeek([...new Set(plan.map(p => p.date))]); done('Meal plan cleared.'); }), true],
    ['trash-outline', `Clear shopping list (${items.length})`, 'Removes every item', () => confirm('Clear the shopping list?', () => { clearList(); done('Shopping list cleared.'); }), true],
  ];

  return (
    <>
      <Hint>Quick ways to fill the app with test data, or empty it again.</Hint>
      <View style={{ gap: 10 }}>
        {actions.map(([icon, title, sub, run, danger]) => (
          <Pressable key={title} onPress={run} accessibilityRole="button"
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 20, backgroundColor: pressed ? th.c.soft : th.c.surface, borderWidth: 1, borderColor: th.c.line })}>
            <View style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: danger ? th.c.soft : th.c.accentSoft }}>
              <Icon name={icon} size={20} color={danger ? th.c.temp : th.c.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt weight="black" size={15} color={danger ? th.c.temp : th.c.text}>{title}</Txt>
              <Txt muted size={12}>{sub}</Txt>
            </View>
          </Pressable>
        ))}
      </View>
    </>
  );
}

// ---------- Storage ----------
function StorageTool() {
  const th = useTheme();
  const { signOut } = useAuth();
  const [rows, setRows] = useState<{ key: string; size: number; preview: string }[] | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getAllKeys()
      .then(keys => AsyncStorage.multiGet([...keys].sort()))
      .then(pairs => { if (alive) setRows(pairs.map(([key, v]) => ({ key, size: (v ?? '').length, preview: (v ?? '').slice(0, 400) }))); })
      .catch(() => alive && setRows([]));
    return () => { alive = false; };
  }, [tick]);

  const total = rows?.reduce((n, r) => n + r.size, 0) ?? 0;
  const kb = (n: number) => (n > 1024 ? `${(n / 1024).toFixed(1)} KB` : `${n} B`);

  const eraseAll = () => showAlert('Erase everything?', 'Every recipe, plan, chat, setting and demo account on this phone is deleted, and you’re signed out. The app restarts.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Erase everything', style: 'destructive', onPress: async () => {
      await signOut().catch(() => {});
      await AsyncStorage.clear().catch(() => {});
      if (__DEV__) DevSettings.reload();
      else setTick(t => t + 1);
    } },
  ]);

  return (
    <>
      <Card style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Icon name="server-outline" size={24} color={th.c.accent} />
        <View style={{ flex: 1 }}>
          <Txt weight="black" size={16}>{rows ? `${rows.length} saved items` : 'Reading…'}</Txt>
          <Txt muted size={13}>{kb(total)} on this phone (photos not counted)</Txt>
        </View>
        <RoundBtn icon="refresh" label="Refresh" onPress={() => setTick(t => t + 1)} />
      </Card>
      <View style={{ gap: 8 }}>
        {rows?.map(r => (
          <Pressable key={r.key} onPress={() => showAlert(r.key, r.preview + (r.size > 400 ? '…' : ''))}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, backgroundColor: pressed ? th.c.soft : th.c.surface, borderWidth: 1, borderColor: th.c.line })}>
            <Icon name="document-text-outline" size={18} color={th.c.muted} />
            <Txt weight="bold" size={14} style={{ flex: 1 }} numberOfLines={1}>{r.key}</Txt>
            <Txt muted size={12}>{kb(r.size)}</Txt>
          </Pressable>
        ))}
      </View>
      <Hint>Tap an item to peek at what’s saved. Passwords are never shown (demo accounts keep only a scrambled hash).</Hint>
      <Pressable onPress={eraseAll} style={({ pressed }) => ({ flexDirection: 'row', gap: 8, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? th.c.line : th.c.soft, marginTop: 6 })}>
        <Icon name="warning-outline" size={18} color={th.c.temp} />
        <Txt weight="black" color={th.c.temp}>Erase everything</Txt>
      </Pressable>
    </>
  );
}
