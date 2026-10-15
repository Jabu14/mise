// Voice, in the style of ChatGPT's voice picker: swipe between voices (each with its own glowing orb);
// the one you land on is chosen and says hello. Below: speed, language, and when Mise speaks.
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, FlatList, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Circle, Stop } from 'react-native-svg';
import { Toggle } from '../components/settings-ui';
import { Card, Icon, Screen, TopBar, Txt, type IconName } from '../components/ui';
import { AI_NAME } from '../lib/chat-store';
import { useApp } from '../lib/store';
import { useTheme } from '../lib/theme';
import { phoneVoices, speak, voiceId, type PhoneVoice } from '../lib/voices';

const SAMPLE = `Hi, I'm ${AI_NAME}. Let's get cooking!`;
const ORBS: [string, string][] = [
  ['#FFE3A3', '#FF8A3D'], ['#BFE3FF', '#3B7BFF'], ['#D8C8FF', '#7C4DFF'], ['#C6F5D9', '#18A867'],
  ['#FFD0DE', '#FF4F8B'], ['#FFF1B8', '#E0A800'], ['#C9F2F5', '#0FA3B1'], ['#E5E5E5', '#5E5E5E'], ['#FFD9C2', '#E2552D'],
];
const RATE_NAMES: Record<string, string> = { slow: 'Slower', normal: 'Normal', fast: 'Faster' };

type Choice = { id: string; name: string; feel: string };

export default function VoiceSettings() {
  const th = useTheme();
  const { width } = useWindowDimensions();
  const { settings, updateSettings } = useApp();
  const [voices, setVoices] = useState<PhoneVoice[] | null>(null);
  const [spin] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let alive = true;
    phoneVoices().then(v => alive && setVoices(v));
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => { alive = false; loop.stop(); Speech.stop(); };
  }, [spin]);

  // Automatic first, then the most natural voices on the phone.
  const choices: Choice[] = [
    { id: '', name: 'Automatic', feel: 'The most natural voice on your phone' },
    ...(voices ?? []).slice(0, 8).map(v => ({ id: v.id, name: v.name, feel: [v.quality !== 'Standard' ? v.quality : 'Standard', v.region && `English (${v.region})`].filter(Boolean).join(' · ') })),
  ];
  const current = Math.max(0, choices.findIndex(c => c.id === voiceId(settings.aiVoice)));
  // -1 until you swipe: then the saved voice's page is shown (voices load after the first render).
  const [swiped, setSwiped] = useState(-1);
  const page = swiped < 0 ? current : swiped;

  const land = (i: number) => {
    const c = choices[i];
    if (!c || i === page) return;
    setSwiped(i);
    if (settings.haptics) Haptics.selectionAsync().catch(() => {});
    updateSettings({ aiVoice: c.id });
    speak(SAMPLE, { ...settings, aiVoice: c.id });
  };

  const pickRate = () =>
    Alert.alert('Speed', 'How fast should Mise talk?', [
      ...Object.entries(RATE_NAMES).map(([k, label]) => ({ text: label + (settings.aiVoiceRate === k ? '  ✓' : ''), onPress: () => { updateSettings({ aiVoiceRate: k }); speak(SAMPLE, { ...settings, aiVoiceRate: k }); } })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);

  return (
    <Screen>
      <TopBar>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={4}
          style={({ pressed }) => ({ marginLeft: 8, width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line, opacity: pressed ? 0.7 : 1 })}>
          <Icon name="chevron-back" size={22} color={th.c.text} />
        </Pressable>
        <Txt weight="black" size={18} style={{ flex: 1, textAlign: 'center' }}>Voice</Txt>
        <View style={{ width: 54 }} />
      </TopBar>

      <ScrollView contentContainerStyle={{ paddingBottom: 48, gap: 16 }}>
        {voices === null ? (
          <ActivityIndicator style={{ height: 320 }} color={th.c.accent} />
        ) : (
          <FlatList
            data={choices}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={current}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            keyExtractor={c => c.id || 'auto'}
            onMomentumScrollEnd={e => land(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item, index }) => {
              const [a, b] = ORBS[index % ORBS.length];
              return (
                <View style={{ width, alignItems: 'center', paddingTop: 40, gap: 6 }}>
                  <Animated.View style={{ transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
                    <Svg width={170} height={170} viewBox="0 0 170 170">
                      <Defs>
                        <RadialGradient id={`orb${index}`} cx="35%" cy="30%" r="80%">
                          <Stop offset="0" stopColor="#FFFFFF" />
                          <Stop offset="0.35" stopColor={a} />
                          <Stop offset="1" stopColor={b} />
                        </RadialGradient>
                      </Defs>
                      <Circle cx="85" cy="85" r="82" fill={`url(#orb${index})`} />
                    </Svg>
                  </Animated.View>
                  <Txt kind="head" weight="bold" size={26} style={{ marginTop: 22 }}>{item.name}</Txt>
                  <Txt muted size={15}>{item.feel}</Txt>
                </View>
              );
            }}
          />
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 9 }}>
          {choices.map((c, i) => <View key={c.id || 'auto'} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i === page ? th.c.text : th.c.line }} />)}
        </View>
        <Txt muted size={13} style={{ textAlign: 'center' }}>Swipe to hear each voice</Txt>

        <View style={{ paddingHorizontal: 16, gap: 12, marginTop: 10 }}>
          <PillRow icon="speedometer-outline" label="Speed" value={RATE_NAMES[settings.aiVoiceRate] ?? 'Normal'} onPress={pickRate} />
          <PillRow icon="globe-outline" label="Language" value="English" onPress={() => Alert.alert('Language', 'Mise speaks English for now. More languages are coming.')} />

          <Card style={{ paddingHorizontal: 16, paddingVertical: 2, marginTop: 6 }}>
            <Toggle k="aiVoiceReplies" label={`Read ${AI_NAME}'s answers out loud`} />
            <Toggle k="handsFree" label="Hands-free in cook mode" hint="Steps are read out loud when you start cooking" last />
          </Card>

          <Txt muted size={13} style={{ marginHorizontal: 4 }}>For even more natural voices on iPhone: Settings › Accessibility › Spoken Content › Voices › English, and download a “Premium” voice. It will show up here.</Txt>
        </View>
      </ScrollView>
    </Screen>
  );
}

function PillRow({ icon, label, value, onPress }: { icon: IconName; label: string; value: string; onPress: () => void }) {
  const th = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, height: 60, paddingHorizontal: 20, borderRadius: 30, backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line }}>
        <Icon name={icon} size={22} color={th.c.text} />
        <Txt weight="bold" size={17} style={{ flex: 1 }}>{label}</Txt>
        <Txt muted size={16}>{value}</Txt>
        <Icon name="chevron-expand-outline" size={18} color={th.c.muted} />
      </View>
    </Pressable>
  );
}
