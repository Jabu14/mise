import { Fraunces_500Medium, Fraunces_700Bold, Fraunces_800ExtraBold } from '@expo-google-fonts/fraunces';
import { Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { Nunito_500Medium, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold, PlayfairDisplay_800ExtraBold } from '@expo-google-fonts/playfair-display';
import { Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { useFonts } from 'expo-font';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TimerIslandHost } from '../components/timer-island';
import { ChatProvider } from '../lib/chat-store';
import { AppProvider, useApp } from '../lib/store';
import { useTheme } from '../lib/theme';

// If a screen ever crashes, show a friendly screen with a retry instead of closing the app.
// Kept dependency-free (no theme/store) so it still works if those are what broke.
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32, backgroundColor: '#FBF6EF' }}>
      <Text style={{ fontSize: 48 }}>🍞</Text>
      <Text style={{ fontSize: 22, fontWeight: '800', color: '#2A1F17', textAlign: 'center' }}>Something went wrong</Text>
      <Text style={{ fontSize: 15, color: '#7C6B5D', textAlign: 'center' }}>Your recipes are safe. Try again, and if it keeps happening, restart the app.</Text>
      <Pressable onPress={retry} style={{ marginTop: 8, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 999, backgroundColor: '#B8622B' }}>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Try again</Text>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_500Medium, Fraunces_700Bold, Fraunces_800ExtraBold, Nunito_500Medium, Nunito_700Bold, Nunito_800ExtraBold,
    Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold, PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold, PlayfairDisplay_800ExtraBold,
    Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold,
  });
  return (
    <SafeAreaProvider>
      <AppProvider>
        <ChatProvider>
          <Shell fontsLoaded={fontsLoaded} />
        </ChatProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}

function Shell({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { ready } = useApp();
  const th = useTheme();
  if (!ready || !fontsLoaded) return <View style={{ flex: 1, backgroundColor: th.c.bg }} />;
  return (
    <>
      <StatusBar style={th.dark ? 'light' : 'dark'} />
      <TimerIslandHost>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: th.c.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="recipe/[id]" />
        <Stack.Screen name="edit/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="appearance" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="about" />
        <Stack.Screen name="feedback" />
        <Stack.Screen name="recipe-prompt" />
        <Stack.Screen name="help" />
        <Stack.Screen name="legal" />
        <Stack.Screen name="sous-settings" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="usage" />
        <Stack.Screen name="voice-settings" />
        <Stack.Screen name="plus" options={{ presentation: 'modal' }} />
        <Stack.Screen name="timer/[id]" />
        <Stack.Screen name="timer-new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="voice" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="cook/[id]" options={{ gestureEnabled: false, animation: 'fade_from_bottom' }} />
      </Stack>
      </TimerIslandHost>
    </>
  );
}
