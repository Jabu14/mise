// A row (or grid) of choices where the highlight glides to the one you tap, instead of jumping.
// Used for every "pick one" control: cooking level, text size, font, Monthly / Annual…
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View, type LayoutRectangle } from 'react-native';
import { useTheme } from '../lib/theme';
import { Txt } from './ui';

export function SlidingChoice({ options, value, onChange, columns, fontFor, accent = false, height = 40 }: {
  options: [string, string][];
  value: string;
  onChange: (v: string) => void;
  columns?: number;                 // wrap into a grid with this many per row
  fontFor?: (v: string) => string | undefined;
  accent?: boolean;                 // highlight in the accent colour instead of white
  height?: number;
}) {
  const th = useTheme();
  const [boxes, setBoxes] = useState<Record<string, LayoutRectangle>>({});
  const [thumb] = useState(() => ({ x: new Animated.Value(0), y: new Animated.Value(0), w: new Animated.Value(0), h: new Animated.Value(0) }));
  const placed = useRef(false);
  const radius = th.flat ? 8 : height / 2;

  // Glide to the chosen option (the very first time, just appear there).
  useEffect(() => {
    const b = boxes[value];
    if (!b) return;
    const to = { x: b.x, y: b.y, w: b.width, h: b.height };
    if (!placed.current) {
      placed.current = true;
      (Object.keys(to) as (keyof typeof to)[]).forEach(k => thumb[k].setValue(to[k]));
      return;
    }
    Animated.parallel((Object.keys(to) as (keyof typeof to)[]).map(k =>
      Animated.spring(thumb[k], { toValue: to[k], friction: 9, tension: 110, useNativeDriver: false }),
    )).start();
  }, [boxes, value, thumb]);

  const known = !!boxes[value];

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, padding: 4, borderRadius: th.flat ? 10 : radius + 4, backgroundColor: th.c.soft }}>
      <Animated.View pointerEvents="none" style={{
        position: 'absolute', left: thumb.x, top: thumb.y, width: thumb.w, height: thumb.h, borderRadius: radius, opacity: known ? 1 : 0,
        backgroundColor: accent ? th.c.accent : th.c.surface,
        shadowColor: '#000', shadowOpacity: accent || th.dark ? 0 : 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
      }} />
      {options.map(([v, label]) => {
        const on = value === v;
        return (
          <Pressable
            key={v}
            onPress={() => onChange(v)}
            onLayout={e => {
              const l = e.nativeEvent.layout;
              setBoxes(b => (b[v] && b[v].x === l.x && b[v].y === l.y && b[v].width === l.width ? b : { ...b, [v]: l }));
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            style={{ flexGrow: 1, flexBasis: columns ? `${100 / columns - 3}%` : 0, minHeight: height, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, borderRadius: radius }}
          >
            <Txt weight={accent ? 'black' : 'bold'} size={accent ? 16 : 14} color={on ? (accent ? th.c.onAccent : th.c.text) : accent ? th.c.text : th.c.muted}
              style={fontFor?.(v) ? { fontFamily: fontFor(v) } : undefined}>
              {label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
