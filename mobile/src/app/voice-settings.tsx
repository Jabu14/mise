// Voice: pick how Sous sounds when you talk to it in voice mode. Tap a voice to hear it.
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Group, Toggle } from '../components/settings-ui';
import { Card, Icon, IconBtn, Screen, TopBar, Txt } from '../components/ui';
import { AI_NAME } from '../lib/chat-store';
import { useApp } from '../lib/store';
import { useTheme } from '../lib/theme';
import { VOICES } from '../lib/voices';

export default function VoiceSettings() {
  const th = useTheme();
  const { settings, updateSettings } = useApp();
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => () => { Speech.stop(); }, []);

  const choose = (key: string) => {
    if (settings.haptics) Haptics.selectionAsync().catch(() => {});
    updateSettings({ aiVoice: key });
    const v = VOICES[key];
    Speech.stop();
    setPlaying(key);
    Speech.speak(`Hi, I'm ${AI_NAME}. Let's get cooking!`, { pitch: v.pitch, rate: v.rate, onDone: () => setPlaying(null), onStopped: () => setPlaying(null), onError: () => setPlaying(null) });
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
            {Object.entries(VOICES).map(([key, v], i, all) => {
              const on = settings.aiVoice === key;
              return (
                <Pressable key={key} onPress={() => choose(key)} accessibilityRole="radio" accessibilityState={{ selected: on }}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 10, borderBottomWidth: i === all.length - 1 ? 0 : 1, borderBottomColor: th.c.line, opacity: pressed ? 0.6 : 1 })}>
                  <View style={{ width: 28, alignItems: 'center' }}>
                    <Icon name={playing === key ? 'volume-high-outline' : 'mic-outline'} size={22} color={th.c.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt weight="bold">{v.name}</Txt>
                    <Txt muted size={13}>{v.feel}</Txt>
                  </View>
                  {on ? <Icon name="checkmark" size={22} color={th.c.accent} /> : null}
                </Pressable>
              );
            })}
          </Card>
          <Txt muted size={13}>Tap a voice to hear it. Make sure your phone isn’t on silent.</Txt>
        </Group>
        <Group title="Voice mode">
          <Card style={{ paddingHorizontal: 16, paddingVertical: 2 }}>
            <Toggle k="aiVoiceReplies" label="Read answers out loud" last />
          </Card>
        </Group>
      </ScrollView>
    </Screen>
  );
}
