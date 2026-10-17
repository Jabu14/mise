// Food scanner: point the camera at a food barcode to see how healthy it is.
// You can also type the barcode, or reopen a recent scan. (Mise QR codes have their own scanner.)
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, TextInput, View, useWindowDimensions } from 'react-native';
import { Btn, Card, Icon, IconBtn, Screen, TopBar, Txt, PageTitle } from '../components/ui';
import { NUTRISCORE_COLORS, isBarcode, readRecentScans, type RecentScan } from '../lib/food';
import { useApp } from '../lib/store';
import { useTheme } from '../lib/theme';

export default function ScanScreen() {
  const th = useTheme();
  const { width } = useWindowDimensions();
  const { settings } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const [paused, setPaused] = useState(false);
  const [code, setCode] = useState('');
  const [recent, setRecent] = useState<RecentScan[]>([]);

  // Ready to scan again (and refresh recent scans) whenever you come back here.
  useFocusEffect(useCallback(() => {
    setPaused(false);
    readRecentScans().then(setRecent).catch(() => {});
  }, []));

  const open = (c: string) => {
    if (!isBarcode(c)) return;
    setPaused(true);
    if (settings.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    router.push(`/product/${c.trim()}`);
  };

  const box = Math.min(width - 32, 420);

  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <PageTitle>Scan food</PageTitle>
      </TopBar>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 48, gap: 16 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <View style={{ width: box, height: box * 0.78, alignSelf: 'center', borderRadius: 28, overflow: 'hidden', backgroundColor: '#111' }}>
          {permission?.granted ? (
            <>
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
                onBarcodeScanned={paused ? undefined : r => open(r.data)}
              />
              <View pointerEvents="none" style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: '72%', height: '42%', borderRadius: 18, borderWidth: 3, borderColor: '#FFFFFFDD' }} />
                <Txt weight="bold" size={14} color="#FFFFFF" style={{ marginTop: 14, opacity: 0.9 }}>Line up the barcode inside the frame</Txt>
              </View>
            </>
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
              <Icon name="barcode-outline" size={44} color="#FFFFFF" />
              <Txt weight="bold" color="#FFFFFF" style={{ textAlign: 'center' }}>Allow the camera to scan food barcodes</Txt>
              <Btn title={permission?.canAskAgain === false ? 'Camera is off in Settings' : 'Allow camera'} icon="camera-outline" size="small" onPress={requestPermission} disabled={permission?.canAskAgain === false} />
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 52, paddingLeft: 18, paddingRight: 6, borderRadius: 26, backgroundColor: th.c.surface, borderWidth: 1, borderColor: th.c.line }}>
          <Icon name="keypad-outline" size={20} color={th.c.muted} />
          <TextInput value={code} onChangeText={t => setCode(t.replace(/\D/g, '').slice(0, 14))} keyboardType="number-pad" placeholder="Or type the barcode number" placeholderTextColor={th.c.muted} returnKeyType="search" onSubmitEditing={() => open(code)}
            style={[{ flex: 1, minWidth: 0, color: th.c.text, fontSize: th.fs(16), paddingVertical: 0 }, th.f('body')]} />
          <Pressable onPress={() => open(code)} disabled={!isBarcode(code)} accessibilityRole="button" accessibilityLabel="Look up"
            style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: isBarcode(code) ? th.c.accent : th.c.soft }}>
            <Icon name="arrow-forward" size={20} color={isBarcode(code) ? th.c.onAccent : th.c.muted} />
          </Pressable>
        </View>

        {recent.length ? (
          <View style={{ gap: 8 }}>
            <Txt muted weight="black" size={13} style={{ marginLeft: 6, letterSpacing: 0.5 }}>RECENT SCANS</Txt>
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              {recent.map((s, i) => (
                <Pressable key={s.code} onPress={() => router.push(`/product/${s.code}`)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: pressed ? th.c.soft : 'transparent', borderBottomWidth: i === recent.length - 1 ? 0 : 1, borderBottomColor: th.c.line })}>
                  <View style={{ width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: s.nutriscore ? NUTRISCORE_COLORS[s.nutriscore] : th.c.soft }}>
                    <Txt weight="black" size={16} color={s.nutriscore ? '#FFFFFF' : th.c.muted}>{s.nutriscore ? s.nutriscore.toUpperCase() : '?'}</Txt>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt weight="bold" numberOfLines={1}>{s.name}</Txt>
                    {s.brand ? <Txt muted size={13} numberOfLines={1}>{s.brand}</Txt> : null}
                  </View>
                  <Icon name="chevron-forward" size={18} color={th.c.muted} />
                </Pressable>
              ))}
            </Card>
          </View>
        ) : (
          <Txt muted size={14} style={{ textAlign: 'center', marginHorizontal: 20 }}>Scan anything with a barcode: cereal, yogurt, sauces, snacks. You’ll see its Nutri-Score, how processed it is and what’s inside.</Txt>
        )}
      </ScrollView>
    </Screen>
  );
}
