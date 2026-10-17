// Send feedback / Report an issue: a message, optional screenshots or screen recordings, and (for
// feedback) how it's going and what it's about. It opens your mail app with everything attached,
// addressed to EXPO_PUBLIC_FEEDBACK_EMAIL. Without a mail app it falls back to the share sheet
// (text only). The app version and phone type are added so problems are easier to fix.
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as MailComposer from 'expo-mail-composer';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Platform, Pressable, ScrollView, Share, TextInput, View } from 'react-native';
import { showAlert } from '../components/sheet';
import { Icon, IconBtn, PageTitle, Screen, TopBar, Txt } from '../components/ui';
import { useApp } from '../lib/store';
import { useTheme } from '../lib/theme';

const FEEDBACK_EMAIL = (process.env.EXPO_PUBLIC_FEEDBACK_EMAIL ?? '').trim();
const MOODS = ['😣', '😕', '😐', '🙂', '😍'];
const KINDS = ['Idea', 'Something broke', 'I love it', 'Other'] as const;
const MAX_MESSAGE = 2000;
const MAX_FILES = 5;

type Attachment = { uri: string; video: boolean; seconds?: number };

export default function FeedbackScreen() {
  const th = useTheme();
  const { settings } = useApp();
  const issue = useLocalSearchParams<{ mode?: string }>().mode === 'issue';
  const [mood, setMood] = useState<number | null>(null);
  const [kind, setKind] = useState<(typeof KINDS)[number]>('Idea');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const canSend = !busy && (issue ? message.trim().length >= 10 : message.trim().length >= 3 || mood != null);

  const addFiles = async () => {
    if (files.length >= MAX_FILES) return showAlert('That’s the most', `You can attach up to ${MAX_FILES} screenshots or recordings.`);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return showAlert('Photos are off', 'Allow photo access for Mise in your phone’s Settings to attach screenshots.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], allowsMultipleSelection: true, selectionLimit: MAX_FILES - files.length, quality: 0.8, videoMaxDuration: 120 });
    if (result.canceled) return;
    setFiles(f => [...f, ...result.assets.map(a => ({ uri: a.uri, video: a.type === 'video', seconds: a.duration ? Math.round(a.duration / 1000) : undefined }))].slice(0, MAX_FILES));
  };

  const removeFile = (uri: string) =>
    showAlert('Remove this attachment?', undefined, [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: () => setFiles(f => f.filter(x => x.uri !== uri)) }]);

  const send = async () => {
    if (!canSend) return;
    setBusy(true);
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
    try {
      if (Platform.OS !== 'web' && (await MailComposer.isAvailableAsync())) {
        const r = await MailComposer.composeAsync({
          recipients: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(FEEDBACK_EMAIL) ? [FEEDBACK_EMAIL] : [],
          subject, body, attachments: files.map(f => f.uri),
        });
        sent = r.status === MailComposer.MailComposerStatus.SENT || r.status === MailComposer.MailComposerStatus.SAVED;
        if (r.status === MailComposer.MailComposerStatus.CANCELLED) { setBusy(false); return; }
      } else {
        const r = await Share.share({ title: subject, message: `${subject}\n\n${body}` });
        sent = r.action === Share.sharedAction;
      }
    } catch { /* fall through: nothing was sent */ }
    setBusy(false);
    if (sent) {
      showAlert('Thank you!', issue ? 'We’ll look into it.' : 'Every note helps make Mise better.');
      router.back();
    }
  };

  return (
    <Screen>
      <TopBar>
        <IconBtn name="close" label="Close" onPress={() => router.back()} />
        <PageTitle>{issue ? 'Report an issue' : 'Send feedback'}</PageTitle>
        <Pressable onPress={send} disabled={!canSend} accessibilityRole="button" accessibilityLabel="Send"
          style={({ pressed }) => ({ height: 42, paddingHorizontal: 18, borderRadius: 21, marginRight: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: canSend ? th.c.accent : th.c.soft, opacity: pressed ? 0.8 : 1 })}>
          <Txt weight="black" size={15} color={canSend ? th.c.onAccent : th.c.muted}>{busy ? 'Sending…' : 'Send'}</Txt>
        </Pressable>
      </TopBar>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 48, gap: 20 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <Txt muted size={14} style={{ paddingHorizontal: 4 }}>
          {issue ? 'Something not working? Tell us what happened. ' : 'Ideas, praise or problems, we read everything. '}
          For how-tos, the <Txt size={14} weight="bold" color={th.c.accent} onPress={() => router.push('/help')}>Help center</Txt> may have the answer.
        </Txt>

        {!issue ? (
          <>
            <View style={{ gap: 10 }}>
              <Txt weight="black" size={15} style={{ paddingHorizontal: 4 }}>How’s Mise working for you?</Txt>
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
          </>
        ) : null}

        <View style={{ gap: 6 }}>
          <TextInput
            multiline
            value={message}
            onChangeText={setMessage}
            maxLength={MAX_MESSAGE}
            placeholder={issue ? 'Describe the problem: what happened, and what did you expect?' : 'Tell us more…'}
            placeholderTextColor={th.c.muted}
            textAlignVertical="top"
            style={[{ minHeight: 150, padding: 16, borderRadius: 24, backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line, color: th.c.text, fontSize: th.fs(16) }, th.f('body')]}
          />
          <Txt muted size={12} style={{ alignSelf: 'flex-end', marginRight: 6 }}>{message.length}/{MAX_MESSAGE}</Txt>
        </View>

        <View style={{ gap: 10 }}>
          <Txt weight="black" size={16} style={{ paddingHorizontal: 4 }}>Screenshots or recordings <Txt muted size={14}>(optional)</Txt></Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 14, borderRadius: 24, backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line }}>
            {files.map(f => (
              <Pressable key={f.uri} onPress={() => removeFile(f.uri)} accessibilityLabel={f.video ? 'Recording, tap to remove' : 'Screenshot, tap to remove'}
                style={{ width: 92, height: 92, borderRadius: 16, overflow: 'hidden', backgroundColor: '#111' }}>
                {f.video ? (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Icon name="play-circle" size={34} color="#FFFFFF" />
                    {f.seconds != null ? <Txt weight="bold" size={12} color="#FFFFFF">{Math.floor(f.seconds / 60)}:{String(f.seconds % 60).padStart(2, '0')}</Txt> : null}
                  </View>
                ) : <Image source={{ uri: f.uri }} style={{ width: 92, height: 92 }} />}
                <View style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }}>
                  <Icon name="close" size={14} color="#FFFFFF" />
                </View>
              </Pressable>
            ))}
            {files.length < MAX_FILES ? (
              <Pressable onPress={addFiles} accessibilityRole="button" accessibilityLabel="Add a screenshot or recording"
                style={({ pressed }) => ({ width: 92, height: 92, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: pressed ? th.c.line : th.c.soft })}>
                <Icon name="images-outline" size={26} />
                <Txt muted weight="bold" size={11}>Add</Txt>
              </Pressable>
            ) : null}
          </View>
          <Txt muted size={13} style={{ paddingHorizontal: 4 }}>Up to {MAX_FILES} photos or videos. Tap one to remove it. Check they don’t show anything private.</Txt>
        </View>

        <Txt muted size={12} style={{ paddingHorizontal: 4 }}>
          By sending, you share your message, any attachments, the app version and your phone type with the Mise team to help with your feedback. <Txt size={12} weight="bold" color={th.c.accent} onPress={() => router.push('/legal')}>Learn more</Txt>
        </Txt>
      </ScrollView>
    </Screen>
  );
}
