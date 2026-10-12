// Bottom navigation bar, styled with the app's theme.
// The Add button starts as a wide "+ Add recipe" pill and shrinks to a "+" after a moment.
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp, useTimers } from '../lib/store';
import { useTheme } from '../lib/theme';
import { Icon, Txt, type IconName } from './ui';

const TABS: Record<string, { label: string; icon: IconName; iconActive: IconName }> = {
  index: { label: 'Recipes', icon: 'book-outline', iconActive: 'book' },
  add: { label: 'Add recipe', icon: 'add', iconActive: 'add' },
  timers: { label: 'Timers', icon: 'timer-outline', iconActive: 'timer' },
  account: { label: 'Account', icon: 'person-circle-outline', iconActive: 'person-circle' },
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const th = useTheme();
  const insets = useSafeAreaInsets();
  const { settings } = useApp();
  const { timers } = useTimers();

  // 1 = wide "+ Add recipe" pill, 0 = round "+" button.
  const [expand] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const t = setTimeout(() => Animated.spring(expand, { toValue: 0, friction: 9, tension: 50, useNativeDriver: false }).start(), 2600);
    return () => clearTimeout(t);
  }, [expand]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingBottom: Math.max(insets.bottom, 10), paddingHorizontal: 8, backgroundColor: th.c.surface, borderTopWidth: 1, borderTopColor: th.c.line }}>
      {state.routes.map((route, i) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === i;
        const color = focused ? th.c.accent : th.c.muted;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            if (settings.haptics) Haptics.selectionAsync().catch(() => {});
            navigation.navigate(route.name, route.params);
          }
        };

        if (route.name === 'add') {
          return (
            <Animated.View key={route.key} style={{ width: expand.interpolate({ inputRange: [0, 1], outputRange: [76, 148] }), alignItems: 'center' }}>
              <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel="Add recipe" style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.94 : 1 }] })}>
                <Animated.View
                  style={{
                    height: 46,
                    width: expand.interpolate({ inputRange: [0, 1], outputRange: [46, 136] }),
                    borderRadius: 23,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    overflow: 'hidden',
                    backgroundColor: th.c.accent,
                    ...(th.dark ? {} : { shadowColor: th.c.accent, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 }),
                  }}
                >
                  <Icon name="add" size={28} color={th.c.onAccent} />
                  <Animated.View style={{ opacity: expand.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, 0, 1] }), maxWidth: expand.interpolate({ inputRange: [0, 1], outputRange: [0, 100] }) }}>
                    <Txt weight="black" size={15} color={th.c.onAccent} numberOfLines={1}>Add recipe</Txt>
                  </Animated.View>
                </Animated.View>
              </Pressable>
            </Animated.View>
          );
        }

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            style={({ pressed }) => ({ flex: 1, alignItems: 'center', gap: 3, transform: [{ scale: pressed ? 0.94 : 1 }] })}
          >
            <View style={[{ width: 58, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, focused && { backgroundColor: th.c.accentSoft }]}>
              <Icon name={focused ? tab.iconActive : tab.icon} size={22} color={color} />
              {route.name === 'timers' && renderTimerBadge()}
            </View>
            <Txt weight={focused ? 'black' : 'bold'} size={12} color={color}>{tab.label}</Txt>
          </Pressable>
        );
      })}
    </View>
  );

  // Count of timers; red when one is ringing; a pause sign when every timer is paused.
  function renderTimerBadge() {
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
  }
}
