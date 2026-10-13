// Voice mode: talk to Sous hands-free. A glowing orb follows your voice.
// Preview only for now — Sous can't reply out loud until the AI is connected.
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { File } from 'expo-file-system';
import { useKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatSparkIcon } from '../components/icons';
import { Icon, Txt } from '../components/ui';
import { AI_NAME } from '../lib/chat-store';
import { useTheme } from '../lib/theme';

export default function VoiceMode() {
  useKeepAwake();
  const th = useTheme();
  const insets = useSafeAreaInsets();
  const recorder = useAudioRecorder({ ...RecordingPresets.LOW_QUALITY, isMeteringEnabled: true });
  const rec = useAudioRecorderState(recorder, 60);
  const [state, setState] = useState<'starting' | 'listening' | 'muted' | 'denied'>('starting');
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const permission = await requestRecordingPermissionsAsync();
      if (cancelled) return;
      if (!permission.granted) return setState('denied');
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      if (!cancelled) setState('listening');
    })().catch(() => setState('denied'));
    return () => { cancelled = true; };
  }, [recorder]);

  // Level 0..1 from the microphone; the orb grows and glows with it.
  const level = state === 'listening' ? Math.max(0, Math.min(1, ((rec.metering ?? -60) + 55) / 45)) : 0;
  useEffect(() => {
    Animated.spring(pulse, { toValue: level, friction: 6, tension: 90, useNativeDriver: true }).start();
  }, [level, pulse]);

  const end = async () => {
    try {
      if (rec.isRecording) await recorder.stop();
      if (recorder.uri) new File(recorder.uri).delete();
    } catch {
      // nothing to clean up
    }
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
    router.back();
  };

  const toggleMute = () => {
    if (state === 'listening') { recorder.pause(); setState('muted'); }
    else if (state === 'muted') { recorder.record(); setState('listening'); }
  };

  const ring = (size: number, grow: number, opacity: number) => (
    <Animated.View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: th.c.accent, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [opacity * 0.5, opacity] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1 + grow] }) }] }} />
  );

  const status = { starting: 'Getting ready…', listening: 'Listening…', muted: 'Microphone off', denied: 'Allow microphone access in Settings to talk to Sous.' }[state];

  return (
    <View style={{ flex: 1, backgroundColor: th.c.bg, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24, alignItems: 'center' }}>
      <Txt kind="head" weight="bold" size={22}>{AI_NAME}</Txt>
      <Txt muted size={13} weight="bold">Voice mode · Preview</Txt>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {ring(300, 0.12, 0.08)}
        {ring(230, 0.2, 0.14)}
        {ring(170, 0.28, 0.22)}
        <Animated.View style={{ width: 130, height: 130, borderRadius: 65, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accent, transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) }] }}>
          <ChatSparkIcon size={56} color={th.c.onAccent} active />
        </Animated.View>
      </View>

      <Txt weight="black" size={18} style={{ textAlign: 'center', paddingHorizontal: 32 }}>{status}</Txt>
      <Txt muted size={14} style={{ textAlign: 'center', paddingHorizontal: 40, marginTop: 6 }}>
        Soon you’ll be able to talk to Sous hands-free while you cook. Your voice isn’t sent anywhere yet.
      </Txt>

      <View style={{ flexDirection: 'row', gap: 40, marginTop: 28 }}>
        <Pressable onPress={toggleMute} disabled={state !== 'listening' && state !== 'muted'} accessibilityRole="button" accessibilityLabel={state === 'muted' ? 'Turn microphone on' : 'Turn microphone off'}
          style={{ width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.soft }}>
          <Icon name={state === 'muted' ? 'mic-off' : 'mic'} size={28} color={th.c.text} />
        </Pressable>
        <Pressable onPress={end} accessibilityRole="button" accessibilityLabel="End voice mode"
          style={{ width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.temp }}>
          <Icon name="close" size={30} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}
