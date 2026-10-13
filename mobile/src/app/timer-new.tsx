// "＋" on the Timers tab: set another timer while others keep running.
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { TimerPicker } from '../components/timer-picker';
import { Screen, Txt } from '../components/ui';

export default function NewTimer() {
  const [wheelActive, setWheelActive] = useState(false);
  return (
    <Screen>
      <View style={{ paddingTop: 20, paddingHorizontal: 16, paddingBottom: 6 }}>
        <Txt kind="head" weight="bold" size={26}>New timer</Txt>
      </View>
      <ScrollView scrollEnabled={!wheelActive} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <TimerPicker onStarted={() => router.back()} onCancel={() => router.back()} onWheelActive={setWheelActive} />
      </ScrollView>
    </Screen>
  );
}
