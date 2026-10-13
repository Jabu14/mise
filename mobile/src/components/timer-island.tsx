// The running timer at the top of the screen, like the iPhone's Dynamic Island: a black pill
// that grows in from the top, with pause and cancel on the left and the countdown on the right.
// With several timers it shows the next one to ring, plus how many more are running.
import { router, usePathname } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IslandSpace } from '../lib/island';
import { useTimers, type KitchenTimer } from '../lib/store';
import { mix, useTheme } from '../lib/theme';
import { Icon, Txt, clock } from './ui';

const ISLAND = '#0C0B0B';
const HEIGHT = 58;
const GAP = 8;

// Screens that already show the timers, or sit above everything (modals, voice mode).
const HIDDEN = [/^\/timers$/, /^\/timer\//, /^\/timer-new/, /^\/voice/, /^\/edit\//];

export function TimerIslandHost({ children }: { children: ReactNode }) {
  const { timers, remaining } = useTimers();
  const path = usePathname();
  const show = timers.length > 0 && !HIDDEN.some(re => re.test(path));
  // Ringing first, then the running timer that ends soonest, then paused ones.
  const next = [...timers].sort((a, b) => rank(a, remaining) - rank(b, remaining))[0];

  return (
    <IslandSpace.Provider value={show ? HEIGHT + GAP : 0}>
      {children}
      {show && next ? <Island t={next} more={timers.length - 1} /> : null}
    </IslandSpace.Provider>
  );
}

function rank(t: KitchenTimer, remaining: (t: KitchenTimer) => number) {
  if (t.done) return -1;
  return (t.pausedLeft != null ? 1e10 : 0) + remaining(t);
}

function Island({ t, more }: { t: KitchenTimer; more: number }) {
  const th = useTheme();
  const insets = useSafeAreaInsets();
  const { remaining, togglePause, removeTimer } = useTimers();
  const [grow] = useState(() => new Animated.Value(0));
  const paused = t.pausedLeft != null;
  const accent = th.dark ? th.c.accent : mix(th.c.accent, '#FFFFFF', 0.15);

  useEffect(() => {
    Animated.spring(grow, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true }).start();
  }, [grow]);

  const btn = { width: 42, height: 42, borderRadius: 21, alignItems: 'center' as const, justifyContent: 'center' as const };

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        position: 'absolute', top: insets.top + 2, left: 10, right: 10,
        opacity: grow,
        transform: [{ scaleX: grow.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }, { scaleY: grow.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
      }}
    >
      <View
        style={{
          height: HEIGHT, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 8, borderRadius: HEIGHT / 2,
          backgroundColor: ISLAND, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8,
        }}
      >
        <Pressable onPress={() => (t.done ? removeTimer(t.id) : togglePause(t.id))} hitSlop={4} accessibilityRole="button"
          accessibilityLabel={t.done ? 'Stop timer' : paused ? 'Resume timer' : 'Pause timer'}
          style={[btn, { backgroundColor: mix(ISLAND, th.c.accent, 0.45) }]}>
          <Icon name={t.done ? 'stop' : paused ? 'play' : 'pause'} size={21} color={accent} />
        </Pressable>
        {!t.done && (
          <Pressable onPress={() => removeTimer(t.id)} hitSlop={4} accessibilityRole="button" accessibilityLabel="Cancel timer" style={[btn, { backgroundColor: '#2C2B2A' }]}>
            <Icon name="close" size={22} color="#FFFFFF" />
          </Pressable>
        )}
        {more > 0 ? (
          <View style={{ paddingHorizontal: 8, height: 22, borderRadius: 11, justifyContent: 'center', backgroundColor: '#2C2B2A' }}>
            <Txt weight="black" size={12} color="#FFFFFF">+{more}</Txt>
          </View>
        ) : null}
        <Pressable
          onPress={() => router.push(more > 0 ? '/timers' : `/timer/${t.id}`)}
          accessibilityRole="button"
          accessibilityLabel={`${t.label}, ${t.done ? "time's up" : clock(remaining(t))}${more > 0 ? `, and ${more} more` : ''}. Open`}
          style={({ pressed }) => ({ flex: 1, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, paddingRight: 18, opacity: pressed ? 0.75 : 1 })}
        >
          <Txt weight="bold" size={14} color={accent} numberOfLines={1} style={{ flexShrink: 1 }}>{t.done ? t.label : t.label.length > 14 ? 'Timer' : t.label}</Txt>
          <Txt weight="bold" size={t.done ? 20 : 28} color={accent} style={{ fontVariant: ['tabular-nums'], opacity: paused ? 0.6 : 1, lineHeight: t.done ? 28 : 34 }}>
            {t.done ? "Time's up!" : clock(remaining(t))}
          </Txt>
        </Pressable>
      </View>
    </Animated.View>
  );
}
