// A row you can swipe left or right to delete, like iOS lists.
import * as Haptics from 'expo-haptics';
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, PanResponder, View } from 'react-native';
import { useTheme } from '../lib/theme';
import { Icon } from './ui';

const DELETE_AT = 110;

export function SwipeRow({ children, onDelete, enabled = true, haptics = true }: { children: ReactNode; onDelete: () => void; enabled?: boolean; haptics?: boolean }) {
  const th = useTheme();
  const [x] = useState(() => new Animated.Value(0));
  // The gesture handler is created once, so it reads the latest props from this holder.
  const [latest] = useState(() => ({ onDelete, enabled, haptics }));
  useEffect(() => {
    Object.assign(latest, { onDelete, enabled, haptics });
  }, [latest, onDelete, enabled, haptics]);

  const [responder] = useState(() => {
    let armed = false;
    const reset = () => Animated.spring(x, { toValue: 0, friction: 7, useNativeDriver: false }).start();
    return PanResponder.create({
      // Only take over clearly horizontal drags, so vertical scrolling still works.
      onMoveShouldSetPanResponder: (_, g) => latest.enabled && Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.6,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => {
        x.setValue(g.dx);
        const past = Math.abs(g.dx) > DELETE_AT;
        if (past !== armed) {
          armed = past;
          if (latest.haptics) Haptics.selectionAsync().catch(() => {});
        }
      },
      onPanResponderRelease: (_, g) => {
        armed = false;
        if (Math.abs(g.dx) > DELETE_AT || Math.abs(g.vx) > 1.2) {
          Animated.timing(x, { toValue: Math.sign(g.dx || g.vx) * 600, duration: 180, useNativeDriver: false }).start(() => latest.onDelete());
        } else reset();
      },
      onPanResponderTerminate: () => {
        armed = false;
        reset();
      },
    });
  });

  const iconOpacity = x.interpolate({ inputRange: [-DELETE_AT, -30, 0, 30, DELETE_AT], outputRange: [1, 0.3, 0, 0.3, 1], extrapolate: 'clamp' });

  return (
    <View style={{ overflow: 'hidden' }}>
      <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, backgroundColor: th.c.temp }}>
        <Animated.View style={{ opacity: iconOpacity }}><Icon name="trash" size={22} color="#fff" /></Animated.View>
        <Animated.View style={{ opacity: iconOpacity }}><Icon name="trash" size={22} color="#fff" /></Animated.View>
      </View>
      <Animated.View {...responder.panHandlers} style={{ transform: [{ translateX: x }], backgroundColor: th.c.surface }}>
        {children}
      </Animated.View>
    </View>
  );
}
