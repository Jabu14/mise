// Plays a Lottie animation for a step (phones). On the web this returns null and the drawn scene shows.
import LottieView from 'lottie-react-native';
import { H, W } from './kit';

export function LottieScene({ source, width, active }: { source: unknown; width: number; active: boolean }) {
  return (
    <LottieView
      source={source as never}
      autoPlay
      loop
      speed={active ? 1 : 0}
      resizeMode="contain"
      style={{ width, height: (H / W) * width }}
    />
  );
}
