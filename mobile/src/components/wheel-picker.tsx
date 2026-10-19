// iPhone-style scroll wheels for picking hours / minutes / seconds.
// Flicks glide freely and settle on the nearest number; tap the selected number to type it.
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useTheme } from '../lib/theme';
import { Txt } from './ui';

export const WHEEL_ITEM = 44;
const VISIBLE = 5;

type WheelProps = {
  count: number;
  value: number;
  onChange: (v: number) => void;
  unit: string;
  haptics: boolean;
  onActive: (active: boolean) => void; // true while the finger / glide is on this wheel
};

function Wheel({ count, value, onChange, unit, haptics, onActive }: WheelProps) {
  const th = useTheme();
  const ref = useRef<ScrollView>(null);
  const [index, setIndex] = useState(value);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState('');
  const current = useRef(value);
  const lastTick = useRef(0);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragging = useRef(false);

  const clampIndex = (y: number) => Math.max(0, Math.min(count - 1, Math.round(y / WHEEL_ITEM)));

  // Follow outside changes (e.g. after typing a value).
  useEffect(() => {
    if (value !== current.current) {
      current.current = value;
      ref.current?.scrollTo({ y: value * WHEEL_ITEM, animated: true });
    }
  }, [value]);

  useEffect(() => () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
  }, []);

  // `t` is the event's timestamp (ms), used to space out the clicks during a fast glide.
  const select = (i: number, t: number) => {
    if (i === current.current) return;
    current.current = i;
    setIndex(i);
    onChange(i);
    if (haptics && t - lastTick.current > 40) {
      lastTick.current = t;
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => select(clampIndex(e.nativeEvent.contentOffset.y), e.timeStamp);

  // Settle exactly on a row once the glide stops.
  const settle = (y: number, t: number) => {
    const i = clampIndex(y);
    ref.current?.scrollTo({ y: i * WHEEL_ITEM, animated: true });
    select(i, t);
    dragging.current = false;
    onActive(false);
  };

  const onEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const t = e.timeStamp;
    // If no glide follows the drag, settle right away.
    settleTimer.current = setTimeout(() => settle(y, t + 80), 80);
  };

  const commitTyped = () => {
    const n = parseInt(draft, 10);
    setTyping(false);
    if (Number.isFinite(n)) {
      const i = Math.max(0, Math.min(count - 1, n));
      current.current = i;
      setIndex(i);
      onChange(i);
      ref.current?.scrollTo({ y: i * WHEEL_ITEM, animated: true });
    }
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
      <View style={{ flex: 1, height: WHEEL_ITEM * VISIBLE }}>
        <ScrollView
          ref={ref}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingVertical: WHEEL_ITEM * 2 }}
          showsVerticalScrollIndicator={false}
          decelerationRate="normal"
          scrollEventThrottle={16}
          nestedScrollEnabled
          onTouchStart={() => onActive(true)}
          onTouchEnd={() => {
            if (!dragging.current) onActive(false);
          }}
          onScrollBeginDrag={() => {
            dragging.current = true;
          }}
          onScroll={onScroll}
          onScrollEndDrag={onEndDrag}
          onMomentumScrollBegin={() => {
            if (settleTimer.current) clearTimeout(settleTimer.current);
          }}
          onMomentumScrollEnd={e => settle(e.nativeEvent.contentOffset.y, e.timeStamp)}
          onLayout={() => ref.current?.scrollTo({ y: value * WHEEL_ITEM, animated: false })}
          accessibilityRole="adjustable"
          accessibilityLabel={`${index} ${unit}`}
        >
          {Array.from({ length: count }, (_, i) => {
            const distance = Math.abs(i - index);
            return (
              <Pressable
                key={i}
                onPress={e => {
                  if (i === index) {
                    setDraft('');
                    setTyping(true);
                  } else {
                    ref.current?.scrollTo({ y: i * WHEEL_ITEM, animated: true });
                    select(i, e.timeStamp);
                  }
                }}
                style={{ height: WHEEL_ITEM, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 6 }}
              >
                <Txt
                  kind="head"
                  weight={distance === 0 ? 'bold' : 'regular'}
                  size={distance === 0 ? 26 : 22}
                  color={distance === 0 ? th.c.text : th.c.muted}
                  style={{ opacity: typing && distance === 0 ? 0 : distance === 0 ? 1 : distance === 1 ? 0.6 : 0.28, fontVariant: ['tabular-nums'] }}
                >
                  {i}
                </Txt>
              </Pressable>
            );
          })}
        </ScrollView>

        {typing && (
          <TextInput
            autoFocus
            value={draft}
            onChangeText={t => setDraft(t.replace(/\D/g, '').slice(0, 2))}
            onBlur={commitTyped}
            onSubmitEditing={commitTyped}
            keyboardType="number-pad"
            returnKeyType="done"
            maxLength={2}
            placeholder={String(index)}
            placeholderTextColor={th.c.muted}
            accessibilityLabel={`Type ${unit}`}
            style={[
              { position: 'absolute', left: 4, right: 0, top: WHEEL_ITEM * 2 + 4, height: WHEEL_ITEM - 8, textAlign: 'right', paddingRight: 6, borderBottomWidth: 2, borderColor: th.c.accent, color: th.c.text, fontSize: th.fs(24) },
              th.f('head', 'bold'),
            ]}
          />
        )}
      </View>
      <Txt weight="bold" size={15} style={{ width: 44 }}>{unit}</Txt>
    </View>
  );
}

export function DurationPicker({ hours, minutes, seconds, onChange, haptics, onActive }: {
  hours: number; minutes: number; seconds: number; haptics: boolean;
  onChange: (v: { hours: number; minutes: number; seconds: number }) => void;
  onActive: (active: boolean) => void;
}) {
  const th = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <View style={{ height: WHEEL_ITEM * VISIBLE, justifyContent: 'center' }}>
        {/* highlight band behind the selected row */}
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: WHEEL_ITEM * 2, height: WHEEL_ITEM, borderRadius: WHEEL_ITEM / 2, backgroundColor: th.c.soft }} />
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <Wheel count={24} value={hours} unit="hours" haptics={haptics} onActive={onActive} onChange={h => onChange({ hours: h, minutes, seconds })} />
          <Wheel count={60} value={minutes} unit="min" haptics={haptics} onActive={onActive} onChange={m => onChange({ hours, minutes: m, seconds })} />
          <Wheel count={60} value={seconds} unit="sec" haptics={haptics} onActive={onActive} onChange={s => onChange({ hours, minutes, seconds: s })} />
        </View>
      </View>
      <Txt muted size={12} style={{ textAlign: 'center' }}>Tap a number to type it</Txt>
    </View>
  );
}
