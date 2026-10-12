// iPhone-style swipe to delete: swipe left to reveal a red delete button, tap it to delete,
// or keep swiping all the way across to delete in one go. Swipe right (or tap the row) to close.
import * as Haptics from 'expo-haptics';
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, PanResponder, Pressable, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../lib/theme';
import { Icon, Txt } from './ui';

const BUTTON = 88;

export function SwipeRow({ children, onDelete, enabled = true, haptics = true }: { children: ReactNode; onDelete: () => void; enabled?: boolean; haptics?: boolean }) {
  const th = useTheme();
  const { width } = useWindowDimensions();
  const [x] = useState(() => new Animated.Value(0));
  const [open, setOpen] = useState(false);

  // The gesture handler is created once, so it reads the latest values from this holder.
  const [latest] = useState(() => ({ onDelete, enabled, haptics, open, width }));
  useEffect(() => {
    Object.assign(latest, { onDelete, enabled, haptics, open, width });
  }, [latest, onDelete, enabled, haptics, open, width]);

  const [responder] = useState(() => {
    let start = 0;
    let armed = false;
    const fullAt = () => latest.width * 0.55;
    const to = (value: number, after?: () => void) =>
      Animated.spring(x, { toValue: value, friction: 8, tension: 70, useNativeDriver: false }).start(after);
    const remove = () => {
      if (latest.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Animated.timing(x, { toValue: -latest.width, duration: 200, useNativeDriver: false }).start(() => latest.onDelete());
    };
    return PanResponder.create({
      // Only clearly horizontal drags; leftwards to open, either way once open.
      onMoveShouldSetPanResponder: (_, g) =>
        latest.enabled && Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.6 && (g.dx < 0 || latest.open),
      onPanResponderGrant: () => {
        start = latest.open ? -BUTTON : 0;
        armed = false;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => {
        const next = Math.min(0, start + g.dx);
        x.setValue(next);
        const past = -next > fullAt();
        if (past !== armed) {
          armed = past;
          if (latest.haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        }
      },
      onPanResponderRelease: (_, g) => {
        const pos = Math.min(0, start + g.dx);
        if (-pos > fullAt() || (g.vx < -1.6 && latest.open)) return remove();
        if (-pos > BUTTON / 2 && g.vx < 0.5) {
          setOpen(true);
          to(-BUTTON);
        } else {
          setOpen(false);
          to(0);
        }
      },
      onPanResponderTerminate: () => {
        setOpen(false);
        to(0);
      },
    });
  });

  const close = () => {
    setOpen(false);
    Animated.spring(x, { toValue: 0, friction: 8, useNativeDriver: false }).start();
  };
  const deleteNow = () => {
    if (haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Animated.timing(x, { toValue: -width, duration: 200, useNativeDriver: false }).start(() => onDelete());
  };

  // The red area grows with the swipe; the button sits at its right edge.
  const redWidth = x.interpolate({ inputRange: [-width, 0], outputRange: [width, 0], extrapolate: 'clamp' });

  return (
    <View style={{ overflow: 'hidden' }}>
      <Animated.View style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: redWidth, backgroundColor: th.c.temp, alignItems: 'flex-end', justifyContent: 'center' }}>
        <Pressable onPress={deleteNow} accessibilityRole="button" accessibilityLabel="Delete" style={{ width: BUTTON, height: '100%', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <Icon name="close-circle" size={24} color="#fff" />
          <Txt weight="black" size={12} color="#fff">Delete</Txt>
        </Pressable>
      </Animated.View>
      <Animated.View {...responder.panHandlers} style={{ transform: [{ translateX: x }], backgroundColor: th.c.surface }}>
        {open ? (
          <Pressable onPress={close} accessibilityLabel="Close">{children}</Pressable>
        ) : (
          children
        )}
      </Animated.View>
    </View>
  );
}
