// Profile: your photo, name, email (when signed in) and cooking level.
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Image, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Group, Row, Segmented } from '../components/settings-ui';
import { Card, Icon, IconBtn, Screen, TopBar, Txt, PageTitle } from '../components/ui';
import { AI_NAME } from '../lib/chat-store';
import { AuthError, useAuth } from '../lib/auth';
import { keepPhoto } from '../lib/cook-log';
import { useApp } from '../lib/store';
import { useTheme } from '../lib/theme';
import { LIMITS } from '../lib/validate';
import { showAlert } from '../components/sheet';

export default function ProfileScreen() {
  const th = useTheme();
  const { settings, updateSettings } = useApp();
  const { user, setName, deleteAccount } = useAuth();

  const pickPhoto = async (camera: boolean) => {
    const permission = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [1, 1] };
    const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    const uri = !result.canceled ? result.assets?.[0]?.uri : null;
    if (uri) updateSettings({ avatar: await keepPhoto(uri, 'avatar').catch(() => uri) });
  };
  const photoMenu = () =>
    showAlert('Profile picture', undefined, [
      { text: 'Take photo', onPress: () => pickPhoto(true) },
      { text: 'Choose from library', onPress: () => pickPhoto(false) },
      ...(settings.avatar ? [{ text: 'Remove photo', style: 'destructive' as const, onPress: () => updateSettings({ avatar: '' }) }] : []),
      { text: 'Cancel', style: 'cancel' },
    ]);
  const confirmDelete = () =>
    showAlert('Delete your account?', 'Your account is removed. Recipes, plans and your journal stay on this phone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete account', style: 'destructive', onPress: () => deleteAccount().then(() => router.back()).catch(e => showAlert('Couldn’t delete', e instanceof AuthError ? e.message : 'Try again later.')) },
    ]);
  const initial = settings.name.trim().charAt(0).toUpperCase();
  const diets = settings.aiDiet.split(',').filter(Boolean);

  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <PageTitle>Profile</PageTitle>
      </TopBar>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 48, gap: 28 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', gap: 10 }}>
          <Pressable onPress={photoMenu} accessibilityLabel="Change profile picture">
            <View style={{ width: 112, height: 112, borderRadius: 56, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accentSoft }}>
              {settings.avatar ? <Image source={{ uri: settings.avatar }} style={{ width: 112, height: 112 }} />
                : initial ? <Txt kind="head" weight="bold" size={46} color={th.c.accent}>{initial}</Txt> : <Icon name="person" size={50} color={th.c.accent} />}
            </View>
            <View style={{ position: 'absolute', right: 0, bottom: 0, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accent, borderWidth: 3, borderColor: th.c.bg }}>
              <Icon name="camera" size={16} color={th.c.onAccent} />
            </View>
          </Pressable>
          <Txt muted size={13}>Tap to change your picture</Txt>
        </View>

        <Group title="About you">
          <View style={{ gap: 8 }}>
            <Txt weight="black" size={14}>Name</Txt>
            <TextInput value={settings.name} onChangeText={name => updateSettings({ name })} onEndEditing={() => { if (user) setName(settings.name); }} placeholder="Your name" placeholderTextColor={th.c.muted} maxLength={LIMITS.name} autoCorrect={false}
              style={[{ height: 50, paddingHorizontal: 16, borderRadius: th.radius, borderWidth: 1.5, borderColor: th.c.line, backgroundColor: th.c.surface, color: th.c.text, fontSize: th.fs(16) }, th.f('body')]} />
          </View>
          <Card style={{ paddingHorizontal: 6 }}>
            {user ? <Row icon="mail-outline" title="Email" value={user.email} last />
              : <Row icon="log-in-outline" title="Sign in to add your email" onPress={() => router.push('/sign-in')} last />}
          </Card>
          <Segmented label="Cooking level" k="aiSkill" options={[['beginner', 'Beginner'], ['home', 'Home cook'], ['confident', 'Confident']]} />
        </Group>

        <Group title="Food">
          <Card style={{ paddingHorizontal: 6 }}>
            <Row icon="leaf-outline" title="Diet and allergies" value={diets.length ? diets.join(', ') : 'None set'} onPress={() => router.push('/sous-settings')} last />
          </Card>
          <Txt muted size={13}>{`Shared with ${AI_NAME} settings, so answers fit how you eat.`}</Txt>
        </Group>

        {user ? (
          <Card style={{ paddingHorizontal: 6 }}>
            <Row icon="trash-outline" title="Delete account" danger last onPress={confirmDelete} />
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
