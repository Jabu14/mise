// Bottom navigation: Recipes · Sous (AI chat) · Add · Timers · Account, as a floating rounded bar
// (frosted glass) that floats over the page, so whatever scrolls behind it shows through blurred. A soft highlight slides between the tabs,
// following your finger while you swipe between pages (like Instagram). Press and hold (or slide
// along the bar) and a glass lens lifts out and follows your finger; let go to open that tab.
import * as Haptics from 'expo-haptics';
import { BottomTabBarHeightCallbackContext, type BottomTabBarProps } from 'expo-router/js-tabs';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Keyboard, PanResponder, Platform, Pressable, View } from 'react-native';
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
const BIG_PILL = 64;

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

  // ---- the lens: press and hold, or slide along the bar ----
  const [lift] = useState(() => new Animated.Value(0));
  const [grab, setGrab] = useState(false);
  const [hover, setHover] = useState(state.index);
  const [barX, setBarX] = useState(0);
  const barRef = useRef<View>(null);
  // The tab under a finger that's down but hasn't become a lens yet (tap, or still deciding).
  const [press, setPress] = useState<{ i: number; timer: ReturnType<typeof setTimeout> } | null>(null);
  const count = state.routes.length;
  const indexAt = (pageX: number) => Math.min(count - 1, Math.max(0, (pageX - barX - PAD) / (tabWidth || 1) - 0.5));
  const open = (i: number) => {
    const route = state.routes[i];
    if (!route) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (i !== state.index && !event.defaultPrevented) navigation.navigate(route.name, route.params);
    else if (pos) Animated.spring(pos, { toValue: state.index, friction: 8, useNativeDriver: true }).start();
  };
  const startLens = (i: number) => {
    if (grab) return;
    setGrab(true);
    setHover(i);
    if (settings.haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Animated.spring(lift, { toValue: 1, friction: 6, tension: 140, useNativeDriver: true }).start();
  };
  const endLens = (go: boolean) => {
    setGrab(false);
    Animated.spring(lift, { toValue: 0, friction: 7, tension: 120, useNativeDriver: true }).start();
    if (go) open(hover);
    else if (pos) Animated.spring(pos, { toValue: state.index, friction: 8, useNativeDriver: true }).start();
  };
  // The bar handles every touch itself: a tap opens the tab, holding for a moment or sliding sideways
  // lifts the lens, and letting go opens the tab under it.
  const lens = PanResponder.create({
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (_, g) => {
      const i = Math.round(indexAt(g.x0));
      setPress({ i, timer: setTimeout(() => startLens(i), 220) });
    },
    onPanResponderMove: (_, g) => {
      if (!grab) {
        if (Math.abs(g.dx) < 10) return;
        if (press) clearTimeout(press.timer);
        startLens(Math.round(indexAt(g.moveX)));
      }
      const f = indexAt(g.moveX);
      pos?.setValue(f);
      const r = Math.round(f);
      if (r !== hover) {
        setHover(r);
        if (settings.haptics) Haptics.selectionAsync().catch(() => {});
      }
    },
    onPanResponderRelease: (_, g) => {
      if (press) clearTimeout(press.timer);
      setPress(null);
      if (grab) endLens(true);
      else if (Math.abs(g.dx) >= 10) { setHover(Math.round(indexAt(g.moveX))); endLens(true); }
      else if (press) {
        if (press.i !== state.index && settings.haptics) Haptics.selectionAsync().catch(() => {});
        open(press.i);
      }
    },
    onPanResponderTerminate: () => {
      if (press) clearTimeout(press.timer);
      setPress(null);
      if (grab) endLens(false);
    },
  });
  const LENS_W = tabWidth + 14;

  // Icons grow when a tab shows no text, so the bar still feels full.
  const TABS: Record<string, { label: string; icon: (on: boolean, color: string, big: boolean) => ReactNode }> = {
    index: { label: 'Recipes', icon: (on, color, big) => <RecipeBookIcon open={on} color={color} size={big ? 28 : 22} /> },
    chat: { label: AI_NAME, icon: (on, color, big) => <ChatSparkIcon active={on} color={color} size={big ? 28 : 22} /> },
    add: { label: 'Add', icon: (on, color, big) => <Icon name={on ? 'add-circle' : 'add-circle-outline'} size={big ? 31 : 24} color={color} /> },
    timers: { label: 'Timers', icon: (on, color, big) => <Icon name={on ? 'timer' : 'timer-outline'} size={big ? 28 : 22} color={color} /> },
    account: { label: 'Account', icon: (on, color, big) => <Icon name={on ? 'person-circle' : 'person-circle-outline'} size={big ? 28 : 22} color={color} /> },
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
    <View {...lens.panHandlers} ref={barRef} onLayout={() => barRef.current?.measureInWindow(x => setBarX(x))}
      // (userSelect: stops the web preview from highlighting the labels while you drag.)
      style={{ ...(Platform.OS === 'web' ? ({ userSelect: 'none' } as object) : null), borderRadius: 34, shadowColor: '#000', shadowOpacity: th.dark ? 0.35 : 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 10 }}>
    <Glass tint={th.dark ? 0.25 : 0.2} strength={70} style={{ flexDirection: 'row', alignItems: 'center', height: 68, paddingHorizontal: PAD, borderRadius: 34 }}>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} onLayout={e => setRowWidth(e.nativeEvent.layout.width)} pointerEvents="none">
        {tabWidth && pos ? (
          <Animated.View style={{
            ...(noLabel.has(state.routes[state.index]?.name)
              ? { top: 10, width: BIG_PILL, height: 48, borderRadius: 24, left: PAD + (tabWidth - BIG_PILL) / 2 }
              : { top: 9, width: PILL, height: 32, borderRadius: 16, left: PAD + (tabWidth - PILL) / 2 }),
            position: 'absolute', backgroundColor: th.c.accentSoft, opacity: lift.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
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
            style={{ flex: 1, alignItems: 'center', gap: 3, transform: [{ scale: grab ? (hover === i ? 1.12 : 1) : press?.i === i ? 0.94 : 1 }] }}
          >
            <View style={[{ width: noLabel.has(route.name) ? BIG_PILL : PILL, height: noLabel.has(route.name) ? 48 : 32, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }, focused && !pos && { backgroundColor: th.c.accentSoft }]}>
              {tab.icon(focused, color, noLabel.has(route.name))}
              {route.name === 'timers' && renderTimerBadge()}
            </View>
            {noLabel.has(route.name) ? null : <Txt weight={focused ? 'black' : 'bold'} size={12} color={color}>{tab.label}</Txt>}
          </Pressable>
        );
      })}
    </Glass>
    {/* The lens: a glass bubble a little bigger than the bar, following your finger. */}
    {tabWidth && pos ? (
      <Animated.View pointerEvents="none" style={{
        position: 'absolute', top: -7, height: 82, width: LENS_W, borderRadius: 41, left: PAD + (tabWidth - LENS_W) / 2,
        backgroundColor: th.dark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.42)',
        borderWidth: 1.5, borderColor: th.dark ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.95)',
        shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
        opacity: lift,
        transform: [{ translateX: Animated.multiply(pos, tabWidth) }, { scale: lift.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
      }}>
        <View style={{ position: 'absolute', top: 6, left: 14, right: 14, height: 18, borderRadius: 9, backgroundColor: '#FFFFFF', opacity: th.dark ? 0.12 : 0.5 }} />
      </Animated.View>
    ) : null}
    </View>
    </View>
  );
}
