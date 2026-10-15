// Bottom navigation: Recipes · Sous (AI chat) · Add · Timers · Account, as a floating rounded bar
// (frosted glass) that sits a little above the bottom edge.
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AI_NAME } from '../lib/chat-store';
import { useApp, useTimers } from '../lib/store';
import { useTheme } from '../lib/theme';
import { Glass } from './glass';
import { ChatSparkIcon, RecipeBookIcon } from './icons';
import { Icon, Txt } from './ui';

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const th = useTheme();
  const insets = useSafeAreaInsets();
  const { settings } = useApp();
  const { timers } = useTimers();

  const TABS: Record<string, { label: string; icon: (on: boolean, color: string) => ReactNode }> = {
    index: { label: 'Recipes', icon: (on, color) => <RecipeBookIcon open={on} color={color} /> },
    chat: { label: AI_NAME, icon: (on, color) => <ChatSparkIcon active={on} color={color} /> },
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
    <View style={{ paddingHorizontal: 14, paddingTop: 6, paddingBottom: Math.max(insets.bottom - 6, 10), backgroundColor: th.c.bg }}>
    {/* The shadow lives on a wrapper: the glass clips its own edges. */}
    <View style={{ borderRadius: 34, shadowColor: '#000', shadowOpacity: th.dark ? 0.4 : 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 10 }}>
    <Glass tint={th.dark ? 0.7 : 0.85} strength={50} style={{ flexDirection: 'row', alignItems: 'center', height: 68, paddingHorizontal: 6, borderRadius: 34 }}>
      {state.routes.map((route, i) => {
        const focused = state.index === i;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            if (settings.haptics) Haptics.selectionAsync().catch(() => {});
            navigation.navigate(route.name, route.params);
          }
        };

        if (route.name === 'add') {
          return (
            <View key={route.key} style={{ width: 68, alignItems: 'center' }}>
              <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel="Add recipe" style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.92 : 1 }] })}>
                <View style={{ width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accent, borderWidth: 3, borderColor: th.c.surface, ...(th.dark ? {} : { shadowColor: th.c.accent, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 }) }}>
                  <Icon name="add" size={30} color={th.c.onAccent} />
                </View>
              </Pressable>
            </View>
          );
        }

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
            <View style={[{ width: 54, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, focused && { backgroundColor: th.c.accentSoft }]}>
              {tab.icon(focused, color)}
              {route.name === 'timers' && renderTimerBadge()}
            </View>
            <Txt weight={focused ? 'black' : 'bold'} size={12} color={color}>{tab.label}</Txt>
          </Pressable>
        );
      })}
    </Glass>
    </View>
    </View>
  );
}
