import { router, usePathname } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useEffect, useState } from 'react';
import { Animated, Easing, PanResponder, View, useWindowDimensions } from 'react-native';
import { ChatDrawerShell } from '../../components/chat/chat-drawer';
import { TabBar, TabPosition } from '../../components/tab-bar';
import { useTheme } from '../../lib/theme';

// Tab order, left to right (matches the tab bar).
const PAGES = ['/', '/chat', '/add', '/timers', '/account'] as const;
const NAMES = ['index', 'chat', 'add', 'timers', 'account'];

// Glide the row of pages to `toValue`; the time depends on how far it still has to go.
const glide = (v: Animated.Value, from: number, toValue: number) =>
  Animated.timing(v, { toValue, duration: Math.max(140, Math.min(320, 320 * Math.abs(toValue - from))), easing: Easing.out(Easing.cubic), useNativeDriver: true });

export default function TabsLayout() {
  const th = useTheme();
  const { width } = useWindowDimensions();
  const path = usePathname();
  const idx = PAGES.indexOf(path as (typeof PAGES)[number]);

  // Where the row of pages is: 0 = Recipes on screen, 1 = Sous, … (fractions while swiping).
  // Every tab stays rendered side by side, so swiping drags the next page in with the current one,
  // like Instagram's pager. The tab bar's highlight has its own value (`bar`): it follows the pages
  // while you swipe, and always glides, even when a tap jumps several tabs and the pages switch at once.
  const [pos] = useState(() => new Animated.Value(Math.max(0, idx)));
  const [bar] = useState(() => new Animated.Value(Math.max(0, idx)));
  // While another screen is open on top (a recipe, settings…), keep the last tab.
  const [prev, setPrev] = useState(Math.max(0, idx));
  const at = idx >= 0 ? idx : prev;
  const [jump, setJump] = useState(false);
  if (prev !== at) { setPrev(at); setJump(Math.abs(at - prev) > 1); }

  // A tab changed from a tap: glide there (far jumps switch instantly). After a swipe the row is
  // already in place, so this does nothing visible.
  useEffect(() => {
    bar.stopAnimation(value => glide(bar, value, at).start());
    if (jump) { pos.setValue(at); return; }
    pos.stopAnimation(value => glide(pos, value, at).start());
  }, [at, jump, pos, bar]);

  // Not from Sous: there, swiping right opens the chat history. Rows that swipe themselves
  // (like a timer's delete) get the gesture first.
  const swipe = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => PAGES[at] !== '/chat' && Math.abs(g.dx) > 14 && Math.abs(g.dx) > Math.abs(g.dy) * 1.8,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => { pos.stopAnimation(); bar.stopAnimation(); },
    onPanResponderMove: (_, g) => {
      const hasNext = !!PAGES[at + (g.dx < 0 ? 1 : -1)];
      const v = at - (hasNext ? g.dx : g.dx * 0.25) / width;
      pos.setValue(v);
      bar.setValue(v);
    },
    onPanResponderRelease: (_, g) => {
      const dir = g.dx < -width * 0.3 || g.vx < -0.4 ? 1 : g.dx > width * 0.3 || g.vx > 0.4 ? -1 : 0;
      const next = dir ? PAGES[at + dir] : undefined;
      const from = at - g.dx / width;
      // Finish the slide first, then switch tabs: switching re-draws the pages, which would make
      // the glide stutter if it happened mid-motion.
      glide(bar, from, next ? at + dir : at).start();
      if (next) glide(pos, from, at + dir).start(({ finished }) => { if (finished) router.navigate(next); });
      else glide(pos, from, at).start();
    },
    onPanResponderTerminate: () => { glide(pos, at, at).start(); glide(bar, at, at).start(); },
  });

  return (
    <TabPosition.Provider value={bar}>
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
    </TabPosition.Provider>
  );
}
