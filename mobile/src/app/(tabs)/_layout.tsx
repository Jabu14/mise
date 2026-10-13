import { Tabs } from 'expo-router/js-tabs';
import { TabBar } from '../../components/tab-bar';
import { useTheme } from '../../lib/theme';

export default function TabsLayout() {
  const th = useTheme();
  return (
    <Tabs tabBar={props => <TabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: th.c.bg } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="add" />
      <Tabs.Screen name="timers" />
      <Tabs.Screen name="account" />
    </Tabs>
  );
}
