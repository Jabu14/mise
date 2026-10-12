// iPhone-style scroll wheel for picking hours / minutes / seconds.
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useTheme } from '../lib/theme';
import { Txt } from './ui';

export const WHEEL_ITEM = 44;
const VISIBLE = 5;

type WheelProps = { count: number; value: number; onChange: (v: number) => void; unit: string; haptics: boolean };

function Wheel({ count, value, onChange, unit, haptics }: WheelProps) {
  const th = useTheme();
  const ref = useRef<ScrollView>(null);
  const [index, setIndex] = useState(value);
  const current = useRef(value);
  const lastTick = useRef(0);

  // Jump to the starting value once laid out, and whenever it's changed from outside.
  useEffect(() => {
    if (value !== current.current) {
      current.current = value;
      ref.current?.scrollTo({ y: value * WHEEL_ITEM, animated: true });
    }
  }, [value]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.max(0, Math.min(count - 1, Math.round(e.nativeEvent.contentOffset.y / WHEEL_ITEM)));
    if (i !== current.current) {
      current.current = i;
      setIndex(i);
      onChange(i);
      // A click per number, but not faster than ~25 a second during a fast flick.
      const t = Date.now();
      if (haptics && t - lastTick.current > 40) {
        lastTick.current = t;
        Haptics.selectionAsync().catch(() => {});
      }
    }
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
      <ScrollView
        ref={ref}
        style={{ height: WHEEL_ITEM * VISIBLE, flex: 1 }}
        contentContainerStyle={{ paddingVertical: WHEEL_ITEM * 2 }}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM}
        decelerationRate="normal"
        disableIntervalMomentum={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onLayout={() => ref.current?.scrollTo({ y: value * WHEEL_ITEM, animated: false })}
        accessibilityRole="adjustable"
        accessibilityLabel={`${index} ${unit}`}
      >
        {Array.from({ length: count }, (_, i) => {
          const distance = Math.abs(i - index);
          return (
            <View key={i} style={{ height: WHEEL_ITEM, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 6 }}>
              <Txt
                kind="head"
                weight={distance === 0 ? 'bold' : 'regular'}
                size={distance === 0 ? 26 : 22}
                color={distance === 0 ? th.c.text : th.c.muted}
                style={{ opacity: distance === 0 ? 1 : distance === 1 ? 0.6 : 0.28, fontVariant: ['tabular-nums'] }}
              >
                {i}
              </Txt>
            </View>
          );
        })}
      </ScrollView>
      <Txt weight="bold" size={15} style={{ width: 44 }}>{unit}</Txt>
    </View>
  );
}

export function DurationPicker({ hours, minutes, seconds, onChange, haptics }: {
  hours: number; minutes: number; seconds: number; haptics: boolean;
  onChange: (v: { hours: number; minutes: number; seconds: number }) => void;
}) {
  const th = useTheme();
  return (
    <View style={{ height: WHEEL_ITEM * VISIBLE, justifyContent: 'center' }}>
      {/* highlight band behind the selected row */}
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: WHEEL_ITEM * 2, height: WHEEL_ITEM, borderRadius: WHEEL_ITEM / 2, backgroundColor: th.c.soft }} />
      <View style={{ flexDirection: 'row', gap: 4 }}>
        <Wheel count={24} value={hours} unit="hours" haptics={haptics} onChange={h => onChange({ hours: h, minutes, seconds })} />
        <Wheel count={60} value={minutes} unit="min" haptics={haptics} onChange={m => onChange({ hours, minutes: m, seconds })} />
        <Wheel count={60} value={seconds} unit="sec" haptics={haptics} onChange={s => onChange({ hours, minutes, seconds: s })} />
      </View>
    </View>
  );
}
