// Bottom navigation bar, styled with the app's theme.
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp, useTimers } from '../lib/store';
import { useTheme } from '../lib/theme';
import { Icon, Txt, type IconName } from './ui';

const TABS: Record<string, { label: string; icon: IconName; iconActive: IconName }> = {
  index: { label: 'Recipes', icon: 'book-outline', iconActive: 'book' },
  add: { label: 'Add', icon: 'add', iconActive: 'add' },
  timers: { label: 'Timers', icon: 'timer-outline', iconActive: 'timer' },
  settings: { label: 'Look', icon: 'color-palette-outline', iconActive: 'color-palette' },
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const th = useTheme();
  const insets = useSafeAreaInsets();
  const { settings } = useApp();
  const { timers } = useTimers();
  const activeTimers = timers.length;
  const ringing = timers.some(t => t.done);

  return (
    <View style={{ flexDirection: 'row', paddingTop: 8, paddingBottom: Math.max(insets.bottom, 10), paddingHorizontal: 8, backgroundColor: th.c.surface, borderTopWidth: 1, borderTopColor: th.c.line }}>
      {state.routes.map((route, i) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === i;
        const isAdd = route.name === 'add';
        const color = focused ? th.c.accent : th.c.muted;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            if (settings.haptics) Haptics.selectionAsync().catch(() => {});
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            style={({ pressed }) => ({ flex: 1, alignItems: 'center', gap: 3, transform: [{ scale: pressed ? 0.94 : 1 }] })}
          >
            <View
              style={[
                { width: 58, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
                isAdd ? { backgroundColor: th.c.accent } : focused && { backgroundColor: th.c.accentSoft },
              ]}
            >
              <Icon name={focused ? tab.iconActive : tab.icon} size={isAdd ? 26 : 22} color={isAdd ? th.c.onAccent : color} />
              {route.name === 'timers' && activeTimers > 0 && (
                <View style={{ position: 'absolute', top: -3, right: 6, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: ringing ? th.c.temp : th.c.accent, borderWidth: 2, borderColor: th.c.surface }}>
                  <Txt weight="black" size={10} color={th.c.onAccent} style={{ lineHeight: 12 }}>{activeTimers}</Txt>
                </View>
              )}
            </View>
            <Txt weight={focused ? 'black' : 'bold'} size={12} color={isAdd && !focused ? th.c.text : color}>{tab.label}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
