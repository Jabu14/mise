import { router, usePathname } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { PanResponder, View } from 'react-native';
import { ChatDrawerShell } from '../../components/chat/chat-drawer';
import { TabBar } from '../../components/tab-bar';
import { useTheme } from '../../lib/theme';

// Tab order, left to right (matches the tab bar).
const PAGES = ['/', '/chat', '/add', '/timers', '/account'] as const;

export default function TabsLayout() {
  const th = useTheme();
  const path = usePathname();
  const at = PAGES.indexOf(path as (typeof PAGES)[number]);

  // Swipe left/right to move between tabs. Not from Sous: there, swiping right opens the chat
  // history instead. Rows that swipe themselves (like a timer's delete) get the gesture first.
  const swipe = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => at >= 0 && PAGES[at] !== '/chat' && Math.abs(g.dx) > 24 && Math.abs(g.dx) > Math.abs(g.dy) * 2.2,
    onPanResponderRelease: (_, g) => {
      const dir = g.dx < -60 || g.vx < -0.45 ? 1 : g.dx > 60 || g.vx > 0.45 ? -1 : 0;
      const next = PAGES[at + dir];
      if (dir && next) router.navigate(next);
    },
  });

  return (
    <ChatDrawerShell>
      <View style={{ flex: 1 }} {...swipe.panHandlers}>
        <Tabs tabBar={props => <TabBar {...props} />} screenOptions={{ headerShown: false, animation: 'shift', sceneStyle: { backgroundColor: th.c.bg } }}>
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
