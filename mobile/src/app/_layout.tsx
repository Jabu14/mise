import { Fraunces_500Medium, Fraunces_700Bold, Fraunces_800ExtraBold } from '@expo-google-fonts/fraunces';
import { Nunito_500Medium, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from '../lib/store';
import { useTheme } from '../lib/theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Fraunces_500Medium, Fraunces_700Bold, Fraunces_800ExtraBold, Nunito_500Medium, Nunito_700Bold, Nunito_800ExtraBold });
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Shell fontsLoaded={fontsLoaded} />
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
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: th.c.bg } }}>
        <Stack.Screen name="cook/[id]" options={{ gestureEnabled: false, animation: 'fade_from_bottom' }} />
      </Stack>
    </>
  );
}
