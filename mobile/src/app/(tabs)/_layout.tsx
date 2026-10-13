import { router, usePathname } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useEffect, useState } from 'react';
import { Animated, PanResponder, View, useWindowDimensions } from 'react-native';
import { ChatDrawerShell } from '../../components/chat/chat-drawer';
import { TabBar } from '../../components/tab-bar';
import { useTheme } from '../../lib/theme';

// Tab order, left to right (matches the tab bar).
const PAGES = ['/', '/chat', '/add', '/timers', '/account'] as const;
const NAMES = ['index', 'chat', 'add', 'timers', 'account'];
const settle = (v: Animated.Value, toValue: number) => Animated.spring(v, { toValue, speed: 16, bounciness: 0, useNativeDriver: true });

export default function TabsLayout() {
  const th = useTheme();
  const { width } = useWindowDimensions();
  const path = usePathname();
  const idx = PAGES.indexOf(path as (typeof PAGES)[number]);

  // Where the row of pages is: 0 = Recipes on screen, 1 = Sous, … (fractions while swiping).
  // Every tab stays rendered side by side, so swiping drags the next page in with the current one,
  // like Instagram's pager.
  const [pos] = useState(() => new Animated.Value(Math.max(0, idx)));
  // A tab changed (from a swipe or a tap): glide there. Jumps of more than one tab happen instantly.
  // While another screen is open on top (a recipe, settings…), keep the last tab.
  const [prev, setPrev] = useState(Math.max(0, idx));
  const at = idx >= 0 ? idx : prev;
  const [jump, setJump] = useState(false);
  if (prev !== at) { setPrev(at); setJump(Math.abs(at - prev) > 1); }
  useEffect(() => {
    if (jump) pos.setValue(at);
    else settle(pos, at).start();
  }, [at, jump, pos]);

  // Not from Sous: there, swiping right opens the chat history. Rows that swipe themselves
  // (like a timer's delete) get the gesture first.
  const swipe = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => PAGES[at] !== '/chat' && Math.abs(g.dx) > 14 && Math.abs(g.dx) > Math.abs(g.dy) * 1.8,
    onPanResponderTerminationRequest: () => false,
    onPanResponderMove: (_, g) => {
      const hasNext = !!PAGES[at + (g.dx < 0 ? 1 : -1)];
      pos.setValue(at - (hasNext ? g.dx : g.dx * 0.25) / width);
    },
    onPanResponderRelease: (_, g) => {
      const dir = g.dx < -width * 0.3 || g.vx < -0.4 ? 1 : g.dx > width * 0.3 || g.vx > 0.4 ? -1 : 0;
      const next = dir ? PAGES[at + dir] : undefined;
      if (next) router.navigate(next);
      else settle(pos, at).start();
    },
    onPanResponderTerminate: () => settle(pos, at).start(),
  });

  return (
    <ChatDrawerShell>
      <View style={{ flex: 1, backgroundColor: th.c.bg }} {...swipe.panHandlers}>
        <Tabs
          tabBar={props => <TabBar {...props} />}
          detachInactiveScreens={false}
          screenOptions={({ route }) => {
            const i = NAMES.indexOf(route.name);
            return {
              headerShown: false,
              lazy: false,
              sceneStyle: { backgroundColor: th.c.bg },
              animation: 'shift',
              // Each page sits at its own slot in the row; `pos` slides the whole row.
              sceneStyleInterpolator: () => ({
                sceneStyle: { transform: [{ translateX: Animated.multiply(Animated.subtract(i, pos), width) }] },
              }),
            };
          }}
        >
          <Tabs.Screen name="index" />
          <Tabs.Screen name="chat" />
          <Tabs.Screen name="add" />
          <Tabs.Screen name="timers" />
          <Tabs.Screen name="account" />
        </Tabs>
      </View>
    </ChatDrawerShell>
  );
}
