// A recorded voice message in the chat: play/pause, a waveform that fills as it plays, and its length.
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Pressable, View } from 'react-native';
import { useTheme } from '../../lib/theme';
import { Icon, Txt } from '../ui';

const BARS = 28;

export const formatSeconds = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// A stable, natural-looking waveform shape for a message (derived from its id).
function shape(seed: string) {
  let h = 7;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 9973;
  return Array.from({ length: BARS }, (_, i) => {
    h = (h * 1103 + 12345) % 9973;
    const wave = 0.55 + 0.45 * Math.sin(i / 2.3);
    return 0.25 + 0.75 * ((h % 100) / 100) * wave;
  });
}

export function VoiceMessage({ id, uri, durationMs, mine }: { id: string; uri: string; durationMs: number; mine: boolean }) {
  const th = useTheme();
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const total = (status.duration || durationMs / 1000) * 1000;
  const progress = total ? Math.min(1, (status.currentTime * 1000) / total) : 0;
  const fg = mine ? th.c.onAccent : th.c.accent;

  const toggle = async () => {
    if (status.playing) return player.pause();
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
    if (status.didJustFinish || progress >= 0.99) await player.seekTo(0);
    player.play();
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 210 }}>
      <Pressable onPress={toggle} accessibilityRole="button" accessibilityLabel={status.playing ? 'Pause voice message' : 'Play voice message'}
        style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: mine ? 'rgba(255,255,255,0.22)' : th.c.accentSoft }}>
        <Icon name={status.playing ? 'pause' : 'play'} size={18} color={fg} />
      </Pressable>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 28 }}>
        {shape(id).map((v, i) => (
          <View key={i} style={{ flex: 1, height: `${v * 100}%`, borderRadius: 2, backgroundColor: fg, opacity: i / BARS < progress ? 1 : 0.4 }} />
        ))}
      </View>
      <Txt weight="bold" size={12} color={fg} style={{ fontVariant: ['tabular-nums'] }}>{formatSeconds(status.playing ? status.currentTime * 1000 : total)}</Txt>
    </View>
  );
}
