// A small feedback form: how's it going (1–5), what kind of note, and a message.
// With ?mode=issue it becomes "Report an issue": just what went wrong, plus app and phone details.
// It opens an email to the address in EXPO_PUBLIC_FEEDBACK_EMAIL; without one (or without a mail app)
// it falls back to the share sheet so the note can go anywhere.
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, Share, TextInput, View } from 'react-native';
import { Btn, IconBtn, Screen, TopBar, Txt } from '../components/ui';
import { useApp } from '../lib/store';
import { useTheme } from '../lib/theme';

const FEEDBACK_EMAIL = (process.env.EXPO_PUBLIC_FEEDBACK_EMAIL ?? '').trim();
const MOODS = ['😣', '😕', '😐', '🙂', '😍'];
const KINDS = ['Idea', 'Something broke', 'I love it', 'Other'] as const;
const MAX_MESSAGE = 2000;

export default function FeedbackScreen() {
  const th = useTheme();
  const { settings } = useApp();
  const [mood, setMood] = useState<number | null>(null);
  const [kind, setKind] = useState<(typeof KINDS)[number]>('Idea');
  const [message, setMessage] = useState('');
  const issue = useLocalSearchParams<{ mode?: string }>().mode === 'issue';
  const canSend = issue ? message.trim().length >= 10 : message.trim().length >= 3 || mood != null;

  const send = async () => {
    if (!canSend) return;
    if (settings.haptics) Haptics.selectionAsync().catch(() => {});
    const version = Constants.expoConfig?.version ?? '1.0.0';
    const subject = issue ? 'Mise: issue report' : `Mise feedback: ${kind}`;
    const body = [
      message.trim().slice(0, MAX_MESSAGE),
      '',
      !issue && mood != null ? `How it's going: ${mood + 1}/5 ${MOODS[mood]}` : '',
      `Mise ${version} · ${Platform.OS} ${Platform.Version}`,
    ].filter((line, i) => i < 2 || line).join('\n');

    let sent = false;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(FEEDBACK_EMAIL)) {
      try {
        await Linking.openURL(`mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
        sent = true;
      } catch { /* no mail app: use the share sheet */ }
    }
    if (!sent) {
      const result = await Share.share({ title: subject, message: `${subject}\n\n${body}` }).catch(() => null);
      sent = result?.action === Share.sharedAction;
    }
    if (sent) {
      Alert.alert('Thank you!', issue ? 'We’ll look into it.' : 'Every note helps make Mise better.');
      router.back();
    }
  };

  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <Txt kind="head" weight="bold" size={19} style={{ flex: 1, paddingLeft: 4 }}>{issue ? 'Report an issue' : 'Feedback'}</Txt>
      </TopBar>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 48, gap: 22 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        {issue ? (
          <Txt muted size={15}>Tell us what went wrong and what you were doing when it happened. The more detail, the faster we can fix it.</Txt>
        ) : (
          <>
          <View style={{ gap: 10 }}>
            <Txt kind="head" weight="bold" size={21}>How’s Mise working for you?</Txt>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {MOODS.map((face, i) => {
                const on = mood === i;
                return (
                  <Pressable key={face} onPress={() => setMood(i)} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={`${i + 1} out of 5`}
                    style={{ width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? th.c.accentSoft : th.c.soft, borderWidth: 2, borderColor: on ? th.c.accent : 'transparent', transform: [{ scale: on ? 1.08 : 1 }] }}>
                    <Txt size={28}>{face}</Txt>
                  </Pressable>
                );
              })}
            </View>
          </View>
  
          <View style={{ gap: 10 }}>
            <Txt weight="black" size={14}>What’s it about?</Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {KINDS.map(k => {
                const on = kind === k;
                return (
                  <Pressable key={k} onPress={() => setKind(k)} accessibilityRole="radio" accessibilityState={{ selected: on }}
                    style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: on ? th.c.accent : th.c.soft }}>
                    <Txt weight="bold" size={14} color={on ? th.c.onAccent : th.c.text}>{k}</Txt>
                  </Pressable>
                );
              })}
            </View>
          </View>
  
          </>
        )}

        <View style={{ gap: 8 }}>
          <TextInput
            multiline
            value={message}
            onChangeText={setMessage}
            maxLength={MAX_MESSAGE}
            placeholder={issue ? 'What happened? What did you expect?' : 'Tell us more…'}
            placeholderTextColor={th.c.muted}
            textAlignVertical="top"
            style={[{ minHeight: 150, padding: 14, borderRadius: th.radius, borderWidth: 1.5, borderColor: th.c.line, backgroundColor: th.c.surface, color: th.c.text, fontSize: th.fs(16) }, th.f('body')]}
          />
          <Txt muted size={12} style={{ alignSelf: 'flex-end' }}>{message.length}/{MAX_MESSAGE}</Txt>
        </View>

        <Btn title={issue ? 'Send report' : 'Send feedback'} icon="send" disabled={!canSend} onPress={send} />
        <Txt muted size={12} style={{ textAlign: 'center' }}>We add the app version and phone type so we can fix things faster. Nothing else is sent.</Txt>
      </ScrollView>
    </Screen>
  );
}
