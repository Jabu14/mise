// Shared building blocks: text, buttons, cards, step layout, rich text, bottom dock with timers.
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { BottomTabBarHeightContext } from 'expo-router/js-tabs';
import { useContext, type ComponentProps, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTimers, type KitchenTimer, type Step } from '../lib/store';
import { mix, useTheme, type Weight } from '../lib/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

// ---------- Text ----------

type TxtProps = TextProps & {
  kind?: 'head' | 'body';
  weight?: Weight;
  size?: number;
  color?: string;
  muted?: boolean;
  style?: StyleProp<TextStyle>;
};

export function Txt({ kind = 'body', weight = 'regular', size = 16, color, muted, style, ...rest }: TxtProps) {
  const th = useTheme();
  return (
    <Text
      {...rest}
      style={[{ color: color || (muted ? th.c.muted : th.c.text), fontSize: th.fs(size), lineHeight: th.fs(size) * (kind === 'head' ? 1.2 : 1.5) }, th.f(kind, weight), style]}
    />
  );
}

export function Label({ children, color }: { children: ReactNode; color?: string }) {
  const th = useTheme();
  return (
    <Txt weight="black" size={12} color={color || th.c.accent} style={{ letterSpacing: 1, textTransform: 'uppercase' }}>
      {children}
    </Txt>
  );
}

export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color?: string }) {
  const th = useTheme();
  return <Ionicons name={name} size={size} color={color || th.c.text} />;
}

// ---------- Buttons ----------

type BtnProps = {
  title?: string;
  icon?: IconName;
  iconRight?: IconName;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'small' | 'normal' | 'big';
  disabled?: boolean;
  grow?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  textSize?: number;
};

export function Btn({ title, icon, iconRight, onPress, variant = 'primary', size = 'normal', disabled, grow, style, accessibilityLabel, textSize }: BtnProps) {
  const th = useTheme();
  const bg = { primary: th.c.accent, secondary: th.c.accentSoft, ghost: 'transparent', danger: '#C2382B' }[variant];
  const fg = { primary: th.c.onAccent, secondary: th.c.accent, ghost: th.c.accent, danger: '#fff' }[variant];
  const height = { small: 38, normal: 46, big: 58 }[size];
  const fontSize = textSize ?? { small: 14, normal: 16, big: 17 }[size];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, minHeight: height, paddingHorizontal: size === 'small' ? 14 : 20, opacity: disabled ? 0.45 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
        grow && { flex: 1 },
        variant === 'primary' && !disabled && !th.dark && { shadowColor: th.c.accent, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
        th.flat && size !== 'big' && { borderRadius: 10 },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={fontSize + 3} color={fg} />}
      {title ? <Txt weight="black" size={fontSize} color={fg}>{title}</Txt> : null}
      {iconRight && <Icon name={iconRight} size={fontSize + 3} color={fg} />}
    </Pressable>
  );
}

export function IconBtn({ name, onPress, label, tinted, size = 44, color }: { name: IconName; onPress: () => void; label: string; tinted?: boolean; size?: number; color?: string }) {
  const th = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' },
        tinted && { backgroundColor: th.c.accentSoft },
        pressed && { backgroundColor: th.c.soft },
      ]}
    >
      <Icon name={name} size={size * 0.5} color={color || (tinted ? th.c.accent : th.c.text)} />
    </Pressable>
  );
}

// ---------- Layout ----------

export function Screen({ children }: { children: ReactNode }) {
  const th = useTheme();
  return <View style={{ flex: 1, backgroundColor: th.c.bg }}>{children}</View>;
}

export function TopBar({ children }: { children: ReactNode }) {
  const th = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 8, paddingBottom: 6, flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: th.c.bg }}>
      {children}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const th = useTheme();
  return <View style={[th.card, style]}>{children}</View>;
}

export function Chip({ children, icon, outlined }: { children: ReactNode; icon?: IconName; outlined?: boolean }) {
  const th = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: outlined ? th.c.surface : th.c.soft, borderColor: outlined ? th.c.line : 'transparent' }]}>
      {icon && <Icon name={icon} size={14} color={th.c.accent} />}
      {typeof children === 'string' ? <Txt size={14}>{children}</Txt> : children}
    </View>
  );
}

// Fixed bottom area: running timers above the screen's main buttons.
// On tab screens it sits right above the tab bar, which already handles the phone's bottom edge.
export function Dock({ children, onHeight, hideTimers }: { children?: ReactNode; onHeight?: (h: number) => void; hideTimers?: boolean }) {
  const th = useTheme();
  const insets = useSafeAreaInsets();
  const inTabs = useContext(BottomTabBarHeightContext) != null;
  const { timers } = useTimers();
  const empty = !children && (hideTimers || !timers.length);
  return (
    <View
      onLayout={e => onHeight?.(empty ? 0 : e.nativeEvent.layout.height)}
      pointerEvents="box-none"
      style={[
        { position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: inTabs ? 10 : Math.max(insets.bottom, 12), paddingTop: 10, paddingHorizontal: 16, gap: 10, backgroundColor: th.c.bg + 'F2' },
        empty && { opacity: 0, paddingTop: 0, paddingBottom: 0 },
      ]}
    >
      {!hideTimers && <TimerTray />}
      {children ? <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>{children}</View> : null}
    </View>
  );
}

export function clock(ms: number) {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function TimerTray() {
  const { timers } = useTimers();
  if (!timers.length) return null;
  return <View style={{ gap: 8 }}>{timers.map(t => <TrayTimer key={t.id} t={t} />)}</View>;
}

// A running timer, styled like the iPhone's Dynamic Island timer: a black pill with a round pause
// button and a close button on the left, and the label + countdown in the accent colour on the right.
const ISLAND = '#0C0B0B';
function TrayTimer({ t }: { t: KitchenTimer }) {
  const th = useTheme();
  const { remaining, togglePause, removeTimer } = useTimers();
  const paused = t.pausedLeft != null;
  const accent = th.dark ? th.c.accent : mix(th.c.accent, '#FFFFFF', 0.15);
  return (
    <Pressable
      onPress={() => router.push(`/timer/${t.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${t.label}, ${t.done ? "time's up" : clock(remaining(t))}`}
      style={({ pressed }) => [styles.island, { backgroundColor: ISLAND, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
    >
      <Pressable
        onPress={() => (t.done ? removeTimer(t.id) : togglePause(t.id))}
        accessibilityRole="button"
        accessibilityLabel={t.done ? 'Stop timer' : paused ? 'Resume timer' : 'Pause timer'}
        style={[styles.islandBtn, { backgroundColor: mix(ISLAND, th.c.accent, 0.45) }]}
      >
        <Icon name={t.done ? 'stop' : paused ? 'play' : 'pause'} size={24} color={accent} />
      </Pressable>
      {!t.done && (
        <Pressable onPress={() => removeTimer(t.id)} accessibilityRole="button" accessibilityLabel="Cancel timer" style={[styles.islandBtn, { backgroundColor: '#2C2B2A' }]}>
          <Icon name="close" size={26} color="#FFFFFF" />
        </Pressable>
      )}
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'flex-end', gap: 8 }}>
        <Txt weight="bold" size={15} color={accent} numberOfLines={1} style={{ flexShrink: 1 }}>{t.done ? t.label : t.label.length > 14 ? 'Timer' : t.label}</Txt>
        <Txt weight="bold" size={t.done ? 22 : 34} color={accent} style={{ fontVariant: ['tabular-nums'], opacity: paused ? 0.6 : 1, lineHeight: t.done ? 30 : 40 }}>
          {t.done ? "Time's up!" : clock(remaining(t))}
        </Txt>
      </View>
    </Pressable>
  );
}

// ---------- Rich text (bold, bullets, highlighted times & temperatures) ----------

const TOKEN_RE = /(\*\*.+?\*\*)|(\b\d+(?:[.,]\d+)?(?:\s*(?:-|–|to)\s*\d+(?:[.,]\d+)?)?\s*(?:hours?|hrs?|minutes?|mins?|seconds?|secs?)\b)|(\b\d{2,3}\s*°\s*[CF]\b)/gi;

function InlineText({ text, highlight, size, color }: { text: string; highlight: boolean; size: number; color?: string }) {
  const th = useTheme();
  const parts: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN_RE)) {
    const i = m.index ?? 0;
    if (i > last) parts.push(text.slice(last, i));
    if (m[1]) parts.push(<Text key={i} style={th.f('body', 'black')}>{m[1].slice(2, -2)}</Text>);
    else if (!highlight) parts.push(m[0]);
    else parts.push(<Text key={i} style={[th.f('body', 'black'), { color: m[2] ? th.c.accent : th.c.temp }]}>{m[0]}</Text>);
    last = i + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <Txt size={size} color={color}>{parts}</Txt>;
}

export function RichText({ text, size = 16, highlight = false, color }: { text: string; size?: number; highlight?: boolean; color?: string }) {
  const th = useTheme();
  const lines = String(text || '').split('\n').map(l => l.trim()).filter(Boolean);
  return (
    <View style={{ gap: 10 }}>
      {lines.map((line, i) => {
        const bullet = line.match(/^(?:[•\-*]|\d+[.)])\s+(.*)$/);
        if (!bullet) return <InlineText key={i} text={line} highlight={highlight} size={size} color={color} />;
        return (
          <View key={i} style={{ flexDirection: 'row', gap: 10, paddingLeft: 4 }}>
            <Txt size={size} color={th.c.accent} weight="black">•</Txt>
            <View style={{ flex: 1 }}><InlineText text={bullet[1]} highlight={highlight} size={size} color={color} /></View>
          </View>
        );
      })}
    </View>
  );
}

// ---------- One recipe step (used in cook mode and the settings preview) ----------

export function StepBody({ step, number, text, compact, children }: { step: Step; number: number; text?: string; compact?: boolean; children?: ReactNode }) {
  const th = useTheme();
  const body = text ?? step.text;
  const badge = compact ? 36 : 46;
  return (
    <View style={{ gap: compact ? 14 : 20 }}>
      {step.phase ? (
        <View style={[styles.phase, { backgroundColor: th.c.accentSoft }]}><Label>{step.phase}</Label></View>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
        <View style={[styles.badge, { width: badge, height: badge, borderRadius: badge / 3, backgroundColor: th.c.accent }]}>
          <Txt kind="head" weight="black" size={compact ? 16 : 20} color={th.c.onAccent}>{number}</Txt>
        </View>
        {step.title ? <Txt kind="head" weight="bold" size={compact ? 21 : 30} style={{ flex: 1, paddingTop: compact ? 4 : 3 }}>{step.title}</Txt> : null}
      </View>
      {body ? <RichText text={body} size={compact ? 17 : step.title ? 20 : 23} highlight={th.settings.highlightTimes} /> : null}
      {children}
      {step.tip ? (
        <View style={[styles.tip, { backgroundColor: th.c.tipBg, borderRadius: th.radiusSm }]}>
          <Icon name="bulb-outline" size={20} color={th.c.tipInk} />
          <View style={{ flex: 1 }}><RichText text={step.tip} size={15} /></View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 999 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  island: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 8, paddingRight: 20, paddingVertical: 8, borderRadius: 40, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  islandBtn: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  phase: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  badge: { alignItems: 'center', justifyContent: 'center' },
  tip: { flexDirection: 'row', gap: 12, padding: 14 },
});
