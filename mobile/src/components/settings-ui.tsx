// Building blocks shared by the Appearance and Settings pages: titled groups, segmented choices, switches,
// plus the tappable rows used on the Account page.
import { Pressable, Switch, View } from 'react-native';
import { useApp, type Settings } from '../lib/store';
import { useTheme } from '../lib/theme';
import { Icon, Txt, type IconName } from './ui';

export function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 14 }}>
      <Txt kind="head" weight="bold" size={21}>{title}</Txt>
      {children}
    </View>
  );
}

export function Segmented({ label, k, options, columns, fontFor }: { label: string; k: keyof Settings; options: string[][]; columns?: number; fontFor?: (value: string) => string | undefined }) {
  const th = useTheme();
  const { settings, updateSettings } = useApp();
  return (
    <View style={{ gap: 8 }}>
      <Txt weight="black" size={14}>{label}</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, padding: 4, borderRadius: th.flat ? 10 : 24, backgroundColor: th.c.soft }}>
        {options.map(([value, text]) => {
          const on = settings[k] === value;
          return (
            <Pressable
              key={value}
              onPress={() => updateSettings({ [k]: value } as Partial<Settings>)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              style={{ flexGrow: 1, flexBasis: columns ? `${100 / columns - 3}%` : 0, minHeight: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, borderRadius: th.flat ? 8 : 20, backgroundColor: on ? th.c.surface : 'transparent' }}
            >
              <Txt weight="bold" size={14} muted={!on} style={fontFor?.(value) ? { fontFamily: fontFor(value) } : undefined}>{text}</Txt>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Toggle({ k, label, hint, last }: { k: keyof Settings; label: string; hint?: string; last?: boolean }) {
  const th = useTheme();
  const { settings, updateSettings } = useApp();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: th.c.line }}>
      <View style={{ flex: 1 }}>
        <Txt weight="bold">{label}</Txt>
        {hint ? <Txt muted size={13}>{hint}</Txt> : null}
      </View>
      <Switch value={!!settings[k]} onValueChange={v => updateSettings({ [k]: v } as Partial<Settings>)} trackColor={{ true: th.c.accent, false: th.c.line }} thumbColor="#fff" ios_backgroundColor={th.c.line} />
    </View>
  );
}

export function Row({ icon, title, value, badge, onPress, last, danger }: { icon: IconName; title: string; value?: string; badge?: string; onPress?: () => void; last?: boolean; danger?: boolean }) {
  const th = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 10, borderBottomWidth: last ? 0 : 1, borderBottomColor: th.c.line, opacity: pressed ? 0.6 : 1 })}
    >
      <View style={{ width: 28, alignItems: 'center' }}>
        <Icon name={icon} size={22} color={danger ? th.c.temp : th.c.accent} />
      </View>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Txt weight="bold" color={danger ? th.c.temp : undefined}>{title}</Txt>
        {badge ? <View style={{ paddingHorizontal: 8, paddingVertical: 1, borderRadius: 999, backgroundColor: th.c.soft }}><Txt weight="black" size={11} muted>{badge}</Txt></View> : null}
      </View>
      {value ? <Txt muted size={14}>{value}</Txt> : null}
      {onPress ? <Icon name="chevron-forward" size={18} color={th.c.muted} /> : null}
    </Pressable>
  );
}
