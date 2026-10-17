// Sign in / Create account. Opens as a sheet from the Account tab. In demo mode (no online database
// yet) accounts are kept on this phone, and the screen says so.
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SlidingChoice } from '../components/sliding-choice';
import { Icon, IconBtn, Screen, Txt } from '../components/ui';
import { AuthError, useAuth } from '../lib/auth';
import { useApp } from '../lib/store';
import { useTheme } from '../lib/theme';

export default function SignInScreen() {
  const th = useTheme();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { signIn, signUp, resetPassword, mode: backend } = useAuth();
  const { settings, updateSettings } = useApp();
  const [mode, setMode] = useState<'in' | 'up'>(params.mode === 'up' ? 'up' : 'in');
  const [name, setName] = useState(settings.name);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const done = () => {
    if (settings.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (router.canGoBack()) router.back();
    else router.replace('/account');
  };

  const submit = async () => {
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      if (mode === 'in') {
        await signIn(email, password);
        done();
      } else {
        const result = await signUp(name, email, password);
        if (!settings.name.trim()) updateSettings({ name: name.trim().slice(0, 40) });
        if (result === 'confirm') {
          Alert.alert('Check your email', `We sent a link to ${email.trim()}. Open it to confirm your account, then sign in.`);
          setMode('in');
          setPassword('');
        } else done();
      }
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Something went wrong. Try again.');
      if (settings.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    setError('');
    try {
      await resetPassword(email);
      Alert.alert('Check your email', `If there’s an account for ${email.trim()}, we’ve sent a link to choose a new password.`);
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Something went wrong. Try again.');
    }
  };

  const soon = (what: string) => Alert.alert('Coming soon', `${what} sign-in arrives with Mise’s online accounts.`);

  const field = (props: React.ComponentProps<typeof TextInput>, icon: React.ComponentProps<typeof Icon>['name'], extra?: React.ReactNode) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 54, paddingHorizontal: 16, borderRadius: 16, backgroundColor: th.c.surface, borderWidth: 1.5, borderColor: th.c.line }}>
      <Icon name={icon} size={19} color={th.c.muted} />
      <TextInput placeholderTextColor={th.c.muted} {...props} style={[{ flex: 1, minWidth: 0, color: th.c.text, fontSize: th.fs(16), paddingVertical: 0 }, th.f('body')]} />
      {extra}
    </View>
  );

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 8, paddingTop: 4 }}>
          <IconBtn name="close" label="Close" onPress={() => (router.canGoBack() ? router.back() : router.replace('/account'))} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 0, gap: 16 }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <View style={{ width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accent }}>
              <Icon name="restaurant" size={34} color={th.c.onAccent} />
            </View>
            <Txt kind="head" weight="bold" size={28}>{mode === 'in' ? 'Welcome back' : 'Join Mise'}</Txt>
            <Txt muted style={{ textAlign: 'center', maxWidth: 300 }}>
              {mode === 'in' ? 'Sign in to your account.' : 'Create an account to keep your recipes, plans and journal with you.'}
            </Txt>
          </View>

          <SlidingChoice options={[['in', 'Sign in'], ['up', 'Create account']]} value={mode} onChange={v => { setMode(v as 'in' | 'up'); setError(''); }} height={42} />

          {mode === 'up' ? field({ value: name, onChangeText: setName, placeholder: 'Your name', autoCapitalize: 'words', textContentType: 'name', autoComplete: 'name', maxLength: 40, returnKeyType: 'next' }, 'person-outline') : null}
          {field({ value: email, onChangeText: setEmail, placeholder: 'Email', autoCapitalize: 'none', autoCorrect: false, keyboardType: 'email-address', textContentType: 'emailAddress', autoComplete: 'email', maxLength: 120, returnKeyType: 'next' }, 'mail-outline')}
          {field(
            { value: password, onChangeText: setPassword, placeholder: mode === 'up' ? 'Password (8+ characters)' : 'Password', secureTextEntry: !show, autoCapitalize: 'none', autoCorrect: false, textContentType: mode === 'up' ? 'newPassword' : 'password', autoComplete: mode === 'up' ? 'new-password' : 'current-password', maxLength: 72, returnKeyType: 'go', onSubmitEditing: submit },
            'lock-closed-outline',
            <Pressable onPress={() => setShow(s => !s)} hitSlop={10} accessibilityLabel={show ? 'Hide password' : 'Show password'}>
              <Icon name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={th.c.muted} />
            </Pressable>,
          )}

          {error ? (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: th.c.soft }}>
              <Icon name="alert-circle" size={18} color={th.c.temp} />
              <Txt size={14} style={{ flex: 1 }}>{error}</Txt>
            </View>
          ) : null}

          <Pressable onPress={submit} disabled={busy} accessibilityRole="button"
            style={({ pressed }) => ({ height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accent, opacity: pressed || busy ? 0.8 : 1 })}>
            {busy ? <ActivityIndicator color={th.c.onAccent} /> : <Txt weight="black" size={17} color={th.c.onAccent}>{mode === 'in' ? 'Sign in' : 'Create account'}</Txt>}
          </Pressable>

          {mode === 'in' ? (
            <Pressable onPress={forgot} hitSlop={8} style={{ alignSelf: 'center' }}>
              <Txt weight="bold" size={14} color={th.c.accent}>Forgot password?</Txt>
            </Pressable>
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: th.c.line }} />
            <Txt muted size={13}>or</Txt>
            <View style={{ flex: 1, height: 1, backgroundColor: th.c.line }} />
          </View>
          {([['logo-apple', 'Apple'], ['logo-google', 'Google']] as const).map(([icon, label]) => (
            <Pressable key={label} onPress={() => soon(label)} accessibilityRole="button"
              style={({ pressed }) => ({ flexDirection: 'row', height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1.5, borderColor: th.c.line, backgroundColor: pressed ? th.c.soft : th.c.surface })}>
              <Icon name={icon} size={20} color={th.c.text} />
              <Txt weight="bold">Continue with {label}</Txt>
              <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999, backgroundColor: th.c.soft }}><Txt weight="black" size={10} muted>SOON</Txt></View>
            </Pressable>
          ))}

          {backend === 'demo' ? (
            <View style={{ flexDirection: 'row', gap: 10, padding: 12, borderRadius: 14, backgroundColor: th.c.soft, marginTop: 4 }}>
              <Icon name="phone-portrait-outline" size={18} color={th.c.muted} />
              <Txt muted size={13} style={{ flex: 1 }}>Demo mode: accounts are kept on this phone until Mise’s online accounts are switched on.</Txt>
            </View>
          ) : null}
          <Txt muted size={12} style={{ textAlign: 'center' }}>
            By continuing you agree to the <Txt size={12} weight="bold" color={th.c.accent} onPress={() => router.push('/legal')}>Terms and Privacy Policy</Txt>.
          </Txt>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
