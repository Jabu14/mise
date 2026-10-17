// The message box under the chat, laid out like Claude / ChatGPT / Gemini: a rounded card with the
// text on top and the buttons underneath (＋ on the left; mic and voice mode, or send, on the right).
// While recording, the text area turns into a live level meter.
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { File } from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, TextInput, View } from 'react-native';
import { AI_NAME, type ChatAttachment } from '../../lib/chat-store';
import { useApp } from '../../lib/store';
import { useTheme } from '../../lib/theme';
import { VoiceWaveIcon } from '../icons';
import { Icon, Txt, type IconName } from '../ui';
import { Glass } from '../glass';
import { formatSeconds } from './voice-message';
import { showAlert } from '../sheet';

const MAX_RECORDING_MS = 5 * 60 * 1000;

type Props = {
  attachment: ChatAttachment | null;
  onClearAttachment: () => void;
  onAttach: () => void;
  onSendText: (text: string) => void;
  onSendVoice: (uri: string, durationMs: number) => void;
  onVoiceMode: () => void;
  // A starter from the ＋ sheet: replaces the text and focuses the box (n changes each time).
  draft?: { text: string; n: number };
};

export function Composer({ attachment, onClearAttachment, onAttach, onSendText, onSendVoice, onVoiceMode, draft }: Props) {
  const th = useTheme();
  const { settings } = useApp();
  const [text, setText] = useState('');
  const input = useRef<TextInput>(null);
  // The newest text from the keyboard (kept outside state so a send always reads the very latest).
  const latest = useRef('');
  const sending = useRef(false);
  const [draftN, setDraftN] = useState(0);
  if (draft && draft.n !== draftN) { setDraftN(draft.n); setText(draft.text); }
  const changeText = (t: string) => { latest.current = t; setText(t); };
  const draftKey = draft?.n;
  useEffect(() => { if (draftKey) setTimeout(() => input.current?.focus(), 50); }, [draftKey]);
  const [recording, setRecording] = useState(false);
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true, directory: 'document' });
  const rec = useAudioRecorderState(recorder, 80);
  const [autoStop, setAutoStop] = useState<ReturnType<typeof setTimeout> | null>(null);

  const haptic = () => settings.haptics && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

  const startRecording = async () => {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      showAlert('Microphone is off', 'Allow microphone access for Mise in Settings to record voice messages.');
      return;
    }
    haptic();
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setRecording(true);
    // Recordings stop (and send) on their own at 5 minutes.
    setAutoStop(setTimeout(() => finishRecording(true), MAX_RECORDING_MS));
  };

  async function finishRecording(send: boolean) {
    if (autoStop) clearTimeout(autoStop);
    setAutoStop(null);
    const duration = recorder.currentTime * 1000;
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
    setRecording(false);
    const uri = recorder.uri;
    if (!uri) return;
    if (send && duration > 600) {
      haptic();
      onSendVoice(uri, Math.min(duration, MAX_RECORDING_MS));
    } else {
      try { new File(uri).delete(); } catch { /* nothing to clean up */ }
    }
  }

  // When you tap send, iOS may still be finishing the last word (autocorrect / predictive text) and
  // delivers it a moment later. Wait for it, then send everything and clear the box.
  const send = () => {
    if (sending.current) return;
    sending.current = true;
    setTimeout(() => {
      sending.current = false;
      const t = (latest.current || text).trim();
      if (!t && !attachment) return;
      haptic();
      onSendText(t);
      latest.current = '';
      setText('');
      input.current?.clear();
    }, 120);
  };

  // Live level: 0 (silence) to 1 (loud), from the mic's decibel reading.
  const level = Math.max(0, Math.min(1, ((rec.metering ?? -60) + 55) / 50));
  const t = rec.durationMillis / 160;

  const meter = (
    <View style={{ height: 44, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 6 }}>
      <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: th.c.temp }} />
      <Txt weight="black" size={15} style={{ fontVariant: ['tabular-nums'], width: 44 }}>{formatSeconds(rec.durationMillis)}</Txt>
      <View style={{ flex: 1, height: 30, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        {Array.from({ length: 28 }, (_, i) => {
          const wobble = 0.45 + 0.55 * Math.abs(Math.sin(t + i * 0.9));
          return <View key={i} style={{ flex: 1, height: `${(0.15 + 0.85 * level * wobble) * 100}%`, borderRadius: 2, backgroundColor: th.c.accent }} />;
        })}
      </View>
    </View>
  );

  return (
    <View style={{ paddingHorizontal: 12, paddingTop: 4, paddingBottom: 10 }}>
      <Glass tint={0.72} style={{ borderRadius: 26, paddingHorizontal: 8, paddingTop: 8, paddingBottom: 8, gap: 2 }}>
        {attachment && !recording ? (
          <View style={{ flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 8, marginLeft: 4, marginTop: 2, paddingLeft: attachment.type === 'photo' ? 4 : 12, paddingRight: 6, paddingVertical: 4, borderRadius: 14, backgroundColor: th.c.soft }}>
            {attachment.type === 'photo'
              ? <Image source={{ uri: attachment.uri }} style={{ width: 40, height: 40, borderRadius: 10 }} />
              : <Icon name="book-outline" size={16} color={th.c.accent} />}
            <Txt weight="bold" size={13} numberOfLines={1} style={{ maxWidth: 200 }}>{attachment.type === 'photo' ? 'Photo' : attachment.title}</Txt>
            <Pressable onPress={onClearAttachment} hitSlop={8} accessibilityLabel="Remove attachment"><Icon name="close-circle" size={18} color={th.c.muted} /></Pressable>
          </View>
        ) : null}

        {recording ? meter : (
          <TextInput
            ref={input}
            value={text}
            onChangeText={changeText}
            placeholder={`Ask ${AI_NAME} anything`}
            placeholderTextColor={th.c.muted}
            multiline
            maxLength={4000}
            style={[{ minHeight: 44, maxHeight: 150, paddingHorizontal: 8, paddingTop: 10, paddingBottom: 6, color: th.c.text, fontSize: th.fs(16) }, th.f('body')]}
          />
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {recording
            ? <RoundBtn name="trash-outline" onPress={() => finishRecording(false)} label="Cancel recording" />
            : (
              <Pressable onPress={onAttach} accessibilityRole="button" accessibilityLabel="Attach a photo or recipe" hitSlop={6}
                style={({ pressed }) => ({ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: th.c.line, opacity: pressed ? 0.6 : 1 })}>
                <Icon name="add" size={21} color={th.c.text} />
              </Pressable>
            )}
          <View style={{ flex: 1 }} />
          {recording
            ? <RoundBtn name="arrow-up" onPress={() => finishRecording(true)} label="Send voice message" solid />
            : text.trim() || attachment
              ? <RoundBtn name="arrow-up" onPress={send} label="Send message" solid />
              : (
                <>
                  <RoundBtn name="mic-outline" onPress={startRecording} label="Record a voice message" />
                  <RoundBtn name="voice" onPress={onVoiceMode} label={`Talk to ${AI_NAME}`} solid />
                </>
              )}
        </View>
      </Glass>
    </View>
  );
}

function RoundBtn({ name, onPress, label, solid = false }: { name: IconName | 'voice'; onPress: () => void; label: string; solid?: boolean }) {
  const th = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6}
      style={({ pressed }) => ({ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: solid ? th.c.accent : 'transparent', opacity: pressed ? 0.7 : 1 })}>
      {name === 'voice'
        ? <VoiceWaveIcon size={20} color={solid ? th.c.onAccent : th.c.text} />
        : <Icon name={name} size={solid ? 20 : 22} color={solid ? th.c.onAccent : th.c.text} />}
    </Pressable>
  );
}
