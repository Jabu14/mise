// Frosted glass: whatever is behind shows through, blurred (like iOS menus and the AI apps' buttons).
import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../lib/theme';

export function Glass({ style, children, strength = 40, tint = 0.55 }: { style?: StyleProp<ViewStyle>; children?: ReactNode; strength?: number; tint?: number }) {
  const th = useTheme();
  const alpha = Math.round(Math.min(1, Math.max(0, tint)) * 255).toString(16).padStart(2, '0');
  return (
    // zIndex keeps the blur behind the content everywhere (on the web, icons and text inputs
    // would otherwise slip underneath it).
    <View style={[{ overflow: 'hidden', borderWidth: 1, borderColor: th.c.line, zIndex: 0 }, style]}>
      <BlurView intensity={strength} tint={th.dark ? 'dark' : 'light'} style={[StyleSheet.absoluteFill, { zIndex: -1 }]} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: th.c.surface + alpha, zIndex: -1 }]} />
      {children}
    </View>
  );
}
