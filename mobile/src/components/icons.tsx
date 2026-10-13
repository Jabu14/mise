// Custom icons drawn for Mise (same stroke style as the rest of the icon set).
import { useEffect, useState } from 'react';
import { Animated } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// Sous (AI chat): a speech bubble with a sparkle inside; the sparkle fills in when active.
export function ChatSparkIcon({ size = 22, color, active }: { size?: number; color: string; active?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.6-5A8.5 8.5 0 1 1 21 11.5Z" fill={active ? color : 'none'} fillOpacity={active ? 0.16 : 0} />
      <Path d="M12.5 7.3l1.1 2.9 2.9 1.1-2.9 1.1-1.1 2.9-1.1-2.9-2.9-1.1 2.9-1.1Z" strokeWidth={1.6} fill={active ? color : 'none'} />
    </Svg>
  );
}

const CLOSED = ['M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20'];
const OPEN = ['M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2Z', 'M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7Z'];

// Recipes: the book is open while you're on the Recipes tab and closes when you leave,
// with a quick page-flip in between.
export function RecipeBookIcon({ size = 22, color, open }: { size?: number; color: string; open: boolean }) {
  const [shown, setShown] = useState(open);
  const [flip] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (open === shown) return;
    Animated.timing(flip, { toValue: 0, duration: 110, useNativeDriver: true }).start(() => {
      setShown(open);
      Animated.spring(flip, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
    });
  }, [open, shown, flip]);

  return (
    <Animated.View style={{ transform: [{ scaleX: flip }] }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {(shown ? OPEN : CLOSED).map(d => (
          <Path key={d} d={d} fill={shown ? color : 'none'} fillOpacity={shown ? 0.16 : 0} />
        ))}
      </Svg>
    </Animated.View>
  );
}

// Voice mode: sound-wave bars, the icon AI apps use for "talk to the assistant".
export function VoiceWaveIcon({ size = 22, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round">
      <Path d="M4 10v4M8 6.5v11M12 3.5v17M16 7.5v9M20 10.5v3" />
    </Svg>
  );
}
