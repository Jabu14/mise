import { router, usePathname } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useState } from 'react';
import { Animated, Easing, PanResponder, View, useWindowDimensions } from 'react-native';
import { ChatDrawerShell } from '../../components/chat/chat-drawer';
import { TabBar } from '../../components/tab-bar';
import { useTheme } from '../../lib/theme';

// Tab order, left to right (matches the tab bar).
const PAGES = ['/', '/chat', '/add', '/timers', '/account'] as const;
const DURATION = 300;
const EASE = Easing.out(Easing.cubic);

export default function TabsLayout() {
  const th = useTheme();
  const { width } = useWindowDimensions();
  const path = usePathname();
  const at = PAGES.indexOf(path as (typeof PAGES)[number]);
  // How far the page is being dragged right now (0 when not dragging).
  const [drag] = useState(() => new Animated.Value(0));

  // Swipe left/right to move between tabs: the page follows your finger, then glides the rest of
  // the way while the next one slides in. Not from Sous, where swiping right opens the chat history.
  // Rows that swipe themselves (like a timer's delete) get the gesture first.
  const swipe = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => at >= 0 && PAGES[at] !== '/chat' && Math.abs(g.dx) > 18 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
    onPanResponderTerminationRequest: () => false,
    onPanResponderMove: (_, g) => {
      const next = PAGES[at + (g.dx < 0 ? 1 : -1)];
      drag.setValue(next ? g.dx : g.dx * 0.25); // a little give at the ends
    },
    onPanResponderRelease: (_, g) => {
      const dir = g.dx < -width * 0.25 || g.vx < -0.5 ? 1 : g.dx > width * 0.25 || g.vx > 0.5 ? -1 : 0;
      const next = dir ? PAGES[at + dir] : undefined;
      if (next) {
        router.navigate(next);
        Animated.timing(drag, { toValue: 0, duration: DURATION, easing: EASE, useNativeDriver: true }).start();
      } else {
        Animated.spring(drag, { toValue: 0, friction: 8, tension: 90, useNativeDriver: true }).start();
      }
    },
    onPanResponderTerminate: () => Animated.spring(drag, { toValue: 0, useNativeDriver: true }).start(),
  });

  return (
    <ChatDrawerShell>
      <View style={{ flex: 1, backgroundColor: th.c.soft }} {...swipe.panHandlers}>
        <Tabs
          tabBar={props => <TabBar {...props} />}
          screenOptions={{
            headerShown: false,
            sceneStyle: { backgroundColor: th.c.bg },
            animation: 'shift',
            transitionSpec: { animation: 'timing', config: { duration: DURATION, easing: EASE } },
            // Pages sit side by side like a pager; the one on screen also follows the finger.
            sceneStyleInterpolator: ({ current }) => ({
              sceneStyle: {
                transform: [{
                  translateX: Animated.add(
                    Animated.multiply(current.progress, width),
                    Animated.multiply(drag, current.progress.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 1, 0] })),
                  ),
                }],
              },
            }),
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
