// Voice: which of the phone's voices Sous speaks with (most natural first), and how fast.
// Tap a voice to hear it.
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Group, Segmented, Toggle } from '../components/settings-ui';
import { Card, Icon, IconBtn, Screen, TopBar, Txt } from '../components/ui';
import { AI_NAME } from '../lib/chat-store';
import { useApp } from '../lib/store';
import { useTheme } from '../lib/theme';
import { phoneVoices, speak, voiceId, type PhoneVoice } from '../lib/voices';

const SAMPLE = `Hi, I'm ${AI_NAME}. Let's get cooking! Stir the yeast into the warm water and leave it for five minutes.`;

export default function VoiceSettings() {
  const th = useTheme();
  const { settings, updateSettings } = useApp();
  const [voices, setVoices] = useState<PhoneVoice[] | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    phoneVoices().then(v => alive && setVoices(v));
    return () => { alive = false; Speech.stop(); };
  }, []);

  const choose = (id: string) => {
    if (settings.haptics) Haptics.selectionAsync().catch(() => {});
    updateSettings({ aiVoice: id });
    setPlaying(id);
    speak(SAMPLE, { ...settings, aiVoice: id }, { onDone: () => setPlaying(null) });
  };

  const row = (id: string, title: string, sub: string, badge: string | null, last: boolean) => {
    const on = voiceId(settings.aiVoice) === id;
    return (
      <Pressable key={id || 'auto'} onPress={() => choose(id)} accessibilityRole="radio" accessibilityState={{ selected: on }}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: last ? 0 : 1, borderBottomColor: th.c.line, opacity: pressed ? 0.6 : 1 })}>
        <View style={{ width: 28, alignItems: 'center' }}>
          <Icon name={playing === id ? 'volume-high-outline' : id ? 'mic-outline' : 'sparkles-outline'} size={22} color={th.c.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Txt weight="bold">{title}</Txt>
            {badge ? <View style={{ paddingHorizontal: 7, paddingVertical: 1, borderRadius: 999, backgroundColor: th.c.accentSoft }}><Txt weight="black" size={10} color={th.c.accent}>{badge.toUpperCase()}</Txt></View> : null}
          </View>
          <Txt muted size={13}>{sub}</Txt>
        </View>
        {on ? <Icon name="checkmark" size={22} color={th.c.accent} /> : null}
      </Pressable>
    );
  };

  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <Txt kind="head" weight="bold" size={19} style={{ flex: 1, paddingLeft: 4 }}>Voice</Txt>
      </TopBar>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 48, gap: 28 }}>
        <Group title={`${AI_NAME}'s voice`}>
          <Card style={{ paddingHorizontal: 6 }}>
            {row('', 'Automatic', 'The most natural voice on your phone', null, !voices?.length)}
            {voices === null ? <ActivityIndicator style={{ padding: 16 }} color={th.c.accent} /> : null}
            {voices?.map((v, i) => row(v.id, v.name, v.region ? `English (${v.region})` : 'English', v.quality === 'Standard' ? null : v.quality, i === voices.length - 1))}
          </Card>
          <Txt muted size={13}>Tap a voice to hear it. Make sure your phone isn’t on silent.</Txt>
        </Group>

        <Group title="Speed">
          <Segmented label="How fast it talks" k="aiVoiceRate" options={[['slow', 'Slower'], ['normal', 'Normal'], ['fast', 'Faster']]} />
        </Group>

        <Card style={{ padding: 16, gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name="sparkles-outline" size={20} color={th.c.accent} />
            <Txt weight="black">Get more natural voices</Txt>
          </View>
          <Txt muted size={14}>On iPhone: Settings › Accessibility › Spoken Content › Voices › English. Download a “Premium” or “Enhanced” voice (like Ava, Zoe or Evan), then come back here and pick it.</Txt>
          <Txt muted size={14}>{`Even more lifelike AI voices are coming when ${AI_NAME} is connected.`}</Txt>
        </Card>

        <Group title="Voice mode">
          <Card style={{ paddingHorizontal: 16, paddingVertical: 2 }}>
            <Toggle k="aiVoiceReplies" label="Read answers out loud" last />
          </Card>
        </Group>
      </ScrollView>
    </Screen>
  );
}
