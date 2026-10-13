// The ＋ in the message bar: a bottom sheet (like the Gemini and ChatGPT apps) with big tiles for
// Camera, Photos and your recipes, and a few starters that drop a prompt into the message box.
import { useEffect, useState } from 'react';
import { Animated, Modal, PanResponder, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/theme';
import { Icon, Txt, type IconName } from '../ui';

export type AttachChoice = 'camera' | 'photos' | 'recipe' | { draft: string };

const STARTERS: { icon: IconName; title: string; hint: string; draft: string }[] = [
  { icon: 'calendar-outline', title: 'Plan meals', hint: 'A week of easy dinners', draft: 'Plan easy dinners for this week. ' },
  { icon: 'basket-outline', title: 'Use what I have', hint: 'Cook from your fridge and pantry', draft: 'I have ' },
  { icon: 'swap-horizontal-outline', title: 'Swap an ingredient', hint: 'Find a substitute', draft: 'What can I use instead of ' },
  { icon: 'medkit-outline', title: 'Rescue a dish', hint: 'Too salty, too thick, too sticky…', draft: 'Help, my dish is ' },
];

export function AttachSheet({ visible, hasRecipes, onClose, onChoose }: { visible: boolean; hasRecipes: boolean; onClose: () => void; onChoose: (c: AttachChoice) => void }) {
  const th = useTheme();
  const insets = useSafeAreaInsets();
  const [y] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (visible) Animated.spring(y, { toValue: 0, friction: 10, tension: 80, useNativeDriver: true }).start();
    else y.setValue(1);
  }, [visible, y]);

  // Drag the sheet down to close it.
  const drag = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx),
    onPanResponderMove: (_, g) => y.setValue(Math.max(0, g.dy / 420)),
    onPanResponderRelease: (_, g) => (g.dy > 100 || g.vy > 0.6 ? onClose() : Animated.spring(y, { toValue: 0, useNativeDriver: true }).start()),
  });

  const tiles: { key: AttachChoice; icon: IconName; label: string }[] = [
    { key: 'camera', icon: 'camera-outline', label: 'Camera' },
    { key: 'photos', icon: 'images-outline', label: 'Photos' },
    ...(hasRecipes ? [{ key: 'recipe' as const, icon: 'book-outline' as IconName, label: 'Recipes' }] : []),
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={onClose} accessibilityLabel="Close" />
      <Animated.View
        {...drag.panHandlers}
        style={{
          position: 'absolute', left: 8, right: 8, bottom: insets.bottom + 8, paddingTop: 10, paddingBottom: 12, borderRadius: 30,
          backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line,
          transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [0, 500] }) }],
        }}
      >
        <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: th.c.line, marginBottom: 14 }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 10 }}>
          {tiles.map(t => (
            <Pressable key={t.label} onPress={() => onChoose(t.key)} accessibilityRole="button"
              style={({ pressed }) => ({ width: 108, height: 100, borderRadius: 24, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: th.c.soft, opacity: pressed ? 0.7 : 1 })}>
              <Icon name={t.icon} size={26} color={th.c.text} />
              <Txt weight="black" size={15}>{t.label}</Txt>
            </Pressable>
          ))}
        </ScrollView>
        <View style={{ marginTop: 10 }}>
          {STARTERS.map(s => (
            <Pressable key={s.title} onPress={() => onChoose({ draft: s.draft })} accessibilityRole="button"
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 22, paddingVertical: 12, backgroundColor: pressed ? th.c.soft : 'transparent' })}>
              <Icon name={s.icon} size={22} color={th.c.text} />
              <View style={{ flex: 1 }}>
                <Txt weight="bold" size={17}>{s.title}</Txt>
                <Txt muted size={14}>{s.hint}</Txt>
              </View>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </Modal>
  );
}
