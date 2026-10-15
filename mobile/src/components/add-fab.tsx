// Floating "+ Add recipe" button for the Recipes page. It starts wide with its label,
// then shrinks into a round "+" after a moment so it stays out of the way.
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable } from 'react-native';
import { useTheme } from '../lib/theme';
import { Icon, Txt } from './ui';

const SIZE = 58;
const WIDE = 164;

export function AddFab({ onPress }: { onPress: () => void }) {
  const th = useTheme();
  // 1 = wide pill with label, 0 = round button.
  const [expand] = useState(() => new Animated.Value(1));

  useEffect(() => {
    // Label for 1.5 s, then a 1.5 s shrink: round by the 3-second mark.
    const t = setTimeout(() => Animated.timing(expand, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }).start(), 1500);
    return () => clearTimeout(t);
  }, [expand]);

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Add recipe" style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.94 : 1 }] })}>
      <Animated.View
        style={{
          height: SIZE,
          width: expand.interpolate({ inputRange: [0, 1], outputRange: [SIZE, WIDE] }),
          borderRadius: SIZE / 2,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundColor: th.c.accent,
          ...(th.dark ? {} : { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 }),
        }}
      >
        <Animated.View style={{ transform: [{ translateX: -1.5 }] }}>
          <Icon name="add" size={25} color={th.c.onAccent} />
        </Animated.View>
        {/* The label's width and spacing animate to zero, so the "+" ends up perfectly centred. */}
        <Animated.View
          style={{
            overflow: 'hidden',
            maxWidth: expand.interpolate({ inputRange: [0, 1], outputRange: [0, 110] }),
            marginLeft: expand.interpolate({ inputRange: [0, 1], outputRange: [0, 6] }),
            opacity: expand.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, 0, 1] }),
          }}
        >
          <Txt weight="black" size={16} color={th.c.onAccent} numberOfLines={1}>Add recipe</Txt>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}
