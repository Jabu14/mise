// Pieces of the cooking journal: star rating, the "How did it go?" editor (stars, photo, note)
// and a journal entry row.
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActionSheetIOS, Alert, Image, Platform, Pressable, TextInput, View } from 'react-native';
import { keepPhoto, useCookLog, type CookEntry } from '../lib/cook-log';
import { useApp } from '../lib/store';
import { useTheme } from '../lib/theme';
import { Icon, Txt } from './ui';

export function Stars({ value, onChange, size = 30 }: { value: number; onChange?: (n: number) => void; size?: number }) {
  const th = useTheme();
  const { settings } = useApp();
  return (
    <View style={{ flexDirection: 'row', gap: onChange ? 6 : 2 }} accessibilityLabel={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(n => {
        const star = <Icon name={n <= value ? 'star' : 'star-outline'} size={size} color={n <= value ? '#F2B01E' : th.c.muted} />;
        return onChange ? (
          <Pressable key={n} hitSlop={4} accessibilityRole="button" accessibilityLabel={`${n} ${n === 1 ? 'star' : 'stars'}`}
            onPress={() => { if (settings.haptics) Haptics.selectionAsync().catch(() => {}); onChange(n === value ? 0 : n); }}>
            {star}
          </Pressable>
        ) : <View key={n}>{star}</View>;
      })}
    </View>
  );
}

// Ask camera or library, then return the picked photo's uri.
async function pickPhoto(): Promise<string | null> {
  const source = await new Promise<'camera' | 'library' | null>(resolve => {
    if (Platform.OS === 'web') return resolve('library');
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options: ['Take photo', 'Choose from library', 'Cancel'], cancelButtonIndex: 2 },
        i => resolve(i === 0 ? 'camera' : i === 1 ? 'library' : null));
      return;
    }
    Alert.alert('Add a photo', undefined, [
      { text: 'Take photo', onPress: () => resolve('camera') },
      { text: 'Choose from library', onPress: () => resolve('library') },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
    ], { cancelable: true, onDismiss: () => resolve(null) });
  });
  if (!source) return null;
  const camera = source === 'camera';
  const permission = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [4, 3] };
  const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  return !result.canceled && result.assets?.[0] ? result.assets[0].uri : null;
}

export function CookEntryEditor({ entry }: { entry: CookEntry }) {
  const th = useTheme();
  const { update } = useCookLog();
  const [note, setNote] = useState(entry.note);
  const [busy, setBusy] = useState(false);

  const addPhoto = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const uri = await pickPhoto();
      if (uri) update(entry.id, { photo: await keepPhoto(uri, entry.id) });
    } catch {
      Alert.alert('Couldn’t add that photo', 'Try a different one.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: 14 }}>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Stars value={entry.rating} onChange={n => update(entry.id, { rating: n })} size={34} />
        <Txt muted size={13}>{['Tap to rate', 'Not great', 'It was OK', 'Good', 'Really good', 'Perfect!'][entry.rating]}</Txt>
      </View>

      {entry.photo ? (
        <View>
          <Image source={{ uri: entry.photo }} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: th.radiusSm, backgroundColor: th.c.soft }} />
          <View style={{ position: 'absolute', top: 8, right: 8, flexDirection: 'row', gap: 6 }}>
            <Pressable onPress={addPhoto} accessibilityLabel="Change photo" style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)' }}>
              <Icon name="camera-reverse-outline" size={18} color="#fff" />
            </Pressable>
            <Pressable onPress={() => update(entry.id, { photo: undefined })} accessibilityLabel="Remove photo" style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)' }}>
              <Icon name="trash-outline" size={18} color="#fff" />
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable onPress={addPhoto} accessibilityRole="button"
          style={({ pressed }) => ({ height: 96, borderRadius: th.radiusSm, alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1.5, borderStyle: 'dashed', borderColor: th.c.line, backgroundColor: pressed ? th.c.soft : 'transparent' })}>
          <Icon name="camera-outline" size={26} color={th.c.accent} />
          <Txt weight="bold" size={14} color={th.c.accent}>{busy ? 'Adding…' : 'Add a photo of your dish'}</Txt>
        </Pressable>
      )}

      <TextInput
        value={note}
        onChangeText={t => { setNote(t); update(entry.id, { note: t }); }}
        placeholder="Notes for next time, e.g. a bit less salt, bake 5 min longer"
        placeholderTextColor={th.c.muted}
        multiline
        maxLength={1000}
        style={[{ minHeight: 84, padding: 14, paddingTop: 12, borderRadius: th.radiusSm, backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line, color: th.c.text, fontSize: th.fs(15), textAlignVertical: 'top' }, th.f('body')]}
      />
    </View>
  );
}

export function CookEntryRow({ entry, showTitle, onPress, onLongPress }: { entry: CookEntry; showTitle?: boolean; onPress?: () => void; onLongPress?: () => void }) {
  const th = useTheme();
  const date = new Date(entry.at).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: new Date(entry.at).getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress}
      style={({ pressed }) => ({ flexDirection: 'row', gap: 12, padding: 12, borderRadius: th.radiusSm, backgroundColor: pressed ? th.c.soft : th.c.surface, borderWidth: 1, borderColor: th.c.line })}>
      {entry.photo ? <Image source={{ uri: entry.photo }} style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: th.c.soft }} /> : null}
      <View style={{ flex: 1, gap: 3 }}>
        {showTitle ? <Txt weight="black" size={16} numberOfLines={1}>{entry.title}</Txt> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Txt muted size={13} weight="bold">{date}</Txt>
          {entry.rating ? <Stars value={entry.rating} size={13} /> : null}
        </View>
        {entry.note ? <Txt size={14} numberOfLines={3}>{entry.note}</Txt> : !showTitle ? <Txt muted size={14}>No notes</Txt> : null}
      </View>
    </Pressable>
  );
}
