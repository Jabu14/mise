// QR scanner for Mise share codes: a full-screen camera with a square viewfinder. Scanning a Mise
// code opens what was shared; anything else (a website, a Wi-Fi code…) gets a gentle "not a Mise
// code" note instead of being opened.
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Animated, Easing, Pressable, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Btn, Icon, Txt } from '../components/ui';
import { SHARE_PREFIX, decodeShare } from '../lib/share-code';
import { useApp } from '../lib/store';

export default function QrScanScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { settings } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const [paused, setPaused] = useState(false);
  const [note, setNote] = useState('');
  const [torch, setTorch] = useState(false);
  const [sweep] = useState(() => new Animated.Value(0));
  const box = Math.min(width - 80, 300);

  useFocusEffect(useCallback(() => { setPaused(false); setNote(''); }, []));

  // A line gliding up and down inside the frame while it looks for a code.
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(sweep, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(sweep, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [sweep]);

  const scanned = (data: string) => {
    if (paused) return;
    if (data.startsWith(SHARE_PREFIX) && decodeShare(data)) {
      setPaused(true);
      if (settings.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace({ pathname: '/s/[code]', params: { code: data.slice(SHARE_PREFIX.length) } });
    } else if (!note) {
      if (settings.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      setNote('That’s not a Mise code. Ask them to show it from Mise → Account → QR.');
      setTimeout(() => setNote(''), 2600);
    }
  };

  const corner = (pos: object) => (
    <View style={[{ position: 'absolute', width: 42, height: 42, borderColor: '#FFFFFF' }, pos]} />
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {permission?.granted ? (
        <CameraView style={{ flex: 1 }} facing="back" enableTorch={torch} barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={paused ? undefined : r => scanned(r.data)} />
      ) : null}

      {/* Dimmed surroundings with a clear square in the middle */}
      <View pointerEvents="box-none" style={{ position: 'absolute', inset: 0 }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} />
        <View style={{ flexDirection: 'row', height: box }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} />
          <View style={{ width: box, height: box }}>
            {corner({ top: 0, left: 0, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 26 })}
            {corner({ top: 0, right: 0, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 26 })}
            {corner({ bottom: 0, left: 0, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 26 })}
            {corner({ bottom: 0, right: 0, borderBottomWidth: 5, borderRightWidth: 5, borderBottomRightRadius: 26 })}
            {permission?.granted ? (
              <Animated.View style={{ position: 'absolute', left: 18, right: 18, height: 3, borderRadius: 2, backgroundColor: '#FFFFFF', opacity: 0.8, transform: [{ translateY: sweep.interpolate({ inputRange: [0, 1], outputRange: [18, box - 18] }) }] }} />
            ) : null}
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} />
        </View>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', paddingTop: 28, paddingHorizontal: 32, gap: 10 }}>
          <Txt weight="black" size={18} color="#FFFFFF">Scan a Mise QR code</Txt>
          <Txt size={14} color="#FFFFFF" style={{ opacity: 0.8, textAlign: 'center' }}>Point your camera at the code on their screen.</Txt>
          {note ? (
            <View style={{ marginTop: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)' }}>
              <Txt size={14} weight="bold" color="#FFFFFF" style={{ textAlign: 'center' }}>{note}</Txt>
            </View>
          ) : null}
          {!permission?.granted ? (
            <View style={{ marginTop: 12, alignItems: 'center', gap: 10 }}>
              <Txt size={14} color="#FFFFFF" style={{ opacity: 0.8, textAlign: 'center' }}>Mise needs the camera to read QR codes.</Txt>
              <Btn title={permission?.canAskAgain === false ? 'Open Settings to allow' : 'Allow camera'} icon="camera-outline" onPress={requestPermission} />
            </View>
          ) : null}
        </View>
      </View>

      {/* Top buttons */}
      <View style={{ position: 'absolute', top: insets.top + 10, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Close" style={{ width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)' }}>
          <Icon name="close" size={24} color="#FFFFFF" />
        </Pressable>
        {permission?.granted ? (
          <Pressable onPress={() => setTorch(t => !t)} accessibilityLabel={torch ? 'Turn off the light' : 'Turn on the light'} style={{ width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: torch ? '#FFFFFF' : 'rgba(255,255,255,0.18)' }}>
            <Icon name={torch ? 'flashlight' : 'flashlight-outline'} size={22} color={torch ? '#000' : '#FFFFFF'} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
