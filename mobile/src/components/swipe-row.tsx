// iPhone-style swipe to delete: swipe left to reveal a round red trash button, tap it to delete,
// or keep swiping all the way across to delete in one go. Swipe right (or tap the row) to close.
// `revealed` lets an Edit mode open the row from outside (tapping its red minus).
import * as Haptics from 'expo-haptics';
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, PanResponder, Pressable, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../lib/theme';
import { Icon } from './ui';

const OPEN_AT = 84;

type Props = {
  children: ReactNode;
  onDelete: () => void;
  enabled?: boolean;
  haptics?: boolean;
  revealed?: boolean;
  onRevealChange?: (open: boolean) => void;
};

export function SwipeRow({ children, onDelete, enabled = true, haptics = true, revealed, onRevealChange }: Props) {
  const th = useTheme();
  const { width } = useWindowDimensions();
  const [x] = useState(() => new Animated.Value(0));
  const [open, setOpenState] = useState(false);

  // The gesture handler is created once, so it reads the latest values from this holder.
  const [latest] = useState(() => ({ onDelete, enabled, haptics, open, width, onRevealChange }));
  useEffect(() => {
    Object.assign(latest, { onDelete, enabled, haptics, open, width, onRevealChange });
  }, [latest, onDelete, enabled, haptics, open, width, onRevealChange]);

  const [api] = useState(() => {
    const to = (value: number) => Animated.spring(x, { toValue: value, friction: 8, tension: 70, useNativeDriver: false }).start();
    const setOpen = (value: boolean) => {
      setOpenState(value);
      latest.onRevealChange?.(value);
      to(value ? -OPEN_AT : 0);
    };
    const remove = () => {
      if (latest.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Animated.timing(x, { toValue: -latest.width, duration: 200, useNativeDriver: false }).start(() => latest.onDelete());
    };
    let start = 0;
    let armed = false;
    const responder = PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        latest.enabled && Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.6 && (g.dx < 0 || latest.open),
      onPanResponderGrant: () => { start = latest.open ? -OPEN_AT : 0; armed = false; },
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => {
        const next = Math.min(0, start + g.dx);
        x.setValue(next);
        const past = -next > latest.width * 0.55;
        if (past !== armed) {
          armed = past;
          if (latest.haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        }
      },
      onPanResponderRelease: (_, g) => {
        const pos = Math.min(0, start + g.dx);
        if (-pos > latest.width * 0.55 || (g.vx < -1.6 && latest.open)) return remove();
        setOpen(-pos > OPEN_AT / 2 && g.vx < 0.5);
      },
      onPanResponderTerminate: () => setOpen(false),
    });
    return { responder, setOpen, remove };
  });

  // Follow an outside request (Edit mode) to open or close.
  useEffect(() => {
    if (revealed !== undefined && revealed !== latest.open) api.setOpen(revealed);
  }, [revealed, api, latest]);

  const buttonScale = x.interpolate({ inputRange: [-OPEN_AT, -24, 0], outputRange: [1, 0.4, 0.4], extrapolate: 'clamp' });
  const buttonOpacity = x.interpolate({ inputRange: [-OPEN_AT, -24, 0], outputRange: [1, 0, 0], extrapolate: 'clamp' });

  return (
    <View style={{ overflow: 'hidden' }}>
      <Animated.View pointerEvents={open ? 'auto' : 'none'} style={{ position: 'absolute', top: 0, bottom: 0, right: 14, justifyContent: 'center', opacity: buttonOpacity, transform: [{ scale: buttonScale }] }}>
        <Pressable onPress={api.remove} accessibilityRole="button" accessibilityLabel="Delete" style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.temp }}>
          <Icon name="trash-outline" size={24} color="#fff" />
        </Pressable>
      </Animated.View>
      <Animated.View {...api.responder.panHandlers} style={{ transform: [{ translateX: x }], backgroundColor: th.c.bg }}>
        {open ? <Pressable onPress={() => api.setOpen(false)} accessibilityLabel="Close">{children}</Pressable> : children}
      </Animated.View>
    </View>
  );
}

// The red minus circle shown in Edit mode; tapping it opens the row's delete button.
export function EditMinus({ onPress }: { onPress: () => void }) {
  const th = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Show delete" hitSlop={10} style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.temp }}>
      <View style={{ width: 11, height: 2.5, borderRadius: 2, backgroundColor: '#fff' }} />
    </Pressable>
  );
}
