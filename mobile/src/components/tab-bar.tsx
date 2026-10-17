// Bottom navigation: Recipes · Sous (AI chat) · Add · Timers · Account, as a floating rounded bar
// (frosted glass) that floats over the page, so whatever scrolls behind it shows through blurred. A soft highlight slides between the tabs,
// following your finger while you swipe between pages (like Instagram).
import * as Haptics from 'expo-haptics';
import { BottomTabBarHeightCallbackContext, type BottomTabBarProps } from 'expo-router/js-tabs';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Animated, Keyboard, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AI_NAME } from '../lib/chat-store';
import { useApp, useTimers } from '../lib/store';
import { useTheme } from '../lib/theme';
import { Glass } from './glass';
import { ChatSparkIcon, RecipeBookIcon } from './icons';
import { Icon, Txt } from './ui';

// Where the row of pages is (0 = first tab, fractions mid-swipe), shared by the tabs layout.
export const TabPosition = createContext<Animated.Value | null>(null);

const PAD = 6;
const PILL = 56;

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const th = useTheme();
  const insets = useSafeAreaInsets();
  const { settings } = useApp();
  const { timers } = useTimers();
  const pos = useContext(TabPosition);
  const [rowWidth, setRowWidth] = useState(0);
  // Pages read this to leave room at the bottom for the floating bar.
  const reportHeight = useContext(BottomTabBarHeightCallbackContext);
  // Android moves the bar up with the keyboard; hide it while typing there.
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const show = Keyboard.addListener('keyboardDidShow', () => setTyping(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setTyping(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  const tabWidth = rowWidth ? (rowWidth - PAD * 2) / state.routes.length : 0;
  // Developer setting: tabs that show only their icon.
  const noLabel = new Set(settings.navHideLabels.split(',').filter(Boolean));

  const TABS: Record<string, { label: string; icon: (on: boolean, color: string) => ReactNode }> = {
    index: { label: 'Recipes', icon: (on, color) => <RecipeBookIcon open={on} color={color} /> },
    chat: { label: AI_NAME, icon: (on, color) => <ChatSparkIcon active={on} color={color} /> },
    add: { label: 'Add', icon: (on, color) => <Icon name={on ? 'add-circle' : 'add-circle-outline'} size={24} color={color} /> },
    timers: { label: 'Timers', icon: (on, color) => <Icon name={on ? 'timer' : 'timer-outline'} size={22} color={color} /> },
    account: { label: 'Account', icon: (on, color) => <Icon name={on ? 'person-circle' : 'person-circle-outline'} size={22} color={color} /> },
  };

  // Count of timers; red when one is ringing; a pause sign when every timer is paused.
  const renderTimerBadge = () => {
    if (!timers.length) return null;
    const ringing = timers.some(t => t.done);
    const allPaused = !ringing && timers.every(t => t.pausedLeft != null);
    return (
      <View
        style={{ position: 'absolute', top: -4, right: 5, minWidth: 19, height: 19, paddingHorizontal: 4, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: ringing ? th.c.temp : allPaused ? th.c.muted : th.c.accent, borderWidth: 2, borderColor: th.c.surface }}
        accessibilityLabel={allPaused ? 'Timers paused' : `${timers.length} timers`}
      >
        {allPaused ? <Icon name="pause" size={10} color={th.c.surface} /> : <Txt weight="black" size={10} color={th.c.onAccent} style={{ lineHeight: 12 }}>{timers.length}</Txt>}
      </View>
    );
  };

  return (
    <View pointerEvents="box-none" onLayout={e => reportHeight?.(e.nativeEvent.layout.height)}
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14, paddingTop: 6, paddingBottom: Math.max(insets.bottom - 6, 10), display: typing ? 'none' : 'flex' }}>
    {/* The shadow lives on a wrapper: the glass clips its own edges. */}
    <View style={{ borderRadius: 34, shadowColor: '#000', shadowOpacity: th.dark ? 0.35 : 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 10 }}>
    <Glass tint={th.dark ? 0.25 : 0.2} strength={70} style={{ flexDirection: 'row', alignItems: 'center', height: 68, paddingHorizontal: PAD, borderRadius: 34 }}>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} onLayout={e => setRowWidth(e.nativeEvent.layout.width)} pointerEvents="none">
        {tabWidth && pos ? (
          <Animated.View style={{
            position: 'absolute', top: noLabel.has(state.routes[state.index]?.name) ? 18 : 9, width: PILL, height: 32, borderRadius: 16, backgroundColor: th.c.accentSoft,
            left: PAD + (tabWidth - PILL) / 2,
            transform: [{ translateX: Animated.multiply(pos, tabWidth) }],
          }} />
        ) : null}
      </View>
      {state.routes.map((route, i) => {
        const focused = state.index === i;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            if (settings.haptics) Haptics.selectionAsync().catch(() => {});
            navigation.navigate(route.name, route.params);
          }
        };


        const tab = TABS[route.name];
        if (!tab) return null;
        const color = focused ? th.c.accent : th.c.muted;
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            style={({ pressed }) => ({ flex: 1, alignItems: 'center', gap: 3, transform: [{ scale: pressed ? 0.94 : 1 }] })}
          >
            <View style={[{ width: PILL, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, focused && !pos && { backgroundColor: th.c.accentSoft }]}>
              {tab.icon(focused, color)}
              {route.name === 'timers' && renderTimerBadge()}
            </View>
            {noLabel.has(route.name) ? null : <Txt weight={focused ? 'black' : 'bold'} size={12} color={color}>{tab.label}</Txt>}
          </Pressable>
        );
      })}
    </Glass>
    </View>
    </View>
  );
}
