// "Import with AI" card on the Add screen: a link, photos of a recipe, or messy text in,
// a clean Mise recipe out (shown in the normal preview before saving).
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { AiError, aiAvailable, importWithAi, preparePhoto, type AiRequest } from '../lib/ai';
import { useApp } from '../lib/store';
import { useTheme } from '../lib/theme';
import { Btn, Card, Icon, Txt, type IconName } from './ui';

type Mode = 'url' | 'photo' | 'text';
const MODES: { key: Mode; label: string; icon: IconName }[] = [
  { key: 'url', label: 'Link', icon: 'link-outline' },
  { key: 'photo', label: 'Photo', icon: 'camera-outline' },
  { key: 'text', label: 'Text', icon: 'document-text-outline' },
];

export function AiImportCard({ pastedText, onResult }: { pastedText: string; onResult: (source: string) => void }) {
  const th = useTheme();
  const { settings } = useApp();
  const [mode, setMode] = useState<Mode>('url');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!aiAvailable()) {
    return (
      <Card style={{ padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Icon name="sparkles-outline" size={22} color={th.c.muted} />
        <Txt muted size={14} style={{ flex: 1 }}>AI import isn’t set up on this build yet. You can still paste a recipe below.</Txt>
      </Card>
    );
  }

  const run = async (request: AiRequest, label: string) => {
    setError(null);
    setBusy(label);
    try {
      const { source } = await importWithAi(request);
      if (settings.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onResult(source);
      setUrl('');
    } catch (err) {
      setError(err instanceof AiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const pickPhotos = async (camera: boolean) => {
    setError(null);
    const permission = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(camera ? 'Allow camera access in Settings to take a photo.' : 'Allow photo access in Settings to choose photos.');
      return;
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1, allowsMultipleSelection: !camera, selectionLimit: 3 };
    const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled || !result.assets?.length) return;
    setBusy('Preparing photos…');
    try {
      const photos = await Promise.all(result.assets.slice(0, 3).map(a => preparePhoto(a.uri, a.width)));
      await run({ kind: 'photos', photos }, 'Reading the recipe…');
    } catch {
      setBusy(null);
      setError('Couldn’t read those photos. Try again.');
    }
  };

  return (
    <Card style={{ padding: 18, gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accent }}>
          <Icon name="sparkles" size={20} color={th.c.onAccent} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt weight="black" size={17}>Import with AI</Txt>
          <Txt muted size={13}>A link, a photo of a cookbook, or messy notes</Txt>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 4, padding: 4, borderRadius: 999, backgroundColor: th.c.soft }}>
        {MODES.map(m => {
          const on = mode === m.key;
          return (
            <Pressable key={m.key} onPress={() => { setMode(m.key); setError(null); }} disabled={!!busy} accessibilityRole="radio" accessibilityState={{ selected: on }}
              style={{ flex: 1, flexDirection: 'row', gap: 6, height: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? th.c.surface : 'transparent' }}>
              <Icon name={m.icon} size={16} color={on ? th.c.accent : th.c.muted} />
              <Txt weight="bold" size={14} color={on ? th.c.text : th.c.muted}>{m.label}</Txt>
            </Pressable>
          );
        })}
      </View>

      {busy ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, justifyContent: 'center' }}>
          <ActivityIndicator color={th.c.accent} />
          <Txt weight="bold">{busy}</Txt>
        </View>
      ) : mode === 'url' ? (
        <View style={{ gap: 10 }}>
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder="https://… recipe page"
            placeholderTextColor={th.c.muted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            maxLength={2048}
            returnKeyType="go"
            onSubmitEditing={() => url.trim() && run({ kind: 'url', url: url.trim() }, 'Reading the page…')}
            style={[{ height: 48, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1.5, borderColor: th.c.line, backgroundColor: th.c.surface, color: th.c.text, fontSize: th.fs(15) }, th.f('body')]}
          />
          <Btn title="Get the recipe" icon="sparkles" disabled={!/^https?:\/\/\S+\.\S+/.test(url.trim())} onPress={() => run({ kind: 'url', url: url.trim() }, 'Reading the page…')} />
        </View>
      ) : mode === 'photo' ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Btn title="Take photo" icon="camera" grow onPress={() => pickPhotos(true)} />
          <Btn title="Choose" icon="images-outline" variant="secondary" grow onPress={() => pickPhotos(false)} />
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          <Txt muted size={14}>Paste any recipe in the box below, then let the AI tidy it into clear steps with timers.</Txt>
          <Btn title="Tidy up with AI" icon="sparkles" disabled={pastedText.trim().length < 20} onPress={() => run({ kind: 'text', text: pastedText.slice(0, 60_000) }, 'Tidying up the recipe…')} />
        </View>
      )}

      {error ? (
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: 12, borderRadius: th.radiusSm, backgroundColor: th.c.tipBg }}>
          <Icon name="alert-circle-outline" size={18} color={th.c.tipInk} />
          <Txt size={14} style={{ flex: 1 }}>{error}</Txt>
        </View>
      ) : null}
      {mode === 'photo' && !busy ? <Txt muted size={12}>Up to 3 photos for multi-page recipes.</Txt> : null}
    </Card>
  );
}
