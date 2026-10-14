// Mise Plus: the subscription page (plans, what's included, free vs Plus).
// Payments aren't connected yet: the buttons explain that Plus is coming soon. Prices below are
// placeholders to settle before launch (and must match what's set up in App Store Connect / Play).
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { Btn, Card, Icon, IconBtn, Screen, TopBar, Txt, type IconName } from '../components/ui';
import { AI_NAME } from '../lib/chat-store';
import { useTheme } from '../lib/theme';
import { AI_IMPORTS_PER_DAY } from '../lib/usage';

const PLANS = {
  yearly: { label: 'Yearly', price: '$39.99', per: 'per year', note: 'Just $3.33 a month · save 33%' },
  monthly: { label: 'Monthly', price: '$4.99', per: 'per month', note: 'Cancel anytime' },
} as const;

const PERKS: { icon: IconName; title: string; text: string }[] = [
  { icon: 'sparkles-outline', title: 'Unlimited Import with AI', text: 'Links, photos and notes turned into recipes, as many as you like.' },
  { icon: 'chatbubble-outline', title: `${AI_NAME}, fully unlocked`, text: 'Remembers your tastes and knows the step you’re on.' },
  { icon: 'mic-outline', title: 'Voice commands', text: 'Say “next” or “start the timer” while your hands are busy.' },
  { icon: 'calendar-outline', title: 'Meal planner & shopping list', text: 'Plan the week and get one tidy list for the shop.' },
  { icon: 'cloud-outline', title: 'Sync across devices', text: 'Your recipes and chats on every phone and tablet.' },
  { icon: 'color-palette-outline', title: 'Extra looks for the cooks', text: 'Seasonal outfits, themes and app icons.' },
];

const COMPARE: [string, string, string][] = [
  ['Recipes & cook mode', 'Unlimited', 'Unlimited'],
  ['Import with AI', `${AI_IMPORTS_PER_DAY} a day`, 'Unlimited'],
  [`Chat with ${AI_NAME}`, 'Basic', 'With memory'],
  ['Hands-free cooking', 'Claps', 'Voice commands'],
  ['Meal planner & shopping list', '–', '✓'],
  ['Sync across devices', '–', '✓'],
];

export default function PlusScreen() {
  const th = useTheme();
  const [plan, setPlan] = useState<keyof typeof PLANS>('yearly');

  const soon = () => Alert.alert('Mise Plus is coming soon', 'Subscriptions aren’t open yet. Everything in Mise is free while we get Plus ready.');

  return (
    <Screen>
      <TopBar>
        <IconBtn name="close" label="Close" onPress={() => router.back()} />
        <View style={{ flex: 1 }} />
      </TopBar>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 48, gap: 22 }}>
        <View style={{ alignItems: 'center', gap: 10 }}>
          <View style={{ width: 76, height: 76, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accent }}>
            <Icon name="sparkles" size={36} color={th.c.onAccent} />
          </View>
          <Txt kind="head" weight="bold" size={32} style={{ textAlign: 'center' }}>Mise Plus</Txt>
          <Txt muted size={16} style={{ textAlign: 'center', maxWidth: 300 }}>{`Cook more, worry less, with ${AI_NAME} by your side.`}</Txt>
          <View style={{ paddingHorizontal: 10, paddingVertical: 2, borderRadius: 999, backgroundColor: th.c.soft }}>
            <Txt weight="black" size={12} muted>COMING SOON</Txt>
          </View>
        </View>

        <View style={{ gap: 14 }}>
          {PERKS.map(p => (
            <View key={p.title} style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
              <View style={{ width: 28, alignItems: 'center', paddingTop: 1 }}><Icon name={p.icon} size={22} color={th.c.accent} /></View>
              <View style={{ flex: 1 }}>
                <Txt weight="bold">{p.title}</Txt>
                <Txt muted size={14}>{p.text}</Txt>
              </View>
            </View>
          ))}
        </View>

        <View style={{ gap: 10 }}>
          {(Object.keys(PLANS) as (keyof typeof PLANS)[]).map(key => {
            const p = PLANS[key];
            const on = plan === key;
            return (
              <Pressable key={key} onPress={() => setPlan(key)} accessibilityRole="radio" accessibilityState={{ selected: on }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 20, borderWidth: 2, borderColor: on ? th.c.accent : th.c.line, backgroundColor: th.c.surface }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: on ? th.c.accent : th.c.line, alignItems: 'center', justifyContent: 'center' }}>
                  {on ? <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: th.c.accent }} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Txt weight="black" size={17}>{p.label}</Txt>
                    {key === 'yearly' ? <View style={{ paddingHorizontal: 8, paddingVertical: 1, borderRadius: 999, backgroundColor: th.c.accent }}><Txt weight="black" size={11} color={th.c.onAccent}>BEST VALUE</Txt></View> : null}
                  </View>
                  <Txt muted size={13}>{p.note}</Txt>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Txt weight="black" size={18}>{p.price}</Txt>
                  <Txt muted size={12}>{p.per}</Txt>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Btn title="Start 7-day free trial" icon="sparkles" size="big" onPress={soon} />
        <Txt muted size={12} style={{ textAlign: 'center', marginTop: -10 }}>Then {PLANS[plan].price} {PLANS[plan].per}. Cancel anytime.</Txt>

        <Card style={{ padding: 6 }}>
          <View style={{ flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 10 }}>
            <Txt weight="black" size={13} muted style={{ flex: 1.6 }}> </Txt>
            <Txt weight="black" size={13} muted style={{ flex: 1, textAlign: 'center' }}>Free</Txt>
            <Txt weight="black" size={13} color={th.c.accent} style={{ flex: 1, textAlign: 'center' }}>Plus</Txt>
          </View>
          {COMPARE.map(([what, free, plus], i) => (
            <View key={what} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 11, borderTopWidth: 1, borderTopColor: th.c.line, backgroundColor: i % 2 ? 'transparent' : th.c.soft + '55' }}>
              <Txt weight="bold" size={14} style={{ flex: 1.6 }}>{what}</Txt>
              <Txt muted size={13} style={{ flex: 1, textAlign: 'center' }}>{free}</Txt>
              <Txt weight="black" size={13} color={th.c.accent} style={{ flex: 1, textAlign: 'center' }}>{plus}</Txt>
            </View>
          ))}
        </Card>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 22 }}>
          <Pressable onPress={soon} hitSlop={8}><Txt weight="bold" size={13} muted>Restore purchases</Txt></Pressable>
          <Pressable onPress={() => router.push('/legal?doc=terms')} hitSlop={8}><Txt weight="bold" size={13} muted>Terms</Txt></Pressable>
          <Pressable onPress={() => router.push('/legal?doc=privacy')} hitSlop={8}><Txt weight="bold" size={13} muted>Privacy</Txt></Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}
