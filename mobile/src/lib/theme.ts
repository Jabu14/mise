// Colours, fonts and sizes. Mirrors the look & feel options of the web app.
import { useColorScheme } from 'react-native';
import { useApp } from './store';

export const THEMES = {
  sourdough: { name: 'Sourdough', accent: '#B8622B', bg: '#FBF6EF', soft: '#F3E9DC', line: '#E8DAC6' },
  sage: { name: 'Sage', accent: '#4E7D50', bg: '#F5F7F1', soft: '#E7EDE0', line: '#D6E0CC' },
  tomato: { name: 'Tomato', accent: '#C9432F', bg: '#FCF5F2', soft: '#F6E4DD', line: '#EDD3CA' },
  blueberry: { name: 'Blueberry', accent: '#4361CF', bg: '#F4F6FC', soft: '#E5E9F7', line: '#D3DAF0' },
  plum: { name: 'Plum', accent: '#8746B3', bg: '#F8F4FB', soft: '#EDE4F4', line: '#DFD2EA' },
  teal: { name: 'Teal', accent: '#13777B', bg: '#F2F8F7', soft: '#E1EEEC', line: '#CDE2DF' },
  honey: { name: 'Honey', accent: '#A87700', bg: '#FCF8EC', soft: '#F5EDD3', line: '#EADFBD' },
  charcoal: { name: 'Charcoal', accent: '#2F2F2F', accentDark: '#ECE6DC', bg: '#F6F5F2', soft: '#EBE9E4', line: '#DDDAD3' },
} as const;

export type ThemeKey = keyof typeof THEMES;
export type Weight = 'regular' | 'bold' | 'black';

type FontSet = { name: string; head: Record<Weight, string> | null; body: Record<Weight, string> | null };
const FRAUNCES = { regular: 'Fraunces_500Medium', bold: 'Fraunces_700Bold', black: 'Fraunces_800ExtraBold' };
const NUNITO = { regular: 'Nunito_500Medium', bold: 'Nunito_700Bold', black: 'Nunito_800ExtraBold' };

// null = the phone's own system font
export const FONTS: Record<string, FontSet> = {
  classic: { name: 'Classic', head: FRAUNCES, body: NUNITO },
  modern: { name: 'Modern', head: null, body: null },
  rounded: { name: 'Rounded', head: NUNITO, body: NUNITO },
  cookbook: { name: 'Cookbook', head: FRAUNCES, body: FRAUNCES },
};

export const TEXT_SIZES: Record<string, number> = { s: 0.92, m: 1, l: 1.12, xl: 1.26 };

export function mix(a: string, b: string, t: number) {
  const rgb = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [rgb(a), rgb(b)];
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

export function useTheme() {
  const { settings } = useApp();
  const system = useColorScheme();
  const dark = settings.mode === 'dark' || (settings.mode === 'auto' && system === 'dark');
  const t = THEMES[settings.theme as ThemeKey] || THEMES.sourdough;
  const font = FONTS[settings.font] || FONTS.classic;
  const scale = TEXT_SIZES[settings.textSize] || 1;
  const flat = settings.cards === 'flat';

  const c = dark
    ? (() => {
        const accent = 'accentDark' in t ? t.accentDark : mix(t.accent, '#ffffff', 0.38);
        const surface = mix('#1C1A18', t.accent, 0.08);
        return {
          bg: mix('#121110', t.accent, 0.06),
          surface,
          soft: mix('#262320', t.accent, 0.12),
          line: mix('#36322E', t.accent, 0.14),
          text: '#F4ECE3',
          muted: '#B3A698',
          accent,
          onAccent: '#17110C',
          accentSoft: mix(surface, accent, 0.16),
          temp: '#FF8D7E',
          tipBg: mix(surface, '#E8A800', 0.14),
          tipInk: '#F1C453',
          tray: '#F4ECE3',
          onTray: '#17110C',
        };
      })()
    : {
        bg: t.bg,
        surface: '#FFFFFF',
        soft: t.soft,
        line: t.line,
        text: '#2A1F17',
        muted: '#7C6B5D',
        accent: t.accent as string,
        onAccent: '#FFFFFF',
        accentSoft: mix('#FFFFFF', t.accent, 0.13),
        temp: '#C2382B',
        tipBg: mix('#FFFFFF', '#E8A800', 0.14),
        tipInk: '#A57300',
        tray: '#2A1F17',
        onTray: '#FBF6EF',
      };

  // Font style for a text role. System fonts use fontWeight instead of separate font files.
  const f = (role: 'head' | 'body', weight: Weight = 'regular') => {
    const set = font[role];
    if (set) return { fontFamily: set[weight] };
    return { fontWeight: weight === 'regular' ? ('500' as const) : weight === 'bold' ? ('700' as const) : ('800' as const) };
  };

  return {
    dark,
    c,
    f,
    fs: (n: number) => Math.round(n * scale * 10) / 10,
    radius: flat ? 10 : 20,
    radiusSm: flat ? 8 : 12,
    flat,
    card: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: flat ? c.line : mix(c.surface, c.line, 0.7),
      borderRadius: flat ? 10 : 20,
      ...(flat || dark
        ? {}
        : { shadowColor: '#3C2814', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 2 }),
    },
    settings,
  };
}

export type Theme = ReturnType<typeof useTheme>;

export function hue(s: string) {
  return [...String(s)].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 17);
}

// Soft pastel tile behind a recipe's emoji.
export function artColor(title: string, dark: boolean) {
  return `hsl(${hue(title)}, ${dark ? 22 : 70}%, ${dark ? 22 : 90}%)`;
}
