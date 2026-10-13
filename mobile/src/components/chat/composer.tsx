// The message bar under the chat: ＋ to attach, text, a mic to record a voice message,
// and a button for full voice mode. While recording it turns into a live level meter.
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { File } from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, Image, Pressable, TextInput, View } from 'react-native';
import type { ChatAttachment } from '../../lib/chat-store';
import { useApp } from '../../lib/store';
import { useTheme } from '../../lib/theme';
import { Icon, Txt, type IconName } from '../ui';
import { formatSeconds } from './voice-message';

const MAX_RECORDING_MS = 5 * 60 * 1000;

type Props = {
  attachment: ChatAttachment | null;
  onClearAttachment: () => void;
  onAttach: () => void;
  onSendText: (text: string) => void;
  onSendVoice: (uri: string, durationMs: number) => void;
  onVoiceMode: () => void;
};

export function Composer({ attachment, onClearAttachment, onAttach, onSendText, onSendVoice, onVoiceMode }: Props) {
  const th = useTheme();
  const { settings } = useApp();
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true, directory: 'document' });
  const rec = useAudioRecorderState(recorder, 80);
  const [autoStop, setAutoStop] = useState<ReturnType<typeof setTimeout> | null>(null);

  const haptic = () => settings.haptics && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

  const startRecording = async () => {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Microphone is off', 'Allow microphone access for Mise in Settings to record voice messages.');
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

  const send = () => {
    const t = text.trim();
    if (!t && !attachment) return;
    haptic();
    onSendText(t);
    setText('');
  };

  // Live level: 0 (silence) to 1 (loud), from the mic's decibel reading.
  const level = Math.max(0, Math.min(1, ((rec.metering ?? -60) + 55) / 50));
  const t = rec.durationMillis / 160;

  const round = (name: IconName, onPress: () => void, label: string, solid = false) => (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6}
      style={({ pressed }) => ({ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: solid ? th.c.accent : 'transparent', opacity: pressed ? 0.7 : 1 })}>
      <Icon name={name} size={solid ? 20 : 22} color={solid ? th.c.onAccent : th.c.text} />
    </Pressable>
  );

  return (
    <View style={{ paddingHorizontal: 12, paddingTop: 6, paddingBottom: 10, gap: 8 }}>
      {attachment && !recording ? (
        <View style={{ flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 8, paddingLeft: attachment.type === 'photo' ? 4 : 12, paddingRight: 6, paddingVertical: 4, borderRadius: 999, backgroundColor: th.c.accentSoft }}>
          {attachment.type === 'photo'
            ? <Image source={{ uri: attachment.uri }} style={{ width: 32, height: 32, borderRadius: 16 }} />
            : <Icon name="book-outline" size={16} color={th.c.accent} />}
          <Txt weight="bold" size={13} color={th.c.accent} numberOfLines={1} style={{ maxWidth: 220 }}>{attachment.type === 'photo' ? 'Photo' : attachment.title}</Txt>
          <Pressable onPress={onClearAttachment} hitSlop={8} accessibilityLabel="Remove attachment"><Icon name="close-circle" size={18} color={th.c.accent} /></Pressable>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, padding: 6, borderRadius: 24, backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line }}>
        {recording ? (
          <>
            {round('trash-outline', () => finishRecording(false), 'Cancel recording')}
            <View style={{ flex: 1, height: 38, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: th.c.temp }} />
              <Txt weight="black" size={14} style={{ fontVariant: ['tabular-nums'], width: 40 }}>{formatSeconds(rec.durationMillis)}</Txt>
              <View style={{ flex: 1, height: 28, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                {Array.from({ length: 24 }, (_, i) => {
                  const wobble = 0.45 + 0.55 * Math.abs(Math.sin(t + i * 0.9));
                  return <View key={i} style={{ flex: 1, height: `${(0.15 + 0.85 * level * wobble) * 100}%`, borderRadius: 2, backgroundColor: th.c.accent }} />;
                })}
              </View>
            </View>
            {round('arrow-up', () => finishRecording(true), 'Send voice message', true)}
          </>
        ) : (
          <>
            {round('add', onAttach, 'Attach a photo or recipe')}
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Ask Sous anything…"
              placeholderTextColor={th.c.muted}
              multiline
              maxLength={4000}
              style={[{ flex: 1, minHeight: 38, maxHeight: 140, paddingHorizontal: 6, paddingTop: 9, paddingBottom: 9, color: th.c.text, fontSize: th.fs(16) }, th.f('body')]}
            />
            {text.trim() || attachment ? (
              round('arrow-up', send, 'Send message', true)
            ) : (
              <>
                {round('mic-outline', startRecording, 'Record a voice message')}
                {round('pulse', onVoiceMode, 'Talk to Sous', true)}
              </>
            )}
          </>
        )}
      </View>
    </View>
  );
}
