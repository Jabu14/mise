// Mise Plus: the subscription page. A hero with one of the cooks, what's included, two plans side by
// side, how the free trial works, and a sticky "Start my free week" button.
// Payments aren't connected yet: the buttons explain that Plus is coming soon. Prices are placeholders
// to settle before launch (they must match what's set up in App Store Connect / Google Play).
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { StepScene } from '../components/art/step-scenes';
import { Glass } from '../components/glass';
import { Btn, Icon, Txt } from '../components/ui';
import { AI_NAME } from '../lib/chat-store';
import { mix, useTheme } from '../lib/theme';

const PLANS = {
  yearly: { label: 'Yearly', price: '$39.99', per: '/ year', small: '$3.33 / month', badge: 'SAVE 33%' },
  monthly: { label: 'Monthly', price: '$4.99', per: '/ month', small: 'Billed monthly', badge: null },
} as const;
type Plan = keyof typeof PLANS;

const INCLUDED = [
  'Unlimited Import with AI',
  `${AI_NAME} with memory, on every step`,
  'Voice commands while you cook',
  'Meal planner and shopping list',
  'Sync on all your devices',
  'Seasonal looks for the cooks',
];

const TRIAL: { icon: 'lock-open-outline' | 'notifications-outline' | 'star-outline'; title: string; text: string }[] = [
  { icon: 'lock-open-outline', title: 'Today', text: 'Everything in Plus unlocks.' },
  { icon: 'notifications-outline', title: 'Day 5', text: 'We remind you that your trial is ending.' },
  { icon: 'star-outline', title: 'Day 7', text: 'Your plan starts. Cancel anytime before.' },
];

export default function PlusScreen() {
  const th = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [plan, setPlan] = useState<Plan>('yearly');
  const top = th.c.accent;
  const bottom = mix(th.c.accent, '#000000', 0.35);

  const soon = () => Alert.alert('Mise Plus is coming soon', 'Subscriptions aren’t open yet. Everything in Mise is free while we get Plus ready.');

  return (
    <View style={{ flex: 1, backgroundColor: th.c.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 190 + insets.bottom }} bounces={false}>
        {/* Hero */}
        <View style={{ paddingTop: insets.top + 8, paddingBottom: 28, alignItems: 'center', overflow: 'hidden' }}>
          <Svg style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} width="100%" height="100%" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="hero" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={top} />
                <Stop offset="1" stopColor={bottom} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#hero)" />
          </Svg>
          <View style={{ alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14 }}>
            <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Close" hitSlop={6}>
              <Glass tint={0.25} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderColor: '#FFFFFF33' }}>
                <Icon name="close" size={20} color="#FFFFFF" />
              </Glass>
            </Pressable>
            <Pressable onPress={soon} hitSlop={8}><Txt weight="bold" size={14} color="#FFFFFF" style={{ opacity: 0.9 }}>Restore</Txt></Pressable>
          </View>
          <StepScene step={{ title: 'Serve', text: 'serve' }} index={2} width={Math.min(width - 60, 300)} />
          <Txt kind="head" weight="bold" size={34} color="#FFFFFF" style={{ marginTop: 4 }}>Mise Plus</Txt>
          <Txt size={16} color="#FFFFFF" style={{ opacity: 0.88, textAlign: 'center', maxWidth: 300, marginTop: 4 }}>Everything you need to cook with confidence.</Txt>
        </View>

        <View style={{ padding: 20, gap: 26 }}>
          {/* What's included */}
          <View style={{ gap: 12 }}>
            {INCLUDED.map(item => (
              <View key={item} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accent }}>
                  <Icon name="checkmark" size={15} color={th.c.onAccent} />
                </View>
                <Txt weight="bold" size={16} style={{ flex: 1 }}>{item}</Txt>
              </View>
            ))}
          </View>

          {/* Plans, side by side */}
          <View style={{ flexDirection: 'row', gap: 12, paddingTop: 8 }}>
            {(Object.keys(PLANS) as Plan[]).map(key => {
              const p = PLANS[key];
              const on = plan === key;
              return (
                <Pressable key={key} onPress={() => setPlan(key)} accessibilityRole="radio" accessibilityState={{ selected: on }} style={{ flex: 1 }}>
                  <View style={{ minHeight: 132, padding: 16, paddingTop: 20, borderRadius: 22, borderWidth: 2.5, borderColor: on ? th.c.accent : th.c.line, backgroundColor: on ? th.c.accentSoft : th.c.surface, gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Txt weight="black" size={16}>{p.label}</Txt>
                      <View style={{ width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: on ? 0 : 2, borderColor: th.c.line, backgroundColor: on ? th.c.accent : 'transparent' }}>
                        {on ? <Icon name="checkmark" size={14} color={th.c.onAccent} /> : null}
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3, marginTop: 10 }}>
                      <Txt kind="head" weight="bold" size={26}>{p.price}</Txt>
                      <Txt muted size={13} weight="bold">{p.per}</Txt>
                    </View>
                    <Txt muted size={13}>{p.small}</Txt>
                  </View>
                  {p.badge ? (
                    <View style={{ position: 'absolute', top: -11, alignSelf: 'center', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: th.c.accent }}>
                      <Txt weight="black" size={11} color={th.c.onAccent}>{p.badge}</Txt>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {/* How the trial works */}
          <View style={{ gap: 4 }}>
            <Txt kind="head" weight="bold" size={20} style={{ marginBottom: 8 }}>How your free week works</Txt>
            {TRIAL.map((t, i) => (
              <View key={t.title} style={{ flexDirection: 'row', gap: 14 }}>
                <View style={{ alignItems: 'center' }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: i === 0 ? th.c.accent : th.c.accentSoft }}>
                    <Icon name={t.icon} size={18} color={i === 0 ? th.c.onAccent : th.c.accent} />
                  </View>
                  {i < TRIAL.length - 1 ? <View style={{ width: 3, flex: 1, minHeight: 18, borderRadius: 2, backgroundColor: th.c.accentSoft }} /> : null}
                </View>
                <View style={{ flex: 1, paddingTop: 6, paddingBottom: 14 }}>
                  <Txt weight="black">{t.title}</Txt>
                  <Txt muted size={14}>{t.text}</Txt>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Sticky call to action */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 14, paddingBottom: insets.bottom + 12, gap: 8, backgroundColor: th.c.bg, borderTopWidth: 1, borderTopColor: th.c.line }}>
        <Btn title="Start my free week" size="big" onPress={soon} />
        <Txt muted size={12} style={{ textAlign: 'center' }}>7 days free, then {PLANS[plan].price}{PLANS[plan].per.replace('/ ', '/')}. Cancel anytime.</Txt>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 18 }}>
          <Pressable onPress={() => router.push('/legal?doc=terms')} hitSlop={8}><Txt weight="bold" size={12} muted>Terms</Txt></Pressable>
          <Pressable onPress={() => router.push('/legal?doc=privacy')} hitSlop={8}><Txt weight="bold" size={12} muted>Privacy</Txt></Pressable>
          <Pressable onPress={soon} hitSlop={8}><Txt weight="bold" size={12} muted>Restore purchases</Txt></Pressable>
        </View>
      </View>
    </View>
  );
}
