// Mise's own icon set: rounded, slightly heavier strokes than the stock icons, drawn on a 24×24 grid.
// <Icon> (ui.tsx) uses these whenever a name is listed here and falls back to Ionicons otherwise.
import Svg, { Circle, Path, Rect } from 'react-native-svg';

type Shape =
  | { d: string; fill?: boolean }
  | { circle: [number, number, number]; fill?: boolean }
  | { rect: [number, number, number, number, number]; fill?: boolean };

const STROKE = 2.25;

const compose: Shape[] = [
  { d: 'M11 4H7.5A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5V13' },
  { d: 'M17.6 3.6a2.05 2.05 0 0 1 2.9 2.9L12.9 14.1 9.5 15l.9-3.4 7.2-8Z' },
];
const timer: Shape[] = [{ circle: [12, 13.5, 7.5] }, { d: 'M12 10v3.5l2.2 2' }, { d: 'M10 2.5h4' }, { d: 'M18.5 5.5l1.5 1.5' }];
const person: Shape[] = [{ circle: [12, 12, 9.5] }, { circle: [12, 10, 3.2] }, { d: 'M6.3 18.6a7 7 0 0 1 11.4 0' }];
const pin: Shape[] = [{ d: 'M9 3.5h6' }, { d: 'M10 3.5v5.5L7 13.5h10L14 9V3.5' }, { d: 'M12 13.5V21' }];

export const GLYPHS: Record<string, Shape[]> = {
  'arrow-back': [{ d: 'M19 12H5' }, { d: 'M11.5 18.5 5 12l6.5-6.5' }],
  'arrow-up': [{ d: 'M12 19V5' }, { d: 'M5.5 11.5 12 5l6.5 6.5' }],
  'arrow-down': [{ d: 'M12 5v14' }, { d: 'M18.5 12.5 12 19l-6.5-6.5' }],
  'arrow-forward': [{ d: 'M5 12h14' }, { d: 'M12.5 5.5 19 12l-6.5 6.5' }],
  'chevron-back': [{ d: 'M15 18.5 8.5 12 15 5.5' }],
  'chevron-forward': [{ d: 'M9 18.5l6.5-6.5L9 5.5' }],
  'chevron-down': [{ d: 'M5.5 9l6.5 6.5L18.5 9' }],
  'chevron-up': [{ d: 'M18.5 15 12 8.5 5.5 15' }],
  close: [{ d: 'M18 6 6 18' }, { d: 'M6 6l12 12' }],
  menu: [{ d: 'M4 8.5h16' }, { d: 'M4 15.5h10' }],
  search: [{ circle: [10.8, 10.8, 6.8] }, { d: 'M20 20l-4.2-4.2' }],
  'ellipsis-horizontal': [{ circle: [5, 12, 1.9], fill: true }, { circle: [12, 12, 1.9], fill: true }, { circle: [19, 12, 1.9], fill: true }],
  'create-outline': compose,
  'pencil-outline': [{ d: 'M16.9 3.6a2.4 2.4 0 0 1 3.5 3.5L8 19.5l-4.5 1 1-4.5Z' }, { d: 'M14.5 6l3.5 3.5' }],
  'trash-outline': [{ d: 'M4 6.5h16' }, { d: 'M9 6.5V4.8A1.8 1.8 0 0 1 10.8 3h2.4A1.8 1.8 0 0 1 15 4.8v1.7' }, { d: 'M18.2 6.5l-.8 12.4a2.2 2.2 0 0 1-2.2 2.1H8.8a2.2 2.2 0 0 1-2.2-2.1L5.8 6.5' }, { d: 'M10 11v5.5' }, { d: 'M14 11v5.5' }],
  'share-outline': [{ d: 'M12 3.5v11' }, { d: 'M7.5 8 12 3.5 16.5 8' }, { d: 'M5 13v5.5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V13' }],
  'pin-outline': pin,
  pin: [{ d: 'M9 3.5h6' }, { d: 'M10 3.5v5.5L7 13.5h10L14 9V3.5Z', fill: true }, { d: 'M12 13.5V21' }],
  add: [{ d: 'M12 5v14' }, { d: 'M5 12h14' }],
  remove: [{ d: 'M5 12h14' }],
  checkmark: [{ d: 'M20 6.5 9.5 17 4 11.5' }],
  'settings-outline': [{ d: 'M4 7h9' }, { d: 'M17 7h3' }, { circle: [15, 7, 2.2] }, { d: 'M4 17h3' }, { d: 'M11 17h9' }, { circle: [9, 17, 2.2] }],
  'copy-outline': [{ rect: [8.5, 8.5, 12, 12, 2.6] }, { d: 'M15.5 8.5V6.1A2.6 2.6 0 0 0 12.9 3.5H6.1A2.6 2.6 0 0 0 3.5 6.1v6.8a2.6 2.6 0 0 0 2.6 2.6h2.4' }],
  'timer-outline': timer,
  timer,
  refresh: [{ d: 'M20 11a8 8 0 0 0-14.3-4.6L4 8.5' }, { d: 'M4 4v4.5h4.5' }, { d: 'M4 13a8 8 0 0 0 14.3 4.6L20 15.5' }, { d: 'M20 20v-4.5h-4.5' }],
  'mic-outline': [{ rect: [9, 3, 6, 11, 3] }, { d: 'M18.5 11a6.5 6.5 0 0 1-13 0' }, { d: 'M12 17.5V21' }],
  send: [{ d: 'M21 3 10.5 13.5' }, { d: 'M21 3l-6.5 18-4-7.5L3 9.5Z' }],
  play: [{ d: 'M7.5 5.2v13.6a1 1 0 0 0 1.5.9l10.6-6.8a1 1 0 0 0 0-1.7L9 4.3a1 1 0 0 0-1.5.9Z', fill: true }],
  pause: [{ rect: [6, 4.5, 4, 15, 1.4], fill: true }, { rect: [14, 4.5, 4, 15, 1.4], fill: true }],
  stop: [{ rect: [5.5, 5.5, 13, 13, 2.8], fill: true }],
  'chatbubble-outline': [{ d: 'M20.5 11.5a8.3 8.3 0 0 1-12.2 7.3L3.5 20.5l1.6-4.6A8.3 8.3 0 1 1 20.5 11.5Z' }],
  'book-outline': [{ d: 'M4.5 19V5.5A2.5 2.5 0 0 1 7 3h12.5v18H7a2.5 2.5 0 0 1 0-5h12.5' }],
  'help-circle-outline': [{ circle: [12, 12, 9.5] }, { d: 'M9.3 9.2a2.8 2.8 0 0 1 5.4 1c0 1.9-2.7 2.6-2.7 2.6' }, { d: 'M12 17h.01' }],
  'bug-outline': [{ d: 'M10.3 4.2 2.6 17.6A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-2.9L13.7 4.2a2 2 0 0 0-3.4 0Z' }, { d: 'M12 9.5v4' }, { d: 'M12 17h.01' }],
  'chatbox-ellipses-outline': [{ d: 'M20.5 15a2.5 2.5 0 0 1-2.5 2.5H8L3.5 21V6A2.5 2.5 0 0 1 6 3.5h12A2.5 2.5 0 0 1 20.5 6Z' }, { d: 'M8.5 10.5h.01' }, { d: 'M12 10.5h.01' }, { d: 'M15.5 10.5h.01' }],
  'information-circle-outline': [{ circle: [12, 12, 9.5] }, { d: 'M12 16.5v-5' }, { d: 'M12 7.8h.01' }],
  'document-text-outline': [{ d: 'M14 3H7a2.5 2.5 0 0 0-2.5 2.5v13A2.5 2.5 0 0 0 7 21h10a2.5 2.5 0 0 0 2.5-2.5V8.5Z' }, { d: 'M14 3v5.5h5.5' }, { d: 'M15.5 13h-7' }, { d: 'M15.5 17h-7' }],
  'color-palette-outline': [{ d: 'M12 21a9 9 0 1 1 9-9c0 2.5-2 3.6-3.7 3.6h-1.8a1.8 1.8 0 0 0-1.4 3A1.6 1.6 0 0 1 12 21Z' }, { circle: [7.6, 11, 1.2], fill: true }, { circle: [10.5, 7.3, 1.2], fill: true }, { circle: [15, 7.8, 1.2], fill: true }],
  'shield-checkmark-outline': [{ d: 'M12 21.5s7.5-3.2 7.5-9.5V5.5L12 2.5l-7.5 3V12c0 6.3 7.5 9.5 7.5 9.5Z' }, { d: 'M8.8 12l2.2 2.2 4.3-4.4' }],
  'camera-outline': [{ d: 'M14.6 4H9.4L7.5 6.5H5A2.5 2.5 0 0 0 2.5 9v8.5A2.5 2.5 0 0 0 5 20h14a2.5 2.5 0 0 0 2.5-2.5V9A2.5 2.5 0 0 0 19 6.5h-2.5Z' }, { circle: [12, 13, 3.6] }],
  'images-outline': [{ rect: [3, 3, 18, 18, 3.5] }, { circle: [9, 9, 2] }, { d: 'M21 15.5l-3.3-3.3a2 2 0 0 0-2.8 0L6 21' }],
  list: [{ d: 'M9 6h11' }, { d: 'M9 12h11' }, { d: 'M9 18h11' }, { d: 'M4.5 6h.01' }, { d: 'M4.5 12h.01' }, { d: 'M4.5 18h.01' }],
  'person-circle-outline': person,
  'person-circle': person,
};

export function Glyph({ name, size, color }: { name: string; size: number; color: string }) {
  const shapes = GLYPHS[name];
  // Active tab icons (filled names) are drawn a touch bolder.
  const sw = name === 'timer' || name === 'person-circle' ? STROKE + 0.5 : STROKE;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {shapes.map((s, i) => {
        const fill = s.fill ? color : 'none';
        if ('circle' in s) return <Circle key={i} cx={s.circle[0]} cy={s.circle[1]} r={s.circle[2]} fill={fill} stroke={s.fill ? 'none' : color} />;
        if ('rect' in s) return <Rect key={i} x={s.rect[0]} y={s.rect[1]} width={s.rect[2]} height={s.rect[3]} rx={s.rect[4]} fill={fill} stroke={s.fill ? 'none' : color} />;
        return <Path key={i} d={s.d} fill={fill} />;
      })}
    </Svg>
  );
}
